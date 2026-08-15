import type {
  ExcludedCourse,
  RecommendationSuggestion,
} from '../../../types/course.ts'
import { Button } from '../../common/Button/Button.tsx'
import layout from '../FeedbackStateLayout.module.css'
import styles from './NoResultsState.module.css'

interface NoResultsStateProps {
  suggestions?: RecommendationSuggestion[]
  exclusions?: ExcludedCourse[]
  onReset: () => void
  onHome: () => void
}

const fallbackSuggestions = [
  '가능 시간을 하루 종일로 변경하기',
  '이동 부담 조건을 완화하기',
  '취향 조건을 넓게 선택하기',
]

/**
 * 조건에 맞는 코스가 없을 때 임의 코스를 만들어 내지 않고,
 * 서버가 실제로 계산한 "조건을 바꾸면 몇 개가 나오는지"를 그대로 보여줍니다.
 */
export function NoResultsState({
  suggestions = [],
  exclusions = [],
  onReset,
  onHome,
}: NoResultsStateProps) {
  const actionable = suggestions.filter(
    (suggestion) => suggestion.code !== 'NO_ALTERNATIVE',
  )
  const excludedSample = exclusions.slice(0, 3)

  return (
    <section className={layout.state} aria-labelledby="no-results-title">
      <p className={styles.eyebrow}>추천 결과 없음</p>
      <h1 className={layout.title} id="no-results-title">
        조건에 맞는 코스를 찾지 못했어요.
      </h1>
      <p className={layout.description}>
        시간 안에 다녀올 수 없는 코스는 추천하지 않습니다. 아래 조건을 바꾸면
        결과를 볼 수 있어요.
      </p>

      <ul className={styles.suggestions}>
        {actionable.length > 0
          ? actionable.map((suggestion) => (
              <li key={suggestion.code}>{suggestion.message}</li>
            ))
          : fallbackSuggestions.map((suggestion) => (
              <li key={suggestion}>{suggestion}</li>
            ))}
      </ul>

      {excludedSample.length > 0 ? (
        <details className={styles.excluded}>
          <summary>왜 제외됐는지 보기</summary>
          <ul>
            {excludedSample.map((course) => (
              <li key={course.id}>
                <strong>{course.title}</strong>
                <span>{course.reasons.map((r) => r.message).join(' ')}</span>
              </li>
            ))}
          </ul>
        </details>
      ) : null}

      <div className={layout.actions}>
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
