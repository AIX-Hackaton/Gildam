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
    getOptionLabel(mobilityOptions, conditions.mobility),
    ...conditions.preferences.map((preference) =>
      getOptionLabel(preferenceOptions, preference),
    ),
  ].filter(Boolean) as string[]

  const [featuredCourse, ...alternativeCourses] = courses

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

      <CourseCard
        course={featuredCourse}
        featured
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
