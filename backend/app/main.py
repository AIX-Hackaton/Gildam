from fastapi import FastAPI, HTTPException

from backend.app.courses.models import CourseDetailResponse
from backend.app.courses.service import get_course_detail

app = FastAPI(
    title="Gildam API",
    version="0.1.0",
    description="길담 MVP의 추천 코스 상세 API입니다.",
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
