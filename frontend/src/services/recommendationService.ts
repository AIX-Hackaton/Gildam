import type { Course, CourseSummary } from '../types/course.ts'
import type { TravelConditions } from '../types/travelConditions.ts'
import { fetchApiJson, isApiNotFoundError } from './apiClient.ts'

interface RecommendationApiResponse {
  courses: CourseSummary[]
}

export async function getRecommendations(
  conditions: TravelConditions,
): Promise<CourseSummary[]> {
  if (!conditions.departure || !conditions.duration) return []

  const response = await fetchApiJson<RecommendationApiResponse>(
    '/api/recommendations',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(conditions),
    },
  )

  return response.courses
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
