import unittest

import httpx
from fastapi.testclient import TestClient

from backend.app.main import app
from backend.app.tour_api.client import (
    TourApiClient,
    TourApiProviderError,
    get_tour_api_client,
)
from backend.app.tour_api.models import TourApiItem, TourApiListResponse


class TourApiClientTest(unittest.TestCase):
    def _client(self, handler) -> TourApiClient:
        return TourApiClient(
            service_key="encoded%3D%3D",
            transport=httpx.MockTransport(handler),
        )

    def test_search_keyword_builds_required_params_and_normalizes_items(self) -> None:
        captured_url = ""

        def handler(request: httpx.Request) -> httpx.Response:
            nonlocal captured_url
            captured_url = str(request.url)

            return httpx.Response(
                200,
                json={
                    "response": {
                        "header": {"resultCode": "0000", "resultMsg": "OK"},
                        "body": {
                            "pageNo": 1,
                            "numOfRows": 5,
                            "totalCount": 1,
                            "items": {
                                "item": {
                                    "contentid": "126499",
                                    "contenttypeid": "12",
                                    "title": "죽녹원",
                                    "addr1": "전라남도 담양군 담양읍 죽녹원로 119",
                                    "mapx": "126.9865",
                                    "mapy": "35.3216",
                                    "firstimage": "https://example.com/main.jpg",
                                    "cpyrhtDivCd": "Type1",
                                }
                            },
                        },
                    }
                },
            )

        result = self._client(handler).search_keyword(
            keyword="죽녹원",
            content_type_id=12,
            num_of_rows=5,
        )

        self.assertIn("searchKeyword2", captured_url)
        self.assertIn("serviceKey=encoded%3D%3D", captured_url)
        self.assertIn("MobileOS=WEB", captured_url)
        self.assertIn("MobileApp=Gildam", captured_url)
        self.assertIn("_type=json", captured_url)
        self.assertEqual(result.endpoint, "searchKeyword2")
        self.assertEqual(result.totalCount, 1)
        self.assertEqual(result.items[0].contentId, "126499")
        self.assertEqual(result.items[0].contentTypeId, "12")
        self.assertEqual(result.items[0].mapX, 126.9865)
        self.assertEqual(result.items[0].mapY, 35.3216)
        self.assertEqual(result.items[0].copyrightType, "Type1")

    def test_location_radius_is_capped_before_request(self) -> None:
        def handler(_: httpx.Request) -> httpx.Response:
            raise AssertionError("request should not be sent")

        with self.assertRaises(ValueError):
            self._client(handler).location_based_list(
                map_x=126.9865,
                map_y=35.3216,
                radius=20001,
            )

    def test_provider_error_is_reported_with_code(self) -> None:
        def handler(_: httpx.Request) -> httpx.Response:
            return httpx.Response(
                200,
                json={
                    "response": {
                        "header": {
                            "resultCode": "20",
                            "resultMsg": "SERVICE_KEY_IS_NULL",
                        },
                        "body": {},
                    }
                },
            )

        with self.assertRaises(TourApiProviderError) as context:
            self._client(handler).detail_common(content_id="126499")

        self.assertEqual(context.exception.code, "20")


class TourApiEndpointTest(unittest.TestCase):
    def setUp(self) -> None:
        self.client = TestClient(app)

    def tearDown(self) -> None:
        app.dependency_overrides.pop(get_tour_api_client, None)

    def test_search_endpoint_uses_backend_proxy(self) -> None:
        class FakeTourApiClient:
            def search_keyword(self, **kwargs):
                self.last_kwargs = kwargs
                return TourApiListResponse(
                    endpoint="searchKeyword2",
                    pageNo=1,
                    numOfRows=10,
                    totalCount=1,
                    items=[
                        TourApiItem(
                            contentId="126499",
                            contentTypeId="12",
                            title="죽녹원",
                        )
                    ],
                )

        fake = FakeTourApiClient()
        app.dependency_overrides[get_tour_api_client] = lambda: fake

        response = self.client.get(
            "/api/tour/search",
            params={"keyword": "죽녹원", "contentTypeId": 12},
        )

        self.assertEqual(response.status_code, 200)
        data = response.json()

        self.assertEqual(data["source"], "KTO_TOUR_API")
        self.assertEqual(data["endpoint"], "searchKeyword2")
        self.assertEqual(data["items"][0]["contentId"], "126499")
        self.assertEqual(fake.last_kwargs["keyword"], "죽녹원")
        self.assertEqual(fake.last_kwargs["content_type_id"], 12)


if __name__ == "__main__":
    unittest.main()

