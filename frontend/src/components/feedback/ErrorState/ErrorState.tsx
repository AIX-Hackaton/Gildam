import { Button } from '../../common/Button/Button.tsx'
import layout from '../FeedbackStateLayout.module.css'
import styles from './ErrorState.module.css'

interface ErrorStateProps {
  message?: string | null
  onRetry: () => void
  onBack: () => void
}

export function ErrorState({ message, onRetry, onBack }: ErrorStateProps) {
  return (
    <section className={layout.state} aria-labelledby="error-title">
      <p className={styles.eyebrow}>오류</p>
      <h1 className={layout.title} id="error-title">
        데이터를 불러오지 못했습니다.
      </h1>
      <p className={layout.description}>
        {message ?? '잠시 후 다시 시도해 주세요. 입력한 조건은 그대로 유지됩니다.'}
      </p>
      <div className={layout.actions}>
        <Button type="button" size="large" fullWidth onClick={onRetry}>
          다시 시도
        </Button>
        <Button
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
