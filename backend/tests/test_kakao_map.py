import unittest

from backend.app.courses.kakao_map import (
    MapPlace,
    build_kakao_directions_url,
    build_kakao_map_url,
    build_kakao_search_url,
)


class KakaoMapLinkTest(unittest.TestCase):
    def test_builds_encoded_search_url(self) -> None:
        self.assertEqual(
            build_kakao_search_url("담양 관방제림"),
            "https://map.kakao.com/link/search/%EB%8B%B4%EC%96%91%20%EA%B4%80%EB%B0%A9%EC%A0%9C%EB%A6%BC",
        )

    def test_builds_map_url_with_destination_coordinates(self) -> None:
        self.assertEqual(
            build_kakao_map_url(
                MapPlace(
                    name="담양 관방제림",
                    latitude=35.3216,
                    longitude=126.9865,
                )
            ),
            "https://map.kakao.com/link/map/%EB%8B%B4%EC%96%91%20%EA%B4%80%EB%B0%A9%EC%A0%9C%EB%A6%BC,35.3216,126.9865",
        )

    def test_builds_directions_url_with_destination_coordinates(self) -> None:
        self.assertEqual(
            build_kakao_directions_url(
                MapPlace(
                    name="담양 관방제림",
                    latitude=35.3216,
                    longitude=126.9865,
                )
            ),
            "https://map.kakao.com/link/to/%EB%8B%B4%EC%96%91%20%EA%B4%80%EB%B0%A9%EC%A0%9C%EB%A6%BC,35.3216,126.9865",
        )

    def test_rejects_empty_link_text(self) -> None:
        with self.assertRaises(ValueError):
            build_kakao_search_url(" ")


if __name__ == "__main__":
    unittest.main()
