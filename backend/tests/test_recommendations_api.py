import os
import unittest
from unittest.mock import patch

from fastapi.testclient import TestClient

from backend.app.courses.service import get_valid_courses
from backend.app.main import app
from backend.app.recommendations.models import RecommendationRequest
from backend.app.recommendations.service import get_recommendations
from backend.app.traffic.models import TrafficSnapshot

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

    def _with_traffic(self, snapshots_by_course_id: dict[str, TrafficSnapshot]):
        class FakeTrafficProvider:
            def get_return_leg_snapshot(self, course):
                return snapshots_by_course_id.get(
                    course["id"],
                    TrafficSnapshot(
                        status="NORMAL",
                        provider="TEST_TRAFFIC",
                        affectedSegmentId=(
                            course.get("schedule", {})
                            .get("returnTransport", {})
                            .get("segmentId")
                        ),
                    ),
                )

        return patch(
            "backend.app.recommendations.service.traffic_service.get_traffic_provider",
            return_value=FakeTrafficProvider(),
        )

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

        response = self._post(mobility="MIN_TRANSFER")

        self.assertEqual(response.status_code, 200)

        data = response.json()

        self.assertGreater(len(data["courses"]), 0)
        self.assertEqual(data["courses"][0]["id"], "NJ_LOW_01")
        self.assertEqual(data["courses"][0]["thumbnailCredit"], "황성훈")
        self.assertEqual(
            data["courses"][0]["returnFeasibility"]["confidence"],
            "NEEDS_DAY_OF_CHECK",
        )

    def test_representative_scenario_ranks_naju_then_damyang(self) -> None:
        with self._with_traffic({}):
            data = self._post(mobility="MIN_TRANSFER").json()

        self.assertEqual(
            [course["id"] for course in data["courses"]],
            ["NJ_LOW_01", "DY_LOW_01"],
        )
        self.assertEqual([course["rank"] for course in data["courses"]], [1, 2])

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

    def test_public_mode_keeps_unpublished_demo_courses_hidden(self) -> None:
        os.environ["GILDAM_EXPOSURE_MODE"] = "PUBLIC"
        try:
            data = self._post().json()
            self.assertEqual(data["courses"], [])
            self.assertEqual(data["meta"]["blockedCount"], 7)
        finally:
            os.environ.pop("GILDAM_EXPOSURE_MODE", None)

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

    def test_condition_changes_actual_ranking_order(self) -> None:
        with self._with_traffic({}):
            six_hour = self._post(
                duration="SIX_HOURS",
                preferences=["HISTORY_CULTURE", "FOOD_MARKET"],
                mobility="MIN_TRANSFER",
            ).json()
            full_day = self._post(
                duration="FULL_DAY",
                preferences=["HISTORY_CULTURE"],
                mobility="ANY",
            ).json()

        self.assertEqual(
            [course["id"] for course in six_hour["courses"]],
            ["NJ_LOW_01", "DY_LOW_01"],
        )
        self.assertEqual(
            [course["id"] for course in full_day["courses"]],
            ["NJ_LOW_01", "NJ_NORMAL_01", "DY_NORMAL_01"],
        )

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
        course = self._post().json()["courses"][0]
        breakdown = course["scoreBreakdown"]

        self.assertEqual(
            set(breakdown),
            {"preferenceMatch", "mobility", "returnMargin", "localResource", "recordFit"},
        )
        total = sum(factor["weightedScore"] for factor in breakdown.values())
        self.assertAlmostEqual(course["recommendationScore"], total, places=3)

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

    def test_recommended_unverified_transport_has_second_check_warning(self) -> None:
        data = self._post().json()
        self.assertTrue(data["courses"])
        for course in data["courses"]:
            self.assertEqual(
                course["returnFeasibility"]["confidence"], "NEEDS_DAY_OF_CHECK"
            )

    def test_realtime_traffic_tight_keeps_course_with_warning(self) -> None:
        with self._with_traffic(
            {
                "NJ_LOW_01": TrafficSnapshot(
                    status="DELAYED",
                    provider="TEST_TRAFFIC",
                    affectedSegmentId="NJ_LOW_01-S2",
                    delayMinutes=50,
                    message="테스트 지연",
                )
            }
        ):
            data = self._post(mobility="MIN_TRANSFER").json()

        naju = next(course for course in data["courses"] if course["id"] == "NJ_LOW_01")
        self.assertEqual(naju["trafficStatus"], "TIGHT")
        self.assertEqual(naju["returnFeasibility"]["status"], "TIGHT")
        self.assertEqual(naju["trafficWarnings"][0]["code"], "REALTIME_TRAFFIC_TIGHT")
        self.assertEqual(data["meta"]["trafficTightCount"], 1)

    def test_realtime_traffic_blocked_excludes_course_and_returns_alternative(self) -> None:
        with self._with_traffic(
            {
                "NJ_LOW_01": TrafficSnapshot(
                    status="BLOCKED",
                    provider="TEST_TRAFFIC",
                    affectedSegmentId="NJ_LOW_01-S2",
                    message="귀가편 도착 예정 차량이 없습니다.",
                )
            }
        ):
            data = self._post(mobility="MIN_TRANSFER").json()

        self.assertEqual([course["id"] for course in data["courses"]], ["DY_LOW_01"])
        self.assertEqual(data["courses"][0]["rank"], 1)
        excluded = next(
            item for item in data["exclusions"] if item["id"] == "NJ_LOW_01"
        )
        self.assertEqual(excluded["trafficStatus"], "BLOCKED")
        self.assertEqual(
            excluded["reasons"][0]["code"], "REALTIME_TRAFFIC_BLOCKED"
        )
        self.assertEqual(data["meta"]["trafficBlockedCount"], 1)

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
        self.assertEqual(data["meta"]["dataSnapshotDate"], "2026-08-19")


if __name__ == "__main__":
    unittest.main()
