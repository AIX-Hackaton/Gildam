import os

from fastapi import Depends, FastAPI, HTTPException, Query, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from backend.app.courses import exposure
from backend.app.courses.data import DATA_SNAPSHOT_DATE, DATA_SOURCE_URL, SCHEMA_VERSION
from backend.app.courses.lineage import build_lineage_report
from backend.app.courses.models import CourseDetailResponse, DataLineageResponse
from backend.app.courses.service import (
    get_schema_diagnostics,
    get_valid_courses,
    resolve_fatigue,
)
from backend.app.courses.service import get_course_detail
from backend.app.recommendations.models import (
    RecommendationRequest,
    RecommendationResponse,
)
from backend.app.recommendations.service import get_recommendations
from backend.app.tour_api.client import (
    TourApiClient,
    TourApiConfigurationError,
    TourApiError,
    TourApiProviderError,
    TourApiTransportError,
    get_tour_api_client,
)
from backend.app.tour_api.models import TourApiListResponse

app = FastAPI(
    title="Gildam API",
    version="0.4.0",
    description=(
        "길담 MVP API입니다. 검증된 코스 DB(schema v3.1)를 원천으로 "
        "조건 필터링·귀가 가능성 검증·설명 가능한 추천을 제공합니다."
    ),
)


def _allowed_origins() -> list[str]:
    configured = os.getenv("GILDAM_ALLOWED_ORIGINS")

    if configured:
        return [origin.strip() for origin in configured.split(",") if origin.strip()]

    return [
        "http://127.0.0.1:5173",
        "http://localhost:5173",
        "http://127.0.0.1:4173",
        "http://localhost:4173",
    ]


app.add_middleware(
    CORSMiddleware,
    allow_origins=_allowed_origins(),
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)


# ----------------------------------------------------------------------
# 오류 응답 규격 통일
# 프론트엔드가 상태코드만이 아니라 code 로도 분기할 수 있게 합니다.
# ----------------------------------------------------------------------


def _error_body(code: str, message: str) -> dict[str, str]:
    return {"code": code, "message": message, "detail": message}


def _tour_api_error(exc: TourApiError) -> HTTPException:
    if isinstance(exc, TourApiConfigurationError):
        return HTTPException(
            status_code=503,
            detail=_error_body(
                "TOUR_API_NOT_CONFIGURED",
                "TourAPI 인증키가 설정되지 않았습니다. TOUR_API_SERVICE_KEY를 확인해 주세요.",
            ),
        )

    if isinstance(exc, TourApiProviderError):
        return HTTPException(
            status_code=502,
            detail={
                **_error_body(
                    "TOUR_API_PROVIDER_ERROR",
                    "TourAPI 응답을 처리하지 못했습니다.",
                ),
                "providerCode": exc.code,
                "providerMessage": exc.message,
            },
        )

    if isinstance(exc, TourApiTransportError):
        return HTTPException(
            status_code=502,
            detail=_error_body(
                "TOUR_API_UNAVAILABLE",
                "TourAPI에 연결하지 못했습니다. 잠시 후 다시 시도해 주세요.",
            ),
        )

    return HTTPException(
        status_code=502,
        detail=_error_body("TOUR_API_ERROR", "TourAPI 요청에 실패했습니다."),
    )


@app.exception_handler(HTTPException)
async def http_exception_handler(_: Request, exc: HTTPException) -> JSONResponse:
    detail = exc.detail

    if isinstance(detail, dict) and "code" in detail:
        body = detail
    else:
        body = _error_body(
            "NOT_FOUND" if exc.status_code == 404 else "REQUEST_FAILED",
            str(detail),
        )

    return JSONResponse(status_code=exc.status_code, content=body)


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(
    _: Request, exc: RequestValidationError
) -> JSONResponse:
    return JSONResponse(
        status_code=422,
        content={
            **_error_body(
                "INVALID_REQUEST",
                "요청 조건이 올바르지 않습니다. 출발지·가능 시간·취향·이동 부담을 다시 선택해 주세요.",
            ),
            "errors": [
                {"field": ".".join(str(part) for part in error.get("loc", [])),
                 "message": error.get("msg", "")}
                for error in exc.errors()
            ],
        },
    )


