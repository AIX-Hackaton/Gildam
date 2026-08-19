import { CourseCard } from '../../components/course/CourseCard/CourseCard.tsx'
import {
  departureOptions,
  durationOptions,
  getOptionLabel,
  mobilityOptions,
  preferenceOptions,
} from '../../constants/travelConditionOptions.ts'
import type { CourseSummary } from '../../types/course.ts'
import type {
  ExcludedCourse,
  ExclusionReasonCode,
} from '../../types/recommendation.ts'
import type { TravelConditions } from '../../types/travelConditions.ts'
import { formatCompactLabel } from '../../utils/coursePresentation.ts'
import styles from './ResultsContent.module.css'

interface ResultsContentProps {
  conditions: TravelConditions
  courses: CourseSummary[]
  excludedCourses: ExcludedCourse[]
  onOpenCourse: (courseId: string) => void
}

const INTERNAL_EXCLUSION_CODES = new Set<ExclusionReasonCode>([
  'BLOCKED_BY_EXPOSURE_POLICY',
  'SCHEMA_INVALID',
])

export function ResultsContent({
  conditions,
  courses,
  excludedCourses,
  onOpenCourse,
}: ResultsContentProps) {
  const conditionLabels = [
    conditions.departure
      ? getOptionLabel(departureOptions, conditions.departure)
      : null,
    conditions.duration
      ? getOptionLabel(durationOptions, conditions.duration)
      : null,
    getOptionLabel(mobilityOptions, conditions.mobility),
    ...conditions.preferences.map((preference) =>
      getOptionLabel(preferenceOptions, preference),
    ),
  ].filter(Boolean) as string[]

  const [featuredCourse, ...alternativeCourses] = courses.slice(0, 3)
  const visibleExclusions = excludedCourses
    .map((course) => ({
      ...course,
      reasons: course.reasons.filter(
        (reason) => !INTERNAL_EXCLUSION_CODES.has(reason.code),
      ),
    }))
    .filter((course) => course.reasons.length > 0)
    .slice(0, 3)

  return (
    <>
      <section className={styles.intro}>
        <h1 aria-label="내 조건에 맞는 코스를 찾았어요">
          <span>내 조건에 맞는 코스를</span>
          <span>찾았어요</span>
        </h1>
      </section>

      <div className={styles.conditionChips} aria-label="선택한 여행 조건">
        {conditionLabels.map((label) => (
          <span key={label}>{formatCompactLabel(label)}</span>
        ))}
      </div>

      <div className={styles.rankedCourse}>
        <p className={styles.rankLabel}>추천 1위</p>
        <CourseCard
          course={featuredCourse}
          featured
          onOpen={() => onOpenCourse(featuredCourse.id)}
        />
      </div>

      {alternativeCourses.length > 0 ? (
        <section className={styles.alternatives}>
          <div className={styles.sectionHeading}>
            <h2>이 코스도 잘 맞아요</h2>
            <p>{alternativeCourses.length}개의 대안 코스</p>
          </div>
          <div className={styles.alternativeList}>
            {alternativeCourses.map((course, index) => (
              <div className={styles.rankedCourse} key={course.id}>
                <p className={styles.rankLabel}>추천 {index + 2}위</p>
                <CourseCard
                  course={course}
                  onOpen={() => onOpenCourse(course.id)}
                />
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {visibleExclusions.length > 0 ? (
        <details className={styles.exclusions}>
          <summary>다른 코스가 제외된 이유</summary>
          <ul>
            {visibleExclusions.map((course) => (
              <li key={course.id}>
                <strong>{course.title}</strong>
                {course.reasons.slice(0, 2).map((reason) => (
                  <p key={reason.code}>{reason.message}</p>
                ))}
              </li>
            ))}
          </ul>
        </details>
      ) : null}
    </>
  )
}
