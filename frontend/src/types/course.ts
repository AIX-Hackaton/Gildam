export type FatigueLevel = 'LOW' | 'MEDIUM' | 'HIGH'
export type ExposureTier = 'PUBLIC' | 'MANUAL_REVIEW' | 'DEMO_ONLY' | 'BLOCKED'
export type FeasibilityStatus = 'FEASIBLE' | 'TIGHT' | 'NOT_FEASIBLE'
export type FeasibilityConfidence =
  | 'CONFIRMED'
  | 'NEEDS_DAY_OF_CHECK'
  | 'UNVERIFIED'

export interface MinutesRange {
  min: number
  plan: number
  max: number
}

export interface FatigueFactor {
  key: string
  label: string
  value: number
  unit: string
  level: FatigueLevel
  levelScore: number
  weight: number
  contribution: number
  threshold: string
}

export interface FatigueExplanation {
  level: FatigueLevel
  score: number
  calculatedLevel: FatigueLevel
  sourceLevel?: FatigueLevel | null
  resolution: string
  factors: FatigueFactor[]
  formula: string
}

export interface ReturnFeasibility {
  status: FeasibilityStatus
  confidence: FeasibilityConfidence
  departureTime: string
  plannedReturnTime: string
  latestReturnTime: string
  plannedTotalMinutes: number
  worstCaseTotalMinutes: number
  allowedMinutes: number
  slackMinutes: number
  lastActivityEndTime?: string | null
  bookingRequired: boolean
  returnTransport: ReturnTransport
  messages: string[]
}

export interface ReturnTransport {
  type:
    | 'HEADWAY_SERVICE'
    | 'SCHEDULED_SERVICE'
    | 'RESERVATION_REQUIRED'
    | 'UNSPECIFIED'
  segmentId?: string | null
  serviceDay?: string | null
  plannedDeparture?: string | null
  plannedBoardingAfter?: string | null
  alternativeDepartures: string[]
  departureWindow?: {
    start?: string | null
    end?: string | null
  } | null
  headwayMinutes?: number | null
  ticketingModel?:
    | 'PAY_ON_BOARD'
    | 'ONSITE_TICKET'
    | 'ADVANCE_RESERVATION'
    | null
  stationArrivalBufferMinutes: number
  verificationStatus?: string | null
  requiresDayOfCheck: boolean
  sourceValueType?: string | null
  operatingModel?: string | null
  note?: string | null
  selectedDeparture?: string | null
  selectedDepartureSlackMinutes?: number | null
}

export interface RecommendationScoreFactor {
  score: number
  weight: number
  weightedScore: number
  explanation: string
}

export interface PreferenceMatchScoreFactor extends RecommendationScoreFactor {
  matchedCount: number
  selectedCount: number
  matchedPreferences: string[]
}

export interface MobilityScoreFactor extends RecommendationScoreFactor {
  fatigueScore: number
  fatigueLevel: FatigueLevel
  walkingMinutes: number
  transferCount: number
}

export interface ReturnMarginScoreFactor extends RecommendationScoreFactor {
  slackMinutes: number
  status: FeasibilityStatus
}

export interface RecommendationScoreBreakdown {
  preferenceMatch: PreferenceMatchScoreFactor
  mobility: MobilityScoreFactor
  returnMargin: ReturnMarginScoreFactor
  localResource: RecommendationScoreFactor
  recordFit: RecommendationScoreFactor
}

export interface CourseSummary {
  id: string
  title: string
  region: string
  thumbnailUrl: string
  tags: string[]
  courseType?: string
  fatigueLevel: FatigueLevel
  fatigueScore?: number
  fatigueExplanation?: FatigueExplanation
  durationMinutes: number
  durationMinMinutes?: number
  durationMaxMinutes?: number
  walkingMinutes: number
  transferCount: number
  roundTripTransitMinutes?: number
  verificationStatus?: string
  exposureTier?: ExposureTier
  recommendationReasons: string[]
  recommendationScore?: number
  scoreBreakdown?: RecommendationScoreBreakdown
  returnFeasibility?: ReturnFeasibility
}

export interface ItineraryItem {
  id: string
  sourceRecordId?: string | null
  time?: string
  name: string
  type: 'transport' | 'walk' | 'place' | 'food'
  durationMinutes?: number
  note?: string
  segmentType?: string | null
  verificationStatus?: string | null
  isTransfer?: boolean
  mapUrl?: string | null
}

export interface LocalFood {
  id: string
  name: string
  description: string
  tags?: string[]
}

export interface LocalPoint {
  id: string
  title: string
  description: string
  tags?: string[]
}

export interface DataSource {
  label: string
  url: string
  checkedDate: string
  verificationStatus: string
}

export interface RouteLink {
  order: number
  fromName: string
  toName: string
  transitUrl: string
  walkUrl: string
}

export interface ExposureNotice {
  tier: ExposureTier
  title: string
  message: string
}

export interface CourseDestination {
  name: string
  latitude: number
  longitude: number
}

export interface Course extends CourseSummary {
  schemaVersion: string
  departurePoint: string
  departurePointName: string
  applicableDays: string[]
  timeType: string
  publishable: boolean
  verifiedDate: string
  totalMinutes: MinutesRange
  walkingMinutesRange: MinutesRange
  insideWalkingMinutes?: number
  localTransitMinutes?: number
  stayMinutes?: number
  description: string
  cautions?: string[]
  manualChecks?: string[]
  itinerary: ItineraryItem[]
  localFood: LocalFood[]
  localPoints: LocalPoint[]
  scenePrompts: string[]
  sources?: DataSource[]
  primaryDestination?: CourseDestination
  mapUrl: string
  directionsUrl: string
  kakaoMapUrl?: string
  kakaoDirectionsUrl?: string
  routeLinks?: RouteLink[]
  exposureNotice?: ExposureNotice | null
  dataSnapshotDate?: string
  dataSourceName?: string
  dataSourceUrl?: string
}

export interface ExclusionReason {
  code: string
  message: string
}

export interface ExcludedCourse {
  id: string
  title: string
  reasons: ExclusionReason[]
}

export interface RecommendationSuggestion {
  code: string
  message: string
  availableCount: number
}

export interface RecommendationMeta {
  exposureMode: string
  evaluatedCount: number
  blockedCount: number
  schemaInvalidCount: number
  dataSnapshotDate: string
  appliedMobility: string
}

export interface RecommendationResult {
  courses: CourseSummary[]
  exclusions: ExcludedCourse[]
  suggestions: RecommendationSuggestion[]
  meta?: RecommendationMeta
}
