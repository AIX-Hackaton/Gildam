import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import App from './App.tsx'
import { TravelConditionsProvider } from '../contexts/TravelConditionsProvider.tsx'

describe('App', () => {
  const fetchMock = vi.fn<typeof fetch>()

  beforeEach(() => {
    sessionStorage.clear()
    fetchMock.mockReset()
    vi.stubGlobal('fetch', fetchMock)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('renders the home message', () => {
    render(
      <MemoryRouter>
        <TravelConditionsProvider>
          <App />
        </TravelConditionsProvider>
      </MemoryRouter>,
    )

    expect(
      screen.getByRole('heading', {
        name: '차 없이도 충분한 전남의 하루',
      }),
    ).toBeInTheDocument()
  })

  it('redirects incomplete recommendations to the plan page', () => {
    render(
      <MemoryRouter initialEntries={['/results']}>
        <TravelConditionsProvider>
          <App />
        </TravelConditionsProvider>
      </MemoryRouter>,
    )

    expect(
      screen.getByRole('heading', { name: '여행 조건을 선택해주세요' }),
    ).toBeInTheDocument()
  })

  it('moves from condition selection to recommendation results', async () => {
    const user = userEvent.setup()

    render(
      <MemoryRouter initialEntries={['/plan']}>
        <TravelConditionsProvider>
          <App />
        </TravelConditionsProvider>
      </MemoryRouter>,
    )

    const submitButton = screen.getByRole('button', { name: '코스 추천받기' })
    expect(submitButton).toBeDisabled()

    await user.click(screen.getByRole('button', { name: '광주송정역' }))
    await user.click(screen.getByRole('button', { name: '하루 종일' }))
    await user.click(screen.getByRole('button', { name: '자연·산책' }))

    expect(submitButton).toBeEnabled()
    fetchMock.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          courses: [
            {
              id: 'damyang-slow-walk',
              title: '담양 느린 산책 코스',
              region: '담양',
              thumbnailUrl: '/images/course-damyang.svg',
              tags: ['자연·산책', '감성기록', '음식'],
              fatigueLevel: 'MEDIUM',
              durationMinutes: 360,
              walkingMinutes: 24,
              transferCount: 1,
              recommendationReasons: [
                '자연·산책 취향과 주요 장소가 잘 맞아요.',
              ],
              returnFeasibility: { status: 'FEASIBLE' },
            },
          ],
          exclusions: [],
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      ),
    )
    await user.click(submitButton)

    expect(
      await screen.findByRole('heading', {
        name: '내 조건에 맞는 코스를 찾았어요',
      }),
    ).toBeInTheDocument()
    expect(
      screen.getByText('• 자연·산책 취향과 주요 장소가 잘 맞아요.'),
    ).toBeInTheDocument()
    expect(screen.getByText('귀가 가능')).toBeInTheDocument()
  })

  it('asks for a preference when submitting without one', async () => {
    const user = userEvent.setup()

    render(
      <MemoryRouter initialEntries={['/plan']}>
        <TravelConditionsProvider>
          <App />
        </TravelConditionsProvider>
      </MemoryRouter>,
    )

    const submitButton = screen.getByRole('button', { name: '코스 추천받기' })

    await user.click(screen.getByRole('button', { name: '유스퀘어' }))
    await user.click(screen.getByRole('button', { name: '6시간' }))

    expect(submitButton).toBeEnabled()
    await user.click(submitButton)

    expect(screen.getByRole('alert')).toHaveTextContent('취향을 선택해주세요')
    expect(
      screen.getByRole('heading', { name: '여행 조건을 선택해주세요' }),
    ).toBeInTheDocument()
  })
})
