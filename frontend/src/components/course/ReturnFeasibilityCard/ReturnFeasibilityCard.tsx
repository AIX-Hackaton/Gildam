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

function returnTransportSummary(feasibility: ReturnFeasibility) {
  const transport = feasibility.returnTransport

  if (transport.type === 'HEADWAY_SERVICE') {
    const start = transport.plannedBoardingAfter ?? transport.departureWindow?.start
    const headway = transport.headwayMinutes
    return `${start ? `${start} 이후 · ` : ''}${headway ? `약 ${headway}분 간격` : '배차형'}`
  }

  if (transport.type === 'SCHEDULED_SERVICE') {
    const planned = transport.selectedDeparture ?? transport.plannedDeparture
    const alternatives = transport.alternativeDepartures
    return [
      planned ? `계획 ${planned}` : '계획 회차 당일 확인',
      alternatives.length > 0 ? `대체 ${alternatives.join('·')}` : null,
    ]
      .filter(Boolean)
      .join(' · ')
  }

  if (transport.type === 'RESERVATION_REQUIRED') {
    const buffer = transport.stationArrivalBufferMinutes
    return `왕복 선예매${buffer ? ` · ${buffer}분 전 승차지 복귀` : ''}`
  }

  return '이용일 재확인'
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
    const needsSecondCheck = feasibility.confidence !== 'CONFIRMED'

    return (
      <p className={`${styles.badge} ${styles[tone]}`}>
        {feasibilityLabels[feasibility.status]} · {feasibility.departureTime} 출발 →{' '}
        {feasibility.plannedReturnTime} 도착
        {needsSecondCheck ? ' · 2차 확인 필요' : ''}
      </p>
    )
  }

  return (
    <section className={`${styles.card} ${styles[tone]}`}>
      <header className={styles.header}>
        <h2>귀가 가능성 안내</h2>
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
          <dt>귀가 교통</dt>
          <dd>{returnTransportSummary(feasibility)}</dd>
        </div>
      </dl>

      {feasibility.returnTransport.note ? (
        <p className={styles.transportNote}>
          근거 구간 {feasibility.returnTransport.segmentId ?? '이용일 확인'} ·{' '}
          {feasibility.returnTransport.note}
        </p>
      ) : null}

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
