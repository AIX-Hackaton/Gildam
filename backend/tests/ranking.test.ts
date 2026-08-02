import assert from 'node:assert/strict'
import test from 'node:test'

import {
  calculateMobilityScore,
  calculatePreferenceMatchScore,
  rankRecommendationCandidates,
  type RecommendationRankableCourse,
} from '../src/recommendations/ranking.ts'

const mockCourses: Array<RecommendationRankableCourse & { id: string }> = [
  {
    id: 'damyang-slow-walk',
    preferences: ['NATURE_WALK', 'FOOD_MARKET', 'MEMORY'],
    walkingMinutes: 24,
    transferCount: 1,
    roundTripTransitMinutes: 130,
    localResourceScore: 0.9,
    recordFitScore: 0.9,
  },
  {
    id: 'naju-history-walk',
    preferences: ['HISTORY_CULTURE', 'FOOD_MARKET', 'MEMORY'],
    walkingMinutes: 12,
    transferCount: 0,
    roundTripTransitMinutes: 80,
    localResourceScore: 1,
    recordFitScore: 0.5,
  },
  {
    id: 'mokpo-seaside-day',
    preferences: ['NATURE_WALK', 'MEMORY'],
    walkingMinutes: 42,
    transferCount: 2,
    roundTripTransitMinutes: 190,
    localResourceScore: 0.8,
    recordFitScore: 1,
  },
]

test('calculates preference match score from selected preferences', () => {
  const score = calculatePreferenceMatchScore(
    ['NATURE_WALK', 'FOOD_MARKET'],
    ['NATURE_WALK', 'MEMORY'],
  )

  assert.equal(score.score, 0.5)
  assert.equal(score.weight, 0.4)
  assert.equal(score.weightedScore, 0.2)
  assert.equal(score.matchedCount, 1)
  assert.equal(score.selectedCount, 2)
  assert.deepEqual(score.matchedPreferences, ['NATURE_WALK'])
})

test('converts fatigue score into mobility suitability score', () => {
  assert.equal(calculateMobilityScore(1), 1)
  assert.equal(calculateMobilityScore(2), 0.5)
  assert.equal(calculateMobilityScore(3), 0)
})

test('ranks candidates by explainable weighted score', () => {
  const rankedCandidates = rankRecommendationCandidates(mockCourses, {
    preferences: ['NATURE_WALK', 'MEMORY'],
  })

  assert.deepEqual(
    rankedCandidates.map((candidate) => ({
      id: candidate.id,
      recommendationScore: candidate.recommendationScore,
      fatigueScore: candidate.fatigueScore,
      matchedPreferences:
        candidate.scoreBreakdown.preferenceMatch.matchedPreferences,
    })),
    [
      {
        id: 'damyang-slow-walk',
        recommendationScore: 0.82,
        fatigueScore: 2,
        matchedPreferences: ['NATURE_WALK', 'MEMORY'],
      },
      {
        id: 'naju-history-walk',
        recommendationScore: 0.75,
        fatigueScore: 1,
        matchedPreferences: ['MEMORY'],
      },
      {
        id: 'mokpo-seaside-day',
        recommendationScore: 0.66,
        fatigueScore: 3,
        matchedPreferences: ['NATURE_WALK', 'MEMORY'],
      },
    ],
  )
})

test('limits ranked candidates to the MVP recommendation count', () => {
  const rankedCandidates = rankRecommendationCandidates(
    mockCourses,
    { preferences: ['NATURE_WALK', 'MEMORY'] },
    { limit: 2 },
  )

  assert.deepEqual(
    rankedCandidates.map((candidate) => candidate.id),
    ['damyang-slow-walk', 'naju-history-walk'],
  )
})

test('uses lower fatigue as a deterministic tie breaker', () => {
  const rankedCandidates = rankRecommendationCandidates(
    [
      {
        id: 'medium-fatigue',
        preferences: ['NATURE_WALK'],
        walkingMinutes: 24,
        transferCount: 1,
        roundTripTransitMinutes: 130,
        localResourceScore: 0.25,
        recordFitScore: 1,
      },
      {
        id: 'low-fatigue',
        preferences: ['NATURE_WALK'],
        walkingMinutes: 12,
        transferCount: 0,
        roundTripTransitMinutes: 80,
        localResourceScore: 0,
        recordFitScore: 0,
      },
    ],
    { preferences: ['NATURE_WALK'] },
  )

  assert.deepEqual(
    rankedCandidates.map((candidate) => candidate.id),
    ['low-fatigue', 'medium-fatigue'],
  )
})

test('rejects ranking input without explainable score data', () => {
  assert.throws(
    () =>
      rankRecommendationCandidates(
        [
          {
            id: 'invalid-local-score',
            preferences: ['NATURE_WALK'],
            walkingMinutes: 12,
            transferCount: 0,
            roundTripTransitMinutes: 80,
            localResourceScore: 1.2,
            recordFitScore: 1,
          },
        ],
        { preferences: ['NATURE_WALK'] },
      ),
    RangeError,
  )

  assert.throws(
    () => rankRecommendationCandidates(mockCourses, { preferences: [] }),
    RangeError,
  )
})
