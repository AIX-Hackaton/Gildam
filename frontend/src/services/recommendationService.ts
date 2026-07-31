import { mockCourses, type MockCourseSummary } from '../data/mockCourses.ts'
import type { CourseSummary } from '../types/course.ts'
import type { TravelConditions } from '../types/travelConditions.ts'

const fatigueScore = { LOW: 0, MEDIUM: 1, HIGH: 2 } as const

function toCourseSummary(course: MockCourseSummary): CourseSummary {
  const { departures, durations, preferences, ...summary } = course
  void departures
  void durations
  void preferences
  return summary
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
