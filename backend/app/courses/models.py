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
    sourceRecordId: str | None = None
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


class Track1DatasetLineage(BaseModel):
    id: str
    name: str
    provider: str
    dataType: str
    catalogUrl: str
    topicOutlinePage: int
    suggestedUse: str
    proposalRole: str
    proposalPages: list[int]
    usageStatus: Literal[
        "TRACEABLE_USED",
        "REFERENCE_ONLY",
        "EVIDENCE_REQUIRED",
        "DEFERRED",
        "OUT_OF_SCOPE_MVP",
    ]
    currentDecision: str
    targetSheetTabs: list[str]
    codeConsumers: list[str]
    apiFields: list[str]
    uiSurfaces: list[str]
    sourceRecordKeys: list[str]
    sourceSnapshot: dict[str, object] | None = None
    analysisResults: list[str]
    nextEvidence: list[str]


class FeatureDataLineage(BaseModel):
    id: str
    name: str
    sheetSelectors: list[str]
    snapshotFields: list[str]
    transformation: str
    codeConsumers: list[str]
    apiFields: list[str]
    uiSurfaces: list[str]


class SupplementarySourceLineage(BaseModel):
    label: str
    url: str
    courseIds: list[str]
    checkedDates: list[str]
    verificationStatuses: list[str]
    sourceClass: Literal["SUPPLEMENTARY_SOURCE"]


class DataLineageSummary(BaseModel):
    catalogDatasetCount: int
    proposalSelectedCount: int
    traceableUsedCount: int
    referenceOnlyCount: int
    evidenceRequiredCount: int
    deferredCount: int
    outOfScopeCount: int
    supplementarySourceCount: int
    claimableTrack1DatasetIds: list[str]
    lineageInvalidCount: int
    registryStatus: Literal["VALID", "INVALID"]
    claimReadiness: Literal["READY_TO_CLAIM", "EVIDENCE_GAPS"]


class SheetTabLineage(BaseModel):
    name: str
    gid: int
    recordKey: str


class SheetSnapshotLineage(BaseModel):
    spreadsheetId: str
    title: str
    url: str
    snapshotDate: str
    schemaVersion: str
    tabs: list[SheetTabLineage]


class DataLineageResponse(BaseModel):
    schemaVersion: str
    catalogVersion: str
    policy: str
    sheetSnapshot: SheetSnapshotLineage
    summary: DataLineageSummary
    track1Datasets: list[Track1DatasetLineage]
    featureLineage: list[FeatureDataLineage]
    supplementarySources: list[SupplementarySourceLineage]
    knownGaps: list[str]
    diagnostics: list[str]


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
    bookingRequired: bool = False
    returnTransport: "ReturnTransportModel"
    messages: list[str] = Field(default_factory=list)


class ReturnDepartureWindow(BaseModel):
    start: str | None = None
    end: str | None = None


class ReturnTransportModel(BaseModel):
    type: Literal[
        "HEADWAY_SERVICE",
        "SCHEDULED_SERVICE",
        "RESERVATION_REQUIRED",
        "UNSPECIFIED",
    ]
    segmentId: str | None = None
    serviceDay: str | None = None
    plannedDeparture: str | None = None
    plannedBoardingAfter: str | None = None
    alternativeDepartures: list[str] = Field(default_factory=list)
    departureWindow: ReturnDepartureWindow | None = None
    headwayMinutes: int | None = None
    ticketingModel: Literal[
        "PAY_ON_BOARD",
        "ONSITE_TICKET",
        "ADVANCE_RESERVATION",
    ] | None = None
    stationArrivalBufferMinutes: int = 0
    verificationStatus: str | None = None
    requiresDayOfCheck: bool = True
    sourceValueType: str | None = None
    operatingModel: str | None = None
    note: str | None = None
    selectedDeparture: str | None = None
    selectedDepartureSlackMinutes: int | None = None


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
