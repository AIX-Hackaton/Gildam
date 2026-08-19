import type { CourseSummary } from '../../../types/course.ts'
import {
  fatigueLabels,
  formatDuration,
} from '../../../utils/coursePresentation.ts'
import styles from './CourseMetrics.module.css'

type CourseMetricData = Pick<
  CourseSummary,
  'durationMinutes' | 'walkingMinutes' | 'transferCount' | 'fatigueLevel'
>

interface CourseMetricsProps {
  course: CourseMetricData
  variant: 'card' | 'detail'
}

export function CourseMetrics({ course, variant }: CourseMetricsProps) {
  const metrics =
    variant === 'card'
      ? [
          { label: '피로도', value: fatigueLabels[course.fatigueLevel] },
          { label: '환승', value: `${course.transferCount}회` },
          { label: '총 도보', value: `${course.walkingMinutes}분` },
          { label: '예상 시간', value: formatDuration(course.durationMinutes) },
        ]
      : [
          { label: '피로도', value: fatigueLabels[course.fatigueLevel] },
          { label: '환승', value: `${course.transferCount}회` },
          { label: '총 도보', value: `${course.walkingMinutes}분` },
          { label: '예상 시간', value: formatDuration(course.durationMinutes) },
        ]

  return (
    <dl className={`${styles.metrics} ${styles[variant]}`}>
      {metrics.map((metric) => (
        <div key={metric.label}>
          <dt>{metric.label}</dt>
          <dd>{metric.value}</dd>
        </div>
      ))}
    </dl>
  )
}
