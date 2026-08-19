import { useNavigate } from 'react-router-dom'

import { AppShell } from '../../components/common/AppShell/AppShell.tsx'
import { Button } from '../../components/common/Button/Button.tsx'
import styles from './HomePage.module.css'

const heroSlides = [
  {
    src: '/images/home/김찬영_무안식영정.jpg',
    alt: '무안 식영정 풍경',
    credit: '김찬영',
  },
  {
    src: '/images/home/오경택_메타세퀘이아길.jpg',
    alt: '담양 메타세쿼이아길 풍경',
    credit: '오경택',
  },
  {
    src: '/images/home/이재근_여수밤바다.jpg',
    alt: '여수 밤바다 풍경',
    credit: '이재근',
  },
  {
    src: '/images/home/황성훈_죽림재.jpg',
    alt: '담양 죽림재 풍경',
    credit: '황성훈',
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
                  <p className={styles.imageCredit}>
                    사진 제공 ({slide.credit}) - 한국관광공사
                  </p>
                </div>
              ))}
              <div className={styles.slide} aria-hidden="true">
                <img
                  className={styles.slideImage}
                  src={heroSlides[0].src}
                  alt=""
                />
                <p className={styles.imageCredit}>
                  사진 제공 ({heroSlides[0].credit}) - 한국관광공사
                </p>
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
