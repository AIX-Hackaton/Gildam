import { useNavigate } from 'react-router-dom'

import { AppShell } from '../../components/common/AppShell/AppShell.tsx'
import { PageHeader } from '../../components/common/PageHeader/PageHeader.tsx'
import { NotFoundState } from '../../components/feedback/NotFoundState/NotFoundState.tsx'

export function NotFoundPage() {
  const navigate = useNavigate()

  return (
    <AppShell>
      <PageHeader
        title="페이지 없음"
        visuallyHiddenTitle
        backAlignedToContent
        showBack
        onBack={() => navigate(-1)}
      />
      <main className="page-content">
        <NotFoundState onHome={() => navigate('/')} />
      </main>
    </AppShell>
  )
}
