"""schema v3.1 정합성 검사.

샘플 데이터 11번(`JSON 필수 필드 누락`) 대응 모듈입니다.
필수 필드가 없거나 요약 수치가 일정과 어긋나는 코스는 추천 후보에서 조용히
제외하고, 그 사실을 진단 결과로 남깁니다. 서버가 500으로 죽지 않게 하는 것이
이 모듈의 목적입니다.
"""

from datetime import date
from typing import Any, Iterable
from urllib.parse import urlparse

from backend.app.courses.lineage import RETURN_SEGMENT_REFERENCES

SCHEMA_VERSION = "3.1"

REQUIRED_FIELDS: tuple[str, ...] = (
    "schemaVersion",
    "id",
    "title",
    "region",
    "courseType",
    "departurePoint",
    "timeType",
    "applicableDays",
    "verificationStatus",
    "verifiedDate",
    "publishable",
    "exposureTier",
    "isPrimary",
    "thumbnailUrl",
    "tags",
    "recommendationReasons",
    "description",
    "totalMinutes",
    "walkingMinutes",
    "transferCount",
    "roundTripTransitMinutes",
    "itinerary",
    "preferences",
    "primaryDestination",
    "sources",
    "schedule",
)

REQUIRED_SCHEDULE_FIELDS: tuple[str, ...] = (
    "departureTime",
    "plannedReturnTime",
    "latestReturnTime",
    "returnTransport",
)

VALID_EXPOSURE_TIERS = {"PUBLIC", "MANUAL_REVIEW", "DEMO_ONLY", "BLOCKED"}
VALID_TIME_TYPES = {"SIX_HOURS", "FULL_DAY"}
VALID_DEPARTURES = {"USQUARE", "GWANGJU_SONGJEONG"}
VALID_RETURN_TRANSPORT_TYPES = {
    "HEADWAY_SERVICE",
    "SCHEDULED_SERVICE",
    "RESERVATION_REQUIRED",
}
VALID_TICKETING_MODELS = {
    "PAY_ON_BOARD",
    "ONSITE_TICKET",
    "ADVANCE_RESERVATION",
}


class CourseSchemaError(ValueError):
    """코스 원천 데이터가 schema v3.1을 만족하지 못할 때 발생합니다."""


def _range_is_ordered(value: Any) -> bool:
    if not isinstance(value, dict):
        return False
    if not all(key in value for key in ("min", "plan", "max")):
        return False
    try:
        return value["min"] <= value["plan"] <= value["max"]
    except TypeError:
        return False


def _is_clock(value: Any) -> bool:
    if not isinstance(value, str):
        return False
    try:
        hour, minute = (int(part) for part in value.split(":"))
    except (TypeError, ValueError):
        return False
    return 0 <= hour <= 23 and 0 <= minute <= 59


def _is_iso_date(value: Any) -> bool:
    if not isinstance(value, str):
        return False
    try:
        date.fromisoformat(value)
    except ValueError:
        return False
    return True


def _is_http_url(value: Any) -> bool:
    if not isinstance(value, str):
        return False
    parsed = urlparse(value)
    return parsed.scheme in {"http", "https"} and bool(parsed.netloc)


