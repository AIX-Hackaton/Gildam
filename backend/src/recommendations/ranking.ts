import {
  attachFatigueToCourse,
  type CourseWithCalculatedFatigue,
} from './candidate.ts'
import type { FatigueMetrics } from './fatigue.ts'

export type PreferenceId =
  | 'NATURE_WALK'
  | 'HISTORY_CULTURE'
  | 'FOOD_MARKET'
  | 'MEMORY'

export interface RecommendationRankingConditions {
  preferences: readonly PreferenceId[]
}

export interface RecommendationRankableCourse extends FatigueMetrics {
  preferences: readonly PreferenceId[]
  localResourceScore: number
  recordFitScore: number
}

export interface RecommendationRankingOptions {
  limit?: number
}

export interface RecommendationScoreFactor {
  score: number
  weight: number
  weightedScore: number
}

export interface PreferenceMatchScoreFactor extends RecommendationScoreFactor {
  matchedCount: number
  selectedCount: number
  matchedPreferences: PreferenceId[]
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

export type RankedRecommendationCandidate<
  TCourse extends RecommendationRankableCourse,
> = CourseWithCalculatedFatigue<TCourse> & {
  recommendationScore: number
  scoreBreakdown: RecommendationScoreBreakdown
}

const DEFAULT_RANKING_LIMIT = 3

const RANKING_WEIGHTS = {
  preferenceMatch: 0.4,
  mobility: 0.3,
  localResource: 0.2,
  recordFit: 0.1,
} as const

function roundScore(value: number) {
  return Number(value.toFixed(4))
}

function assertNormalizedScore(name: string, value: number) {
  if (!Number.isFinite(value) || value < 0 || value > 1) {
    throw new RangeError(`${name} must be a number between 0 and 1.`)
  }
}

function assertSelectedPreferences(preferences: readonly PreferenceId[]) {
  if (preferences.length === 0) {
    throw new RangeError('At least one preference is required for ranking.')
  }
}

function assertRankingLimit(limit: number) {
  if (!Number.isInteger(limit) || limit <= 0) {
    throw new RangeError('Ranking limit must be a positive integer.')
  }
}

function uniquePreferences(
  preferences: readonly PreferenceId[],
): PreferenceId[] {
  return Array.from(new Set(preferences))
}

function buildScoreFactor(
  score: number,
  weight: number,
): RecommendationScoreFactor {
  return {
    score: roundScore(score),
    weight,
    weightedScore: roundScore(score * weight),
  }
}

export function calculatePreferenceMatchScore(
  coursePreferences: readonly PreferenceId[],
  selectedPreferences: readonly PreferenceId[],
): PreferenceMatchScoreFactor {
  const uniqueSelectedPreferences = uniquePreferences(selectedPreferences)

  assertSelectedPreferences(uniqueSelectedPreferences)

  const coursePreferenceSet = new Set(coursePreferences)
  const matchedPreferences = uniqueSelectedPreferences.filter((preference) =>
    coursePreferenceSet.has(preference),
  )
  const score = matchedPreferences.length / uniqueSelectedPreferences.length

  return {
    ...buildScoreFactor(score, RANKING_WEIGHTS.preferenceMatch),
    matchedCount: matchedPreferences.length,
    selectedCount: uniqueSelectedPreferences.length,
    matchedPreferences,
  }
}

export function calculateMobilityScore(fatigueScore: number): number {
  if (!Number.isFinite(fatigueScore) || fatigueScore < 1 || fatigueScore > 3) {
    throw new RangeError('fatigueScore must be a number between 1 and 3.')
  }

  return roundScore((3 - fatigueScore) / 2)
}

export function calculateRecommendationScoreBreakdown<
  TCourse extends RecommendationRankableCourse,
>(
  course: CourseWithCalculatedFatigue<TCourse>,
  conditions: RecommendationRankingConditions,
): RecommendationScoreBreakdown {
  assertNormalizedScore('localResourceScore', course.localResourceScore)
  assertNormalizedScore('recordFitScore', course.recordFitScore)

  const mobilityScore = calculateMobilityScore(course.fatigueScore)

  return {
    preferenceMatch: calculatePreferenceMatchScore(
      course.preferences,
      conditions.preferences,
    ),
    mobility: {
      ...buildScoreFactor(mobilityScore, RANKING_WEIGHTS.mobility),
      fatigueScore: course.fatigueScore,
    },
    localResource: buildScoreFactor(
      course.localResourceScore,
      RANKING_WEIGHTS.localResource,
    ),
    recordFit: buildScoreFactor(course.recordFitScore, RANKING_WEIGHTS.recordFit),
  }
}

function calculateRecommendationScore(
  breakdown: RecommendationScoreBreakdown,
) {
  return roundScore(
    breakdown.preferenceMatch.weightedScore +
      breakdown.mobility.weightedScore +
      breakdown.localResource.weightedScore +
      breakdown.recordFit.weightedScore,
  )
}

export function rankRecommendationCandidates<
  TCourse extends RecommendationRankableCourse,
>(
  courses: readonly TCourse[],
  conditions: RecommendationRankingConditions,
  options: RecommendationRankingOptions = {},
): RankedRecommendationCandidate<TCourse>[] {
  const limit = options.limit ?? DEFAULT_RANKING_LIMIT

  assertRankingLimit(limit)

  return courses
    .map((course, index) => {
      const courseWithFatigue = attachFatigueToCourse(course)
      const scoreBreakdown = calculateRecommendationScoreBreakdown(
        courseWithFatigue,
        conditions,
      )

      return {
        candidate: {
          ...courseWithFatigue,
          recommendationScore: calculateRecommendationScore(scoreBreakdown),
          scoreBreakdown,
        },
        index,
      }
    })
    .sort((first, second) => {
      return (
        second.candidate.recommendationScore -
          first.candidate.recommendationScore ||
        second.candidate.scoreBreakdown.preferenceMatch.matchedCount -
          first.candidate.scoreBreakdown.preferenceMatch.matchedCount ||
        first.candidate.fatigueScore - second.candidate.fatigueScore ||
        first.index - second.index
      )
    })
    .slice(0, limit)
    .map(({ candidate }) => candidate)
}
