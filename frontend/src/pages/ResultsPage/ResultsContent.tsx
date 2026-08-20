import { CourseCard } from '../../components/course/CourseCard/CourseCard.tsx'
import {
  departureOptions,
  durationOptions,
  getOptionLabel,
  mobilityOptions,
  preferenceOptions,
} from '../../constants/travelConditionOptions.ts'
import type { CourseSummary } from '../../types/course.ts'
import type { TravelConditions } from '../../types/travelConditions.ts'
import { formatCompactLabel } from '../../utils/coursePresentation.ts'
import styles from './ResultsContent.module.css'

interface ResultsContentProps {
  conditions: TravelConditions
  courses: CourseSummary[]
  onOpenCourse: (courseId: string) => void
}

export function ResultsContent({
  conditions,
  courses,
  onOpenCourse,
}: ResultsContentProps) {
  const conditionLabels = [
    conditions.departure
      ? getOptionLabel(departureOptions, conditions.departure)
      : null,
    conditions.duration
      ? getOptionLabel(durationOptions, conditions.duration)
      : null,
    conditions.mobility
      ? getOptionLabel(mobilityOptions, conditions.mobility)
      : null,
    ...conditions.preferences.map((preference) =>
      getOptionLabel(preferenceOptions, preference),
    ),
  ].filter(Boolean) as string[]

  const [featuredCourse, ...alternativeCourses] = courses.slice(0, 3)
  const scoreBreakdown = featuredCourse.scoreBreakdown
  const recommendationCriteria = scoreBreakdown
    ? [
        { label: '취향 일치도', weight: scoreBreakdown.preferenceMatch.weight },
        { label: '이동 부담', weight: scoreBreakdown.mobility.weight },
        { label: '귀가 여유', weight: scoreBreakdown.returnMargin.weight },
        { label: '지역성', weight: scoreBreakdown.localResource.weight },
        { label: '기록 적합성', weight: scoreBreakdown.recordFit.weight },
      ]
    : []

  return (
    <>
      <section className={styles.intro}>
        <h1 aria-label="내 조건에 맞는 코스를 찾았어요">
          <span>내 조건에 맞는 코스를</span>
          <span>찾았어요</span>
        </h1>
      </section>

      <div className={styles.conditionSummary}>
        <div className={styles.conditionChips} aria-label="선택한 여행 조건">
          {conditionLabels.map((label) => (
            <span key={label}>{formatCompactLabel(label)}</span>
          ))}
        </div>

        {recommendationCriteria.length > 0 ? (
          <details className={styles.criteria}>
            <summary>추천 기준 보기</summary>
            <p>선택한 조건과 이동 가능성을 아래 비율로 반영했어요.</p>
            <dl>
              {recommendationCriteria.map(({ label, weight }) => (
                <div key={label}>
                  <dt>{label}</dt>
                  <dd>{Math.round(weight * 100)}%</dd>
                </div>
              ))}
            </dl>
          </details>
        ) : null}
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
    </>
  )
}
