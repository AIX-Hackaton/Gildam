import type { CourseSummary } from '../../../types/course.ts'
import { verificationLabels } from '../../../utils/coursePresentation.ts'
import { Button } from '../../common/Button/Button.tsx'
import { CourseMetrics } from '../CourseMetrics/CourseMetrics.tsx'
import { RecommendationBasis } from '../RecommendationBasis/RecommendationBasis.tsx'
import { ReturnFeasibilityCard } from '../ReturnFeasibilityCard/ReturnFeasibilityCard.tsx'
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
  const needsReview =
    course.exposureTier === 'DEMO_ONLY' || course.exposureTier === 'MANUAL_REVIEW'

  return (
    <article className={`${styles.card} ${featured ? styles.featured : ''}`}>
      <div className={styles.imageWrap}>
        <img
          className={styles.image}
          src={course.thumbnailUrl}
          alt={`${course.region} ${course.title} 대표 풍경`}
        />
        {featured ? (
          <span className={styles.rankBadge} aria-label={`${rank ?? 1}순위 추천`}>
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

        {course.returnFeasibility ? (
          <ReturnFeasibilityCard
            feasibility={course.returnFeasibility}
            compact
          />
        ) : null}

        <div className={styles.tags} aria-label="코스 취향">
          {course.tags.map((tag) => (
            <span className={styles.tag} key={tag}>
              {tag}
            </span>
          ))}
        </div>

        {needsReview ? (
          <p className={styles.verification}>
            {verificationLabels[course.verificationStatus ?? ''] ??
              course.verificationStatus}
            {' · '}
            이용일 확인이 필요한 코스입니다
          </p>
        ) : null}

        {featured ? (
          <section
            className={styles.reasons}
            aria-labelledby={`${course.id}-reason`}
          >
            <h3 id={`${course.id}-reason`}>추천 이유</h3>
            <ul>
              {course.recommendationReasons.map((reason) => (
                <li key={reason}>{reason}</li>
              ))}
            </ul>
          </section>
        ) : null}

        <RecommendationBasis course={course} defaultOpen={featured} />

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
