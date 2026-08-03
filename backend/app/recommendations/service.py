from copy import deepcopy
from typing import Any, TypedDict

from backend.app.courses.data import COURSE_DETAILS
from backend.app.courses.fatigue import calculate_fatigue
from backend.app.recommendations.models import (
    DepartureId,
    DurationId,
    ExcludedCourse,
    ExclusionReason,
    PreferenceId,
    RecommendationRequest,
    RecommendationResponse,
)

DURATION_LIMITS: dict[DurationId, int] = {
    "SIX_HOURS": 360,
    "FULL_DAY": 720,
}

RANKING_WEIGHTS = {
    "preferenceMatch": 0.4,
    "mobility": 0.3,
    "localResource": 0.2,
    "recordFit": 0.1,
}


class RecommendationMetadata(TypedDict):
    departures: list[DepartureId]
    preferences: list[PreferenceId]
    returnFeasible: bool
    localResourceScore: float
    recordFitScore: float


RECOMMENDATION_METADATA: dict[str, RecommendationMetadata] = {
    "damyang-slow-walk": {
        "departures": ["GWANGJU_SONGJEONG", "USQUARE"],
        "preferences": ["NATURE_WALK", "FOOD_MARKET", "MEMORY"],
        "returnFeasible": True,
        "localResourceScore": 0.9,
        "recordFitScore": 0.85,
    },
    "damyang-market-trip": {
        "departures": ["USQUARE"],
        "preferences": ["FOOD_MARKET", "HISTORY_CULTURE"],
        "returnFeasible": True,
        "localResourceScore": 0.9,
        "recordFitScore": 0.65,
    },
    "naju-history-walk": {
        "departures": ["GWANGJU_SONGJEONG"],
        "preferences": ["HISTORY_CULTURE", "FOOD_MARKET", "MEMORY"],
        "returnFeasible": True,
        "localResourceScore": 0.9,
        "recordFitScore": 0.85,
    },
    "naju-riverside-day": {
        "departures": ["GWANGJU_SONGJEONG", "USQUARE"],
        "preferences": ["NATURE_WALK", "FOOD_MARKET"],
        "returnFeasible": True,
        "localResourceScore": 0.8,
        "recordFitScore": 0.75,
    },
    "mokpo-port-culture": {
        "departures": ["GWANGJU_SONGJEONG"],
        "preferences": ["HISTORY_CULTURE", "FOOD_MARKET", "MEMORY"],
        "returnFeasible": True,
        "localResourceScore": 0.95,
        "recordFitScore": 0.9,
    },
    "mokpo-seaside-day": {
        "departures": ["GWANGJU_SONGJEONG", "USQUARE"],
        "preferences": ["NATURE_WALK", "MEMORY"],
        "returnFeasible": True,
        "localResourceScore": 0.75,
        "recordFitScore": 0.95,
    },
}


def _round_score(value: float) -> float:
    return round(value, 4)


def _assert_normalized_score(name: str, value: float) -> None:
    if not isinstance(value, (int, float)) or value < 0 or value > 1:
        raise ValueError(f"{name} must be a number between 0 and 1.")


def _unique_preferences(preferences: list[PreferenceId]) -> list[PreferenceId]:
    return list(dict.fromkeys(preferences))


def _get_exclusion_reasons(
    course: dict[str, Any],
    metadata: RecommendationMetadata,
    request: RecommendationRequest,
) -> list[ExclusionReason]:
    reasons: list[ExclusionReason] = []

    if request.departure not in metadata["departures"]:
        reasons.append(
            ExclusionReason(
                code="UNSUPPORTED_DEPARTURE",
                message="선택한 출발지에서 이용할 수 없는 코스입니다.",
            )
        )

    if course["durationMinutes"] > DURATION_LIMITS[request.duration]:
        reasons.append(
            ExclusionReason(
                code="TIME_LIMIT_EXCEEDED",
                message="선택한 가능 시간을 초과하는 코스입니다.",
            )
        )

    if not metadata["returnFeasible"]:
        reasons.append(
            ExclusionReason(
                code="RETURN_NOT_FEASIBLE",
                message="당일 귀가 가능성이 검증되지 않은 코스입니다.",
            )
        )

    return reasons


def _build_score_factor(score: float, weight: float) -> dict[str, float]:
    rounded_score = _round_score(score)

    return {
        "score": rounded_score,
        "weight": weight,
        "weightedScore": _round_score(rounded_score * weight),
    }


