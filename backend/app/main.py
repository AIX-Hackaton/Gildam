from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from backend.app.courses.models import CourseDetailResponse
from backend.app.courses.service import get_course_detail
from backend.app.recommendations.models import (
    RecommendationRequest,
    RecommendationResponse,
)
from backend.app.recommendations.service import get_recommendations

app = FastAPI(
    title="Gildam API",
    version="0.1.0",
    description="길담 MVP의 추천 코스 상세 API입니다.",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://127.0.0.1:5173",
        "http://localhost:5173",
    ],
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)


@app.get("/health")
def health_check() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/api/courses/{course_id}", response_model=CourseDetailResponse)
def read_course_detail(course_id: str) -> CourseDetailResponse:
    course = get_course_detail(course_id)

    if course is None:
        raise HTTPException(status_code=404, detail="Course not found.")

    return course


@app.post("/api/recommendations", response_model=RecommendationResponse)
def read_recommendations(request: RecommendationRequest) -> RecommendationResponse:
    return get_recommendations(request)
