from typing import Literal

from pydantic import BaseModel, Field

from backend.app.courses.models import (
    FatigueExplanation,
    ReturnFeasibilityModel,
)
from backend.app.traffic.models import (
    TrafficEvaluation,
    TrafficStatus,
    TrafficWarning,
)

DepartureId = Literal["GWANGJU_SONGJEONG", "USQUARE"]
DurationId = Literal["SIX_HOURS", "FULL_DAY"]
PreferenceId = Literal["NATURE_WALK", "HISTORY_CULTURE", "FOOD_MARKET", "MEMORY"]
MobilityId = Literal["MIN_TRANSFER", "LOW_BURDEN", "ANY"]
FatigueLevel = Literal["LOW", "MEDIUM", "HIGH"]

ExclusionReasonCode = Literal[
    "UNSUPPORTED_DEPARTURE",
    "DAY_NOT_SUPPORTED",
    "TIME_LIMIT_EXCEEDED",
    "RETURN_NOT_FEASIBLE",
    "MOBILITY_LIMIT_EXCEEDED",
    "PREFERENCE_MISMATCH",
    "BLOCKED_BY_EXPOSURE_POLICY",
    "SCHEMA_INVALID",
    "REALTIME_TRAFFIC_BLOCKED",
]

SuggestionCode = Literal[
    "RELAX_DURATION",
    "RELAX_MOBILITY",
    "ADD_PREFERENCE",
    "CHANGE_DEPARTURE",
    "NO_ALTERNATIVE",
]


class RecommendationRequest(BaseModel):
    departure: DepartureId
    duration: DurationId
    preferences: list[PreferenceId] = Field(min_length=1)
    mobility: MobilityId = "ANY"


class RecommendationScoreFactor(BaseModel):
    score: float
    weight: float
    weightedScore: float
    explanation: str


class PreferenceMatchScoreFactor(RecommendationScoreFactor):
    matchedCount: int
    selectedCount: int
    matchedPreferences: list[PreferenceId]


class MobilityComponentWeights(BaseModel):
    walking: float
    transfer: float
    transit: float


class MobilityScoreFactor(RecommendationScoreFactor):
    fatigueScore: float
    fatigueLevel: FatigueLevel
    walkingMinutes: int
    transferCount: int
    roundTripTransitMinutes: int
    componentWeights: MobilityComponentWeights


class ReturnMarginScoreFactor(RecommendationScoreFactor):
    slackMinutes: int
    status: str


class RecommendationScoreBreakdown(BaseModel):
    preferenceMatch: PreferenceMatchScoreFactor
    mobility: MobilityScoreFactor
    returnMargin: ReturnMarginScoreFactor
    localResource: RecommendationScoreFactor
    recordFit: RecommendationScoreFactor


class CourseRecommendationSummary(BaseModel):
    rank: int
    id: str
    title: str
    region: str
    thumbnailUrl: str
    thumbnailCredit: str | None = None
    thumbnailPlace: str | None = None
    tags: list[str]
    courseType: str
    fatigueLevel: FatigueLevel
    fatigueScore: float
    fatigueExplanation: FatigueExplanation
    durationMinutes: int
    durationMinMinutes: int
    durationMaxMinutes: int
    walkingMinutes: int
    transferCount: int
    roundTripTransitMinutes: int
    verificationStatus: str
    exposureTier: str
    recommendationReasons: list[str]
    recommendationScore: float
    scoreBreakdown: RecommendationScoreBreakdown
    returnFeasibility: ReturnFeasibilityModel
    trafficStatus: TrafficStatus
    trafficWarnings: list[TrafficWarning] = Field(default_factory=list)
    traffic: TrafficEvaluation


class ExclusionReason(BaseModel):
    code: ExclusionReasonCode
    message: str


class ExcludedCourse(BaseModel):
    id: str
    title: str
    reasons: list[ExclusionReason]
    trafficStatus: TrafficStatus | None = None


class RecommendationSuggestion(BaseModel):
    code: SuggestionCode
    message: str
    availableCount: int = 0


class RecommendationMeta(BaseModel):
    exposureMode: str
    evaluatedCount: int
    blockedCount: int
    schemaInvalidCount: int
    dataSnapshotDate: str
    appliedMobility: MobilityId
    trafficProvider: str
    trafficEvaluatedCount: int = 0
    trafficBlockedCount: int = 0
    trafficTightCount: int = 0


class RecommendationResponse(BaseModel):
    courses: list[CourseRecommendationSummary]
    exclusions: list[ExcludedCourse]
    suggestions: list[RecommendationSuggestion] = Field(default_factory=list)
    meta: RecommendationMeta
