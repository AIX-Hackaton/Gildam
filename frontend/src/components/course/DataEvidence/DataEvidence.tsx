import type { Course } from '../../../types/course.ts'
import { verificationLabels } from '../../../utils/coursePresentation.ts'
import styles from './DataEvidence.module.css'

interface DataEvidenceProps {
  course: Course
}

/**
 * 데이터 근거·검증 상태를 화면에 그대로 표기합니다.
 * (멘토 코멘트: "시스템상 출처 표기", "유효 데이터를 검증하는 것이 좋음")
 */
export function DataEvidence({ course }: DataEvidenceProps) {
  const manualChecks = course.manualChecks ?? []
  const sources = course.sources ?? []

  if (manualChecks.length === 0 && sources.length === 0) return null

  return (
    <section className={styles.evidence}>
      <h2>데이터 근거와 이용 전 확인</h2>

      {course.verificationStatus !== 'VERIFIED' ? (
        <p className={styles.meta}>
          2차 확인 필요 · 데모에서는 추천되지만 실제 출발 전 아래 항목을 다시 확인해 주세요.
        </p>
      ) : null}

      <p className={styles.meta}>
        검증상태 {verificationLabels[course.verificationStatus ?? ''] ??
          course.verificationStatus}{' '}
        · 확인일 {course.verifiedDate} · 데이터 기준일 {course.dataSnapshotDate}
      </p>

      {manualChecks.length > 0 ? (
        <div className={styles.block}>
          <h3>이용일에 직접 확인할 항목</h3>
          <ul className={styles.checkList}>
            {manualChecks.map((check) => (
              <li key={check}>{check}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {course.cautions && course.cautions.length > 0 ? (
        <div className={styles.block}>
          <h3>이 코스의 한계</h3>
          <ul className={styles.checkList}>
            {course.cautions.map((caution) => (
              <li key={caution}>{caution}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {sources.length > 0 ? (
        <div className={styles.block}>
          <h3>출처</h3>
          <ul className={styles.sourceList}>
            {sources.map((source) => (
              <li key={source.url}>
                <a href={source.url} target="_blank" rel="noopener noreferrer">
                  {source.label}
                </a>
                <span>
                  {verificationLabels[source.verificationStatus] ??
                    source.verificationStatus}{' '}
                  · {source.checkedDate}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  )
}
