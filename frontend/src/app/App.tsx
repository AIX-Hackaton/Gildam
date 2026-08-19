import { Route, Routes } from 'react-router-dom'

import { CourseDetailPage } from '../pages/CourseDetailPage/CourseDetailPage.tsx'
import { HomePage } from '../pages/HomePage/HomePage.tsx'
import { NotFoundPage } from '../pages/NotFoundPage/NotFoundPage.tsx'
import { PlanPage } from '../pages/PlanPage/PlanPage.tsx'
import { ResultsPage } from '../pages/ResultsPage/ResultsPage.tsx'

function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/plan" element={<PlanPage />} />
      <Route path="/results" element={<ResultsPage />} />
      <Route path="/courses/:courseId" element={<CourseDetailPage />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}

export default App
