from __future__ import annotations

import os
import logging
import time
from collections.abc import Iterator
from typing import Any
from urllib.parse import quote, urlencode

import httpx

from backend.app.tour_api.models import TourApiItem, TourApiListResponse

DEFAULT_BASE_URL = "https://apis.data.go.kr/B551011/KorService2"
DEFAULT_MOBILE_OS = "WEB"
DEFAULT_MOBILE_APP = "Gildam"
DEFAULT_TIMEOUT_SECONDS = 8.0
DEFAULT_MAX_RETRIES = 2
RETRYABLE_STATUS_CODES = {429, 502, 503, 504}
logger = logging.getLogger("gildam.tour_api")

REMOVED_DETAIL_COMMON_FLAGS = {
    "defaultYN",
    "firstImageYN",
    "areacodeYN",
    "catcodeYN",
    "addrinfoYN",
    "mapinfoYN",
    "overviewYN",
}


class TourApiError(RuntimeError):
    """Base error for TourAPI integration failures."""


class TourApiConfigurationError(TourApiError):
    """Raised when the backend is missing required TourAPI settings."""


class TourApiProviderError(TourApiError):
    """Raised when TourAPI returns a structured failure response."""

    def __init__(self, code: str, message: str) -> None:
        super().__init__(message)
        self.code = code
        self.message = message


class TourApiTransportError(TourApiError):
    """Raised when the backend cannot reach TourAPI."""


def _compact_params(params: dict[str, Any]) -> dict[str, Any]:
    return {
        key: value
        for key, value in params.items()
        if value is not None and value != ""
    }


def _encode_service_key(service_key: str) -> str:
    stripped = service_key.strip()

    if not stripped:
        raise TourApiConfigurationError("TOUR_API_SERVICE_KEY is empty.")

    # 공공데이터포털은 URL-encoded serviceKey를 요구합니다. 사용자가 이미
    # 인코딩된 일반 인증키를 넣은 경우에는 이중 인코딩하지 않습니다.
    return stripped if "%" in stripped else quote(stripped, safe="")


def _as_int(value: Any, fallback: int) -> int:
    try:
        return int(value)
    except (TypeError, ValueError):
        return fallback


def _as_float(value: Any) -> float | None:
    if value in (None, ""):
        return None

    try:
        return float(value)
    except (TypeError, ValueError):
        return None


def _item_value(item: dict[str, Any], *names: str) -> Any:
    for name in names:
        if name in item and item[name] not in (None, ""):
            return item[name]

    return None


def _normalise_item(item: dict[str, Any]) -> TourApiItem:
    return TourApiItem(
        contentId=_item_value(item, "contentid", "contentId"),
        contentTypeId=_item_value(item, "contenttypeid", "contentTypeId"),
        title=_item_value(item, "title"),
        addr1=_item_value(item, "addr1"),
        addr2=_item_value(item, "addr2"),
        areaCode=_item_value(item, "areacode", "areaCode"),
        sigunguCode=_item_value(item, "sigungucode", "sigunguCode"),
        mapX=_as_float(_item_value(item, "mapx", "mapX")),
        mapY=_as_float(_item_value(item, "mapy", "mapY")),
        firstImage=_item_value(item, "firstimage", "firstImage"),
        firstImage2=_item_value(item, "firstimage2", "firstImage2"),
        tel=_item_value(item, "tel"),
        createdTime=_item_value(item, "createdtime", "createdTime"),
        modifiedTime=_item_value(item, "modifiedtime", "modifiedTime"),
        copyrightType=_item_value(item, "cpyrhtDivCd", "copyrightType"),
    )


