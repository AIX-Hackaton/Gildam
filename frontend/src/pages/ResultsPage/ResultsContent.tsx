import { CourseCard } from '../../components/course/CourseCard/CourseCard.tsx'
import {
  departureOptions,
  durationOptions,
  getOptionLabel,
  preferenceOptions,
} from '../../constants/travelConditionOptions.ts'
import type { CourseSummary } from '../../types/course.ts'
import type { TravelConditions } from '../../types/travelConditions.ts'
import styles from './ResultsContent.module.css'

interface ResultsContentProps {
  conditions: TravelConditions
  courses: CourseSummary[]
  onChangeConditions: () => void
  onOpenCourse: (courseId: string) => void
}

export function ResultsContent({
  conditions,
  courses,
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
  ].filter(Boolean) as string[]

  const [featuredCourse, ...alternativeCourses] = courses

  return (
    <>
      <section className={styles.intro}>
        <div>
          <h1>내 조건에 맞는 코스를 찾았어요</h1>
          <p>이동 부담과 취향을 함께 비교해보세요.</p>
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
            {alternativeCourses.map((course) => (
              <CourseCard
                key={course.id}
                course={course}
                onOpen={() => onOpenCourse(course.id)}
              />
            ))}
          </div>
        </section>
      ) : null}
    </>
  )
}
