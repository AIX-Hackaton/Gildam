import { Button } from '../../common/Button/Button.tsx'
import styles from './NoResultsState.module.css'

interface NoResultsStateProps {
  onReset: () => void
  onHome: () => void
}

export function NoResultsState({ onReset, onHome }: NoResultsStateProps) {
  return (
    <section className={styles.state} aria-labelledby="no-results-title">
      <p className={styles.eyebrow}>추천 결과 없음</p>
      <h1 id="no-results-title">조건에 맞는 코스를 찾지 못했어요.</h1>
      <p className={styles.description}>
        가능한 시간을 늘리거나, 취향 조건을 줄여 다시 찾아보세요.
      </p>
      <ul className={styles.suggestions}>
        <li>가능 시간을 하루 종일로 변경하기</li>
        <li>다른 출발지 선택하기</li>
        <li>취향 조건을 줄이기</li>
      </ul>
      <div className={styles.actions}>
        <Button type="button" size="large" fullWidth onClick={onReset}>
          조건 다시 선택하기
        </Button>
        <Button
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
