import unittest

from fastapi.testclient import TestClient

from backend.app.courses.service import get_course_detail
from backend.app.main import app


class CourseDetailApiTest(unittest.TestCase):
    def setUp(self) -> None:
        self.client = TestClient(app)

    def test_returns_course_detail_with_calculated_fatigue_and_kakao_links(
        self,
    ) -> None:
        response = self.client.get("/api/courses/damyang-slow-walk")

        self.assertEqual(response.status_code, 200)

        data = response.json()

        self.assertEqual(data["id"], "damyang-slow-walk")
        self.assertEqual(data["fatigueLevel"], "MEDIUM")
        self.assertEqual(data["fatigueScore"], 2.0)
        self.assertEqual(data["roundTripTransitMinutes"], 130)
        self.assertTrue(data["mapUrl"].startswith("https://map.kakao.com/link/map/"))
        self.assertTrue(
            data["directionsUrl"].startswith("https://map.kakao.com/link/to/")
        )
        self.assertEqual(data["mapUrl"], data["kakaoMapUrl"])
        self.assertEqual(data["directionsUrl"], data["kakaoDirectionsUrl"])

    def test_returns_not_found_for_unknown_course(self) -> None:
        response = self.client.get("/api/courses/unknown-course")

        self.assertEqual(response.status_code, 404)
        self.assertEqual(response.json()["detail"], "Course not found.")

    def test_service_returns_none_for_unknown_course(self) -> None:
        self.assertIsNone(get_course_detail("unknown-course"))

    def test_service_returns_detail_without_mutating_source_data(self) -> None:
        first_result = get_course_detail("naju-history-walk")
        second_result = get_course_detail("naju-history-walk")

        self.assertIsNotNone(first_result)
        self.assertIsNotNone(second_result)
        self.assertEqual(first_result, second_result)


if __name__ == "__main__":
    unittest.main()
