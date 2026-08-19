from __future__ import annotations

import os
import time
from datetime import datetime, timezone
from typing import Any, Protocol
from urllib.parse import quote, urlencode

import httpx

from backend.app.courses.feasibility import COMFORTABLE_SLACK_MINUTES
from backend.app.traffic.models import (
    TrafficEvaluation,
    TrafficSnapshot,
    TrafficWarning,
)

DEFAULT_TAGO_BUS_ARRIVAL_BASE_URL = (
    "https://apis.data.go.kr/1613000/ArvlInfoInqireService"
)
DEFAULT_TRAFFIC_TIMEOUT_SECONDS = 5.0


class TrafficProvider(Protocol):
    def get_return_leg_snapshot(self, course: dict[str, Any]) -> TrafficSnapshot:
        """Return realtime traffic information for a course's return leg."""


class DisabledTrafficProvider:
    def get_return_leg_snapshot(self, course: dict[str, Any]) -> TrafficSnapshot:
        return TrafficSnapshot(
            status="UNKNOWN",
            provider="DISABLED",
            affectedSegmentId=_return_segment_id(course),
            message="실시간 교통 조회가 비활성화되어 있습니다.",
        )


class TagoBusArrivalProvider:
    """Minimal TAGO bus arrival client for return-leg traffic checks.

    The course snapshot must provide ``schedule.returnTransport.realtimeTraffic``
    with ``cityCode``, ``nodeId`` and optionally ``routeId``. The provider turns
    TAGO arrival predictions into a delay estimate, while the recommendation
    service decides whether that delay is still feasible.
    """

    def __init__(
        self,
        *,
        service_key: str,
        base_url: str = DEFAULT_TAGO_BUS_ARRIVAL_BASE_URL,
        timeout_seconds: float = DEFAULT_TRAFFIC_TIMEOUT_SECONDS,
        transport: httpx.BaseTransport | None = None,
    ) -> None:
        self.service_key = service_key.strip()
        self.base_url = base_url.rstrip("/")
        self._client = httpx.Client(timeout=timeout_seconds, transport=transport)

    @classmethod
    def from_env(cls) -> "TagoBusArrivalProvider | DisabledTrafficProvider":
        service_key = os.getenv("TRAFFIC_API_SERVICE_KEY", "").strip()
        enabled = os.getenv("TRAFFIC_API_ENABLED", "").strip().lower()

        if enabled not in {"1", "true", "yes"} or not service_key:
            return DisabledTrafficProvider()

        timeout_seconds = DEFAULT_TRAFFIC_TIMEOUT_SECONDS
        raw_timeout = os.getenv("TRAFFIC_API_TIMEOUT_SECONDS")
        if raw_timeout:
            try:
                timeout_seconds = float(raw_timeout)
            except ValueError:
                timeout_seconds = DEFAULT_TRAFFIC_TIMEOUT_SECONDS

        return cls(
            service_key=service_key,
            base_url=os.getenv(
                "TRAFFIC_TAGO_BUS_ARRIVAL_BASE_URL",
                DEFAULT_TAGO_BUS_ARRIVAL_BASE_URL,
            ),
            timeout_seconds=timeout_seconds,
        )

    def close(self) -> None:
        self._client.close()

    def get_return_leg_snapshot(self, course: dict[str, Any]) -> TrafficSnapshot:
        segment_id = _return_segment_id(course)
        config = _realtime_config(course)

        if not config:
            return TrafficSnapshot(
                status="UNKNOWN",
                provider="TAGO_BUS_ARRIVAL",
                affectedSegmentId=segment_id,
                message="코스에 TAGO 정류소/노선 매핑이 없어 실시간 조회를 건너뜁니다.",
            )

        if str(config.get("provider") or "") != "TAGO_BUS_ARRIVAL":
            return TrafficSnapshot(
                status="UNKNOWN",
                provider=str(config.get("provider") or "UNKNOWN"),
                affectedSegmentId=segment_id,
                message="지원하지 않는 실시간 교통 provider입니다.",
            )

        city_code = config.get("cityCode")
        node_id = config.get("nodeId")
        route_id = config.get("routeId")

        if not city_code or not node_id:
            return TrafficSnapshot(
                status="UNKNOWN",
                provider="TAGO_BUS_ARRIVAL",
                affectedSegmentId=segment_id,
                message="TAGO 버스도착정보 조회에 필요한 cityCode/nodeId가 없습니다.",
            )

        try:
            item = self._fetch_soonest_arrival(
                city_code=str(city_code),
                node_id=str(node_id),
                route_id=str(route_id) if route_id else None,
            )
        except (httpx.HTTPError, ValueError) as exc:
            return TrafficSnapshot(
                status="UNKNOWN",
                provider="TAGO_BUS_ARRIVAL",
                affectedSegmentId=segment_id,
                message=f"TAGO 버스도착정보 조회에 실패했습니다: {type(exc).__name__}",
            )

        if item is None:
            return TrafficSnapshot(
                status="BLOCKED",
                provider="TAGO_BUS_ARRIVAL",
                checkedAt=_now_iso(),
                affectedSegmentId=segment_id,
                message="해당 정류소/노선의 도착 예정 차량이 없어 귀가 교통을 확정할 수 없습니다.",
            )

        arrival_minutes = _arrival_minutes(item)
        planned_wait = int(config.get("plannedWaitMinutes") or 0)
        delay = max(0, arrival_minutes - planned_wait)

        return TrafficSnapshot(
            status="DELAYED" if delay else "NORMAL",
            provider="TAGO_BUS_ARRIVAL",
            checkedAt=_now_iso(),
            affectedSegmentId=segment_id,
            delayMinutes=delay,
            expectedArrivalMinutes=arrival_minutes,
            message=f"도착 예정 {arrival_minutes}분, 계획 대기 {planned_wait}분 기준 지연 {delay}분입니다.",
            raw=dict(item),
        )

    def _fetch_soonest_arrival(
        self, *, city_code: str, node_id: str, route_id: str | None
    ) -> dict[str, Any] | None:
        endpoint = "getSttnAcctoArvlPrearngeInfoList"
        params = {
            "cityCode": city_code,
            "nodeId": node_id,
            "routeId": route_id,
            "_type": "json",
        }
        query = urlencode({k: v for k, v in params.items() if v not in (None, "")})
        key = self.service_key if "%" in self.service_key else quote(self.service_key, safe="")
        response = self._client.get(f"{self.base_url}/{endpoint}?serviceKey={key}&{query}")
        response.raise_for_status()
        payload = response.json()
        envelope = payload.get("response") if isinstance(payload, dict) else None
        if not isinstance(envelope, dict):
            raise ValueError("missing TAGO response envelope")

        body = envelope.get("body") or {}
        raw_items = (body.get("items") or {}).get("item", [])
        if isinstance(raw_items, dict):
            items = [raw_items]
        elif isinstance(raw_items, list):
            items = [item for item in raw_items if isinstance(item, dict)]
        else:
            items = []

        if route_id:
            items = [
                item
                for item in items
                if str(item.get("routeid") or item.get("routeId") or "") == route_id
            ]

        if not items:
            return None

        return min(items, key=_arrival_seconds)


