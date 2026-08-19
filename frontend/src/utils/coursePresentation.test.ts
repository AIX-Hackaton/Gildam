import { describe, expect, it } from 'vitest'

import {
  formatTransportGuidance,
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
