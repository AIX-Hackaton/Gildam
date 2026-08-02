from copy import deepcopy

from backend.app.courses.data import COURSE_DETAILS
from backend.app.courses.fatigue import calculate_fatigue
from backend.app.courses.kakao_map import (
    MapPlace,
    build_kakao_directions_url,
    build_kakao_map_url,
)
from backend.app.courses.models import CourseDetailResponse


def _build_map_place(course: dict) -> MapPlace:
    destination = course["primaryDestination"]

    return MapPlace(
        name=destination["name"],
        latitude=destination["latitude"],
        longitude=destination["longitude"],
    )


def _build_course_detail_response(course: dict) -> CourseDetailResponse:
    course_detail = deepcopy(course)
    destination = _build_map_place(course_detail)
    fatigue = calculate_fatigue(
        {
            "walkingMinutes": course_detail["walkingMinutes"],
            "transferCount": course_detail["transferCount"],
            "roundTripTransitMinutes": course_detail["roundTripTransitMinutes"],
        }
    )
    kakao_map_url = build_kakao_map_url(destination)
    kakao_directions_url = build_kakao_directions_url(destination)

    course_detail.update(
        {
            "fatigueLevel": fatigue["level"],
            "fatigueScore": fatigue["score"],
            "mapUrl": kakao_map_url,
            "directionsUrl": kakao_directions_url,
            "kakaoMapUrl": kakao_map_url,
            "kakaoDirectionsUrl": kakao_directions_url,
        }
    )

    return CourseDetailResponse(**course_detail)


def get_course_detail(course_id: str) -> CourseDetailResponse | None:
    for course in COURSE_DETAILS:
        if course["id"] == course_id:
            return _build_course_detail_response(course)

    return None