def get_traffic_provider() -> TrafficProvider:
    return TagoBusArrivalProvider.from_env()


def evaluate_course_traffic(
    course: dict[str, Any],
    feasibility: dict[str, Any],
    provider: TrafficProvider | None = None,
) -> TrafficEvaluation:
    provider = provider or get_traffic_provider()

    try:
        snapshot = provider.get_return_leg_snapshot(course)
    except Exception as exc:  # pragma: no cover - defensive fallback
        snapshot = TrafficSnapshot(
            status="UNKNOWN",
            provider=type(provider).__name__,
            affectedSegmentId=_return_segment_id(course),
            message=f"실시간 교통 조회 중 오류가 발생했습니다: {type(exc).__name__}",
        )

    planned_total = int(feasibility["plannedTotalMinutes"])
    allowed = int(feasibility["allowedMinutes"])
    delay = max(0, snapshot.delayMinutes)
    projected_total = planned_total + delay
    projected_slack = allowed - projected_total
    provider_name = snapshot.provider

    if snapshot.status == "BLOCKED":
        return TrafficEvaluation(
            status="BLOCKED",
            provider=provider_name,
            checkedAt=snapshot.checkedAt,
            affectedSegmentId=snapshot.affectedSegmentId,
            delayMinutes=delay,
            projectedTotalMinutes=projected_total,
            projectedSlackMinutes=projected_slack,
            warnings=[
                TrafficWarning(
                    code="REALTIME_TRAFFIC_BLOCKED",
                    message=snapshot.message
                    or "실시간 교통 정보상 귀가편 이용이 어렵습니다.",
                    severity="blocking",
                )
            ],
        )

    if snapshot.status == "UNKNOWN":
        return TrafficEvaluation(
            status="UNKNOWN",
            provider=provider_name,
            checkedAt=snapshot.checkedAt,
            affectedSegmentId=snapshot.affectedSegmentId,
            delayMinutes=delay,
            projectedTotalMinutes=None,
            projectedSlackMinutes=None,
            warnings=[
                TrafficWarning(
                    code="REALTIME_TRAFFIC_UNKNOWN",
                    message=snapshot.message
                    or "실시간 교통 정보를 확인하지 못해 당일 확인이 필요합니다.",
                    severity="info",
                )
            ],
        )

    if projected_total > allowed:
        return TrafficEvaluation(
            status="BLOCKED",
            provider=provider_name,
            checkedAt=snapshot.checkedAt,
            affectedSegmentId=snapshot.affectedSegmentId,
            delayMinutes=delay,
            projectedTotalMinutes=projected_total,
            projectedSlackMinutes=projected_slack,
            warnings=[
                TrafficWarning(
                    code="REALTIME_TRAFFIC_BLOCKED",
                    message=(
                        f"실시간 교통 지연 {delay}분 반영 시 총 {projected_total}분으로 "
                        f"선택한 가능 시간({allowed}분)을 넘습니다."
                    ),
                    severity="blocking",
                )
            ],
        )

    if delay > 0 and projected_slack < COMFORTABLE_SLACK_MINUTES:
        return TrafficEvaluation(
            status="TIGHT",
            provider=provider_name,
            checkedAt=snapshot.checkedAt,
            affectedSegmentId=snapshot.affectedSegmentId,
            delayMinutes=delay,
            projectedTotalMinutes=projected_total,
            projectedSlackMinutes=projected_slack,
            warnings=[
                TrafficWarning(
                    code="REALTIME_TRAFFIC_TIGHT",
                    message=(
                        f"실시간 교통 지연 {delay}분 반영 시 귀가 여유가 "
                        f"{projected_slack}분입니다."
                    ),
                    severity="warning",
                )
            ],
        )

    return TrafficEvaluation(
        status="NORMAL",
        provider=provider_name,
        checkedAt=snapshot.checkedAt,
        affectedSegmentId=snapshot.affectedSegmentId,
        delayMinutes=delay,
        projectedTotalMinutes=projected_total,
        projectedSlackMinutes=projected_slack,
        warnings=[],
    )