@app.exception_handler(Exception)
async def unhandled_exception_handler(_: Request, __: Exception) -> JSONResponse:
    return JSONResponse(
        status_code=500,
        content=_error_body(
            "SERVER_ERROR",
            "데이터를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.",
        ),
    )


# ----------------------------------------------------------------------
# 시연용 장애 주입
# GILDAM_DEMO_FAILURE=1 일 때만 활성화됩니다. DemoDay에서 500·빈 결과 대응을
# 실제로 보여주기 위한 스위치이며, 기본값은 비활성입니다.
# ----------------------------------------------------------------------


def _demo_failure_enabled() -> bool:
    return os.getenv("GILDAM_DEMO_FAILURE", "").strip() in {"1", "true", "TRUE"}


def _maybe_simulate_failure(simulate: str | None) -> None:
    if not simulate or not _demo_failure_enabled():
        return

    if simulate == "server_error":
        raise HTTPException(
            status_code=500,
            detail=_error_body(
                "SERVER_ERROR",
                "데이터를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.",
            ),
        )

    if simulate == "not_found":
        raise HTTPException(
            status_code=404,
            detail=_error_body("NOT_FOUND", "요청한 코스를 찾을 수 없습니다."),
        )


# ----------------------------------------------------------------------
# 엔드포인트
# ----------------------------------------------------------------------


@app.get("/health")
def health_check() -> dict[str, object]:
    """서버 상태와 함께 데이터 정합성 요약을 돌려줍니다."""

    courses = get_valid_courses()
    diagnostics = get_schema_diagnostics()
    lineage = build_lineage_report(courses)
    mismatches = [
        {
            "courseId": course["id"],
            "calculated": resolve_fatigue(course)["calculatedLevel"],
            "source": course.get("sheetFatigueLevel"),
        }
        for course in courses
        if resolve_fatigue(course)["calculatedLevel"]
        != course.get("sheetFatigueLevel")
    ]

    return {
        "status": "ok",
        "schemaVersion": SCHEMA_VERSION,
        "dataSnapshotDate": DATA_SNAPSHOT_DATE,
        "dataSourceUrl": DATA_SOURCE_URL,
        "exposureMode": exposure.get_exposure_mode(),
        "managedCourseCount": len(courses),
        "primaryCourseCount": sum(1 for course in courses if course.get("isPrimary")),
        "blockedCourseCount": sum(
            1 for course in courses if exposure.is_hard_blocked(course)
        ),
        "publishableCourseCount": sum(
            1 for course in courses if course.get("publishable")
        ),
        "recommendableCount": sum(
            1 for course in courses if exposure.is_recommendable(course)
        ),
        "blockedCourseIds": [
            course["id"]
            for course in courses
            if not exposure.is_recommendable(course)
        ],
        "schemaInvalidCount": len(diagnostics),
        "schemaDiagnostics": diagnostics,
        "fatigueMismatches": mismatches,
        "dataLineage": lineage["summary"],
        "demoFailureEnabled": _demo_failure_enabled(),
    }


@app.get("/api/meta/conditions")
def read_condition_options() -> dict[str, object]:
    """조건 선택지의 단일 정의. 프론트엔드 하드코딩 드리프트를 막습니다."""

    return {
        "departures": [
            {"id": "USQUARE", "label": "유스퀘어"},
            {"id": "GWANGJU_SONGJEONG", "label": "광주송정역"},
        ],
        "durations": [
            {"id": "SIX_HOURS", "label": "6시간"},
            {"id": "FULL_DAY", "label": "하루 종일"},
        ],
        "preferences": [
            {"id": "NATURE_WALK", "label": "자연·산책"},
            {"id": "HISTORY_CULTURE", "label": "역사·문화"},
            {"id": "FOOD_MARKET", "label": "음식·시장"},
            {"id": "MEMORY", "label": "감성기록"},
        ],
        "mobilities": [
            {"id": "MIN_TRANSFER", "label": "환승 최소"},
            {"id": "LOW_BURDEN", "label": "이동 부담 낮게"},
            {"id": "ANY", "label": "상관없음"},
        ],
        "serviceDay": "SATURDAY",
    }


