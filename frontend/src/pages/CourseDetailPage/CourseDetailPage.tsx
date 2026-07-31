import { useNavigate, useParams } from 'react-router-dom'

import { AppShell } from '../../components/common/AppShell/AppShell.tsx'
import { Button } from '../../components/common/Button/Button.tsx'
import { PageHeader } from '../../components/common/PageHeader/PageHeader.tsx'
import { StickyBottomCTA } from '../../components/common/StickyBottomCTA/StickyBottomCTA.tsx'
import { CourseInfoCard } from '../../components/course/CourseInfoCard/CourseInfoCard.tsx'
import { CourseMetrics } from '../../components/course/CourseMetrics/CourseMetrics.tsx'
import { ItineraryTimeline } from '../../components/course/ItineraryTimeline/ItineraryTimeline.tsx'
import { ErrorState } from '../../components/feedback/ErrorState/ErrorState.tsx'
import { NotFoundState } from '../../components/feedback/NotFoundState/NotFoundState.tsx'
import { useCourseDetail } from '../../hooks/useCourseDetail.ts'
import styles from './CourseDetailPage.module.css'

export function CourseDetailPage() {
  const navigate = useNavigate()
  const { courseId = '' } = useParams()
  const { course, hasError, retry } = useCourseDetail(courseId)

  if (course === undefined) {
    return (
      <AppShell>
        <PageHeader title="코스 상세" showBack onBack={() => navigate(-1)} />
        <main className={`page-content ${styles.loading}`} aria-live="polite">
          코스 정보를 불러오는 중입니다.
        </main>
      </AppShell>
    )
  }

  if (hasError) {
    return (
      <AppShell>
        <PageHeader title="코스 상세" showBack onBack={() => navigate('/results')} />
        <main className="page-content">
          <ErrorState
            onRetry={retry}
            onBack={() => navigate('/plan')}
          />
        </main>
      </AppShell>
    )
  }

  if (course === null) {
    return (
      <AppShell>
        <PageHeader title="코스 상세" showBack onBack={() => navigate('/results')} />
        <main className="page-content">
          <NotFoundState
            title="코스를 찾지 못했어요."
            description="추천 결과에서 다른 코스를 선택해주세요."
            onBack={() => navigate('/results')}
            onHome={() => navigate('/')}
          />
        </main>
      </AppShell>
    )
  }

  return (
    <AppShell>
      <PageHeader title="코스 상세" showBack onBack={() => navigate(-1)} />

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
          onClick={() => window.open(course.mapUrl, '_blank', 'noopener,noreferrer')}
        >
          지도에서 보기
        </Button>
        <Button
          type="button"
          onClick={() =>
            window.open(course.directionsUrl, '_blank', 'noopener,noreferrer')
          }
        >
          길찾기 열기
        </Button>
      </StickyBottomCTA>
    </AppShell>
  )
}
