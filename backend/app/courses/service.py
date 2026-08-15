"""코스 상세 조회 서비스.

`data.py` 의 원천 스냅샷을 사용자 화면용 응답으로 변환합니다.
변환 과정에서 다음을 항상 함께 수행합니다.

1. schema v3.1 정합성 검사 (깨진 행은 조용히 제외)
2. 노출 정책 적용 (BLOCKED·비주력 코스는 직접 URL로도 열리지 않음)
3. 피로도 재계산 + 시트값과의 정합성 판정
4. 귀가 가능성 계산
5. 출발지가 채워진 카카오맵 길찾기 링크 생성
"""

from copy import deepcopy
from functools import lru_cache
from typing import Any

from backend.app.courses import exposure
from backend.app.courses.data import (
    COURSE_DETAILS,
    DATA_SNAPSHOT_DATE,
    DATA_SOURCE_NAME,
    DATA_SOURCE_URL,
    DEPARTURE_POINTS,
)
from backend.app.courses.fatigue import (
    FATIGUE_LEVEL_SCORES,
    calculate_fatigue_breakdown,
)
from backend.app.courses.feasibility import evaluate_return_feasibility
from backend.app.courses.kakao_map import (
    MapPlace,
    build_course_route_links,
    build_kakao_map_url,
    build_kakao_transit_route_url,
)
from backend.app.courses.models import CourseDetailResponse
from backend.app.courses.schema import validate_courses


@lru_cache(maxsize=1)
def _validated() -> tuple[tuple[dict[str, Any], ...], tuple[dict[str, Any], ...]]:
    valid, diagnostics = validate_courses(COURSE_DETAILS)
    return tuple(valid), tuple(diagnostics)


def get_valid_courses() -> list[dict[str, Any]]:
    """schema v3.1을 만족하는 코스만 돌려줍니다."""

    return [deepcopy(course) for course in _validated()[0]]


def get_schema_diagnostics() -> list[dict[str, Any]]:
    """스키마 문제로 제외된 코스 목록을 돌려줍니다."""

    return [dict(item) for item in _validated()[1]]


def find_course(course_id: str) -> dict[str, Any] | None:
    for course in _validated()[0]:
        if course["id"] == course_id:
            return deepcopy(course)

    return None


def _departure_place(course: dict[str, Any]) -> MapPlace:
    point = DEPARTURE_POINTS.get(course["departurePoint"])

    if point is None:
        destination = course["primaryDestination"]
        return MapPlace(
            name=destination["name"],
            latitude=destination["latitude"],
            longitude=destination["longitude"],
        )

    return MapPlace(
        name=point["name"],
        latitude=point["latitude"],
        longitude=point["longitude"],
    )


def _destination_place(course: dict[str, Any]) -> MapPlace:
    destination = course["primaryDestination"]

    return MapPlace(
        name=destination["name"],
        latitude=destination["latitude"],
        longitude=destination["longitude"],
    )


def _itinerary_stops(course: dict[str, Any]) -> list[MapPlace]:
    """왕복 교통 구간을 제외한 실제 방문 지점만 뽑습니다."""

    stops: list[MapPlace] = []
    seen: set[str] = set()
    departure_name = _departure_place(course).name

    for item in course["itinerary"]:
        place = item.get("place")

        if not place or item.get("type") == "transport":
            continue

        if place["name"] in seen or place["name"] == departure_name:
            continue

        seen.add(place["name"])
        stops.append(
            MapPlace(
                name=place["name"],
                latitude=place["latitude"],
                longitude=place["longitude"],
            )
        )

    return stops


def resolve_fatigue(course: dict[str, Any]) -> dict[str, Any]:
    """계산값과 시트값 중 보수적인(더 높은) 등급을 최종 등급으로 씁니다.

    시트에는 "화면에서 저피로 표기 금지" 같은 운영 판단이 반영되어 있으므로,
    계산값이 더 낮게 나오더라도 사용자에게 낙관적으로 보여주지 않습니다.
    """

    breakdown = calculate_fatigue_breakdown(
        {
            "walkingMinutes": course["walkingMinutes"]["plan"],
            "transferCount": course["transferCount"],
            "roundTripTransitMinutes": course["roundTripTransitMinutes"],
        }
    )

    calculated_level = breakdown["level"]
    source_level = course.get("sheetFatigueLevel")

    if source_level and FATIGUE_LEVEL_SCORES.get(
        source_level, 0
    ) > FATIGUE_LEVEL_SCORES.get(calculated_level, 0):
        final_level = source_level
        resolution = (
            "계산값보다 원천 데이터의 피로도가 높아, 사용자에게는 더 보수적인 "
            f"{source_level} 등급으로 표시합니다."
        )
    else:
        final_level = calculated_level
        resolution = "계산값과 원천 데이터가 일치하거나 계산값이 더 보수적입니다."

    return {
        "level": final_level,
        "score": breakdown["score"],
        "calculatedLevel": calculated_level,
        "sourceLevel": source_level,
        "resolution": resolution,
        "factors": breakdown["factors"],
        "formula": breakdown["formula"],
    }


def build_course_detail(
    course: dict[str, Any], duration_id: str | None = None
) -> CourseDetailResponse:
    detail = deepcopy(course)
    origin = _departure_place(detail)
    destination = _destination_place(detail)
    stops = _itinerary_stops(detail)

    fatigue = resolve_fatigue(detail)
    feasibility = evaluate_return_feasibility(
        detail, duration_id or detail["timeType"]
    )

    map_url = build_kakao_map_url(destination)
    directions_url = build_kakao_transit_route_url(origin, destination)

    for item in detail["itinerary"]:
        place = item.get("place")
        if place:
            item["mapUrl"] = build_kakao_map_url(
                MapPlace(
                    name=place["name"],
                    latitude=place["latitude"],
                    longitude=place["longitude"],
                )
            )

    walking = detail["walkingMinutes"]

    detail.update(
        {
            "departurePointName": origin.name,
            "fatigueLevel": fatigue["level"],
            "fatigueScore": fatigue["score"],
            "fatigueExplanation": fatigue,
            "durationMinutes": detail["totalMinutes"]["plan"],
            "walkingMinutes": walking["plan"],
            "walkingMinutesRange": walking,
            "mapUrl": map_url,
            "directionsUrl": directions_url,
            "kakaoMapUrl": map_url,
            "kakaoDirectionsUrl": directions_url,
            "routeLinks": build_course_route_links(origin, stops),
            "returnFeasibility": feasibility,
            "exposureNotice": exposure.build_exposure_notice(detail),
            "dataSnapshotDate": DATA_SNAPSHOT_DATE,
            "dataSourceName": DATA_SOURCE_NAME,
            "dataSourceUrl": DATA_SOURCE_URL,
        }
    )

    return CourseDetailResponse(**detail)


def get_course_detail(
    course_id: str, duration_id: str | None = None
) -> CourseDetailResponse | None:
    """상세 조회. 노출 금지 코스는 존재하지 않는 것처럼 ``None`` 을 돌려줍니다."""

    course = find_course(course_id)

    if course is None:
        return None

    if not exposure.is_directly_accessible(course):
        return None

    return build_course_detail(course, duration_id)
