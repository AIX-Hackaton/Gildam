import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import App from './App.tsx'
import type { CourseSummary } from '../types/course.ts'
import { TravelConditionsProvider } from '../contexts/TravelConditionsProvider.tsx'

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

const najuLowSummary = {
  id: 'NJ_LOW_01',
  title: '나주 읍성·곰탕 저환승 코스',
  region: '나주',
  thumbnailUrl: '/images/course-naju.svg',
  tags: ['역사·문화', '음식·시장'],
  fatigueLevel: 'MEDIUM',
  durationMinutes: 289,
  walkingMinutes: 35,
  transferCount: 0,
  recommendationReasons: ['환승 없이 한 번에 이동할 수 있어요.'],
  verificationStatus: 'PARTIALLY_VERIFIED',
  returnFeasibility: {
    status: 'FEASIBLE',
    confidence: 'CONFIRMED',
    departureTime: '09:00',
    plannedReturnTime: '13:49',
    latestReturnTime: '13:59',
    plannedTotalMinutes: 289,
    worstCaseTotalMinutes: 299,
    allowedMinutes: 360,
    slackMinutes: 61,
    bookingRequired: false,
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
    },
    messages: ['최악의 경우에도 6시간 안에 돌아올 수 있어요.'],
  },
} satisfies CourseSummary

function renderApp(initialEntry: string) {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <TravelConditionsProvider>
        <App />
      </TravelConditionsProvider>
    </MemoryRouter>,
  )
}

async function selectConditions(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole('button', { name: '유스퀘어' }))
  await user.click(screen.getByRole('button', { name: '6시간' }))
  await user.click(screen.getByRole('button', { name: '역사·문화' }))
}

describe('App', () => {
  const fetchMock = vi.fn()

  beforeEach(() => {
    sessionStorage.clear()
    fetchMock.mockReset()
    vi.stubGlobal('fetch', fetchMock)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('홈 화면을 렌더링한다', () => {
    renderApp('/')

    expect(
      screen.getByRole('heading', {
        name: '차 없이도 충분한 전남 당일치기 여행',
      }),
    ).toBeInTheDocument()
  })

  it('조건이 없는 상태로 결과 화면에 들어오면 조건 입력으로 돌려보낸다', () => {
    renderApp('/results')

    expect(
      screen.getByRole('heading', { name: '여행 조건을 선택해주세요' }),
    ).toBeInTheDocument()
  })

  it('조건 선택에서 추천 결과까지 이어진다', async () => {
    const user = userEvent.setup()
    renderApp('/plan')

    const submitButton = screen.getByRole('button', { name: '코스 추천받기' })
    expect(submitButton).toBeDisabled()

    await selectConditions(user)
    expect(submitButton).toBeEnabled()

    fetchMock.mockResolvedValueOnce(
      jsonResponse({
        courses: [najuLowSummary],
        exclusions: [],
        suggestions: [],
        meta: {
          dataSnapshotDate: '2026-08-06',
          evaluatedCount: 6,
          blockedCount: 1,
          schemaInvalidCount: 0,
        },
      }),
    )
    await user.click(submitButton)

    expect(
      await screen.findByRole('heading', {
        name: '내 조건에 맞는 코스를 찾았어요',
      }),
    ).toBeInTheDocument()
    expect(screen.getByText('나주 읍성·곰탕 저환승 코스')).toBeInTheDocument()
  })

  it('결과가 없으면 서버가 계산한 대안을 그대로 보여준다', async () => {
    const user = userEvent.setup()
    renderApp('/plan')

    await selectConditions(user)

    fetchMock.mockResolvedValueOnce(
      jsonResponse({
        courses: [],
        exclusions: [
          {
            id: 'MP_NORMAL_02',
            title: '목포역 도보권 근대문화 확장 코스',
            reasons: [
              {
                code: 'TIME_LIMIT_EXCEEDED',
                message: '6시간 안에 돌아오기 어려워요.',
              },
            ],
          },
        ],
        suggestions: [
          {
            code: 'RELAX_DURATION',
            message: '하루 종일로 바꾸면 2개 코스를 볼 수 있어요.',
            availableCount: 2,
          },
        ],
      }),
    )
    await user.click(screen.getByRole('button', { name: '코스 추천받기' }))

    expect(
      await screen.findByText('하루 종일로 바꾸면 2개 코스를 볼 수 있어요.'),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: '조건 다시 선택하기' }),
    ).toBeInTheDocument()
  })

  it('서버 오류 시 재시도 흐름을 제공한다', async () => {
    const user = userEvent.setup()
    renderApp('/plan')

    await selectConditions(user)

    fetchMock.mockResolvedValueOnce(
      jsonResponse(
        { code: 'SERVER_ERROR', message: '일시적인 오류가 발생했습니다.' },
        500,
      ),
    )
    await user.click(screen.getByRole('button', { name: '코스 추천받기' }))

    expect(
      await screen.findByText('일시적인 오류가 발생했습니다.'),
    ).toBeInTheDocument()

    fetchMock.mockResolvedValueOnce(
      jsonResponse({ courses: [najuLowSummary], exclusions: [], suggestions: [] }),
    )
    await user.click(screen.getByRole('button', { name: '다시 시도' }))

    expect(
      await screen.findByText('나주 읍성·곰탕 저환승 코스'),
    ).toBeInTheDocument()
  })
})
