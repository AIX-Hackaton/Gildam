import { useNavigate, useParams } from 'react-router-dom'

import { AppShell } from '../../components/common/AppShell/AppShell.tsx'
import { PageHeader } from '../../components/common/PageHeader/PageHeader.tsx'
import { CourseDetailContent } from '../../components/course/CourseDetailContent/CourseDetailContent.tsx'
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
        <PageHeader
          title="코스 상세"
          showBack
          onBack={() => navigate('/results')}
        />
        <main className="page-content">
          <ErrorState onRetry={retry} onBack={() => navigate('/plan')} />
        </main>
      </AppShell>
    )
  }

  if (course === null) {
    return (
      <AppShell>
        <PageHeader
          title="코스 상세"
          showBack
          onBack={() => navigate('/results')}
        />
        <main className="page-content">
          <NotFoundState
            title="코스를 찾지 못했어요"
            description="추천 결과에서 다른 코스를 선택해주세요"
            onBack={() => navigate('/results')}
            onHome={() => navigate('/')}
          />
        </main>
      </AppShell>
    )
  }

  return (
    <AppShell>
      <PageHeader
        title="코스 상세"
        visuallyHiddenTitle
        backAlignedToContent
        compact
        showBack
        onBack={() => navigate(-1)}
      />
      <CourseDetailContent course={course} />
    </AppShell>
  )
}
