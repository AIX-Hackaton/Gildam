from typing import Literal

from pydantic import BaseModel, Field

DepartureId = Literal["GWANGJU_SONGJEONG", "USQUARE"]
DurationId = Literal["SIX_HOURS", "FULL_DAY"]
PreferenceId = Literal["NATURE_WALK", "HISTORY_CULTURE", "FOOD_MARKET", "MEMORY"]
FatigueLevel = Literal["LOW", "MEDIUM", "HIGH"]
ExclusionReasonCode = Literal[
    "UNSUPPORTED_DEPARTURE", "TIME_LIMIT_EXCEEDED", "RETURN_NOT_FEASIBLE"
]


class RecommendationRequest(BaseModel):
    departure: DepartureId
    duration: DurationId
    preferences: list[PreferenceId] = Field(min_length=1)


class RecommendationScoreFactor(BaseModel):
    score: float
    weight: float
    weightedScore: float


class PreferenceMatchScoreFactor(RecommendationScoreFactor):
    matchedCount: int
    selectedCount: int
    matchedPreferences: list[PreferenceId]


class MobilityScoreFactor(RecommendationScoreFactor):
    fatigueScore: float


class RecommendationScoreBreakdown(BaseModel):
    preferenceMatch: PreferenceMatchScoreFactor
    mobility: MobilityScoreFactor
    localResource: RecommendationScoreFactor
    recordFit: RecommendationScoreFactor


class CourseRecommendationSummary(BaseModel):
    id: str
    title: str
    region: str
    thumbnailUrl: str
    tags: list[str]
    fatigueLevel: FatigueLevel
    fatigueScore: float
    durationMinutes: int
    walkingMinutes: int
    transferCount: int
    roundTripTransitMinutes: int
    recommendationReasons: list[str]
    recommendationScore: float
    scoreBreakdown: RecommendationScoreBreakdown


class ExclusionReason(BaseModel):
    code: ExclusionReasonCode
    message: str


class ExcludedCourse(BaseModel):
    id: str
    title: str
    reasons: list[ExclusionReason]


class RecommendationResponse(BaseModel):
    courses: list[CourseRecommendationSummary]
    exclusions: list[ExcludedCourse]
