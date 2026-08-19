import { Button } from '../../common/Button/Button.tsx'
import layout from '../FeedbackStateLayout.module.css'
import styles from './ErrorState.module.css'

interface ErrorStateProps {
  onRetry: () => void
  onBack: () => void
}

export function ErrorState({ onRetry, onBack }: ErrorStateProps) {
  return (
    <section className={layout.state} role="alert" aria-labelledby="error-title">
      <p className={styles.eyebrow}>일시적인 오류</p>
      <h1 className={layout.title} id="error-title">
        코스를 불러오지 못했어요
      </h1>
      <p className={layout.description}>잠시 후 다시 시도해주세요</p>
      <div className={layout.actions}>
        <Button
          className={layout.primaryAction}
          type="button"
          size="large"
          fullWidth
          onClick={onRetry}
        >
          다시 시도
        </Button>
        <Button
          className={layout.secondaryAction}
          type="button"
          variant="secondary"
          size="large"
          fullWidth
          onClick={onBack}
        >
          조건 입력으로 돌아가기
        </Button>
      </div>
    </section>
  )
}
