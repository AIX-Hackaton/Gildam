import type { CourseSummary, FatigueLevel } from '../../../types/course.ts'
import { Button } from '../../common/Button/Button.tsx'
import styles from './CourseCard.module.css'

interface CourseCardProps {
  course: CourseSummary
  featured?: boolean
  rank?: number
  onOpen: () => void
}

const fatigueLabels: Record<FatigueLevel, string> = {
  LOW: '낮음',
  MEDIUM: '보통',
  HIGH: '높음',
}

function formatDuration(minutes: number) {
  const hours = Math.floor(minutes / 60)
  const remainingMinutes = minutes % 60
  return remainingMinutes ? `${hours}시간 ${remainingMinutes}분` : `${hours}시간`
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
          <span className={styles.rankBadge}>{rank ?? 1}순위 추천</span>
        ) : null}
      </div>

      <div className={styles.content}>
        <div className={styles.titleRow}>
          <div>
            <p className={styles.region}>{course.region}</p>
            <h2 className={styles.title}>{course.title}</h2>
          </div>
        </div>

        <div className={styles.tags} aria-label="코스 취향">
          {course.tags.map((tag) => (
            <span className={styles.tag} key={tag}>
              {tag}
            </span>
          ))}
        </div>

        <dl className={styles.metrics}>
          <div>
            <dt>이동 피로도</dt>
            <dd>{fatigueLabels[course.fatigueLevel]}</dd>
          </div>
          <div>
            <dt>환승</dt>
            <dd>{course.transferCount}회</dd>
          </div>
          <div>
            <dt>총 도보</dt>
            <dd>{course.walkingMinutes}분</dd>
          </div>
          <div>
            <dt>예상 시간</dt>
            <dd>{formatDuration(course.durationMinutes)}</dd>
          </div>
        </dl>

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
