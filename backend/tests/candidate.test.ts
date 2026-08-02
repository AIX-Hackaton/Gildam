import assert from 'node:assert/strict'
import test from 'node:test'

import {
  attachFatigueToCourse,
  attachFatigueToCourses,
} from '../src/recommendations/candidate.ts'

const mockCourses = [
  {
    id: 'damyang-slow-walk',
    title: '담양 느린 산책 코스',
    walkingMinutes: 24,
    transferCount: 1,
    roundTripTransitMinutes: 130,
  },
  {
    id: 'mokpo-seaside-day',
    title: '목포 바다 산책 코스',
    walkingMinutes: 42,
    transferCount: 2,
    roundTripTransitMinutes: 190,
  },
] as const

test('attaches calculated fatigue fields to a course candidate', () => {
  const candidate = attachFatigueToCourse(mockCourses[0])

  assert.equal(candidate.id, 'damyang-slow-walk')
  assert.equal(candidate.fatigueLevel, 'MEDIUM')
  assert.equal(candidate.fatigueScore, 2)
  assert.equal(candidate.fatigueFactors.walking.value, 24)
  assert.equal(candidate.fatigueFactors.transfers.value, 1)
  assert.equal(candidate.fatigueFactors.roundTripTransit.value, 130)
})

test('attaches fatigue fields to every recommendation candidate', () => {
  const candidates = attachFatigueToCourses(mockCourses)

  assert.deepEqual(
    candidates.map((candidate) => ({
      id: candidate.id,
      fatigueLevel: candidate.fatigueLevel,
      fatigueScore: candidate.fatigueScore,
    })),
    [
      { id: 'damyang-slow-walk', fatigueLevel: 'MEDIUM', fatigueScore: 2 },
      { id: 'mokpo-seaside-day', fatigueLevel: 'HIGH', fatigueScore: 3 },
    ],
  )
})

test('overwrites stale fatigue fields from source data', () => {
  const candidate = attachFatigueToCourse({
    id: 'stale-course',
    walkingMinutes: 12,
    transferCount: 0,
    roundTripTransitMinutes: 80,
    fatigueLevel: 'HIGH',
    fatigueScore: 3,
  })

  assert.equal(candidate.fatigueLevel, 'LOW')
  assert.equal(candidate.fatigueScore, 1)
})
