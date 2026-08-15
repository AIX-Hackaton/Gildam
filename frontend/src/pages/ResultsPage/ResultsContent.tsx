import { CourseCard } from '../../components/course/CourseCard/CourseCard.tsx'
import {
  departureOptions,
  durationOptions,
  getOptionLabel,
  mobilityOptions,
  preferenceOptions,
} from '../../constants/travelConditionOptions.ts'
import type {
  CourseSummary,
  ExcludedCourse,
  RecommendationMeta,
} from '../../types/course.ts'
import type { TravelConditions } from '../../types/travelConditions.ts'
import styles from './ResultsContent.module.css'

interface ResultsContentProps {
  conditions: TravelConditions
  courses: CourseSummary[]
  exclusions: ExcludedCourse[]
  meta?: RecommendationMeta
  onChangeConditions: () => void
  onOpenCourse: (courseId: string) => void
}

export function ResultsContent({
  conditions,
  courses,
  exclusions,
  meta,
  onChangeConditions,
  onOpenCourse,
}: ResultsContentProps) {
  const conditionLabels = [
    conditions.departure
      ? getOptionLabel(departureOptions, conditions.departure)
      : null,
    conditions.duration
      ? getOptionLabel(durationOptions, conditions.duration)
      : null,
    ...conditions.preferences.map((preference) =>
      getOptionLabel(preferenceOptions, preference),
    ),
    conditions.mobility !== 'ANY'
      ? getOptionLabel(mobilityOptions, conditions.mobility)
      : null,
  ].filter(Boolean) as string[]

  const [featuredCourse, ...alternativeCourses] = courses

  return (
    <>
      <section className={styles.intro}>
        <div>
          <h1>내 조건에 맞는 코스를 찾았어요</h1>
          <p>시간 안에 돌아올 수 있는 코스만 남겼습니다.</p>
        </div>
        <button
          className={styles.changeButton}
          type="button"
          onClick={onChangeConditions}
        >
          조건 변경
        </button>
      </section>

      <div className={styles.conditionChips} aria-label="선택한 여행 조건">
        {conditionLabels.map((label) => (
          <span key={label}>{label}</span>
        ))}
      </div>

      <CourseCard
        course={featuredCourse}
        featured
        rank={1}
        onOpen={() => onOpenCourse(featuredCourse.id)}
      />

      {alternativeCourses.length > 0 ? (
        <section className={styles.alternatives}>
          <div className={styles.sectionHeading}>
            <h2>이 코스도 잘 맞아요</h2>
            <p>{alternativeCourses.length}개의 대안 코스</p>
          </div>
          <div className={styles.alternativeList}>
            {alternativeCourses.map((course, index) => (
              <CourseCard
                key={course.id}
                course={course}
                rank={index + 2}
                onOpen={() => onOpenCourse(course.id)}
              />
            ))}
          </div>
        </section>
      ) : null}

      {exclusions.length > 0 ? (
        <details className={styles.excluded}>
          <summary>제외된 코스 {exclusions.length}개와 그 이유</summary>
          <ul>
            {exclusions.map((course) => (
              <li key={course.id}>
                <strong>{course.title}</strong>
                <span>{course.reasons.map((r) => r.message).join(' ')}</span>
              </li>
            ))}
          </ul>
        </details>
      ) : null}

      {meta ? (
        <p className={styles.meta}>
          데이터 기준일 {meta.dataSnapshotDate} · 검토한 코스 {meta.evaluatedCount}개 ·
          노출 제외 {meta.blockedCount}개
        </p>
      ) : null}
    </>
  )
}
