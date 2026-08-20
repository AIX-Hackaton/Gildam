import type { CourseSummary } from '../../../types/course.ts'
import {
  formatCompactLabel,
  formatRecommendationReason,
  getTopRecommendationReasons,
  getReturnActionLabel,
  getReturnFeasibilityLabel,
} from '../../../utils/coursePresentation.ts'
import { Button } from '../../common/Button/Button.tsx'
import { CourseMetrics } from '../CourseMetrics/CourseMetrics.tsx'
import styles from './CourseCard.module.css'

interface CourseCardProps {
  course: CourseSummary
  featured?: boolean
  onOpen: () => void
}

export function CourseCard({
  course,
  featured = false,
  onOpen,
}: CourseCardProps) {
  const returnFeasibilityLabel = getReturnFeasibilityLabel(
    course.returnFeasibility.status,
  )
  const returnFeasibilityClassName =
    course.returnFeasibility.status === 'FEASIBLE'
      ? styles.returnAvailable
      : styles.returnTight
  const returnActionLabel = getReturnActionLabel(course.returnFeasibility)
  const recommendationReasons = getTopRecommendationReasons(
    course,
    featured ? 3 : 2,
  )

  return (
    <article className={`${styles.card} ${featured ? styles.featured : ''}`}>
      <div className={styles.imageWrap}>
        <img
          className={styles.image}
          src={course.thumbnailUrl}
          alt={
            course.thumbnailPlace
              ? `${course.thumbnailPlace} 풍경`
              : `${course.title} 대표 풍경`
          }
        />
        {course.thumbnailCredit ? (
          <p className={styles.imageCredit}>
            사진 제공 ({course.thumbnailCredit}) - 한국관광공사
          </p>
        ) : null}
      </div>

      <div className={styles.content}>
        <div className={styles.titleRow}>
          <h2 className={styles.title}>{course.title}</h2>
        </div>

        <CourseMetrics course={course} variant="card" />

        <div className={styles.returnStatus}>
          <div className={styles.tags} aria-label="코스 취향">
            {course.tags.slice(0, 3).map((tag) => (
              <span className={styles.tag} key={tag}>
                {formatCompactLabel(tag)}
              </span>
            ))}
            {returnFeasibilityLabel ? (
              <span className={`${styles.tag} ${returnFeasibilityClassName}`}>
                {returnFeasibilityLabel}
              </span>
            ) : null}
          </div>
          {returnActionLabel ? (
            <p className={styles.returnCheck}>{returnActionLabel}</p>
          ) : null}
        </div>

        {recommendationReasons.length > 0 ? (
          <section className={styles.reasons} aria-labelledby={`${course.id}-reason`}>
            <h3 id={`${course.id}-reason`}>추천 이유</h3>
            <ul>
              {recommendationReasons.map((reason) => (
                <li key={reason}>{formatRecommendationReason(reason)}</li>
              ))}
            </ul>
          </section>
        ) : null}

        <Button
          className={styles.cta}
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
