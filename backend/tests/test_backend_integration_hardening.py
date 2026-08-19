import unittest

from fastapi.testclient import TestClient

from backend.app.main import app
from backend.app.tour_api.client import get_tour_api_client


class BackendIntegrationHardeningTest(unittest.TestCase):
    def setUp(self) -> None:
        self.client = TestClient(app)

    def tearDown(self) -> None:
        app.dependency_overrides.pop(get_tour_api_client, None)

    def _recommend(self, departure, duration, preferences, mobility):
        response = self.client.post(
            "/api/recommendations",
            json={
                "departure": departure,
                "duration": duration,
                "preferences": preferences,
                "mobility": mobility,
            },
        )
        self.assertEqual(response.status_code, 200)
        return response.json()

    def test_sheet_qa_scenarios(self) -> None:
        cases = (
            ("S1", "USQUARE", "SIX_HOURS", ["NATURE_WALK"], "LOW_BURDEN", ["DY_LOW_01"]),
            ("S2", "USQUARE", "FULL_DAY", ["HISTORY_CULTURE"], "ANY", ["NJ_LOW_01", "NJ_NORMAL_01", "DY_NORMAL_01"]),
            ("S3", "USQUARE", "SIX_HOURS", ["HISTORY_CULTURE", "FOOD_MARKET"], "MIN_TRANSFER", ["NJ_LOW_01", "DY_LOW_01"]),
            ("S4", "USQUARE", "FULL_DAY", ["HISTORY_CULTURE"], "ANY", ["NJ_LOW_01", "NJ_NORMAL_01", "DY_NORMAL_01"]),
            ("S5", "GWANGJU_SONGJEONG", "SIX_HOURS", ["HISTORY_CULTURE"], "MIN_TRANSFER", ["MP_LOW_01"]),
            ("S6", "GWANGJU_SONGJEONG", "FULL_DAY", ["MEMORY", "HISTORY_CULTURE"], "ANY", ["MP_NORMAL_02", "MP_LOW_01"]),
            ("S7", "GWANGJU_SONGJEONG", "SIX_HOURS", ["MEMORY"], "ANY", []),
        )
        for name, departure, duration, preferences, mobility, expected in cases:
            with self.subTest(name=name):
                data = self._recommend(departure, duration, preferences, mobility)
                self.assertEqual([course["id"] for course in data["courses"]], expected)
                self.assertNotIn("MP_NORMAL_01", expected)

    def test_tourapi_timeout_cannot_break_core_recommendations(self) -> None:
        class FailingTourApi:
            def __getattr__(self, _: str):
                raise TimeoutError("TourAPI timeout")

        app.dependency_overrides[get_tour_api_client] = lambda: FailingTourApi()
        data = self._recommend(
            "USQUARE",
            "SIX_HOURS",
            ["HISTORY_CULTURE", "FOOD_MARKET"],
            "MIN_TRANSFER",
        )
        self.assertEqual([course["id"] for course in data["courses"]], ["NJ_LOW_01", "DY_LOW_01"])

    def test_tourapi_500_cannot_break_core_course_detail(self) -> None:
        class FailingTourApi:
            def __getattr__(self, _: str):
                raise RuntimeError("TourAPI 500")

        app.dependency_overrides[get_tour_api_client] = lambda: FailingTourApi()
        response = self.client.get("/api/courses/NJ_LOW_01")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["id"], "NJ_LOW_01")


if __name__ == "__main__":
    unittest.main()
