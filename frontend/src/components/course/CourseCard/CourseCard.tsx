import type { CourseSummary } from '../../../types/course.ts'
import { Button } from '../../common/Button/Button.tsx'
import { CourseMetrics } from '../CourseMetrics/CourseMetrics.tsx'
import styles from './CourseCard.module.css'

interface CourseCardProps {
  course: CourseSummary
  featured?: boolean
  rank?: number
  onOpen: () => void
}

export function CourseCard({
  course,
  featured = false,
  rank,
  onOpen,
}: CourseCardProps) {
  return (
    <article className={`${styles.card} ${featured ? styles.featured : ''}`}>
      <div className={styles.imageWrap}>
        <img
          className={styles.image}
          src={course.thumbnailUrl}
          alt={`${course.region} ${course.title} 대표 풍경`}
        />
        {featured ? (
          <span
            className={styles.rankBadge}
            aria-label={`${rank ?? 1}순위 추천`}
          >
            <span className={styles.rankBrand} aria-hidden="true">
              GILDAM
            </span>
            <span aria-hidden="true">{rank ?? 1}순위 추천</span>
          </span>
        ) : null}
      </div>

      <div className={styles.content}>
        <div className={styles.titleRow}>
          <div>
            <p className={styles.region}>{course.region}</p>
            <h2 className={styles.title}>{course.title}</h2>
          </div>
        </div>

        <CourseMetrics course={course} variant="card" />

        <div className={styles.tags} aria-label="코스 취향">
          {course.tags.map((tag) => (
            <span className={styles.tag} key={tag}>
              {tag}
            </span>
          ))}
        </div>

        {featured ? (
          <section className={styles.reasons} aria-labelledby={`${course.id}-reason`}>
            <h3 id={`${course.id}-reason`}>추천 이유</h3>
            <ul>
              {course.recommendationReasons.map((reason) => (
                <li key={reason}>{reason}</li>
              ))}
            </ul>
          </section>
        ) : null}

        <Button
          type="button"
          variant={featured ? 'primary' : 'secondary'}
          fullWidth
          onClick={onOpen}
        >
          코스 자세히 보기
        </Button>
      </div>
    </article>
  )
}
