import { Navigate, useNavigate, useSearchParams } from 'react-router-dom'

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
  const [searchParams] = useSearchParams()
  const { conditions, isComplete } = useTravelConditions()
  const requestedPreview = searchParams.get('preview')
  const previewState =
    import.meta.env.DEV &&
    (requestedPreview === 'error' || requestedPreview === 'no-results')
      ? requestedPreview
      : null
  const {
    courses,
    exclusions,
    suggestions,
    isLoading,
    hasError,
    retry,
  } = useRecommendations(conditions, isComplete && previewState === null)

  if (!isComplete && previewState === null) {
    return <Navigate to="/plan" replace />
  }

  return (
    <AppShell>
      <PageHeader
        title="추천 결과"
        visuallyHiddenTitle
        backAlignedToContent
        showBack
        onBack={() => navigate('/plan')}
      />

      <main className={`page-content ${styles.main}`}>
        {previewState === 'error' ? (
          <ErrorState onRetry={retry} onBack={() => navigate('/plan')} />
        ) : previewState === 'no-results' ? (
          <NoResultsState
            onReset={() => navigate('/plan')}
            onHome={() => navigate('/')}
          />
        ) : isLoading ? (
          <CourseCardSkeleton />
        ) : hasError ? (
          <ErrorState onRetry={retry} onBack={() => navigate('/plan')} />
        ) : courses.length === 0 ? (
          <NoResultsState
            suggestions={suggestions.map((suggestion) => suggestion.message)}
            onReset={() => navigate('/plan')}
            onHome={() => navigate('/')}
          />
        ) : (
          <ResultsContent
            conditions={conditions}
            courses={courses}
            excludedCourses={exclusions}
            onOpenCourse={(courseId) => navigate(`/courses/${courseId}`)}
          />
        )}
      </main>
    </AppShell>
  )
}
