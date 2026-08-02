import assert from 'node:assert/strict'
import test from 'node:test'

import {
  filterRecommendationCandidates,
  getCourseExclusionReasons,
  type RecommendationFilterableCourse,
} from '../src/recommendations/filtering.ts'

const mockCourses: Array<RecommendationFilterableCourse & { id: string }> = [
  {
    id: 'six-hour-fit',
    departures: ['GWANGJU_SONGJEONG'],
    durationMinutes: 360,
    returnFeasible: true,
  },
  {
    id: 'unsupported-departure',
    departures: ['USQUARE'],
    durationMinutes: 300,
    returnFeasible: true,
  },
  {
    id: 'time-limit-exceeded',
    departures: ['GWANGJU_SONGJEONG'],
    durationMinutes: 361,
    returnFeasible: true,
  },
  {
    id: 'return-not-feasible',
    departures: ['GWANGJU_SONGJEONG'],
    durationMinutes: 300,
    returnFeasible: false,
  },
]

test('keeps courses that match departure, time limit, and return feasibility', () => {
  const result = filterRecommendationCandidates(mockCourses, {
    departure: 'GWANGJU_SONGJEONG',
    duration: 'SIX_HOURS',
  })

  assert.deepEqual(
    result.candidates.map((course) => course.id),
    ['six-hour-fit'],
  )
})

test('reports unsupported departure as an exclusion reason', () => {
  const reasons = getCourseExclusionReasons(mockCourses[1], {
    departure: 'GWANGJU_SONGJEONG',
    duration: 'SIX_HOURS',
  })

  assert.deepEqual(
    reasons.map((reason) => reason.code),
    ['UNSUPPORTED_DEPARTURE'],
  )
})

test('reports time limit exceeded as an exclusion reason', () => {
  const reasons = getCourseExclusionReasons(mockCourses[2], {
    departure: 'GWANGJU_SONGJEONG',
    duration: 'SIX_HOURS',
  })

  assert.deepEqual(
    reasons.map((reason) => reason.code),
    ['TIME_LIMIT_EXCEEDED'],
  )
})

test('reports return infeasibility as an exclusion reason', () => {
  const reasons = getCourseExclusionReasons(mockCourses[3], {
    departure: 'GWANGJU_SONGJEONG',
    duration: 'SIX_HOURS',
  })

  assert.deepEqual(
    reasons.map((reason) => reason.code),
    ['RETURN_NOT_FEASIBLE'],
  )
})

test('keeps full-day courses within the default day-trip limit', () => {
  const result = filterRecommendationCandidates(
    [
      {
        id: 'full-day-fit',
        departures: ['USQUARE'],
        durationMinutes: 720,
        returnFeasible: true,
      },
    ],
    {
      departure: 'USQUARE',
      duration: 'FULL_DAY',
    },
  )

  assert.deepEqual(
    result.candidates.map((course) => course.id),
    ['full-day-fit'],
  )
})

test('allows duration limits to be overridden when the product range changes', () => {
  const result = filterRecommendationCandidates(
    [
      {
        id: 'custom-full-day-fit',
        departures: ['USQUARE'],
        durationMinutes: 800,
        returnFeasible: true,
      },
    ],
    {
      departure: 'USQUARE',
      duration: 'FULL_DAY',
    },
    {
      durationLimits: { FULL_DAY: 840 },
    },
  )

  assert.deepEqual(
    result.candidates.map((course) => course.id),
    ['custom-full-day-fit'],
  )
})

test('collects every exclusion reason for a course', () => {
  const result = filterRecommendationCandidates(
    [
      {
        id: 'multiple-reasons',
        departures: ['USQUARE'],
        durationMinutes: 361,
        returnFeasible: false,
      },
    ],
    {
      departure: 'GWANGJU_SONGJEONG',
      duration: 'SIX_HOURS',
    },
  )

  assert.deepEqual(
    result.exclusions[0].reasons.map((reason) => reason.code),
    [
      'UNSUPPORTED_DEPARTURE',
      'TIME_LIMIT_EXCEEDED',
      'RETURN_NOT_FEASIBLE',
    ],
  )
})

test('rejects invalid duration data', () => {
  assert.throws(
    () =>
      getCourseExclusionReasons(
        {
          departures: ['GWANGJU_SONGJEONG'],
          durationMinutes: -1,
          returnFeasible: true,
        },
        {
          departure: 'GWANGJU_SONGJEONG',
          duration: 'SIX_HOURS',
        },
      ),
    RangeError,
  )
})
