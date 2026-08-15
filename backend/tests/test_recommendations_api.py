import unittest

from fastapi.testclient import TestClient

from backend.app.courses.service import get_valid_courses
from backend.app.main import app
from backend.app.recommendations.models import RecommendationRequest
from backend.app.recommendations.service import get_recommendations

PRIMARY_COURSE_IDS = {
    "DY_LOW_01",
    "DY_NORMAL_01",
    "NJ_LOW_01",
    "NJ_NORMAL_01",
    "MP_LOW_01",
    "MP_NORMAL_02",
}


class RecommendationsApiTest(unittest.TestCase):
    def setUp(self) -> None:
        self.client = TestClient(app)

    def _post(self, **overrides):
        payload = {
            "departure": "USQUARE",
            "duration": "SIX_HOURS",
            "preferences": ["HISTORY_CULTURE", "FOOD_MARKET"],
            "mobility": "ANY",
        }
        payload.update(overrides)

        return self.client.post("/api/recommendations", json=payload)

    # -- 대표 시나리오 -------------------------------------------------

    def test_representative_scenario_ranks_naju_low_first(self) -> None:
        """대표 시나리오: 유스퀘어 / 6시간 / 역사·문화+음식·시장 / 환승 최소."""

        response = self._post(mobility="MIN_TRANSFER")

        self.assertEqual(response.status_code, 200)

        data = response.json()

        self.assertGreater(len(data["courses"]), 0)
        self.assertEqual(data["courses"][0]["id"], "NJ_LOW_01")
        self.assertEqual(data["courses"][0]["durationMinutes"], 289)
        self.assertEqual(data["courses"][0]["walkingMinutes"], 35)
        self.assertEqual(data["courses"][0]["transferCount"], 0)
        self.assertEqual(data["courses"][0]["fatigueLevel"], "MEDIUM")

    def test_returns_at_most_three_courses(self) -> None:
        response = self._post(
            duration="FULL_DAY",
            preferences=["NATURE_WALK", "HISTORY_CULTURE", "FOOD_MARKET", "MEMORY"],
        )

        self.assertLessEqual(len(response.json()["courses"]), 3)

    # -- 노출 정책 -----------------------------------------------------

    def test_blocked_course_never_appears_in_any_condition_combination(self) -> None:
        """MP_NORMAL_01은 어떤 조건 조합에서도 추천 결과에 나오면 안 됩니다."""

        preference_sets = [
            ["NATURE_WALK"],
            ["HISTORY_CULTURE"],
            ["FOOD_MARKET"],
            ["MEMORY"],
            ["NATURE_WALK", "HISTORY_CULTURE", "FOOD_MARKET", "MEMORY"],
        ]

        for departure in ("USQUARE", "GWANGJU_SONGJEONG"):
            for duration in ("SIX_HOURS", "FULL_DAY"):
                for mobility in ("MIN_TRANSFER", "LOW_BURDEN", "ANY"):
                    for preferences in preference_sets:
                        data = self._post(
                            departure=departure,
                            duration=duration,
                            mobility=mobility,
                            preferences=preferences,
                        ).json()

                        ids = {course["id"] for course in data["courses"]}

                        self.assertNotIn("MP_NORMAL_01", ids)
                        self.assertTrue(ids <= PRIMARY_COURSE_IDS)

    def test_blocked_course_is_reported_with_policy_reason(self) -> None:
        data = self._post().json()
        blocked = [item for item in data["exclusions"] if item["id"] == "MP_NORMAL_01"]

        self.assertEqual(len(blocked), 1)
        self.assertEqual(
            blocked[0]["reasons"][0]["code"], "BLOCKED_BY_EXPOSURE_POLICY"
        )

    # -- 조건 반응성 ---------------------------------------------------

    def test_mobility_condition_changes_results(self) -> None:
        relaxed = self._post(
            duration="FULL_DAY", preferences=["HISTORY_CULTURE"], mobility="ANY"
        ).json()
        strict = self._post(
            duration="FULL_DAY",
            preferences=["HISTORY_CULTURE"],
            mobility="MIN_TRANSFER",
        ).json()

        relaxed_ids = {course["id"] for course in relaxed["courses"]}
        strict_ids = {course["id"] for course in strict["courses"]}

        self.assertIn("NJ_NORMAL_01", relaxed_ids)
        self.assertNotIn("NJ_NORMAL_01", strict_ids)
        self.assertTrue(strict_ids <= relaxed_ids)

    def test_departure_filter_excludes_other_region(self) -> None:
        data = self._post(departure="GWANGJU_SONGJEONG").json()

        for course in data["courses"]:
            self.assertEqual(course["region"], "목포")

    def test_every_recommended_course_is_return_feasible(self) -> None:
        for duration in ("SIX_HOURS", "FULL_DAY"):
            for departure in ("USQUARE", "GWANGJU_SONGJEONG"):
                data = self._post(
                    departure=departure,
                    duration=duration,
                    preferences=[
                        "NATURE_WALK",
                        "HISTORY_CULTURE",
                        "FOOD_MARKET",
                        "MEMORY",
                    ],
                ).json()

                for course in data["courses"]:
                    self.assertNotEqual(
                        course["returnFeasibility"]["status"], "NOT_FEASIBLE"
                    )
                    self.assertLessEqual(
                        course["durationMinutes"],
                        course["returnFeasibility"]["allowedMinutes"],
                    )

    # -- 설명 가능성 ---------------------------------------------------

    def test_score_breakdown_is_explainable_and_sums_to_total(self) -> None:
        course = self._post(mobility="MIN_TRANSFER").json()["courses"][0]
        breakdown = course["scoreBreakdown"]

        expected_keys = {
            "preferenceMatch",
            "mobility",
            "returnMargin",
            "localResource",
            "recordFit",
        }
        self.assertEqual(set(breakdown), expected_keys)

        total = sum(factor["weightedScore"] for factor in breakdown.values())
        self.assertAlmostEqual(course["recommendationScore"], total, places=3)

        for factor in breakdown.values():
            self.assertTrue(factor["explanation"])
            self.assertGreaterEqual(factor["score"], 0)
            self.assertLessEqual(factor["score"], 1)

    def test_more_walking_lowers_mobility_score(self) -> None:
        data = self._post(
            duration="FULL_DAY",
            preferences=["NATURE_WALK", "HISTORY_CULTURE", "FOOD_MARKET"],
        ).json()
        by_id = {course["id"]: course for course in data["courses"]}

        if "DY_NORMAL_01" in by_id and "DY_LOW_01" in by_id:
            self.assertLess(
                by_id["DY_NORMAL_01"]["scoreBreakdown"]["mobility"]["score"],
                by_id["DY_LOW_01"]["scoreBreakdown"]["mobility"]["score"],
            )

    def test_fatigue_explanation_is_included(self) -> None:
        course = self._post().json()["courses"][0]
        explanation = course["fatigueExplanation"]

        self.assertEqual(len(explanation["factors"]), 3)
        self.assertTrue(explanation["formula"])
        self.assertIn(explanation["level"], {"LOW", "MEDIUM", "HIGH"})

    # -- 결과 없음 대응 -------------------------------------------------

    def test_no_results_returns_actionable_suggestions(self) -> None:
        """샘플 데이터 7번: 조건 충족 코스가 없으면 억지 추천 대신 대안을 제시합니다."""

        data = self._post(
            departure="GWANGJU_SONGJEONG",
            duration="SIX_HOURS",
            preferences=["MEMORY"],
            mobility="ANY",
        ).json()

        self.assertEqual(data["courses"], [])
        self.assertGreater(len(data["suggestions"]), 0)

        codes = {suggestion["code"] for suggestion in data["suggestions"]}
        self.assertIn("RELAX_DURATION", codes)

        for suggestion in data["suggestions"]:
            self.assertTrue(suggestion["message"])
            if suggestion["code"] != "NO_ALTERNATIVE":
                self.assertGreater(suggestion["availableCount"], 0)

    def test_suggestions_are_absent_when_results_exist(self) -> None:
        data = self._post().json()

        self.assertGreater(len(data["courses"]), 0)
        self.assertEqual(data["suggestions"], [])

    def test_does_not_invent_courses_when_nothing_matches(self) -> None:
        response = get_recommendations(
            RecommendationRequest(
                departure="USQUARE",
                duration="SIX_HOURS",
                preferences=["MEMORY"],
                mobility="MIN_TRANSFER",
            )
        )

        for course in response.courses:
            self.assertIn("MEMORY", course.scoreBreakdown.preferenceMatch.matchedPreferences)

    # -- 입력 검증 -----------------------------------------------------

    def test_rejects_empty_preferences_with_structured_error(self) -> None:
        response = self.client.post(
            "/api/recommendations",
            json={
                "departure": "USQUARE",
                "duration": "SIX_HOURS",
                "preferences": [],
            },
        )

        self.assertEqual(response.status_code, 422)
        self.assertEqual(response.json()["code"], "INVALID_REQUEST")

    def test_rejects_unknown_departure(self) -> None:
        response = self._post(departure="SEOUL_STATION")

        self.assertEqual(response.status_code, 422)

    # -- 메타 ----------------------------------------------------------

    def test_meta_reports_data_integrity(self) -> None:
        data = self._post().json()

        self.assertEqual(data["meta"]["schemaInvalidCount"], 0)
        self.assertEqual(data["meta"]["evaluatedCount"], len(get_valid_courses()))
        self.assertEqual(data["meta"]["dataSnapshotDate"], "2026-08-06")


if __name__ == "__main__":
    unittest.main()
