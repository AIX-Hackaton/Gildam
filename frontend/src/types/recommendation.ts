import type { CourseSummary } from './course.ts'
import type { MobilityId } from './travelConditions.ts'

export type ExclusionReasonCode =
  | 'UNSUPPORTED_DEPARTURE'
  | 'DAY_NOT_SUPPORTED'
  | 'TIME_LIMIT_EXCEEDED'
  | 'RETURN_NOT_FEASIBLE'
  | 'MOBILITY_LIMIT_EXCEEDED'
  | 'PREFERENCE_MISMATCH'
  | 'BLOCKED_BY_EXPOSURE_POLICY'
  | 'SCHEMA_INVALID'

export interface ExclusionReason {
  code: ExclusionReasonCode
  message: string
}

export interface ExcludedCourse {
  id: string
  title: string
  reasons: ExclusionReason[]
}

export type SuggestionCode =
  | 'RELAX_DURATION'
  | 'RELAX_MOBILITY'
  | 'ADD_PREFERENCE'
  | 'CHANGE_DEPARTURE'
  | 'NO_ALTERNATIVE'

export interface RecommendationSuggestion {
  code: SuggestionCode
  message: string
  availableCount: number
}

export interface RecommendationMeta {
  exposureMode: string
  evaluatedCount: number
  blockedCount: number
  schemaInvalidCount: number
  dataSnapshotDate: string
  appliedMobility: MobilityId
}

export interface RecommendationResult {
  courses: CourseSummary[]
  exclusions: ExcludedCourse[]
  suggestions: RecommendationSuggestion[]
  meta: RecommendationMeta | null
}
