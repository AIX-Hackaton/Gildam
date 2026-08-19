import copy
import unittest

from fastapi.testclient import TestClient

from backend.app.courses.data import COURSE_DETAILS
from backend.app.courses.lineage import (
    RETURN_SEGMENT_REFERENCES,
    TRACK1_SOURCE_REGISTRY,
    build_lineage_report,
    collect_lineage_problems,
)
from backend.app.courses.schema import collect_course_problems
from backend.app.main import app
from backend.app.recommendations.service import _local_resource_score


class Track1LineageTest(unittest.TestCase):
    def setUp(self) -> None:
        self.client = TestClient(app)

    def test_catalog_contains_all_track1_datasets_once(self) -> None:
        ids = [dataset["id"] for dataset in TRACK1_SOURCE_REGISTRY]

        self.assertEqual(ids, [f"A-DS{number:02d}" for number in range(1, 20)])
        self.assertEqual(collect_lineage_problems(), [])

    def test_unproven_track1_sources_are_not_claimed_as_used(self) -> None:
        report = build_lineage_report(COURSE_DETAILS)

        self.assertEqual(report["summary"]["traceableUsedCount"], 0)
        self.assertEqual(report["summary"]["claimableTrack1DatasetIds"], [])
        self.assertEqual(report["summary"]["referenceOnlyCount"], 1)
        self.assertEqual(report["summary"]["evidenceRequiredCount"], 3)
        self.assertGreater(report["summary"]["supplementarySourceCount"], 0)

    def test_lineage_api_explains_source_to_ui_flow(self) -> None:
        response = self.client.get("/api/meta/data-lineage")

        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(len(data["track1Datasets"]), 19)
        self.assertEqual(len(data["sheetSnapshot"]["tabs"]), 18)
        self.assertEqual(data["sheetSnapshot"]["schemaVersion"], "3.1")
        self.assertEqual(data["summary"]["lineageInvalidCount"], 0)

        return_flow = next(
            item for item in data["featureLineage"] if item["id"] == "RETURN_READINESS"
        )
        self.assertIn("교통 구간[구간ID]", return_flow["sheetSelectors"])
        self.assertIn("ReturnFeasibilityModel", return_flow["apiFields"])
        self.assertTrue(return_flow["uiSurfaces"])


class ReturnTransportDataTest(unittest.TestCase):
    def test_every_course_references_the_sheet_return_segment(self) -> None:
        for course in COURSE_DETAILS:
            with self.subTest(course=course["id"]):
                transport = course["schedule"]["returnTransport"]
                self.assertEqual(
                    transport["segmentId"], RETURN_SEGMENT_REFERENCES[course["id"]]
                )

    def test_transport_types_preserve_sheet_semantics(self) -> None:
        by_id = {course["id"]: course for course in COURSE_DETAILS}

        damyang = by_id["DY_LOW_01"]["schedule"]["returnTransport"]
        self.assertEqual(damyang["type"], "HEADWAY_SERVICE")
        self.assertEqual(damyang["headwayMinutes"], 20)
        self.assertIsNone(damyang["plannedDeparture"])

        naju = by_id["NJ_LOW_01"]["schedule"]["returnTransport"]
        self.assertEqual(naju["type"], "SCHEDULED_SERVICE")
        self.assertEqual(naju["plannedDeparture"], "13:05")
        self.assertEqual(naju["alternativeDepartures"], ["13:35", "13:50"])
        self.assertEqual(naju["ticketingModel"], "ONSITE_TICKET")

        mokpo = by_id["MP_LOW_01"]["schedule"]["returnTransport"]
        self.assertEqual(mokpo["type"], "RESERVATION_REQUIRED")
        self.assertEqual(mokpo["ticketingModel"], "ADVANCE_RESERVATION")

    def test_schema_rejects_an_invented_return_segment(self) -> None:
        broken = copy.deepcopy(COURSE_DETAILS[0])
        broken["schedule"]["returnTransport"]["segmentId"] = "invented-segment"

        problems = collect_course_problems(broken)

        self.assertTrue(any("final transport segment" in item for item in problems))

    def test_schema_requires_fields_consumed_by_the_api(self) -> None:
        for field in (
            "verifiedDate",
            "publishable",
            "isPrimary",
            "thumbnailUrl",
            "recommendationReasons",
            "description",
            "roundTripTransitMinutes",
            "primaryDestination",
            "sources",
        ):
            with self.subTest(field=field):
                broken = copy.deepcopy(COURSE_DETAILS[0])
                broken.pop(field)
                self.assertTrue(collect_course_problems(broken))


class RankingDataShapeTest(unittest.TestCase):
    def test_local_resource_score_uses_category_coverage_not_row_count(self) -> None:
        course = copy.deepcopy(COURSE_DETAILS[0])
        original_score, _ = _local_resource_score(course)
        course["localFood"] = course["localFood"] * 20
        course["localPoints"] = course["localPoints"] * 20

        duplicated_score, explanation = _local_resource_score(course)

        self.assertEqual(original_score, duplicated_score)
        self.assertIn("2/2개 범주", explanation)


if __name__ == "__main__":
    unittest.main()
