import unittest

import httpx
from fastapi.testclient import TestClient

from backend.app.ai_preferences.client import (
    GeminiInvalidResponseError,
    GeminiPreferenceClient,
    GeminiTransportError,
    get_gemini_preference_client,
)
from backend.app.ai_preferences.models import AiPreferenceInterpretationResponse
from backend.app.main import app


class GeminiPreferenceClientTest(unittest.TestCase):
    def test_interpret_returns_only_supported_condition_codes(self) -> None:
        def handler(request: httpx.Request) -> httpx.Response:
            self.assertEqual(request.headers["x-goog-api-key"], "test-key")
            body = request.read().decode("utf-8")
            self.assertIn("오래된 거리", body)
            return httpx.Response(
                200,
                json={
                    "candidates": [
                        {
                            "content": {
                                "parts": [
                                    {
                                        "text": '{"preferences":["HISTORY_CULTURE","FOOD_MARKET"],"mobility":"LOW_BURDEN"}'
                                    }
                                ]
                            }
                        }
                    ]
                },
            )

        with GeminiPreferenceClient(
            api_key="test-key", transport=httpx.MockTransport(handler)
        ) as client:
            result = client.interpret(
                "많이 걷지 않고 오래된 거리와 시장을 둘러보고 싶어요"
            )

        self.assertEqual(
            result.preferences, ["HISTORY_CULTURE", "FOOD_MARKET"]
        )
        self.assertEqual(result.mobility, "LOW_BURDEN")

    def test_interpret_rejects_invalid_provider_codes(self) -> None:
        def handler(_: httpx.Request) -> httpx.Response:
            return httpx.Response(
                200,
                json={
                    "candidates": [
                        {
                            "content": {
                                "parts": [
                                    {
                                        "text": '{"preferences":["BEACH"],"mobility":"ANY"}'
                                    }
                                ]
                            }
                        }
                    ]
                },
            )

        with GeminiPreferenceClient(
            api_key="test-key", transport=httpx.MockTransport(handler)
        ) as client:
            with self.assertRaises(GeminiInvalidResponseError):
                client.interpret("바다를 보고 싶어요")


class AiPreferencesEndpointTest(unittest.TestCase):
    def setUp(self) -> None:
        self.client = TestClient(app)

    def tearDown(self) -> None:
        app.dependency_overrides.pop(get_gemini_preference_client, None)

    def test_endpoint_returns_interpreted_conditions(self) -> None:
        class FakeGeminiClient:
            def interpret(self, text: str) -> AiPreferenceInterpretationResponse:
                self.text = text
                return AiPreferenceInterpretationResponse(
                    preferences=["HISTORY_CULTURE", "FOOD_MARKET"],
                    mobility="LOW_BURDEN",
                )

        fake = FakeGeminiClient()
        app.dependency_overrides[get_gemini_preference_client] = lambda: fake

        response = self.client.post(
            "/api/ai/interpret-preferences",
            json={"text": "  오래된 거리에서 맛있는 것을 먹고 싶어요  "},
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response.json(),
            {
                "preferences": ["HISTORY_CULTURE", "FOOD_MARKET"],
                "mobility": "LOW_BURDEN",
            },
        )
        self.assertEqual(fake.text, "오래된 거리에서 맛있는 것을 먹고 싶어요")

    def test_endpoint_rejects_blank_text(self) -> None:
        response = self.client.post(
            "/api/ai/interpret-preferences", json={"text": "   "}
        )

        self.assertEqual(response.status_code, 422)
        self.assertEqual(response.json()["code"], "INVALID_REQUEST")

    def test_endpoint_hides_provider_transport_error(self) -> None:
        class FailingGeminiClient:
            def interpret(self, _: str) -> AiPreferenceInterpretationResponse:
                raise GeminiTransportError("provider detail must stay private")

        app.dependency_overrides[get_gemini_preference_client] = (
            lambda: FailingGeminiClient()
        )

        response = self.client.post(
            "/api/ai/interpret-preferences", json={"text": "자연을 보고 싶어요"}
        )

        self.assertEqual(response.status_code, 502)
        self.assertEqual(response.json()["code"], "AI_UNAVAILABLE")
        self.assertNotIn("provider detail", response.text)


if __name__ == "__main__":
    unittest.main()
