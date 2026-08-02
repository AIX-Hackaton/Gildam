export type FatigueLevel = 'LOW' | 'MEDIUM' | 'HIGH'

export interface CourseSummary {
  id: string
  title: string
  region: string
  thumbnailUrl: string
  tags: string[]
  fatigueLevel: FatigueLevel
  durationMinutes: number
  walkingMinutes: number
  transferCount: number
  recommendationReasons: string[]
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

export interface Course extends CourseSummary {
  description: string
  itinerary: ItineraryItem[]
  localFood: LocalFood[]
  localPoints: LocalPoint[]
  scenePrompts: string[]
  mapUrl: string
  directionsUrl: string
}
