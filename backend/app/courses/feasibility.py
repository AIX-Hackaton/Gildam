"""여행시간·귀가 가능성 검증.

멘토 피드백 2번(`여행시간과 귀가 가능성 검증`)에 대응하는 모듈입니다.

총 소요시간만 보는 것이 아니라
1. 사용자가 입력한 가능 시간 안에 **최악값**으로도 일정이 끝나는지,
2. 귀가 구간이 **배차형/계획 회차형/예약형** 중 무엇인지,
3. 계획·대체 회차를 탈 수 있는지와 예매·당일 확인 행동이 전달되는지
를 함께 판정합니다.

이용일 확인이 필요한 코스는 시간 산술 판정을 덮어쓰지 않고 ``confidence``를
낮춰 사용자에게 2차 확인 항목으로 노출합니다. 서로 다른 운영 모델을 다시 하나의
막차 필드로 합치는 사고를 막기 위해 ``lastReturnDeparture``는 사용하지 않습니다.
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
    bookingRequired: bool
    returnTransport: dict[str, Any]
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

    # 2. 시트의 마지막 교통 구간을 유형별로 판정합니다. 배차형에는 '막차'가
    # 없고, 계획회차형에는 계획·대체 회차가 있으며, 예약형은 이용일 예매편이
    # 정본입니다. 이 세 경우를 하나의 lastReturnDeparture로 합치지 않습니다.
    departure_minutes = parse_clock(departure_time)
    return_leg = _return_leg_minutes(course, "max")
    buffer_minutes = int(schedule.get("returnBufferMinutes") or 0)

    last_activity_end_minutes: int | None = None
    if departure_minutes is not None:
        last_activity_end_minutes = departure_minutes + worst_total - return_leg

    raw_transport = schedule.get("returnTransport") or {}
    transport_type = raw_transport.get("type") or "UNSPECIFIED"
    planned_transport_departure = raw_transport.get("plannedDeparture")
    alternative_departures = list(raw_transport.get("alternativeDepartures") or [])
    scheduled_candidates = [
        value
        for value in [planned_transport_departure, *alternative_departures]
        if parse_clock(value) is not None
    ]
    selected_transport_departure: str | None = None
    scheduled_slack: int | None = None

    if transport_type == "SCHEDULED_SERVICE" and last_activity_end_minutes is not None:
        boarding_deadline = last_activity_end_minutes + int(
            raw_transport.get("stationArrivalBufferMinutes") or buffer_minutes
        )
        for candidate in scheduled_candidates:
            candidate_minutes = parse_clock(candidate)
            if candidate_minutes is not None and candidate_minutes >= boarding_deadline:
                selected_transport_departure = candidate
                scheduled_slack = candidate_minutes - boarding_deadline
                break

        if scheduled_candidates and selected_transport_departure is None:
            status = "NOT_FEASIBLE"
            messages.append(
                "계획·대체 귀가 회차 전에 승차 지점에 도착할 수 없어 당일 귀가가 불가능합니다."
            )
        elif (
            selected_transport_departure
            and planned_transport_departure
            and selected_transport_departure != planned_transport_departure
        ):
            messages.append(
                f"계획 회차를 놓치면 {selected_transport_departure} 대체 회차를 이용해야 합니다."
            )

    # 3. 귀가편 정보의 신뢰도. 데이터 유형과 검증상태를 섞지 않습니다.
    transport_verification = raw_transport.get("verificationStatus")
    needs_day_of_check = bool(raw_transport.get("requiresDayOfCheck", True))

    if (
        transport_verification in {"VERIFIED", "OFFICIAL"}
        and not needs_day_of_check
    ):
        confidence: FeasibilityConfidence = "CONFIRMED"
    else:
        confidence = "NEEDS_DAY_OF_CHECK"
        messages.append(
            "귀가 교통편은 2차 확인이 필요합니다. 출발 전에 당일 운행·예매 정보를 확인해 주세요."
        )

    if transport_type == "HEADWAY_SERVICE":
        headway = raw_transport.get("headwayMinutes")
        window = raw_transport.get("departureWindow") or {}
        boarding_after = raw_transport.get("plannedBoardingAfter") or window.get("start")
        messages.append(
            f"귀가편은 {boarding_after or '일정 종료'} 이후 약 {headway}분 배차형입니다. 막차 추정값 대신 당일 BIS 도착정보를 확인합니다."
        )
    elif transport_type == "SCHEDULED_SERVICE":
        alternatives = ", ".join(alternative_departures)
        detail = f"계획 귀가 회차는 {planned_transport_departure}입니다."
        if alternatives:
            detail += f" 대체 회차는 {alternatives}입니다."
        messages.append(detail)
    elif transport_type == "RESERVATION_REQUIRED":
        messages.append(
            "귀가편은 고정 막차 추정이 아니라 이용일에 왕복 교통편을 먼저 예약해 확정합니다."
        )

    ticketing_model = raw_transport.get("ticketingModel")
    booking_required = bool(schedule.get("bookingRequired")) or ticketing_model in {
        "ONSITE_TICKET",
        "ADVANCE_RESERVATION",
    }
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
        bookingRequired=booking_required,
        returnTransport={
            **raw_transport,
            "selectedDeparture": selected_transport_departure,
            "selectedDepartureSlackMinutes": scheduled_slack,
        },
        messages=messages,
    )
