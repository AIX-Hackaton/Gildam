import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { AppShell } from '../../components/common/AppShell/AppShell.tsx'
import { PageHeader } from '../../components/common/PageHeader/PageHeader.tsx'
import { CourseCard } from '../../components/course/CourseCard/CourseCard.tsx'
import { ErrorState } from '../../components/feedback/ErrorState/ErrorState.tsx'
import { NoResultsState } from '../../components/feedback/NoResultsState/NoResultsState.tsx'
import {
  departureOptions,
  durationOptions,
  getOptionLabel,
  preferenceOptions,
} from '../../constants/travelConditionOptions.ts'
import { useTravelConditions } from '../../hooks/useTravelConditions.ts'
import { getRecommendations } from '../../services/recommendationService.ts'
import type { CourseSummary } from '../../types/course.ts'
import styles from './ResultsPage.module.css'

export function ResultsPage() {
  const navigate = useNavigate()
  const { conditions, isComplete } = useTravelConditions()
  const [courses, setCourses] = useState<CourseSummary[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)
  const [retryKey, setRetryKey] = useState(0)

  useEffect(() => {
    let isCurrent = true

    if (!isComplete) {
      setCourses([])
      setHasError(false)
      setIsLoading(false)
      return () => {
        isCurrent = false
      }
    }

    setIsLoading(true)
    setHasError(false)
    getRecommendations(conditions)
      .then((recommendations) => {
        if (!isCurrent) return
        setCourses(recommendations)
        setIsLoading(false)
      })
      .catch(() => {
        if (!isCurrent) return
        setCourses([])
        setHasError(true)
        setIsLoading(false)
      })

    return () => {
      isCurrent = false
    }
  }, [conditions, isComplete, retryKey])

  const conditionLabels = [
    conditions.departure
      ? getOptionLabel(departureOptions, conditions.departure)
      : null,
    conditions.duration
      ? getOptionLabel(durationOptions, conditions.duration)
      : null,
    ...conditions.preferences.map((preference) =>
      getOptionLabel(preferenceOptions, preference),
    ),
  ].filter(Boolean) as string[]

  return (
    <AppShell>
      <PageHeader
        title="추천 결과"
        showBack
        onBack={() => navigate('/plan')}
      />

      <main className={`page-content ${styles.main}`}>
        {isLoading ? (
          <section className={styles.loading} aria-live="polite">
            <span className="sr-only">추천 코스를 불러오는 중입니다.</span>
            <div className={styles.loadingImage} />
            <div className={styles.loadingLine} />
            <div className={styles.loadingLineShort} />
          </section>
        ) : hasError ? (
          <ErrorState
            onRetry={() => setRetryKey((current) => current + 1)}
            onBack={() => navigate('/plan')}
          />
        ) : courses.length === 0 ? (
          <NoResultsState
            onReset={() => navigate('/plan')}
            onHome={() => navigate('/')}
          />
        ) : (
          <>
            <section className={styles.intro}>
              <div>
                <h1>내 조건에 맞는 코스를 찾았어요</h1>
                <p>이동 부담과 취향을 함께 비교해보세요.</p>
              </div>
              <button
                className={styles.changeButton}
                type="button"
                onClick={() => navigate('/plan')}
              >
                조건 변경
              </button>
            </section>

            <div className={styles.conditionChips} aria-label="선택한 여행 조건">
              {conditionLabels.map((label) => (
                <span key={label}>{label}</span>
              ))}
            </div>

            <CourseCard
              course={courses[0]}
              featured
              rank={1}
              onOpen={() => navigate(`/courses/${courses[0].id}`)}
            />

            {courses.length > 1 ? (
              <section className={styles.alternatives}>
                <div className={styles.sectionHeading}>
                  <h2>이 코스도 잘 맞아요</h2>
                  <p>{courses.length - 1}개의 대안 코스</p>
                </div>
                <div className={styles.alternativeList}>
                  {courses.slice(1).map((course) => (
                    <CourseCard
                      key={course.id}
                      course={course}
                      onOpen={() => navigate(`/courses/${course.id}`)}
                    />
                  ))}
                </div>
              </section>
            ) : null}
          </>
        )}
      </main>
    </AppShell>
  )
}
