import { useNavigate } from 'react-router-dom'

import { AppShell } from '../../components/common/AppShell/AppShell.tsx'
import { Button } from '../../components/common/Button/Button.tsx'
import styles from './HomeCollagePreviewPage.module.css'

const collagePhotos = [
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

export function HomeCollagePreviewPage() {
  const navigate = useNavigate()

  return (
    <AppShell>
      <header className={styles.header}>
        <div className={styles.logo}>길담</div>
      </header>

      <main className={styles.main}>
        <section className={styles.intro}>
          <h1 className={styles.heading}>
            차 없이도 충분한
            <br />
            전남의 하루
          </h1>
          <p className={styles.description}>
            출발지와 시간, 취향을 선택하면
            <br />
            실제로 다녀올 수 있는 코스를 추천해드려요
          </p>
        </section>

        <section className={styles.collage} aria-label="전남 여행 풍경">
          <figure className={`${styles.photo} ${styles.photoPrimary}`}>
            <img src={collagePhotos[0].src} alt={collagePhotos[0].alt} />
          </figure>
          <figure className={`${styles.photo} ${styles.photoSecondary}`}>
            <img src={collagePhotos[1].src} alt={collagePhotos[1].alt} />
          </figure>
          <figure className={`${styles.photo} ${styles.photoTertiary}`}>
            <img src={collagePhotos[2].src} alt={collagePhotos[2].alt} />
          </figure>
        </section>

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
