"""여행시간·귀가 가능성 검증.

멘토 피드백 2번(`여행시간과 귀가 가능성 검증`)에 대응하는 모듈입니다.

총 소요시간만 보는 것이 아니라
1. 사용자가 입력한 가능 시간 안에 **최악값**으로도 일정이 끝나는지,
2. 마지막 관광지에서 나온 시각이 **막차/막 열차 출발시각**보다 앞서는지,
3. 예매가 필요한 구간이라면 그 사실이 사용자에게 전달되는지
를 함께 판정합니다.

막차 정보가 공식 확인되지 않은 코스는 "가능"이라고 단정하지 않고
``confidence`` 를 낮춰 사용자에게 재확인 항목으로 노출합니다.
"""

from typing import Any, Literal, TypedDict

FeasibilityStatus = Literal["FEASIBLE", "TIGHT", "NOT_FEASIBLE"]
FeasibilityConfidence = Literal["CONFIRMED", "NEEDS_DAY_OF_CHECK", "UNVERIFIED"]

DURATION_LIMITS: dict[str, int] = {
    "SIX_HOURS": 360,
    "FULL_DAY": 720,
}

#: 사용자에게 "여유 있음"이라고 말할 수 있는 최소 여유 시간(분).
COMFORTABLE_SLACK_MINUTES = 30


class ReturnFeasibility(TypedDict):
    status: FeasibilityStatus
    confidence: FeasibilityConfidence
    departureTime: str
    plannedReturnTime: str
    latestReturnTime: str
    plannedTotalMinutes: int
    worstCaseTotalMinutes: int
    allowedMinutes: int
    slackMinutes: int
    lastActivityEndTime: str | None
    lastReturnDeparture: str | None
    lastReturnSlackMinutes: int | None
    bookingRequired: bool
    messages: list[str]


def parse_clock(value: str | None) -> int | None:
    """``"HH:MM"`` 을 자정 기준 분으로 바꿉니다."""

    if not value:
        return None

    try:
        hour, minute = value.split(":")
        return int(hour) * 60 + int(minute)
    except (ValueError, AttributeError):
        return None


def format_clock(minutes: int | None) -> str | None:
    if minutes is None:
        return None

    return f"{(minutes // 60) % 24:02d}:{minutes % 60:02d}"


def _return_leg_minutes(course: dict[str, Any], key: str = "plan") -> int:
    schedule = course.get("schedule") or {}
    leg = schedule.get("returnLegMinutes") or {}
    value = leg.get(key)

    if isinstance(value, int):
        return value

    return int(course.get("roundTripTransitMinutes", 0) / 2)


def evaluate_return_feasibility(
    course: dict[str, Any], duration_id: str
) -> ReturnFeasibility:
    """코스 하나의 귀가 가능성을 계산합니다."""

    schedule: dict[str, Any] = course.get("schedule") or {}
    totals: dict[str, Any] = course.get("totalMinutes") or {}

    planned_total = int(totals.get("plan", 0))
    worst_total = int(totals.get("max", planned_total))
    allowed = DURATION_LIMITS.get(duration_id, DURATION_LIMITS["FULL_DAY"])
    slack = allowed - worst_total

    departure_time = schedule.get("departureTime") or "--:--"
    planned_return = schedule.get("plannedReturnTime") or "--:--"
    latest_return = schedule.get("latestReturnTime") or planned_return

    messages: list[str] = []

    # 1. 사용자가 고른 가능 시간 안에 끝나는가?
    if planned_total > allowed:
        status: FeasibilityStatus = "NOT_FEASIBLE"
        messages.append(
            f"계획 소요 {planned_total}분이 선택한 가능 시간({allowed}분)을 넘습니다."
        )
    elif slack < 0:
        status = "TIGHT"
        messages.append(
            f"계획은 {planned_total}분이지만 지연 시 최대 {worst_total}분까지 늘어나 "
            f"가능 시간({allowed}분)을 넘길 수 있습니다."
        )
    elif slack < COMFORTABLE_SLACK_MINUTES:
        status = "TIGHT"
        messages.append(
            f"지연을 감안하면 여유가 {slack}분뿐이라 일정이 빠듯할 수 있습니다."
        )
    else:
        status = "FEASIBLE"

    # 2. 마지막 귀가 교통편을 실제로 탈 수 있는가?
    departure_minutes = parse_clock(departure_time)
    return_leg = _return_leg_minutes(course, "max")
    buffer_minutes = int(schedule.get("returnBufferMinutes") or 0)

    last_activity_end_minutes: int | None = None
    if departure_minutes is not None:
        last_activity_end_minutes = departure_minutes + worst_total - return_leg

    last_return_departure = schedule.get("lastReturnDeparture")
    last_return_minutes = parse_clock(last_return_departure)
    last_return_slack: int | None = None

    if last_activity_end_minutes is not None and last_return_minutes is not None:
        last_return_slack = last_return_minutes - (
            last_activity_end_minutes + buffer_minutes
        )

        if last_return_slack < 0:
            status = "NOT_FEASIBLE"
            messages.append(
                "마지막 일정이 끝나는 시각이 막차 출발시각보다 늦어 당일 귀가가 불가능합니다."
            )

    # 3. 귀가편 정보의 신뢰도. 시트에 없는 추정 시각으로 추천을 허용하지 않습니다.
    last_return_status = schedule.get("lastReturnDepartureStatus")

    if last_return_status in {"VERIFIED", "OFFICIAL"}:
        confidence: FeasibilityConfidence = "CONFIRMED"
    elif last_return_minutes is None:
        confidence = "UNVERIFIED"
        messages.append(
            "마지막 귀가 교통편이 공식 확인되지 않아 당일 귀가를 보장할 수 없습니다."
        )
        status = "NOT_FEASIBLE"
    else:
        confidence = "NEEDS_DAY_OF_CHECK"
        messages.append(
            "막차 시각은 공식 확인 전 값이라 이용일 당일 도착정보를 반드시 확인해 주세요."
        )
        status = "NOT_FEASIBLE"

    booking_required = bool(schedule.get("bookingRequired"))
    if booking_required:
        booking_note = schedule.get("bookingNote")
        messages.append(
            booking_note
            or "귀가편 좌석을 먼저 확보한 뒤 일정을 시작해 주세요."
        )

    return ReturnFeasibility(
        status=status,
        confidence=confidence,
        departureTime=departure_time,
        plannedReturnTime=planned_return,
        latestReturnTime=latest_return,
        plannedTotalMinutes=planned_total,
        worstCaseTotalMinutes=worst_total,
        allowedMinutes=allowed,
        slackMinutes=slack,
        lastActivityEndTime=format_clock(last_activity_end_minutes),
        lastReturnDeparture=last_return_departure,
        lastReturnSlackMinutes=last_return_slack,
        bookingRequired=booking_required,
        messages=messages,
    )
