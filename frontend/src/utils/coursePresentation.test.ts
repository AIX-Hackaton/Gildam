import { describe, expect, it } from 'vitest'

import type { CourseSummary } from '../types/course.ts'
import {
  formatTransportGuidance,
  getTopRecommendationReasons,
  getReturnActionLabel,
  getReturnFeasibilityLabel,
} from './coursePresentation.ts'

describe('getReturnFeasibilityLabel', () => {
  it.each([
    ['FEASIBLE', '귀가 가능'],
    ['TIGHT', '귀가 빠듯'],
    ['NOT_FEASIBLE', null],
  ] as const)('%s 상태의 뱃지 문구를 반환한다', (status, label) => {
    expect(getReturnFeasibilityLabel(status)).toBe(label)
  })
})

describe('getReturnActionLabel', () => {
  it('배차형은 당일 BIS 확인을 안내한다', () => {
    expect(
      getReturnActionLabel({
        status: 'FEASIBLE',
        confidence: 'NEEDS_DAY_OF_CHECK',
        returnTransport: {
          type: 'HEADWAY_SERVICE',
          requiresDayOfCheck: true,
        },
      }),
    ).toBe('출발 전 버스 도착정보 확인 필요')
  })

  it('현장 발권형은 승차권 확보를 안내한다', () => {
    expect(
      getReturnActionLabel({
        status: 'FEASIBLE',
        confidence: 'NEEDS_DAY_OF_CHECK',
        returnTransport: {
          type: 'SCHEDULED_SERVICE',
          ticketingModel: 'ONSITE_TICKET',
        },
      }),
    ).toBe('도착 직후 귀가편 승차권 확보 필요')
  })

  it('예약형은 사전 예약을 안내한다', () => {
    expect(
      getReturnActionLabel({
        status: 'FEASIBLE',
        confidence: 'NEEDS_DAY_OF_CHECK',
        returnTransport: {
          type: 'RESERVATION_REQUIRED',
          ticketingModel: 'ADVANCE_RESERVATION',
        },
      }),
    ).toBe('왕복 교통편 사전 예약 필요')
  })

  it('확인된 교통편에는 추가 행동을 표시하지 않는다', () => {
    expect(
      getReturnActionLabel({
        status: 'FEASIBLE',
        confidence: 'CONFIRMED',
        returnTransport: { type: 'HEADWAY_SERVICE' },
      }),
    ).toBeNull()
  })
})

describe('formatTransportGuidance', () => {
  it('BIS 약어를 사용자용 명칭으로 풀어 쓴다', () => {
    expect(formatTransportGuidance('출발 전 BIS에서 도착정보 확인')).toBe(
      '출발 전 버스정보시스템에서 도착정보 확인',
    )
  })
})

describe('getTopRecommendationReasons', () => {
  it('가중 점수가 높은 항목부터 사용자용 추천 이유를 만든다', () => {
    const course = {
      title: '근대골목 반걸음',
      recommendationReasons: ['기존 추천 이유'],
      scoreBreakdown: {
        preferenceMatch: {
          score: 1,
          weight: 0.35,
          weightedScore: 0.35,
          explanation: '내부 설명',
          matchedCount: 2,
          selectedCount: 2,
          matchedPreferences: ['HISTORY_CULTURE', 'FOOD_MARKET'],
        },
        mobility: {
          score: 1,
          weight: 0.3,
          weightedScore: 0.3,
          explanation: '내부 설명',
          fatigueScore: 1,
          fatigueLevel: 'LOW',
          walkingMinutes: 18,
          transferCount: 0,
        },
        returnMargin: {
          score: 1,
          weight: 0.15,
          weightedScore: 0.15,
          explanation: '내부 설명',
          slackMinutes: 42,
          status: 'FEASIBLE',
        },
        localResource: {
          score: 1,
          weight: 0.12,
          weightedScore: 0.12,
          explanation: '내부 설명',
        },
        recordFit: {
          score: 1,
          weight: 0.08,
          weightedScore: 0.08,
          explanation: '내부 설명',
        },
      },
    } as CourseSummary

    expect(getTopRecommendationReasons(course, 3)).toEqual([
      '근대골목 반걸음 코스는 역사·문화, 음식·시장 취향과 잘 맞아요.',
      '환승 없이 이동하고, 관광지 사이는 총 18분 걸어요.',
      '일정을 마친 뒤에도 귀가 시간까지 42분 여유가 있어요.',
    ])
  })

  it('점수 근거가 없으면 기존 추천 이유를 사용한다', () => {
    const course = {
      recommendationReasons: ['첫 번째 이유', '두 번째 이유', '세 번째 이유'],
    } as CourseSummary

    expect(getTopRecommendationReasons(course, 2)).toEqual([
      '첫 번째 이유',
      '두 번째 이유',
    ])
  })
})
