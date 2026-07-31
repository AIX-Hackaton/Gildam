import { AppShell } from '../components/common/AppShell/AppShell.tsx'
import { Button } from '../components/common/Button/Button.tsx'
import { PageHeader } from '../components/common/PageHeader/PageHeader.tsx'
import { StickyBottomCTA } from '../components/common/StickyBottomCTA/StickyBottomCTA.tsx'
import styles from './App.module.css'

function App() {
  return (
    <AppShell>
      <PageHeader />
      <main className={`page-content ${styles.intro}`}>
        <section>
          <p className={styles.eyebrow}>GILDAM FOUNDATION</p>
          <h1 className={styles.heading}>길담 디자인 기반</h1>
          <p className={styles.description}>
            모바일 화면을 위한 색상, 간격, 버튼과 레이아웃을 준비했어요.
          </p>
        </section>

        <section className={styles.panel}>
          <h2 className={styles.panelTitle}>공통 버튼</h2>
          <div className={styles.buttonGroup}>
            <Button size="large" fullWidth>
              주요 버튼
            </Button>
            <Button variant="secondary" size="large" fullWidth>
              보조 버튼
            </Button>
            <Button size="large" fullWidth disabled>
              비활성 버튼
            </Button>
          </div>
        </section>
      </main>

      <StickyBottomCTA>
        <Button size="large" fullWidth>
          다음 화면 준비
        </Button>
      </StickyBottomCTA>
    </AppShell>
  )
}

export default App
