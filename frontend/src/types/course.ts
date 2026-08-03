export type FatigueLevel = 'LOW' | 'MEDIUM' | 'HIGH'

export interface RecommendationScoreFactor {
  score: number
  weight: number
  weightedScore: number
}

export interface PreferenceMatchScoreFactor extends RecommendationScoreFactor {
  matchedCount: number
  selectedCount: number
  matchedPreferences: string[]
}

export interface MobilityScoreFactor extends RecommendationScoreFactor {
  fatigueScore: number
}

export interface RecommendationScoreBreakdown {
  preferenceMatch: PreferenceMatchScoreFactor
  mobility: MobilityScoreFactor
  localResource: RecommendationScoreFactor
  recordFit: RecommendationScoreFactor
}

export interface CourseSummary {
  id: string
  title: string
  region: string
  thumbnailUrl: string
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
}

export interface ItineraryItem {
  id: string
  time?: string
  name: string
  type: 'transport' | 'place' | 'food'
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

export interface Course extends CourseSummary {
  description: string
  itinerary: ItineraryItem[]
  localFood: LocalFood[]
  localPoints: LocalPoint[]
  scenePrompts: string[]
  primaryDestination?: CourseDestination
  mapUrl: string
  directionsUrl: string
  kakaoMapUrl?: string
  kakaoDirectionsUrl?: string
}
