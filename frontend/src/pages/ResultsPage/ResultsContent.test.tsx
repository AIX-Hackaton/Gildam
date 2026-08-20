import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import type { CourseSummary } from '../../types/course.ts'
import type { TravelConditions } from '../../types/travelConditions.ts'
import { ResultsContent } from './ResultsContent.tsx'

const conditions: TravelConditions = {
  departure: 'USQUARE',
  duration: 'FULL_DAY',
  mobility: 'LOW_BURDEN',
  preferences: ['HISTORY_CULTURE'],
}

function createCourse(
  id: string,
  mobilityOverrides: Partial<
    NonNullable<CourseSummary['scoreBreakdown']>['mobility']
  > = {},
): CourseSummary {
  return {
    id,
    title: `${id} 코스`,
    region: '나주',
    thumbnailUrl: '/images/course-naju.svg',
    tags: ['역사·문화'],
    fatigueLevel: 'LOW',
    durationMinutes: 300,
    walkingMinutes: 20,
    transferCount: 0,
    recommendationReasons: ['역사·문화 취향과 잘 맞아요.'],
    recommendationScore: 1,
    scoreBreakdown: {
      preferenceMatch: {
        score: 1,
        weight: 0.35,
        weightedScore: 0.35,
        explanation: '선택한 취향 1개 중 1개가 코스와 일치합니다.',
        matchedCount: 1,
        selectedCount: 1,
        matchedPreferences: ['HISTORY_CULTURE'],
      },
      mobility: {
        score: 1,
        weight: 0.3,
        weightedScore: 0.3,
        explanation: '이동 도보 20분 · 환승 0회',
        fatigueScore: 1,
        fatigueLevel: 'LOW',
        walkingMinutes: 20,
        transferCount: 0,
        roundTripTransitMinutes: 84,
        componentWeights: {
          walking: 0.45,
          transfer: 0.3,
          transit: 0.25,
        },
        ...mobilityOverrides,
      },
      returnMargin: {
        score: 1,
        weight: 0.15,
        weightedScore: 0.15,
        explanation: '여유 42분',
        slackMinutes: 42,
        status: 'FEASIBLE',
      },
      localResource: {
        score: 1,
        weight: 0.12,
        weightedScore: 0.12,
        explanation: '지역 음식과 로컬 포인트 포함',
      },
      recordFit: {
        score: 1,
        weight: 0.08,
        weightedScore: 0.08,
        explanation: '기록 장면 포함',
      },
    },
    returnFeasibility: {
      status: 'FEASIBLE',
      confidence: 'NEEDS_DAY_OF_CHECK',
      returnTransport: {
        type: 'HEADWAY_SERVICE',
        requiresDayOfCheck: true,
      },
    },
  }
}

describe('ResultsContent', () => {
  it('추천 코스를 점수순 최대 3위까지 표시한다', () => {
    render(
      <ResultsContent
        conditions={conditions}
        courses={[
          createCourse('첫 번째'),
          createCourse('두 번째', {
            walkingMinutes: 28,
            transferCount: 2,
            roundTripTransitMinutes: 84,
          }),
          createCourse('세 번째', {
            walkingMinutes: 52,
            transferCount: 0,
            roundTripTransitMinutes: 140,
          }),
          createCourse('네 번째'),
        ]}
        onOpenCourse={vi.fn()}
      />,
    )

    expect(screen.getByText('추천 1위')).toBeInTheDocument()
    expect(screen.getByText('추천 2위')).toBeInTheDocument()
    expect(screen.getByText('추천 3위')).toBeInTheDocument()
    expect(screen.queryByText('네 번째 코스')).not.toBeInTheDocument()
    expect(
      screen.getAllByText('출발 전 버스 도착정보 확인 필요'),
    ).toHaveLength(3)
    expect(screen.getByText('추천 기준 보기')).toBeInTheDocument()
    expect(screen.getByText('취향 일치도')).toBeInTheDocument()
    expect(screen.getByText('35%')).toBeInTheDocument()
    expect(screen.queryByText('기록 적합성')).not.toBeInTheDocument()
    expect(screen.getByText('이동 부담 세부 기준')).toBeInTheDocument()
    expect(
      screen.getByText('도보 45% · 환승 30% · 왕복 이동 25%'),
    ).toBeInTheDocument()
    expect(screen.getByText('이번 순위가 갈린 이유')).toBeInTheDocument()
    expect(
      screen.getByText(
        '두 번째 코스는 도보 28분·왕복 이동 84분으로 세 번째 코스보다 이동 부담이 낮아 2위가 됐어요.',
      ),
    ).toBeInTheDocument()
    expect(
      screen.getAllByText(
        '• 환승 없이 이동하고, 관광지 사이는 총 20분 걸어요.',
      ),
    ).toHaveLength(1)
    expect(
      screen.getByText(
        '• 환승 2회, 관광지 사이는 총 28분 걸어요.',
      ),
    ).toBeInTheDocument()
    expect(
      screen.getByText(
        '• 환승 없이 이동하고, 관광지 사이는 총 52분 걸어요.',
      ),
    ).toBeInTheDocument()
    expect(
      screen.getAllByText(
        '• 일정을 마친 뒤에도 귀가 시간까지 42분 여유가 있어요.',
      ),
    ).toHaveLength(1)
  })
})
