import { Navigate, useNavigate } from 'react-router-dom'

import { AppShell } from '../../components/common/AppShell/AppShell.tsx'
import { PageHeader } from '../../components/common/PageHeader/PageHeader.tsx'
import { CourseCardSkeleton } from '../../components/course/CourseCardSkeleton/CourseCardSkeleton.tsx'
import { ErrorState } from '../../components/feedback/ErrorState/ErrorState.tsx'
import { NoResultsState } from '../../components/feedback/NoResultsState/NoResultsState.tsx'
import { useRecommendations } from '../../hooks/useRecommendations.ts'
import { useTravelConditions } from '../../hooks/useTravelConditions.ts'
import { ResultsContent } from './ResultsContent.tsx'
import styles from './ResultsPage.module.css'

export function ResultsPage() {
  const navigate = useNavigate()
  const { conditions, isComplete } = useTravelConditions()
  const {
    courses,
    exclusions,
    suggestions,
    meta,
    isLoading,
    hasError,
    errorMessage,
    retry,
  } = useRecommendations(conditions, isComplete)

  if (!isComplete) return <Navigate to="/plan" replace />

  return (
    <AppShell>
      <PageHeader title="추천 결과" showBack onBack={() => navigate('/plan')} />

      <main className={`page-content ${styles.main}`} aria-busy={isLoading}>
        {isLoading ? (
          <CourseCardSkeleton />
        ) : hasError ? (
          <ErrorState
            message={errorMessage}
            onRetry={retry}
            onBack={() => navigate('/plan')}
          />
        ) : courses.length === 0 ? (
          <NoResultsState
            suggestions={suggestions}
            exclusions={exclusions}
            onReset={() => navigate('/plan')}
            onHome={() => navigate('/')}
          />
        ) : (
          <ResultsContent
            conditions={conditions}
            courses={courses}
            exclusions={exclusions}
            meta={meta}
            onChangeConditions={() => navigate('/plan')}
            onOpenCourse={(courseId) => navigate(`/courses/${courseId}`)}
          />
        )}
      </main>
    </AppShell>
  )
}