def collect_course_problems(course: Any) -> list[str]:
    """코스 하나의 스키마 문제를 모두 모아 돌려줍니다 (비어 있으면 정상)."""

    problems: list[str] = []

    if not isinstance(course, dict):
        return ["course row is not an object"]

    for field in REQUIRED_FIELDS:
        if course.get(field) in (None, "", [], {}):
            problems.append(f"missing required field: {field}")

    if problems:
        return problems

    if course.get("schemaVersion") != SCHEMA_VERSION:
        problems.append(
            f"schemaVersion must be {SCHEMA_VERSION}, got {course.get('schemaVersion')!r}"
        )

    if course["exposureTier"] not in VALID_EXPOSURE_TIERS:
        problems.append(f"unknown exposureTier: {course['exposureTier']}")

    if course["timeType"] not in VALID_TIME_TYPES:
        problems.append(f"unknown timeType: {course['timeType']}")

    if course["departurePoint"] not in VALID_DEPARTURES:
        problems.append(f"unknown departurePoint: {course['departurePoint']}")

    if not _is_iso_date(course["verifiedDate"]):
        problems.append("verifiedDate must be an ISO date")

    if not isinstance(course["publishable"], bool):
        problems.append("publishable must be a boolean")

    if not isinstance(course["isPrimary"], bool):
        problems.append("isPrimary must be a boolean")

    if not isinstance(course["roundTripTransitMinutes"], int) or course[
        "roundTripTransitMinutes"
    ] < 0:
        problems.append("roundTripTransitMinutes must be a non-negative integer")

    if not _range_is_ordered(course["totalMinutes"]):
        problems.append("totalMinutes must satisfy min <= plan <= max")

    if not _range_is_ordered(course["walkingMinutes"]):
        problems.append("walkingMinutes must satisfy min <= plan <= max")

    schedule = course["schedule"]
    for field in REQUIRED_SCHEDULE_FIELDS:
        if not schedule.get(field):
            problems.append(f"missing required schedule field: {field}")

    return_transport = schedule.get("returnTransport")
    if isinstance(return_transport, dict):
        transport_type = return_transport.get("type")
        segment_id = return_transport.get("segmentId")
        expected_segment = RETURN_SEGMENT_REFERENCES.get(course["id"])

        if transport_type not in VALID_RETURN_TRANSPORT_TYPES:
            problems.append(f"unknown returnTransport.type: {transport_type}")
        if segment_id != expected_segment:
            problems.append(
                "returnTransport.segmentId must reference the spreadsheet's final "
                f"transport segment ({segment_id!r} != {expected_segment!r})"
            )
        if return_transport.get("serviceDay") != "SATURDAY":
            problems.append("returnTransport.serviceDay must be SATURDAY for this MVP")
        if return_transport.get("ticketingModel") not in VALID_TICKETING_MODELS:
            problems.append("returnTransport.ticketingModel is invalid")
        if not isinstance(return_transport.get("requiresDayOfCheck"), bool):
            problems.append("returnTransport.requiresDayOfCheck must be a boolean")
        if not return_transport.get("sourceValueType"):
            problems.append("returnTransport.sourceValueType is required")
        if not return_transport.get("operatingModel"):
            problems.append("returnTransport.operatingModel is required")

        planned_departure = return_transport.get("plannedDeparture")
        alternatives = return_transport.get("alternativeDepartures") or []

        if transport_type == "HEADWAY_SERVICE":
            headway = return_transport.get("headwayMinutes")
            if not isinstance(headway, int) or headway <= 0:
                problems.append("HEADWAY_SERVICE requires a positive headwayMinutes")
            if planned_departure is not None:
                problems.append("HEADWAY_SERVICE must not invent a plannedDeparture")
            if not _is_clock(return_transport.get("plannedBoardingAfter")):
                problems.append(
                    "HEADWAY_SERVICE requires a valid plannedBoardingAfter"
                )
        elif transport_type == "SCHEDULED_SERVICE":
            if not _is_clock(planned_departure):
                problems.append("SCHEDULED_SERVICE requires a valid plannedDeparture")
            if not all(_is_clock(value) for value in alternatives):
                problems.append("all alternativeDepartures must use HH:MM")
        elif transport_type == "RESERVATION_REQUIRED":
            if return_transport.get("ticketingModel") != "ADVANCE_RESERVATION":
                problems.append(
                    "RESERVATION_REQUIRED requires ADVANCE_RESERVATION ticketing"
                )

    legacy_return_fields = {
        "lastReturnDeparture",
        "lastReturnDepartureStatus",
        "lastReturnDepartureSource",
    }
    populated_legacy_fields = sorted(legacy_return_fields.intersection(schedule))
    if populated_legacy_fields:
        problems.append(
            "legacy last-return fields are prohibited; use returnTransport: "
            + ", ".join(populated_legacy_fields)
        )

    itinerary = course["itinerary"]
    itinerary_ids = [item.get("id") for item in itinerary]
    if len(itinerary_ids) != len(set(itinerary_ids)):
        problems.append("itinerary item IDs must be unique within a course")

    for item in itinerary:
        duration = item.get("durationMinutes")
        if not item.get("id") or not item.get("type"):
            problems.append("every itinerary item needs id and type")
        if not isinstance(duration, int) or duration < 0:
            problems.append(
                f"itinerary durationMinutes must be non-negative: {item.get('id')}"
            )

    for source in course["sources"]:
        if not all(
            source.get(field)
            for field in ("label", "url", "checkedDate", "verificationStatus")
        ):
            problems.append("every source needs label, url, checkedDate and status")
            continue
        if not _is_http_url(source["url"]):
            problems.append(f"source URL must be http(s): {source['url']!r}")
        if not _is_iso_date(source["checkedDate"]):
            problems.append(f"source checkedDate must be ISO: {source['checkedDate']!r}")
    itinerary_total = sum(item.get("durationMinutes") or 0 for item in itinerary)
    plan_total = course["totalMinutes"].get("plan")

    if itinerary_total != plan_total:
        problems.append(
            "totalMinutes.plan must equal the itinerary sum "
            f"({plan_total} != {itinerary_total})"
        )

    walking_total = sum(
        item.get("durationMinutes") or 0
        for item in itinerary
        if item.get("type") == "walk"
    )
    if walking_total != course["walkingMinutes"].get("plan"):
        problems.append(
            "walkingMinutes.plan must equal the sum of walk segments "
            f"({course['walkingMinutes'].get('plan')} != {walking_total})"
        )

    transfer_total = sum(1 for item in itinerary if item.get("isTransfer"))
    if transfer_total != course["transferCount"]:
        problems.append(
            "transferCount must equal the number of transfer segments "
            f"({course['transferCount']} != {transfer_total})"
        )

    return problems


