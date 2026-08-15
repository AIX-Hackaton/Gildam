from typing import Literal

from pydantic import BaseModel, Field

FatigueLevel = Literal["LOW", "MEDIUM", "HIGH"]
ItineraryItemType = Literal["transport", "walk", "place", "food"]
ExposureTier = Literal["PUBLIC", "MANUAL_REVIEW", "DEMO_ONLY", "BLOCKED"]
VerificationStatus = Literal[
    "VERIFIED",
    "VERIFIED_MAP",
    "PARTIALLY_VERIFIED",
    "NEEDS_RECHECK",
    "TEMPORARILY_UNAVAILABLE",
    "REFERENCE",
    "BLOCKED",
]


class MinutesRange(BaseModel):
    min: int
    plan: int
    max: int


class CourseDestination(BaseModel):
    name: str
    latitude: float
    longitude: float


class ItineraryItem(BaseModel):
    id: str
    name: str
    type: ItineraryItemType
    time: str | None = None
    durationMinutes: int | None = None
    note: str | None = None
    segmentType: str | None = None
    verificationStatus: str | None = None
    isTransfer: bool = False
    place: CourseDestination | None = None
    mapUrl: str | None = None


class LocalFood(BaseModel):
    id: str
    name: str
    description: str
    tags: list[str] = Field(default_factory=list)


class LocalPoint(BaseModel):
    id: str
    title: str
    description: str
    tags: list[str] = Field(default_factory=list)


class DataSource(BaseModel):
    label: str
    url: str
    checkedDate: str
    verificationStatus: str


class FatigueFactorModel(BaseModel):
    key: str
    label: str
    value: int
    unit: str
    level: FatigueLevel
    levelScore: int
    weight: float
    contribution: float
    threshold: str


class FatigueExplanation(BaseModel):
    level: FatigueLevel
    score: float
    calculatedLevel: FatigueLevel
    sourceLevel: FatigueLevel | None = None
    resolution: str
    factors: list[FatigueFactorModel]
    formula: str


class ReturnFeasibilityModel(BaseModel):
    status: Literal["FEASIBLE", "TIGHT", "NOT_FEASIBLE"]
    confidence: Literal["CONFIRMED", "NEEDS_DAY_OF_CHECK", "UNVERIFIED"]
    departureTime: str
    plannedReturnTime: str
    latestReturnTime: str
    plannedTotalMinutes: int
    worstCaseTotalMinutes: int
    allowedMinutes: int
    slackMinutes: int
    lastActivityEndTime: str | None = None
    lastReturnDeparture: str | None = None
    lastReturnSlackMinutes: int | None = None
    bookingRequired: bool = False
    messages: list[str] = Field(default_factory=list)


class ExposureNotice(BaseModel):
    tier: ExposureTier
    title: str
    message: str


class RouteLink(BaseModel):
    order: int
    fromName: str
    toName: str
    transitUrl: str
    walkUrl: str


class CourseDetailResponse(BaseModel):
    schemaVersion: str
    id: str
    title: str
    region: str
    courseType: str
    departurePoint: str
    departurePointName: str
    applicableDays: list[str]
    timeType: str
    verificationStatus: VerificationStatus
    publishable: bool
    exposureTier: ExposureTier
    verifiedDate: str
    thumbnailUrl: str
    tags: list[str]
    preferences: list[str]

    fatigueLevel: FatigueLevel
    fatigueScore: float
    fatigueExplanation: FatigueExplanation

    durationMinutes: int
    totalMinutes: MinutesRange
    walkingMinutes: int
    walkingMinutesRange: MinutesRange
    insideWalkingMinutes: int = 0
    transferCount: int
    roundTripTransitMinutes: int
    localTransitMinutes: int = 0
    stayMinutes: int = 0

    recommendationReasons: list[str]
    description: str
    cautions: list[str] = Field(default_factory=list)
    manualChecks: list[str] = Field(default_factory=list)
    itinerary: list[ItineraryItem]
    localFood: list[LocalFood] = Field(default_factory=list)
    localPoints: list[LocalPoint] = Field(default_factory=list)
    scenePrompts: list[str] = Field(default_factory=list)
    sources: list[DataSource] = Field(default_factory=list)

    primaryDestination: CourseDestination
    mapUrl: str
    directionsUrl: str
    kakaoMapUrl: str
    kakaoDirectionsUrl: str
    routeLinks: list[RouteLink] = Field(default_factory=list)

    returnFeasibility: ReturnFeasibilityModel
    exposureNotice: ExposureNotice | None = None
    dataSnapshotDate: str
    dataSourceName: str
    dataSourceUrl: str