def apply_traffic_to_feasibility(
    feasibility: dict[str, Any],
    traffic: TrafficEvaluation,
) -> dict[str, Any]:
    updated = dict(feasibility)
    messages = list(updated.get("messages") or [])

    if traffic.status == "TIGHT" and updated.get("status") == "FEASIBLE":
        updated["status"] = "TIGHT"

    if traffic.projectedTotalMinutes is not None:
        updated["worstCaseTotalMinutes"] = max(
            int(updated.get("worstCaseTotalMinutes") or 0),
            traffic.projectedTotalMinutes,
        )
        updated["slackMinutes"] = min(
            int(updated.get("slackMinutes") or 0),
            traffic.projectedSlackMinutes,
        )

    messages.extend(warning.message for warning in traffic.warnings)
    updated["messages"] = messages
    return updated


def _realtime_config(course: dict[str, Any]) -> dict[str, Any]:
    transport = (course.get("schedule") or {}).get("returnTransport") or {}
    config = transport.get("realtimeTraffic") or {}
    return config if isinstance(config, dict) else {}


def _return_segment_id(course: dict[str, Any]) -> str | None:
    transport = (course.get("schedule") or {}).get("returnTransport") or {}
    segment_id = transport.get("segmentId")
    return str(segment_id) if segment_id else None


def _arrival_seconds(item: dict[str, Any]) -> int:
    for key in ("arrtime", "arrTime", "arrivalTime"):
        value = item.get(key)
        if value not in (None, ""):
            try:
                return max(0, int(value))
            except (TypeError, ValueError):
                continue
    return 10**9


def _arrival_minutes(item: dict[str, Any]) -> int:
    seconds = _arrival_seconds(item)
    if seconds == 10**9:
        return 0
    return max(0, round(seconds / 60))


def _now_iso() -> str:
    return datetime.fromtimestamp(time.time(), timezone.utc).isoformat()
