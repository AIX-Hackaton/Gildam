import type { CourseSummary } from '../../../types/course.ts'
import {
  fatigueLabels,
  formatDuration,
  formatMinutesRange,
} from '../../../utils/coursePresentation.ts'
import styles from './CourseMetrics.module.css'

type CourseMetricData = Pick<
  CourseSummary,
  | 'durationMinutes'
  | 'walkingMinutes'
  | 'transferCount'
  | 'fatigueLevel'
  | 'durationMinMinutes'
  | 'durationMaxMinutes'
>

interface CourseMetricsProps {
  course: CourseMetricData
  variant: 'card' | 'detail'
}

export function CourseMetrics({ course, variant }: CourseMetricsProps) {
  const hasRange =
    course.durationMinMinutes !== undefined &&
    course.durationMaxMinutes !== undefined

  const durationValue = formatDuration(course.durationMinutes)
  const rangeValue = hasRange
    ? formatMinutesRange(course.durationMinMinutes!, course.durationMaxMinutes!)
    : null

  const metrics =
    variant === 'card'
      ? [
          { label: '피로도', value: fatigueLabels[course.fatigueLevel] },
          { label: '환승', value: `${course.transferCount}회` },
          { label: '이동 도보', value: `${course.walkingMinutes}분` },
          { label: '계획 시간', value: durationValue },
        ]
      : [
          { label: '계획 소요', value: durationValue },
          { label: '이동 도보', value: `${course.walkingMinutes}분` },
          { label: '환승', value: `${course.transferCount}회` },
          { label: '피로도', value: fatigueLabels[course.fatigueLevel] },
        ]

  return (
    <>
      <dl className={`${styles.metrics} ${styles[variant]}`}>
        {metrics.map((metric) => (
          <div key={metric.label}>
            <dt>{metric.label}</dt>
            <dd>{metric.value}</dd>
          </div>
        ))}
      </dl>
      {rangeValue ? (
        <p className={styles.range}>지연 포함 예상 범위 {rangeValue}</p>
      ) : null}
    </>
  )
}
