import type { Course } from '../types/course.ts'
import type { RecommendationResult } from '../types/recommendation.ts'
import type { TravelConditions } from '../types/travelConditions.ts'
import { fetchApiJson, isApiNotFoundError } from './apiClient.ts'

export async function getRecommendations(
  conditions: TravelConditions,
): Promise<RecommendationResult> {
  if (!conditions.departure || !conditions.duration) {
    return { courses: [], exclusions: [], suggestions: [], meta: null }
  }

  return fetchApiJson<RecommendationResult>(
    '/api/recommendations',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(conditions),
    },
  )
}

export async function getCourseById(courseId: string): Promise<Course | null> {
  try {
    return await fetchApiJson<Course>(
      `/api/courses/${encodeURIComponent(courseId)}`,
    )
  } catch (error) {
    if (isApiNotFoundError(error)) return null

    throw error
  }
}
