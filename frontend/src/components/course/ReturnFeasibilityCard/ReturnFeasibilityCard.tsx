import type { ReturnFeasibility } from '../../../types/course.ts'
import {
  confidenceLabels,
  feasibilityLabels,
  formatDuration,
} from '../../../utils/coursePresentation.ts'
import styles from './ReturnFeasibilityCard.module.css'

interface ReturnFeasibilityCardProps {
  feasibility: ReturnFeasibility
  compact?: boolean
}

/** "차 없이 당일치기"의 핵심인 귀가 가능성을 수치로 보여줍니다. */
export function ReturnFeasibilityCard({
  feasibility,
  compact = false,
}: ReturnFeasibilityCardProps) {
  const tone =
    feasibility.status === 'FEASIBLE'
      ? 'ok'
      : feasibility.status === 'TIGHT'
        ? 'warn'
        : 'danger'

  if (compact) {
    return (
      <p className={`${styles.badge} ${styles[tone]}`}>
        {feasibilityLabels[feasibility.status]} · {feasibility.departureTime} 출발 →{' '}
        {feasibility.plannedReturnTime} 도착
      </p>
    )
  }

  return (
    <section className={`${styles.card} ${styles[tone]}`}>
      <header className={styles.header}>
        <h2>귀가 가능성 검증</h2>
        <span className={styles.status}>
          {feasibilityLabels[feasibility.status]}
        </span>
      </header>

      <dl className={styles.grid}>
        <div>
          <dt>출발</dt>
          <dd>{feasibility.departureTime}</dd>
        </div>
        <div>
          <dt>계획 귀가</dt>
          <dd>{feasibility.plannedReturnTime}</dd>
        </div>
        <div>
          <dt>지연 시 귀가</dt>
          <dd>{feasibility.latestReturnTime}</dd>
        </div>
        <div>
          <dt>최악값 소요</dt>
          <dd>{formatDuration(feasibility.worstCaseTotalMinutes)}</dd>
        </div>
        <div>
          <dt>가능 시간 여유</dt>
          <dd>
            {feasibility.slackMinutes >= 0 ? '+' : ''}
            {feasibility.slackMinutes}분
          </dd>
        </div>
        <div>
          <dt>마지막 귀가편</dt>
          <dd>
            {feasibility.lastReturnDeparture ?? '미확인'}
            {feasibility.lastReturnSlackMinutes !== null &&
            feasibility.lastReturnSlackMinutes !== undefined
              ? ` (여유 ${feasibility.lastReturnSlackMinutes}분)`
              : ''}
          </dd>
        </div>
      </dl>

      <p className={styles.confidence}>
        {confidenceLabels[feasibility.confidence]}
      </p>

      {feasibility.messages.length > 0 ? (
        <ul className={styles.messages}>
          {feasibility.messages.map((message) => (
            <li key={message}>{message}</li>
          ))}
        </ul>
      ) : null}
    </section>
  )
}
