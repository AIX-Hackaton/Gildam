import type { Course } from '../../../types/course.ts'
import { Button } from '../../common/Button/Button.tsx'
import { StickyBottomCTA } from '../../common/StickyBottomCTA/StickyBottomCTA.tsx'
import { CourseInfoCard } from '../CourseInfoCard/CourseInfoCard.tsx'
import { CourseMetrics } from '../CourseMetrics/CourseMetrics.tsx'
import { DataEvidence } from '../DataEvidence/DataEvidence.tsx'
import { ItineraryTimeline } from '../ItineraryTimeline/ItineraryTimeline.tsx'
import { RecommendationBasis } from '../RecommendationBasis/RecommendationBasis.tsx'
import { ReturnFeasibilityCard } from '../ReturnFeasibilityCard/ReturnFeasibilityCard.tsx'
import styles from './CourseDetailContent.module.css'

interface CourseDetailContentProps {
  course: Course
}

function openExternalUrl(url: string) {
  window.open(url, '_blank', 'noopener,noreferrer')
}

export function CourseDetailContent({ course }: CourseDetailContentProps) {
  const mapUrl = course.kakaoMapUrl ?? course.mapUrl
  const directionsUrl = course.kakaoDirectionsUrl ?? course.directionsUrl
  const routeLinks = course.routeLinks ?? []

  return (
    <>
      <main className={`page-content ${styles.main}`}>
        <img
          className={styles.hero}
          src={course.thumbnailUrl}
          alt={`${course.region} ${course.title} 대표 풍경`}
        />

        {course.exposureNotice ? (
          <aside className={styles.notice} role="note">
            <strong>{course.exposureNotice.title}</strong>
            <span>{course.exposureNotice.message}</span>
          </aside>
        ) : null}

        <section className={styles.intro}>
          <p className={styles.region}>{course.region}</p>
          <h1>{course.title}</h1>
          <p className={styles.description}>{course.description}</p>
          <div className={styles.tags} aria-label="코스 취향">
            {course.tags.map((tag) => (
              <span key={tag}>{tag}</span>
            ))}
          </div>
        </section>

        <CourseMetrics course={course} variant="detail" />

        {course.returnFeasibility ? (
          <ReturnFeasibilityCard feasibility={course.returnFeasibility} />
        ) : null}

        <section className={styles.section}>
          <h2>이 코스를 추천하는 이유</h2>
          <ul className={styles.reasonList}>
            {course.recommendationReasons.map((reason) => (
              <li key={reason}>{reason}</li>
            ))}
          </ul>
        </section>

        {course.scoreBreakdown ? (
          <RecommendationBasis course={course} />
        ) : null}

        <section className={styles.section}>
          <h2>코스 순서</h2>
          <ItineraryTimeline items={course.itinerary} />
        </section>

        {routeLinks.length > 0 ? (
          <section className={styles.section}>
            <h2>구간별 길찾기</h2>
            <p className={styles.routeHint}>
              출발지 {course.departurePointName}가 이미 입력된 상태로 열립니다.
            </p>
            <ol className={styles.routeList}>
              {routeLinks.map((link) => (
                <li key={`${link.order}-${link.toName}`}>
                  <span className={styles.routeLabel}>
                    {link.fromName} → {link.toName}
                  </span>
                  <span className={styles.routeActions}>
                    <a
                      href={link.transitUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      대중교통
                    </a>
                    <a
                      href={link.walkUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      도보
                    </a>
                  </span>
                </li>
              ))}
            </ol>
          </section>
        ) : null}

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

        {course.scenePrompts.length > 0 ? (
          <section className={styles.section}>
            <h2>오늘 담아볼 장면</h2>
            <ul className={styles.promptList}>
              {course.scenePrompts.map((prompt) => (
                <li key={prompt}>{prompt}</li>
              ))}
            </ul>
          </section>
        ) : null}

        <DataEvidence course={course} />
      </main>

      <StickyBottomCTA>
        <Button
          type="button"
          variant="secondary"
          onClick={() => openExternalUrl(mapUrl)}
        >
          지도에서 보기
        </Button>
        <Button type="button" onClick={() => openExternalUrl(directionsUrl)}>
          길찾기 열기
        </Button>
      </StickyBottomCTA>
    </>
  )
}
