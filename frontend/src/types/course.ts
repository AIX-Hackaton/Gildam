export type FatigueLevel = 'LOW' | 'MEDIUM' | 'HIGH'
export type ReturnFeasibilityStatus = 'FEASIBLE' | 'TIGHT' | 'NOT_FEASIBLE'
export type ReturnFeasibilityConfidence =
  | 'CONFIRMED'
  | 'NEEDS_DAY_OF_CHECK'
  | 'UNVERIFIED'

export interface ReturnDepartureWindow {
  start?: string | null
  end?: string | null
}

export interface ReturnTransport {
  type:
    | 'HEADWAY_SERVICE'
    | 'SCHEDULED_SERVICE'
    | 'RESERVATION_REQUIRED'
    | 'UNSPECIFIED'
  plannedDeparture?: string | null
  plannedBoardingAfter?: string | null
  alternativeDepartures?: string[]
  departureWindow?: ReturnDepartureWindow | null
  headwayMinutes?: number | null
  ticketingModel?:
    | 'PAY_ON_BOARD'
    | 'ONSITE_TICKET'
    | 'ADVANCE_RESERVATION'
    | null
  requiresDayOfCheck?: boolean
  note?: string | null
  selectedDeparture?: string | null
}

export interface ReturnFeasibility {
  status: ReturnFeasibilityStatus
  confidence?: ReturnFeasibilityConfidence
  departureTime?: string
  plannedReturnTime?: string
  latestReturnTime?: string
  slackMinutes?: number
  bookingRequired?: boolean
  returnTransport?: ReturnTransport
  messages?: string[]
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
  status: ReturnFeasibilityStatus
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
  thumbnailCredit?: string
  thumbnailPlace?: string
  tags: string[]
  fatigueLevel: FatigueLevel
  fatigueScore?: number
  durationMinutes: number
  walkingMinutes: number
  transferCount: number
  roundTripTransitMinutes?: number
  recommendationReasons: string[]
  recommendationScore?: number
  scoreBreakdown?: RecommendationScoreBreakdown
  returnFeasibility: ReturnFeasibility
}

export interface ItineraryItem {
  id: string
  time?: string
  name: string
  type: 'transport' | 'walk' | 'place' | 'food'
  durationMinutes?: number
  note?: string
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

export interface CourseDestination {
  name: string
  latitude: number
  longitude: number
}

export interface DataSource {
  label: string
  url: string
  checkedDate: string
  verificationStatus: string
}

export interface Course extends CourseSummary {
  description: string
  itinerary: ItineraryItem[]
  localFood: LocalFood[]
  localPoints: LocalPoint[]
  scenePrompts: string[]
  manualChecks?: string[]
  sources?: DataSource[]
  verifiedDate?: string
  dataSnapshotDate?: string
  dataSourceName?: string
  dataSourceUrl?: string
  primaryDestination?: CourseDestination
  mapUrl: string
  directionsUrl: string
  kakaoMapUrl?: string
  kakaoDirectionsUrl?: string
}
