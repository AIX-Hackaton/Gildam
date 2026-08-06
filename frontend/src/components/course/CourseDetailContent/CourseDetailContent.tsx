import type { Course } from '../../../types/course.ts'
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
  const mapUrl = course.kakaoMapUrl ?? course.mapUrl
  const directionsUrl = course.kakaoDirectionsUrl ?? course.directionsUrl

  return (
    <>
      <main className={`page-content ${styles.main}`}>
        <img
          className={styles.hero}
          src={course.thumbnailUrl}
          alt={`${course.region} ${course.title} 대표 풍경`}
        />

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

        <section className={styles.section}>
          <h2>이 코스를 추천하는 이유</h2>
          <ul className={styles.reasonList}>
            {course.recommendationReasons.map((reason) => (
              <li key={reason}>{reason}</li>
            ))}
          </ul>
        </section>

        <section className={styles.section}>
          <h2>코스 순서</h2>
          <ItineraryTimeline items={course.itinerary} />
        </section>

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

        <section className={styles.section}>
          <h2>오늘 담아볼 장면</h2>
          <ul className={styles.promptList}>
            {course.scenePrompts.map((prompt) => (
              <li key={prompt}>{prompt}</li>
            ))}
          </ul>
        </section>
      </main>

      <StickyBottomCTA>
        <Button
          type="button"
          variant="secondary"
          onClick={() => openExternalUrl(mapUrl)}
        >
          지도에서 보기
        </Button>
        <Button
          type="button"
          onClick={() => openExternalUrl(directionsUrl)}
        >
          길찾기 열기
        </Button>
      </StickyBottomCTA>
    </>
  )
}
