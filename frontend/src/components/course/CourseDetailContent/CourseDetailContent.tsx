import type { Course } from '../../../types/course.ts'
import {
  formatCompactLabel,
  formatRecommendationReason,
  formatTransportGuidance,
  getReturnActionLabel,
  getReturnFeasibilityLabel,
} from '../../../utils/coursePresentation.ts'
import { Button } from '../../common/Button/Button.tsx'
import { StickyBottomCTA } from '../../common/StickyBottomCTA/StickyBottomCTA.tsx'
import { CourseInfoCard } from '../CourseInfoCard/CourseInfoCard.tsx'
import { CourseMetrics } from '../CourseMetrics/CourseMetrics.tsx'
import { ItineraryTimeline } from '../ItineraryTimeline/ItineraryTimeline.tsx'
import styles from './CourseDetailContent.module.css'

interface CourseDetailContentProps {
  course: Course
}

function openExternalUrl(url: string) {
  window.open(url, '_blank', 'noopener,noreferrer')
}

export function CourseDetailContent({ course }: CourseDetailContentProps) {
  const directionsUrl = course.kakaoDirectionsUrl ?? course.directionsUrl
  const returnFeasibilityLabel = getReturnFeasibilityLabel(
    course.returnFeasibility.status,
  )
  const returnFeasibilityClassName =
    course.returnFeasibility.status === 'FEASIBLE'
      ? styles.returnAvailable
      : styles.returnTight
  const returnActionLabel = getReturnActionLabel(course.returnFeasibility)
  const returnConfidenceLabel =
    course.returnFeasibility.confidence === 'CONFIRMED'
      ? '귀가 교통 확인 완료'
      : returnActionLabel
  const returnGuidance = course.returnFeasibility.returnTransport?.note

  return (
    <>
      <main className={`page-content ${styles.main}`}>
        <div className={styles.heroWrap}>
          <img
            className={styles.hero}
            src={course.thumbnailUrl}
            alt={
              course.thumbnailPlace
                ? `${course.thumbnailPlace} 풍경`
                : `${course.region} ${course.title} 대표 풍경`
            }
          />
          {course.thumbnailCredit ? (
            <p className={styles.imageCredit}>
              사진 제공 ({course.thumbnailCredit}) - 한국관광공사
            </p>
          ) : null}
        </div>

        <div className={styles.content}>
          <section className={styles.intro}>
            <h1>{course.title}</h1>
            <p className={styles.description}>{course.description}</p>
            <div className={styles.tags} aria-label="코스 취향">
              {course.tags.map((tag) => (
                <span key={tag}>{formatCompactLabel(tag)}</span>
              ))}
              {returnFeasibilityLabel ? (
                <span className={returnFeasibilityClassName}>
                  {returnFeasibilityLabel}
                </span>
              ) : null}
            </div>
          </section>

          <CourseMetrics course={course} variant="detail" />

          <section className={`${styles.section} ${styles.returnSection}`}>
            <h2>귀가 정보</h2>

            {returnConfidenceLabel ? (
              <p
                className={
                  returnActionLabel
                    ? styles.returnCheck
                    : styles.returnConfirmed
                }
              >
                {returnConfidenceLabel}
              </p>
            ) : null}

            {course.returnFeasibility.departureTime &&
            course.returnFeasibility.plannedReturnTime ? (
              <p className={styles.returnSchedule}>
                <span>기준 일정</span>
                <strong>
                  {course.returnFeasibility.departureTime} →{' '}
                  {course.returnFeasibility.plannedReturnTime}
                </strong>
              </p>
            ) : null}

            {returnGuidance ? (
              <p className={styles.returnGuidance}>
                {formatTransportGuidance(returnGuidance)}
              </p>
            ) : null}
          </section>

          <section className={styles.section}>
            <h2>추천 이유</h2>
            <div className={styles.reasonList}>
              {course.recommendationReasons.map((reason) => (
                <p key={reason}>{formatRecommendationReason(reason)}</p>
              ))}
            </div>
          </section>

          <section className={styles.section}>
            <h2>코스 순서</h2>
            <ItineraryTimeline items={course.itinerary} />
          </section>

          <div className={styles.cardList}>
            {course.localFood.map((food) => (
              <CourseInfoCard
                key={food.id}
                label="지역 음식"
                title={food.name}
                description={food.description}
              />
            ))}

            {course.localPoints.map((point) => (
              <CourseInfoCard
                key={point.id}
                label="로컬 포인트"
                title={point.title}
                description={point.description}
              />
            ))}

            {course.scenePrompts.length ? (
              <CourseInfoCard
                label="오늘 담아볼 장면"
                items={course.scenePrompts}
              />
            ) : null}
          </div>
        </div>
      </main>

      <StickyBottomCTA>
        <Button
          type="button"
          className={styles.cta}
          onClick={() => openExternalUrl(directionsUrl)}
        >
          길찾기 열기
        </Button>
      </StickyBottomCTA>
    </>
  )
}
