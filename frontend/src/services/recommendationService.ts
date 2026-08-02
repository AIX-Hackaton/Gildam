import { mockCourseDetails } from '../data/mockCourseDetails.ts'
import { mockCourses, type MockCourseSummary } from '../data/mockCourses.ts'
import type { Course, CourseSummary } from '../types/course.ts'
import type { TravelConditions } from '../types/travelConditions.ts'

const fatigueScore = { LOW: 0, MEDIUM: 1, HIGH: 2 } as const

function toCourseSummary(course: MockCourseSummary): CourseSummary {
  return {
    id: course.id,
    title: course.title,
    region: course.region,
    thumbnailUrl: course.thumbnailUrl,
    tags: course.tags,
    fatigueLevel: course.fatigueLevel,
    durationMinutes: course.durationMinutes,
    walkingMinutes: course.walkingMinutes,
    transferCount: course.transferCount,
    recommendationReasons: course.recommendationReasons,
  }
}

export async function getRecommendations(
  conditions: TravelConditions,
): Promise<CourseSummary[]> {
  if (!conditions.departure || !conditions.duration) return []

  return mockCourses
    .filter(
      (course) =>
        course.departures.includes(conditions.departure!) &&
        course.durations.includes(conditions.duration!) &&
        course.preferences.some((preference) =>
          conditions.preferences.includes(preference),
        ),
    )
    .sort((first, second) => {
      const firstMatchCount = first.preferences.filter((preference) =>
        conditions.preferences.includes(preference),
      ).length
      const secondMatchCount = second.preferences.filter((preference) =>
        conditions.preferences.includes(preference),
      ).length

      return (
        secondMatchCount - firstMatchCount ||
        fatigueScore[first.fatigueLevel] - fatigueScore[second.fatigueLevel]
      )
    })
    .slice(0, 3)
    .map(toCourseSummary)
}

export async function getCourseById(courseId: string): Promise<Course | null> {
  const summary = mockCourses.find((course) => course.id === courseId)
  const details = mockCourseDetails[courseId]

  if (!summary || !details) return null

  return { ...toCourseSummary(summary), ...details }
}
