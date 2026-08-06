import unittest

from fastapi.testclient import TestClient

from backend.app.main import app
from backend.app.recommendations.service import get_recommendations
from backend.app.recommendations.models import RecommendationRequest


class RecommendationsApiTest(unittest.TestCase):
    def setUp(self) -> None:
        self.client = TestClient(app)

    def test_returns_ranked_recommendations(self) -> None:
        response = self.client.post(
            "/api/recommendations",
            json={
                "departure": "GWANGJU_SONGJEONG",
                "duration": "FULL_DAY",
                "preferences": ["HISTORY_CULTURE", "FOOD_MARKET", "MEMORY"],
            },
        )

        self.assertEqual(response.status_code, 200)

        data = response.json()

        self.assertEqual(
            [course["id"] for course in data["courses"]],
            [
                "naju-history-walk",
                "mokpo-port-culture",
                "damyang-slow-walk",
            ],
        )
        self.assertEqual(data["courses"][0]["fatigueLevel"], "LOW")
        self.assertGreater(data["courses"][0]["recommendationScore"], 0)
        self.assertEqual(
            data["courses"][0]["scoreBreakdown"]["preferenceMatch"][
                "matchedCount"
            ],
            3,
        )

    def test_filters_by_departure_and_duration(self) -> None:
        response = self.client.post(
            "/api/recommendations",
            json={
                "departure": "USQUARE",
                "duration": "SIX_HOURS",
                "preferences": ["FOOD_MARKET", "HISTORY_CULTURE"],
            },
        )

        self.assertEqual(response.status_code, 200)

        data = response.json()

        self.assertEqual(
            [course["id"] for course in data["courses"]],
            ["damyang-market-trip", "damyang-slow-walk"],
        )
        self.assertTrue(
            any(
                reason["code"] == "TIME_LIMIT_EXCEEDED"
                for exclusion in data["exclusions"]
                for reason in exclusion["reasons"]
            )
        )

    def test_rejects_incomplete_recommendation_request(self) -> None:
        response = self.client.post(
            "/api/recommendations",
            json={
                "departure": "GWANGJU_SONGJEONG",
                "duration": "FULL_DAY",
                "preferences": [],
            },
        )

        self.assertEqual(response.status_code, 422)

    def test_service_does_not_mutate_seed_data(self) -> None:
        request = RecommendationRequest(
            departure="GWANGJU_SONGJEONG",
            duration="FULL_DAY",
            preferences=["NATURE_WALK"],
        )

        first_result = get_recommendations(request)
        second_result = get_recommendations(request)

        self.assertEqual(first_result, second_result)


if __name__ == "__main__":
    unittest.main()
