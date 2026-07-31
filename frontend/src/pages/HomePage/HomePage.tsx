import { useNavigate } from 'react-router-dom'

import heroJourney from '../../assets/hero-journey.svg'
import { AppShell } from '../../components/common/AppShell/AppShell.tsx'
import { Button } from '../../components/common/Button/Button.tsx'
import { IconButton } from '../../components/common/IconButton/IconButton.tsx'
import styles from './HomePage.module.css'

function BellIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" width="22" height="22">
      <path
        d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 8.5h18C21 16 18 16 18 9Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M9.75 20h4.5"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  )
}

export function HomePage() {
  const navigate = useNavigate()

  return (
    <AppShell>
      <header className={styles.header}>
        <div className={styles.logo} aria-label="길담">
          길<span className={styles.logoAccent}>담</span>
          <span className={styles.leaf} aria-hidden="true" />
        </div>
        <IconButton label="알림" icon={<BellIcon />} />
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
            rightIcon={
              <span className={styles.arrow} aria-hidden="true">
                →
              </span>
            }
            onClick={() => navigate('/plan')}
          >
            내 여행 조건 입력하기
          </Button>
        </div>
      </main>
    </AppShell>
  )
}
