import {
  calculateFatigue,
  type FatigueMetrics,
  type FatigueResult,
} from './fatigue.ts'

export type CourseWithCalculatedFatigue<TCourse extends FatigueMetrics> = Omit<
  TCourse,
  'fatigueLevel' | 'fatigueScore' | 'fatigueFactors'
> & {
  fatigueLevel: FatigueResult['level']
  fatigueScore: FatigueResult['score']
  fatigueFactors: FatigueResult['factors']
}

export function attachFatigueToCourse<TCourse extends FatigueMetrics>(
  course: TCourse,
): CourseWithCalculatedFatigue<TCourse> {
  const fatigue = calculateFatigue(course)

  return {
    ...course,
    fatigueLevel: fatigue.level,
    fatigueScore: fatigue.score,
    fatigueFactors: fatigue.factors,
  }
}

export function attachFatigueToCourses<TCourse extends FatigueMetrics>(
  courses: readonly TCourse[],
): CourseWithCalculatedFatigue<TCourse>[] {
  return courses.map((course) => attachFatigueToCourse(course))
}
