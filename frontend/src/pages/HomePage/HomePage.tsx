import { useNavigate } from 'react-router-dom'

import heroJourney from '../../assets/hero-journey.svg'
import { AppShell } from '../../components/common/AppShell/AppShell.tsx'
import { Button } from '../../components/common/Button/Button.tsx'
import styles from './HomePage.module.css'

export function HomePage() {
  const navigate = useNavigate()

  return (
    <AppShell>
      <header className={styles.header}>
        <div className={styles.logo} aria-label="길담">
          길<span className={styles.logoAccent}>담</span>
          <span className={styles.leaf} aria-hidden="true" />
        </div>
      </header>

      <main className={styles.main}>
        <section>
          <p className={styles.kicker}>광주에서 떠나는 전남 당일치기</p>
          <h1 className={styles.heading}>
            차 없이도 충분한{' '}
            <br />
            전남 당일치기 여행
          </h1>
          <p className={styles.description}>
            출발지와 시간, 취향만 선택하면
            <br />
            완주 가능한 코스를 추천해드려요.
          </p>
        </section>

        <div className={styles.hero}>
          <img
            className={styles.heroImage}
            src={heroJourney}
            alt="호수와 산 사이를 달리는 기차 일러스트"
          />
        </div>

        <div className={styles.cta}>
          <Button
            size="large"
            fullWidth
            onClick={() => navigate('/plan')}
          >
            내 여행 조건 입력하기
          </Button>
        </div>
      </main>
    </AppShell>
  )
}
