import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

import { AppShell } from '../../components/common/AppShell/AppShell.tsx'
import { Button } from '../../components/common/Button/Button.tsx'
import { PageHeader } from '../../components/common/PageHeader/PageHeader.tsx'
import { StickyBottomCTA } from '../../components/common/StickyBottomCTA/StickyBottomCTA.tsx'
import { ErrorState } from '../../components/feedback/ErrorState/ErrorState.tsx'
import { NotFoundState } from '../../components/feedback/NotFoundState/NotFoundState.tsx'
import { getCourseById } from '../../services/recommendationService.ts'
import type { Course, FatigueLevel, ItineraryItem } from '../../types/course.ts'
import styles from './CourseDetailPage.module.css'

const fatigueLabels: Record<FatigueLevel, string> = {
  LOW: '낮음',
  MEDIUM: '보통',
  HIGH: '높음',
}

const itineraryTypeLabels: Record<ItineraryItem['type'], string> = {
  transport: '이동',
  place: '장소',
  food: '식사',
}

function formatDuration(minutes: number) {
  const hours = Math.floor(minutes / 60)
  const remainingMinutes = minutes % 60
  return remainingMinutes ? `${hours}시간 ${remainingMinutes}분` : `${hours}시간`
}

export function CourseDetailPage() {
  const navigate = useNavigate()
  const { courseId = '' } = useParams()
  const [course, setCourse] = useState<Course | null>()
  const [hasError, setHasError] = useState(false)
  const [retryKey, setRetryKey] = useState(0)

  useEffect(() => {
    let isCurrent = true

    setCourse(undefined)
    setHasError(false)
    getCourseById(courseId)
      .then((result) => {
        if (isCurrent) setCourse(result)
      })
      .catch(() => {
        if (!isCurrent) return
        setHasError(true)
        setCourse(null)
      })

    return () => {
      isCurrent = false
    }
  }, [courseId, retryKey])

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
            onRetry={() => setRetryKey((current) => current + 1)}
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

        <dl className={styles.metrics}>
          <div>
            <dt>총 소요</dt>
            <dd>{formatDuration(course.durationMinutes)}</dd>
          </div>
          <div>
            <dt>총 도보</dt>
            <dd>{course.walkingMinutes}분</dd>
          </div>
          <div>
            <dt>환승</dt>
            <dd>{course.transferCount}회</dd>
          </div>
          <div>
            <dt>피로도</dt>
            <dd>{fatigueLabels[course.fatigueLevel]}</dd>
          </div>
        </dl>

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
          <ol className={styles.timeline}>
            {course.itinerary.map((item) => (
              <li key={item.id}>
                <div className={styles.timelineMarker} aria-hidden="true" />
                <div className={styles.timelineContent}>
                  <div className={styles.timelineTop}>
                    <span className={styles.time}>{item.time}</span>
                    <span className={styles.type}>{itineraryTypeLabels[item.type]}</span>
                    {item.durationMinutes ? (
                      <span className={styles.duration}>{item.durationMinutes}분</span>
                    ) : null}
                  </div>
                  <h3>{item.name}</h3>
                  {item.note ? <p>{item.note}</p> : null}
                </div>
              </li>
            ))}
          </ol>
        </section>

        {course.localFood.map((food) => (
          <section className={styles.infoCard} key={food.id}>
            <p className={styles.cardLabel}>지역 음식</p>
            <h2>{food.name}</h2>
            <p>{food.description}</p>
          </section>
        ))}

        {course.localPoints.map((point) => (
          <section className={styles.infoCard} key={point.id}>
            <p className={styles.cardLabel}>로컬 포인트</p>
            <h2>{point.title}</h2>
            <p>{point.description}</p>
          </section>
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
