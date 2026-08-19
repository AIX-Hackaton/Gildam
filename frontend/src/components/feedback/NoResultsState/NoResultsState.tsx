import { Button } from '../../common/Button/Button.tsx'
import layout from '../FeedbackStateLayout.module.css'
import styles from './NoResultsState.module.css'

interface NoResultsStateProps {
  suggestions?: string[]
  onReset: () => void
  onHome: () => void
}

const DEFAULT_SUGGESTIONS = [
  '가능 시간을 하루 종일로 변경하기',
  '다른 출발지 선택하기',
  '취향 조건을 줄이기',
]

export function NoResultsState({
  suggestions = DEFAULT_SUGGESTIONS,
  onReset,
  onHome,
}: NoResultsStateProps) {
  const suggestionMessages = suggestions.length
    ? suggestions
    : DEFAULT_SUGGESTIONS

  return (
    <section className={layout.state} aria-labelledby="no-results-title">
      <p className={styles.eyebrow}>추천 결과 없음</p>
      <h1 className={layout.title} id="no-results-title">
        조건에 맞는 코스를 찾지 못했어요
      </h1>
      <p className={layout.description}>
        아래 조건을 조정해 다시 찾아보세요
      </p>
      <ul className={styles.suggestions}>
        {suggestionMessages.map((suggestion) => (
          <li key={suggestion}>{suggestion}</li>
        ))}
      </ul>
      <div className={layout.actions}>
        <Button
          className={layout.primaryAction}
          type="button"
          size="large"
          fullWidth
          onClick={onReset}
        >
          조건 다시 선택하기
        </Button>
        <Button
          className={layout.secondaryAction}
          type="button"
          variant="secondary"
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