@app.get("/api/meta/data-lineage", response_model=DataLineageResponse)
def read_data_lineage() -> DataLineageResponse:
    """Track #1 원자료 약속과 실제 시트·코드·화면 사용처를 반환합니다."""

    return DataLineageResponse(**build_lineage_report(get_valid_courses()))


@app.get("/api/tour/search", response_model=TourApiListResponse)
def search_tour_places(
    keyword: str = Query(min_length=1),
    content_type_id: int | None = Query(default=None, alias="contentTypeId"),
    arrange: str = Query(default="A", min_length=1, max_length=1),
    page_no: int = Query(default=1, ge=1, alias="pageNo"),
    num_of_rows: int = Query(default=10, ge=1, le=100, alias="numOfRows"),
    l_dong_regn_cd: str | None = Query(default=None, alias="lDongRegnCd"),
    l_dong_signgu_cd: str | None = Query(default=None, alias="lDongSignguCd"),
    lcls_systm1: str | None = Query(default=None, alias="lclsSystm1"),
    lcls_systm2: str | None = Query(default=None, alias="lclsSystm2"),
    lcls_systm3: str | None = Query(default=None, alias="lclsSystm3"),
    client: TourApiClient = Depends(get_tour_api_client),
) -> TourApiListResponse:
    """TourAPI keyword search. 서버가 인증키를 보관하고 결과만 정규화합니다."""

    try:
        return client.search_keyword(
            keyword=keyword,
            content_type_id=content_type_id,
            arrange=arrange,
            page_no=page_no,
            num_of_rows=num_of_rows,
            l_dong_regn_cd=l_dong_regn_cd,
            l_dong_signgu_cd=l_dong_signgu_cd,
            lcls_systm1=lcls_systm1,
            lcls_systm2=lcls_systm2,
            lcls_systm3=lcls_systm3,
        )
    except TourApiError as exc:
        raise _tour_api_error(exc) from exc


@app.get("/api/tour/nearby", response_model=TourApiListResponse)
def search_nearby_tour_places(
    map_x: float = Query(alias="mapX"),
    map_y: float = Query(alias="mapY"),
    radius: int = Query(default=1000, ge=1, le=20000),
    content_type_id: int | None = Query(default=None, alias="contentTypeId"),
    arrange: str = Query(default="E", min_length=1, max_length=1),
    page_no: int = Query(default=1, ge=1, alias="pageNo"),
    num_of_rows: int = Query(default=10, ge=1, le=100, alias="numOfRows"),
    client: TourApiClient = Depends(get_tour_api_client),
) -> TourApiListResponse:
    """TourAPI location-based search for candidate place matching."""

    try:
        return client.location_based_list(
            map_x=map_x,
            map_y=map_y,
            radius=radius,
            content_type_id=content_type_id,
            arrange=arrange,
            page_no=page_no,
            num_of_rows=num_of_rows,
        )
    except TourApiError as exc:
        raise _tour_api_error(exc) from exc


@app.get("/api/tour/places/{content_id}", response_model=TourApiListResponse)
def read_tour_place_detail(
    content_id: str,
    page_no: int = Query(default=1, ge=1, alias="pageNo"),
    num_of_rows: int = Query(default=10, ge=1, le=100, alias="numOfRows"),
    client: TourApiClient = Depends(get_tour_api_client),
) -> TourApiListResponse:
    """TourAPI common detail lookup by contentId."""

    try:
        return client.detail_common(
            content_id=content_id,
            page_no=page_no,
            num_of_rows=num_of_rows,
        )
    except TourApiError as exc:
        raise _tour_api_error(exc) from exc


@app.get("/api/courses/{course_id}", response_model=CourseDetailResponse)
def read_course_detail(
    course_id: str,
    duration: str | None = Query(default=None),
    simulate: str | None = Query(default=None),
) -> CourseDetailResponse:
    _maybe_simulate_failure(simulate)

    course = get_course_detail(course_id, duration)

    if course is None:
        raise HTTPException(
            status_code=404,
            detail=_error_body("NOT_FOUND", "요청한 코스를 찾을 수 없습니다."),
        )

    return course


@app.post("/api/recommendations", response_model=RecommendationResponse)
def read_recommendations(
    request: RecommendationRequest,
    simulate: str | None = Query(default=None),
) -> RecommendationResponse:
    _maybe_simulate_failure(simulate)

    return get_recommendations(request)
