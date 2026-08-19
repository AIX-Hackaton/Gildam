import { useNavigate } from 'react-router-dom'

import { AppShell } from '../../components/common/AppShell/AppShell.tsx'
import { Button } from '../../components/common/Button/Button.tsx'
import styles from './HomePage.module.css'

const heroSlides = [
  {
    src: '/images/home-damyang.webp',
    alt: '담양 연꽃 연못과 산책로 풍경',
  },
  {
    src: '/images/home-naju.webp',
    alt: '나주 돌담과 한옥이 이어진 골목 풍경',
  },
  {
    src: '/images/home-mokpo.webp',
    alt: '목포 바다와 섬이 보이는 산책로 풍경',
  },
]

export function HomePage() {
  const navigate = useNavigate()

  return (
    <AppShell>
      <header className={styles.header}>
        <div className={styles.logo}>길담</div>
      </header>

      <main className={styles.main}>
        <section className={styles.intro}>
          <h1 className={styles.heading}>
            차 없이도 충분한{' '}
            <br />
            전남의 하루
          </h1>
          <p className={styles.description}>
            출발지와 시간, 취향을 선택하면
            <br />
            실제로 다녀올 수 있는 코스를 추천해드려요
          </p>
        </section>

        <div className={styles.carouselGroup}>
          <div
            className={styles.carousel}
            role="region"
            aria-label="전남 여행 풍경"
          >
            <div className={styles.carouselTrack}>
              {heroSlides.map((slide) => (
                <div className={styles.slide} key={slide.src}>
                  <img
                    className={styles.slideImage}
                    src={slide.src}
                    alt={slide.alt}
                  />
                </div>
              ))}
              <div className={styles.slide} aria-hidden="true">
                <img
                  className={styles.slideImage}
                  src={heroSlides[0].src}
                  alt=""
                />
              </div>
            </div>
          </div>
        </div>

        <div className={styles.cta}>
          <Button
            className={styles.ctaButton}
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
