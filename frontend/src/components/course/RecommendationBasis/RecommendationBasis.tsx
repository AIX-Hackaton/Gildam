import { useState } from 'react'

import type { CourseSummary } from '../../../types/course.ts'
import {
  fatigueLabels,
  formatPercent,
} from '../../../utils/coursePresentation.ts'
import styles from './RecommendationBasis.module.css'

interface RecommendationBasisProps {
  course: CourseSummary
  defaultOpen?: boolean
}

const factorLabels: Record<string, string> = {
  preferenceMatch: '취향 일치',
  mobility: '이동 부담',
  returnMargin: '귀가 여유',
  localResource: '지역 콘텐츠',
  recordFit: '기록 적합도',
}

/**
 * 추천 순위가 "왜" 이렇게 정해졌는지 화면에서 설명합니다.
 * 요소별 점수·가중치·기여도와 피로도 계산식을 그대로 노출합니다.
 */
export function RecommendationBasis({
  course,
  defaultOpen = false,
}: RecommendationBasisProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen)
  const breakdown = course.scoreBreakdown

  if (!breakdown) return null

  const entries = Object.entries(breakdown) as Array<
    [keyof typeof breakdown, (typeof breakdown)[keyof typeof breakdown]]
  >

  return (
    <section className={styles.basis}>
      <button
        className={styles.toggle}
        type="button"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((current) => !current)}
      >
        <span>추천 근거 보기</span>
        <span className={styles.total}>
          종합 {formatPercent(course.recommendationScore ?? 0)}
        </span>
      </button>

      {isOpen ? (
        <div className={styles.panel}>
          <ul className={styles.factorList}>
            {entries.map(([key, factor]) => (
              <li key={key} className={styles.factor}>
                <div className={styles.factorHead}>
                  <span className={styles.factorLabel}>
                    {factorLabels[key] ?? key}
                  </span>
                  <span className={styles.factorScore}>
                    {formatPercent(factor.score)} × {factor.weight} ={' '}
                    {factor.weightedScore.toFixed(3)}
                  </span>
                </div>
                <div
                  className={styles.bar}
                  role="presentation"
                  data-value={Math.round(factor.score * 100)}
                >
                  <span style={{ width: `${Math.round(factor.score * 100)}%` }} />
                </div>
                <p className={styles.factorExplanation}>{factor.explanation}</p>
              </li>
            ))}
          </ul>

          {course.fatigueExplanation ? (
            <div className={styles.fatigue}>
              <h4>
                피로도 {fatigueLabels[course.fatigueExplanation.level]} (
                {course.fatigueExplanation.score})
              </h4>
              <ul>
                {course.fatigueExplanation.factors.map((factor) => (
                  <li key={factor.key}>
                    <strong>{factor.label}</strong> {factor.value}
                    {factor.unit} → {fatigueLabels[factor.level]} × {factor.weight}{' '}
                    = {factor.contribution}
                    <span className={styles.threshold}>{factor.threshold}</span>
                  </li>
                ))}
              </ul>
              <p className={styles.formula}>{course.fatigueExplanation.formula}</p>
              {course.fatigueExplanation.sourceLevel &&
              course.fatigueExplanation.sourceLevel !==
                course.fatigueExplanation.calculatedLevel ? (
                <p className={styles.resolution}>
                  {course.fatigueExplanation.resolution}
                </p>
              ) : null}
            </div>
          ) : null}
        </div>
      ) : null}
    </section>
  )
}
