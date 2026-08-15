"""schema v3.1 정합성 검사.

샘플 데이터 11번(`JSON 필수 필드 누락`) 대응 모듈입니다.
필수 필드가 없거나 요약 수치가 일정과 어긋나는 코스는 추천 후보에서 조용히
제외하고, 그 사실을 진단 결과로 남깁니다. 서버가 500으로 죽지 않게 하는 것이
이 모듈의 목적입니다.
"""

from typing import Any, Iterable

SCHEMA_VERSION = "3.1"

REQUIRED_FIELDS: tuple[str, ...] = (
    "id",
    "title",
    "region",
    "departurePoint",
    "timeType",
    "applicableDays",
    "verificationStatus",
    "exposureTier",
    "totalMinutes",
    "walkingMinutes",
    "transferCount",
    "itinerary",
    "preferences",
    "schedule",
)

REQUIRED_SCHEDULE_FIELDS: tuple[str, ...] = (
    "departureTime",
    "plannedReturnTime",
    "latestReturnTime",
)

VALID_EXPOSURE_TIERS = {"PUBLIC", "MANUAL_REVIEW", "DEMO_ONLY", "BLOCKED"}
VALID_TIME_TYPES = {"SIX_HOURS", "FULL_DAY"}
VALID_DEPARTURES = {"USQUARE", "GWANGJU_SONGJEONG"}


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

    if not _range_is_ordered(course["totalMinutes"]):
        problems.append("totalMinutes must satisfy min <= plan <= max")

    if not _range_is_ordered(course["walkingMinutes"]):
        problems.append("walkingMinutes must satisfy min <= plan <= max")

    schedule = course["schedule"]
    for field in REQUIRED_SCHEDULE_FIELDS:
        if not schedule.get(field):
            problems.append(f"missing required schedule field: {field}")

    itinerary = course["itinerary"]
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

    for index, course in enumerate(courses):
        problems = collect_course_problems(course)
        course_id = course.get("id") if isinstance(course, dict) else None

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