def _calculate_score_breakdown(
    course: dict[str, Any],
    metadata: RecommendationMetadata,
    request: RecommendationRequest,
    fatigue_score: float,
) -> dict[str, Any]:
    _assert_normalized_score("localResourceScore", metadata["localResourceScore"])
    _assert_normalized_score("recordFitScore", metadata["recordFitScore"])

    selected_preferences = _unique_preferences(request.preferences)
    course_preferences = set(metadata["preferences"])
    matched_preferences = [
        preference
        for preference in selected_preferences
        if preference in course_preferences
    ]
    preference_score = len(matched_preferences) / len(selected_preferences)
    mobility_score = _round_score((3 - fatigue_score) / 2)

    return {
        "preferenceMatch": {
            **_build_score_factor(
                preference_score, RANKING_WEIGHTS["preferenceMatch"]
            ),
            "matchedCount": len(matched_preferences),
            "selectedCount": len(selected_preferences),
            "matchedPreferences": matched_preferences,
        },
        "mobility": {
            **_build_score_factor(mobility_score, RANKING_WEIGHTS["mobility"]),
            "fatigueScore": fatigue_score,
        },
        "localResource": _build_score_factor(
            metadata["localResourceScore"], RANKING_WEIGHTS["localResource"]
        ),
        "recordFit": _build_score_factor(
            metadata["recordFitScore"], RANKING_WEIGHTS["recordFit"]
        ),
    }


def _calculate_recommendation_score(breakdown: dict[str, Any]) -> float:
    return _round_score(
        breakdown["preferenceMatch"]["weightedScore"]
        + breakdown["mobility"]["weightedScore"]
        + breakdown["localResource"]["weightedScore"]
        + breakdown["recordFit"]["weightedScore"]
    )


def _has_preference_match(
    metadata: RecommendationMetadata, request: RecommendationRequest
) -> bool:
    selected_preferences = set(request.preferences)

    return any(
        preference in selected_preferences for preference in metadata["preferences"]
    )


def _build_recommendation_candidate(
    course: dict[str, Any],
    metadata: RecommendationMetadata,
    request: RecommendationRequest,
) -> dict[str, Any]:
    fatigue = calculate_fatigue(
        {
            "walkingMinutes": course["walkingMinutes"],
            "transferCount": course["transferCount"],
            "roundTripTransitMinutes": course["roundTripTransitMinutes"],
        }
    )
    breakdown = _calculate_score_breakdown(
        course, metadata, request, fatigue["score"]
    )

    return {
        "id": course["id"],
        "title": course["title"],
        "region": course["region"],
        "thumbnailUrl": course["thumbnailUrl"],
        "tags": course["tags"],
        "fatigueLevel": fatigue["level"],
        "fatigueScore": fatigue["score"],
        "durationMinutes": course["durationMinutes"],
        "walkingMinutes": course["walkingMinutes"],
        "transferCount": course["transferCount"],
        "roundTripTransitMinutes": course["roundTripTransitMinutes"],
        "recommendationReasons": course["recommendationReasons"],
        "recommendationScore": _calculate_recommendation_score(breakdown),
        "scoreBreakdown": breakdown,
    }


def get_recommendations(request: RecommendationRequest) -> RecommendationResponse:
    candidates: list[dict[str, Any]] = []
    exclusions: list[ExcludedCourse] = []

    for index, source_course in enumerate(COURSE_DETAILS):
        course = deepcopy(source_course)
        metadata = RECOMMENDATION_METADATA[course["id"]]
        reasons = _get_exclusion_reasons(course, metadata, request)

        if reasons:
            exclusions.append(
                ExcludedCourse(
                    id=course["id"],
                    title=course["title"],
                    reasons=reasons,
                )
            )
            continue

        if not _has_preference_match(metadata, request):
            continue

        candidate = _build_recommendation_candidate(course, metadata, request)
        candidate["_sourceIndex"] = index
        candidates.append(candidate)

    ranked_candidates = sorted(
        candidates,
        key=lambda candidate: (
            -candidate["recommendationScore"],
            -candidate["scoreBreakdown"]["preferenceMatch"]["matchedCount"],
            candidate["fatigueScore"],
            candidate["_sourceIndex"],
        ),
    )[:3]

    for candidate in ranked_candidates:
        candidate.pop("_sourceIndex")

    return RecommendationResponse(courses=ranked_candidates, exclusions=exclusions)
