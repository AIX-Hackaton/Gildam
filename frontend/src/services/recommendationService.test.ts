import { describe, expect, it } from 'vitest'

import type { TravelConditions } from '../types/travelConditions.ts'
import { getCourseById, getRecommendations } from './recommendationService.ts'

describe('recommendationService', () => {
  it('returns no recommendations when required conditions are missing', async () => {
    const conditions: TravelConditions = {
      departure: null,
      duration: 'FULL_DAY',
      preferences: ['NATURE_WALK'],
    }

    await expect(getRecommendations(conditions)).resolves.toEqual([])
  })

  it('orders matching courses by preference count and fatigue', async () => {
    const conditions: TravelConditions = {
      departure: 'GWANGJU_SONGJEONG',
      duration: 'FULL_DAY',
      preferences: ['HISTORY_CULTURE', 'FOOD_MARKET', 'MEMORY'],
    }

    const courses = await getRecommendations(conditions)

    expect(courses.map((course) => course.id)).toEqual([
      'mokpo-port-culture',
      'damyang-slow-walk',
      'naju-riverside-day',
    ])
  })

  it('returns complete details for a known course and null otherwise', async () => {
    const course = await getCourseById('damyang-slow-walk')

    expect(course).toMatchObject({
      id: 'damyang-slow-walk',
      title: '담양 느린 산책 코스',
    })
    expect(course?.itinerary.length).toBeGreaterThan(0)
    await expect(getCourseById('unknown-course')).resolves.toBeNull()
  })
})
