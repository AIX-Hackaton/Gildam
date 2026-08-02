import { Button } from '../../common/Button/Button.tsx'
import layout from '../FeedbackStateLayout.module.css'
import styles from './NotFoundState.module.css'

interface NotFoundStateProps {
  title?: string
  description?: string
  onHome: () => void
  onBack?: () => void
}

export function NotFoundState({
  title = '페이지를 찾을 수 없어요.',
  description = '주소가 올바른지 확인하거나 홈에서 다시 시작해주세요.',
  onHome,
  onBack,
}: NotFoundStateProps) {
  return (
    <section className={layout.state} aria-labelledby="not-found-title">
      <p className={styles.code}>404</p>
      <h1 className={layout.title} id="not-found-title">
        {title}
      </h1>
      <p className={layout.description}>{description}</p>
      <div className={layout.actions}>
        {onBack ? (
          <Button type="button" size="large" fullWidth onClick={onBack}>
            추천 결과로 돌아가기
          </Button>
        ) : null}
        <Button
          type="button"
          variant={onBack ? 'secondary' : 'primary'}
          size="large"
          fullWidth
          onClick={onHome}
        >
          홈으로 돌아가기
        </Button>
      </div>
    </section>
  )
}
