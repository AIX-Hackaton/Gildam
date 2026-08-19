import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import type { ReturnFeasibility } from '../../../types/course.ts'
import { ReturnFeasibilityCard } from './ReturnFeasibilityCard.tsx'

const feasibility: ReturnFeasibility = {
  status: 'FEASIBLE',
  confidence: 'NEEDS_DAY_OF_CHECK',
  departureTime: '08:45',
  plannedReturnTime: '13:49',
  latestReturnTime: '14:34',
  plannedTotalMinutes: 289,
  worstCaseTotalMinutes: 299,
  allowedMinutes: 360,
  slackMinutes: 61,
  lastActivityEndTime: '12:42',
  bookingRequired: true,
  returnTransport: {
    type: 'SCHEDULED_SERVICE',
    segmentId: 'NJ_LOW_01-S2',
    serviceDay: 'SATURDAY',
    plannedDeparture: '13:05',
    alternativeDepartures: ['13:35', '13:50'],
    departureWindow: null,
    headwayMinutes: null,
    ticketingModel: 'ONSITE_TICKET',
    stationArrivalBufferMinutes: 15,
    verificationStatus: 'PARTIALLY_VERIFIED',
    requiresDayOfCheck: true,
    selectedDeparture: '13:05',
    selectedDepartureSlackMinutes: 8,
    note: '나주 도착 직후 귀가표를 확보합니다.',
  },
  messages: ['귀가 교통편은 2차 확인이 필요합니다.'],
}

describe('ReturnFeasibilityCard', () => {
  it('막차 미확인 대신 계획·대체 회차와 근거 구간을 보여준다', () => {
    render(<ReturnFeasibilityCard feasibility={feasibility} />)

    expect(screen.getByText('계획 13:05 · 대체 13:35·13:50')).toBeInTheDocument()
    expect(screen.getByText(/근거 구간 NJ_LOW_01-S2/)).toBeInTheDocument()
    expect(screen.queryByText('확인된 마지막 귀가편')).not.toBeInTheDocument()
  })
})