class TourApiClient:
    """Small typed client for TourAPI 4.0 KorService2.

    The client keeps the service key server-side and returns only normalized public
    place fields plus the raw record needed for later data-lineage evidence.
    """

    def __init__(
        self,
        *,
        service_key: str,
        base_url: str = DEFAULT_BASE_URL,
        mobile_os: str = DEFAULT_MOBILE_OS,
        mobile_app: str = DEFAULT_MOBILE_APP,
        timeout_seconds: float = DEFAULT_TIMEOUT_SECONDS,
        max_retries: int = DEFAULT_MAX_RETRIES,
        transport: httpx.BaseTransport | None = None,
    ) -> None:
        self.base_url = base_url.rstrip("/")
        self.mobile_os = mobile_os
        self.mobile_app = mobile_app
        self._service_key = service_key
        self._max_retries = max(0, max_retries)
        self._client = httpx.Client(timeout=timeout_seconds, transport=transport)

    def close(self) -> None:
        self._client.close()

    def __enter__(self) -> "TourApiClient":
        return self

    def __exit__(self, *_: object) -> None:
        self.close()

    @classmethod
    def from_env(cls) -> "TourApiClient":
        raw_timeout = os.getenv("TOUR_API_TIMEOUT_SECONDS")
        timeout = DEFAULT_TIMEOUT_SECONDS

        if raw_timeout:
            try:
                timeout = float(raw_timeout)
            except ValueError:
                timeout = DEFAULT_TIMEOUT_SECONDS

        return cls(
            service_key=os.getenv("TOUR_API_SERVICE_KEY", ""),
            base_url=os.getenv("TOUR_API_BASE_URL", DEFAULT_BASE_URL),
            mobile_os=os.getenv("TOUR_API_MOBILE_OS", DEFAULT_MOBILE_OS),
            mobile_app=os.getenv("TOUR_API_MOBILE_APP", DEFAULT_MOBILE_APP),
            timeout_seconds=timeout,
        )

    def search_keyword(
        self,
        *,
        keyword: str,
        content_type_id: int | None = None,
        arrange: str = "A",
        page_no: int = 1,
        num_of_rows: int = 10,
        l_dong_regn_cd: str | None = None,
        l_dong_signgu_cd: str | None = None,
        lcls_systm1: str | None = None,
        lcls_systm2: str | None = None,
        lcls_systm3: str | None = None,
    ) -> TourApiListResponse:
        return self._get_list(
            "searchKeyword2",
            {
                "keyword": keyword,
                "contentTypeId": content_type_id,
                "arrange": arrange,
                "pageNo": page_no,
                "numOfRows": num_of_rows,
                "lDongRegnCd": l_dong_regn_cd,
                "lDongSignguCd": l_dong_signgu_cd,
                "lclsSystm1": lcls_systm1,
                "lclsSystm2": lcls_systm2,
                "lclsSystm3": lcls_systm3,
            },
        )

    def location_based_list(
        self,
        *,
        map_x: float,
        map_y: float,
        radius: int = 1000,
        content_type_id: int | None = None,
        arrange: str = "E",
        page_no: int = 1,
        num_of_rows: int = 10,
    ) -> TourApiListResponse:
        if radius > 20000:
            raise ValueError("radius must be 20,000 meters or less.")

        return self._get_list(
            "locationBasedList2",
            {
                "mapX": map_x,
                "mapY": map_y,
                "radius": radius,
                "contentTypeId": content_type_id,
                "arrange": arrange,
                "pageNo": page_no,
                "numOfRows": num_of_rows,
            },
        )

    def detail_common(
        self,
        *,
        content_id: str,
        page_no: int = 1,
        num_of_rows: int = 10,
    ) -> TourApiListResponse:
        params = {
            "contentId": content_id,
            "pageNo": page_no,
            "numOfRows": num_of_rows,
        }

        invalid = REMOVED_DETAIL_COMMON_FLAGS.intersection(params)
        if invalid:
            raise ValueError(
                "detailCommon2 no longer accepts: " + ", ".join(sorted(invalid))
            )

        return self._get_list("detailCommon2", params)

    def _base_params(self) -> dict[str, Any]:
        return {
            "MobileOS": self.mobile_os,
            "MobileApp": self.mobile_app,
            "_type": "json",
        }

    def _build_url(self, endpoint: str, params: dict[str, Any]) -> str:
        query = urlencode(_compact_params({**self._base_params(), **params}))
        service_key = _encode_service_key(self._service_key)

        return f"{self.base_url}/{endpoint}?serviceKey={service_key}&{query}"

    def _get_list(self, endpoint: str, params: dict[str, Any]) -> TourApiListResponse:
        url = self._build_url(endpoint, params)

        response: httpx.Response | None = None
        for attempt in range(self._max_retries + 1):
            started = time.perf_counter()
            try:
                response = self._client.get(url)
                latency_ms = round((time.perf_counter() - started) * 1000, 1)
                if response.status_code not in RETRYABLE_STATUS_CODES:
                    response.raise_for_status()
                    logger.info(
                        "tourapi endpoint=%s status=%s latency_ms=%s attempt=%s",
                        endpoint,
                        response.status_code,
                        latency_ms,
                        attempt + 1,
                    )
                    break
                logger.warning(
                    "tourapi endpoint=%s status=%s latency_ms=%s attempt=%s",
                    endpoint,
                    response.status_code,
                    latency_ms,
                    attempt + 1,
                )
                if attempt == self._max_retries:
                    response.raise_for_status()
            except (httpx.TimeoutException, httpx.TransportError) as exc:
                logger.warning(
                    "tourapi endpoint=%s transport_error=%s attempt=%s",
                    endpoint,
                    type(exc).__name__,
                    attempt + 1,
                )
                if attempt == self._max_retries:
                    raise TourApiTransportError("TourAPI request failed.") from exc
            except httpx.HTTPStatusError as exc:
                raise TourApiTransportError("TourAPI request failed.") from exc
            time.sleep(0.05 * (2**attempt))

        if response is None:
            raise TourApiTransportError("TourAPI request failed.")

        payload = self._parse_payload(response)
        envelope = payload.get("response")

        if not isinstance(envelope, dict):
            raise TourApiProviderError(
                "INVALID_RESPONSE", "TourAPI response envelope is missing."
            )

        header = envelope.get("header") or {}
        result_code = str(header.get("resultCode", ""))
        result_message = str(header.get("resultMsg", "TourAPI request failed."))

        if result_code != "0000":
            logger.warning(
                "tourapi endpoint=%s provider_code=%s",
                endpoint,
                result_code,
            )
            raise TourApiProviderError(result_code, result_message)

        body = envelope.get("body") or {}
        raw_items = (body.get("items") or {}).get("item", [])

        if isinstance(raw_items, dict):
            items = [raw_items]
        elif isinstance(raw_items, list):
            items = raw_items
        else:
            items = []

        fallback_page = _as_int(params.get("pageNo"), 1)
        fallback_rows = _as_int(params.get("numOfRows"), 10)

        return TourApiListResponse(
            endpoint=endpoint,
            pageNo=_as_int(body.get("pageNo"), fallback_page),
            numOfRows=_as_int(body.get("numOfRows"), fallback_rows),
            totalCount=_as_int(body.get("totalCount"), len(items)),
            items=[
                _normalise_item(item)
                for item in items
                if isinstance(item, dict)
            ],
        )

    def _parse_payload(self, response: httpx.Response) -> dict[str, Any]:
        try:
            payload = response.json()
        except ValueError as exc:
            text = response.text.strip()
            if "OpenAPI_ServiceResponse" in text:
                raise TourApiProviderError(
                    "OPENAPI_SERVICE_ERROR",
                    "공공데이터포털 게이트웨이 오류가 반환되었습니다.",
                ) from exc
            raise TourApiProviderError(
                "INVALID_RESPONSE", "TourAPI JSON 응답을 해석할 수 없습니다."
            ) from exc

        if not isinstance(payload, dict):
            raise TourApiProviderError(
                "INVALID_RESPONSE", "TourAPI JSON 응답이 객체가 아닙니다."
            )

        return payload


def get_tour_api_client() -> Iterator[TourApiClient]:
    """FastAPI dependency that deterministically releases pooled connections."""

    with TourApiClient.from_env() as client:
        yield client

