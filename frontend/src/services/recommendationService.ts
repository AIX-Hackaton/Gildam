import type { Course, RecommendationResult } from '../types/course.ts'
import type { TravelConditions } from '../types/travelConditions.ts'
import { fetchApiJson, isApiNotFoundError } from './apiClient.ts'

const EMPTY_RESULT: RecommendationResult = {
  courses: [],
  exclusions: [],
  suggestions: [],
}

export async function getRecommendations(
  conditions: TravelConditions,
): Promise<RecommendationResult> {
  if (
    !conditions.departure ||
    !conditions.duration ||
    conditions.preferences.length === 0
  ) {
    return EMPTY_RESULT
  }

  const response = await fetchApiJson<RecommendationResult>(
    '/api/recommendations',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        departure: conditions.departure,
        duration: conditions.duration,
        preferences: conditions.preferences,
        mobility: conditions.mobility ?? 'ANY',
      }),
    },
  )

  return {
    courses: response.courses ?? [],
    exclusions: response.exclusions ?? [],
    suggestions: response.suggestions ?? [],
    meta: response.meta,
  }
}

export async function getCourseById(
  courseId: string,
  duration?: string | null,
): Promise<Course | null> {
  const query = duration ? `?duration=${encodeURIComponent(duration)}` : ''

  try {
    return await fetchApiJson<Course>(
      `/api/courses/${encodeURIComponent(courseId)}${query}`,
    )
  } catch (error) {
    if (isApiNotFoundError(error)) return null

    throw error
  }
}
