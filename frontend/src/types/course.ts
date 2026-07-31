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
