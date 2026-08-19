from dataclasses import dataclass
from math import isfinite
from urllib.parse import quote

KAKAO_MAP_LINK_BASE_URL = "https://map.kakao.com/link"


@dataclass(frozen=True)
class MapPlace:
    name: str
    latitude: float
    longitude: float


def _encode_path_segment(value: str) -> str:
    stripped = value.strip()

    if not stripped:
        raise ValueError("Map link text must not be empty.")

    return quote(stripped, safe="")


def _format_coordinate(name: str, value: float) -> str:
    if not isfinite(value):
        raise ValueError(f"{name} must be a finite coordinate.")

    return f"{value:.7f}".rstrip("0").rstrip(".")


def build_kakao_search_url(query: str) -> str:
    return f"{KAKAO_MAP_LINK_BASE_URL}/search/{_encode_path_segment(query)}"


def build_kakao_map_url(place: MapPlace) -> str:
    latitude = _format_coordinate("latitude", place.latitude)
    longitude = _format_coordinate("longitude", place.longitude)

    return (
        f"{KAKAO_MAP_LINK_BASE_URL}/map/"
        f"{_encode_path_segment(place.name)},{latitude},{longitude}"
    )


def build_kakao_directions_url(destination: MapPlace) -> str:
    latitude = _format_coordinate("latitude", destination.latitude)
    longitude = _format_coordinate("longitude", destination.longitude)

    return (
        f"{KAKAO_MAP_LINK_BASE_URL}/to/"
        f"{_encode_path_segment(destination.name)},{latitude},{longitude}"
    )


# ----------------------------------------------------------------------
# 출발지 자동 입력 + 구간별 길찾기
#
# 기존 `link/to/...` 스킴은 도착지만 지정되고 출발지는 사용자가 직접 입력해야
# 했습니다(멘토 코멘트: "출발지는 우리가 입력해야 하고 코스의 관광지 하나만
# 도착으로 설정되어 있음"). 아래 함수들은
#   1) 출발지·도착지를 모두 채운 길찾기 URL
#   2) 코스 전체를 구간 단위로 이어가는 길찾기 URL 목록
# 을 만들어 이 문제를 해결합니다.
# ----------------------------------------------------------------------

from typing import Any, Iterable  # noqa: E402

KAKAO_MAP_WEB_BASE_URL = "https://map.kakao.com/"


def _encode_query_value(value: str) -> str:
    stripped = value.strip()

    if not stripped:
        raise ValueError("Map link text must not be empty.")

    return quote(stripped, safe="")


def build_kakao_route_url(
    origin: MapPlace,
    destination: MapPlace,
) -> str:
    """출발지와 도착지를 모두 채운 카카오맵 길찾기 URL을 만듭니다.

    좌표까지 함께 넘겨 동명 지역(예: 중앙동)에서 엉뚱한 장소가 잡히는 것을 막습니다.
    """

    return (
        f"{KAKAO_MAP_WEB_BASE_URL}?map_type=TYPE_MAP"
        f"&target=car"
        f"&sName={_encode_query_value(origin.name)}"
        f"&sX={origin.longitude}&sY={origin.latitude}"
        f"&eName={_encode_query_value(destination.name)}"
        f"&eX={destination.longitude}&eY={destination.latitude}"
    )


def build_kakao_transit_route_url(
    origin: MapPlace,
    destination: MapPlace,
) -> str:
    """대중교통 기준 길찾기 URL을 만듭니다."""

    return build_kakao_route_url(origin, destination).replace(
        "target=car", "target=publictransit"
    )


def build_course_route_links(
    origin: MapPlace,
    stops: Iterable[MapPlace],
) -> list[dict[str, Any]]:
    """출발지 → 각 경유지 → 출발지 복귀까지 구간별 길찾기 링크를 만듭니다.

    카카오맵 링크 스킴은 경유지를 지원하지 않으므로, 코스를 구간으로 잘라
    "출발지가 이미 채워진" 링크를 순서대로 제공합니다.
    """

    ordered = list(stops)

    if not ordered:
        return []

    points = [origin, *ordered, origin]
    links: list[dict[str, Any]] = []

    for index in range(len(points) - 1):
        start = points[index]
        end = points[index + 1]

        if start.name == end.name:
            continue

        links.append(
            {
                "order": len(links) + 1,
                "fromName": start.name,
                "toName": end.name,
                "transitUrl": build_kakao_transit_route_url(start, end),
                "walkUrl": build_kakao_route_url(start, end).replace(
                    "target=car", "target=walk"
                ),
            }
        )

    return links
