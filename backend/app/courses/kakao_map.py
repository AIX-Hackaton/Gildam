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
