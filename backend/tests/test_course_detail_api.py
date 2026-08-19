import copy
import os
import unittest

from fastapi.testclient import TestClient

from backend.app.courses.data import COURSE_DETAILS
from backend.app.courses.feasibility import evaluate_return_feasibility
from backend.app.courses.schema import collect_course_problems, validate_courses
from backend.app.courses.service import get_course_detail, get_valid_courses
from backend.app.main import app


class CourseDetailApiTest(unittest.TestCase):
    def setUp(self) -> None:
        self.client = TestClient(app)

    def test_returns_detail_for_primary_course(self) -> None:
        response = self.client.get("/api/courses/NJ_LOW_01")

        self.assertEqual(response.status_code, 200)

        data = response.json()

        self.assertEqual(data["id"], "NJ_LOW_01")
        self.assertEqual(data["schemaVersion"], "3.1")
        self.assertEqual(data["durationMinutes"], 289)
        self.assertEqual(data["transferCount"], 0)
        self.assertEqual(data["departurePointName"], "유스퀘어(광주종합버스터미널)")
        self.assertTrue(data["manualChecks"])
        self.assertTrue(data["sources"])

    def test_directions_url_prefills_origin_and_destination(self) -> None:
        """멘토 코멘트 대응: 출발지를 사용자가 직접 입력하지 않도록 합니다."""

        data = self.client.get("/api/courses/DY_LOW_01").json()

        self.assertIn("sName=", data["kakaoDirectionsUrl"])
        self.assertIn("eName=", data["kakaoDirectionsUrl"])
        self.assertIn("target=publictransit", data["kakaoDirectionsUrl"])

    def test_route_links_cover_every_stop_not_just_one(self) -> None:
        data = self.client.get("/api/courses/DY_LOW_01").json()
        links = data["routeLinks"]

        self.assertGreaterEqual(len(links), 3)
        self.assertEqual(links[0]["fromName"], "유스퀘어(광주종합버스터미널)")
        self.assertEqual(links[-1]["toName"], "유스퀘어(광주종합버스터미널)")

    def test_itinerary_items_expose_individual_map_links(self) -> None:
        data = self.client.get("/api/courses/DY_LOW_01").json()
        mapped = [item for item in data["itinerary"] if item.get("mapUrl")]

        self.assertGreaterEqual(len(mapped), 3)

    def test_blocked_course_is_not_reachable_by_direct_url(self) -> None:
        response = self.client.get("/api/courses/MP_NORMAL_01")

        self.assertEqual(response.status_code, 404)
        self.assertEqual(response.json()["code"], "NOT_FOUND")

    def test_unknown_course_returns_structured_404(self) -> None:
        response = self.client.get("/api/courses/unknown-course")

        self.assertEqual(response.status_code, 404)
        self.assertEqual(response.json()["code"], "NOT_FOUND")

    def test_service_returns_none_for_blocked_and_unknown(self) -> None:
        self.assertIsNone(get_course_detail("unknown-course"))
        self.assertIsNone(get_course_detail("MP_NORMAL_01"))

    def test_unverified_return_transport_blocks_both_duration_options(self) -> None:
        six = self.client.get("/api/courses/DY_NORMAL_01?duration=SIX_HOURS").json()
        full = self.client.get("/api/courses/DY_NORMAL_01?duration=FULL_DAY").json()

        self.assertEqual(six["returnFeasibility"]["status"], "NOT_FEASIBLE")
        self.assertEqual(full["returnFeasibility"]["status"], "NOT_FEASIBLE")
        self.assertEqual(full["returnFeasibility"]["confidence"], "UNVERIFIED")