def is_valid_course(course: Any) -> bool:
    return not collect_course_problems(course)


def validate_courses(courses: Iterable[Any]) -> tuple[list[dict], list[dict]]:
    """(유효한 코스, 진단 결과) 튜플을 돌려줍니다."""

    valid: list[dict] = []
    diagnostics: list[dict] = []

    seen_ids: set[str] = set()

    for index, course in enumerate(courses):
        problems = collect_course_problems(course)
        course_id = course.get("id") if isinstance(course, dict) else None

        # 스키마가 깨진 행은 유효 ID를 선점하지 않습니다. 그래야 뒤에 있는 정상
        # 원본 행까지 중복으로 오판해 제거하지 않습니다.
        if not problems:
            if course_id in seen_ids:
                problems.append(f"duplicate course id: {course_id}")
            elif course_id:
                seen_ids.add(course_id)

        if problems:
            diagnostics.append(
                {
                    "index": index,
                    "courseId": course_id,
                    "problems": problems,
                }
            )
            continue

        valid.append(course)

    return valid, diagnostics


def _main() -> int:
    """CI에서 코스 데이터의 스키마 정합성을 단독으로 검사합니다."""

    import json
    import sys

    from backend.app.courses.data import COURSE_DETAILS

    valid, diagnostics = validate_courses(COURSE_DETAILS)

    if diagnostics:
        print("코스 데이터 검증 실패:", file=sys.stderr)
        print(json.dumps(diagnostics, ensure_ascii=False, indent=2), file=sys.stderr)
        return 1

    print(f"코스 데이터 {len(valid)}건이 schema v{SCHEMA_VERSION} 검증을 통과했습니다.")
    return 0


if __name__ == "__main__":
    raise SystemExit(_main())
