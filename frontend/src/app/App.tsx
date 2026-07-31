import { Route, Routes, useNavigate } from 'react-router-dom'

import { AppShell } from '../components/common/AppShell/AppShell.tsx'
import { PageHeader } from '../components/common/PageHeader/PageHeader.tsx'
import { HomePage } from '../pages/HomePage/HomePage.tsx'
import { PlanPage } from '../pages/PlanPage/PlanPage.tsx'
import { ResultsPage } from '../pages/ResultsPage/ResultsPage.tsx'

function CourseDetailPlaceholder() {
  const navigate = useNavigate()

  return (
    <AppShell>
      <PageHeader
        title="코스 상세"
        showBack
        onBack={() => navigate('/results')}
      />
      <main className="page-content">
        <h1>코스 상세 화면</h1>
        <p>다음 단계에서 구현합니다.</p>
      </main>
    </AppShell>
  )
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/plan" element={<PlanPage />} />
      <Route path="/results" element={<ResultsPage />} />
      <Route path="/courses/:courseId" element={<CourseDetailPlaceholder />} />
    </Routes>
  )
}

export default App