class DataIntegrityTest(unittest.TestCase):
    def test_all_shipped_courses_pass_schema_v31(self) -> None:
        valid, diagnostics = validate_courses(COURSE_DETAILS)

        self.assertEqual(diagnostics, [])
        self.assertEqual(len(valid), len(COURSE_DETAILS))

    def test_totals_match_itinerary_sums(self) -> None:
        for course in COURSE_DETAILS:
            with self.subTest(course=course["id"]):
                total = sum(
                    item.get("durationMinutes") or 0 for item in course["itinerary"]
                )
                self.assertEqual(total, course["totalMinutes"]["plan"])

    def test_course_with_missing_field_is_dropped_not_crashing(self) -> None:
        broken = copy.deepcopy(COURSE_DETAILS[0])
        broken.pop("totalMinutes")

        problems = collect_course_problems(broken)
        self.assertTrue(problems)

        valid, diagnostics = validate_courses([broken, *COURSE_DETAILS])
        self.assertEqual(len(valid), len(COURSE_DETAILS))
        self.assertEqual(len(diagnostics), 1)

    def test_primary_courses_do_not_invent_last_return_times(self) -> None:
        for course in get_valid_courses():
            with self.subTest(course=course["id"]):
                if course.get("isPrimary"):
                    self.assertIsNone(course["schedule"]["lastReturnDeparture"])
                    self.assertEqual(
                        course["schedule"]["lastReturnDepartureStatus"], "UNVERIFIED"
                    )

    def test_feasibility_marks_unverified_last_bus_as_not_feasible(self) -> None:
        broken = copy.deepcopy(COURSE_DETAILS[0])
        broken["schedule"]["lastReturnDeparture"] = None
        broken["schedule"]["lastReturnDepartureStatus"] = "BLOCKED"

        result = evaluate_return_feasibility(broken, "FULL_DAY")

        self.assertEqual(result["status"], "NOT_FEASIBLE")
        self.assertEqual(result["confidence"], "UNVERIFIED")

    def test_feasibility_detects_missing_last_bus_window(self) -> None:
        late = copy.deepcopy(COURSE_DETAILS[0])
        late["schedule"]["lastReturnDeparture"] = "10:00"
        late["schedule"]["lastReturnDepartureStatus"] = "VERIFIED"

        result = evaluate_return_feasibility(late, "FULL_DAY")

        self.assertEqual(result["status"], "NOT_FEASIBLE")


class HealthAndDemoFailureTest(unittest.TestCase):
    def setUp(self) -> None:
        self.client = TestClient(app)

    def test_health_reports_data_integrity(self) -> None:
        data = self.client.get("/health").json()

        self.assertEqual(data["status"], "ok")
        self.assertEqual(data["schemaInvalidCount"], 0)
        self.assertEqual(data["managedCourseCount"], 7)
        self.assertEqual(data["primaryCourseCount"], 6)
        self.assertEqual(data["blockedCourseCount"], 1)
        self.assertEqual(data["publishableCourseCount"], 0)
        self.assertIn("MP_NORMAL_01", data["blockedCourseIds"])
        self.assertEqual(data["dataSnapshotDate"], "2026-08-06")

    def test_condition_metadata_is_served(self) -> None:
        data = self.client.get("/api/meta/conditions").json()

        self.assertEqual(len(data["departures"]), 2)
        self.assertEqual(len(data["preferences"]), 4)
        self.assertEqual(len(data["mobilities"]), 3)

    def test_demo_failure_is_disabled_by_default(self) -> None:
        response = self.client.get("/api/courses/NJ_LOW_01?simulate=server_error")

        self.assertEqual(response.status_code, 200)

    def test_demo_failure_can_be_enabled_for_the_stage(self) -> None:
        os.environ["GILDAM_DEMO_FAILURE"] = "1"
        try:
            response = self.client.get(
                "/api/courses/NJ_LOW_01?simulate=server_error"
            )
            self.assertEqual(response.status_code, 500)
            self.assertEqual(response.json()["code"], "SERVER_ERROR")
        finally:
            os.environ.pop("GILDAM_DEMO_FAILURE", None)


if __name__ == "__main__":
    unittest.main()
