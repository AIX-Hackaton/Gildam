import { Route, Routes, useNavigate } from 'react-router-dom'

import { AppShell } from '../components/common/AppShell/AppShell.tsx'
import { PageHeader } from '../components/common/PageHeader/PageHeader.tsx'
import { HomePage } from '../pages/HomePage/HomePage.tsx'
import { PlanPage } from '../pages/PlanPage/PlanPage.tsx'

function ResultsPlaceholder() {
  const navigate = useNavigate()

  return (
    <AppShell>
      <PageHeader
        title="추천 결과"
        showBack
        onBack={() => navigate('/plan')}
      />
      <main className="page-content">
        <h1>추천 결과 화면</h1>
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
      <Route path="/results" element={<ResultsPlaceholder />} />
    </Routes>
  )
}

export default App
