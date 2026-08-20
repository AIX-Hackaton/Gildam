import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import App from '../../app/App.tsx'
import { TravelConditionsProvider } from '../../contexts/TravelConditionsProvider.tsx'

function renderPlanPage() {
  render(
    <MemoryRouter initialEntries={['/plan']}>
      <TravelConditionsProvider>
        <App />
      </TravelConditionsProvider>
    </MemoryRouter>,
  )
}

function createInterpretationResponse() {
  return new Response(
    JSON.stringify({
      preferences: ['HISTORY_CULTURE', 'FOOD_MARKET'],
      mobility: 'LOW_BURDEN',
    }),
    { status: 200, headers: { 'Content-Type': 'application/json' } },
  )
}

describe('PlanPage AI preference interpretation', () => {
  const fetchMock = vi.fn<typeof fetch>()

  beforeEach(() => {
    fetchMock.mockReset()
    vi.stubGlobal('fetch', fetchMock)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('replaces the manual preferences and mobility with a successful interpretation', async () => {
    const user = userEvent.setup()
    fetchMock.mockResolvedValueOnce(createInterpretationResponse())
    renderPlanPage()

    await user.click(screen.getByRole('button', { name: '자연·산책' }))
    await user.click(screen.getByRole('button', { name: '환승 최소' }))
    await user.type(
      screen.getByLabelText('여행 취향을 문장으로 입력'),
      '  많이 걷는 건 싫고 조용한 옛날 거리와 시장을 둘러보고 싶어요.  ',
    )
    await user.click(screen.getByRole('button', { name: '조건에 반영하기' }))

    expect(
      await screen.findByText('입력한 내용을 조건에 반영했어요'),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { name: '여행 조건을 선택해주세요' }),
    ).toBeInTheDocument()
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/ai/interpret-preferences',
      expect.objectContaining({
        body: JSON.stringify({
          text: '많이 걷는 건 싫고 조용한 옛날 거리와 시장을 둘러보고 싶어요.',
        }),
      }),
    )
    expect(screen.getByRole('button', { name: '자연·산책' })).toHaveAttribute(
      'aria-pressed',
      'false',
    )
    expect(screen.getByRole('button', { name: '역사·문화' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    expect(screen.getByRole('button', { name: '음식·시장' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    expect(screen.getByRole('button', { name: '환승 최소' })).toHaveAttribute(
      'aria-pressed',
      'false',
    )
    expect(screen.getByRole('button', { name: '이동 부담 낮게' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )

    await user.click(screen.getByRole('button', { name: '감성기록' }))
    expect(screen.getByRole('button', { name: '감성기록' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
  })

  it('preserves the current manual selections when the response is invalid', async () => {
    const user = userEvent.setup()
    fetchMock.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          preferences: ['UNKNOWN'],
          mobility: 'LOW_BURDEN',
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      ),
    )
    renderPlanPage()

    await user.click(screen.getByRole('button', { name: '자연·산책' }))
    await user.click(screen.getByRole('button', { name: '환승 최소' }))
    await user.type(
      screen.getByLabelText('여행 취향을 문장으로 입력'),
      '조용한 곳을 걷고 싶어요.',
    )
    await user.click(screen.getByRole('button', { name: '조건에 반영하기' }))

    expect(
      await screen.findByText(
        '문장을 해석하지 못했어요. 아래에서 직접 선택해주세요.',
      ),
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '자연·산책' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    expect(screen.getByRole('button', { name: '환승 최소' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
  })

  it('blocks empty input and duplicate requests while interpretation is pending', async () => {
    const user = userEvent.setup()
    let resolveRequest: ((response: Response) => void) | undefined
    fetchMock.mockReturnValueOnce(
      new Promise<Response>((resolve) => {
        resolveRequest = resolve
      }),
    )
    renderPlanPage()

    const textarea = screen.getByLabelText('여행 취향을 문장으로 입력')
    const applyButton = screen.getByRole('button', {
      name: '조건에 반영하기',
    })

    expect(applyButton).toBeDisabled()
    await user.type(textarea, '   ')
    expect(applyButton).toBeDisabled()

    await user.type(textarea, '시장에 가고 싶어요.')
    await user.click(applyButton)

    const loadingButton = screen.getByRole('button', { name: '처리 중' })
    expect(loadingButton).toBeDisabled()
    expect(loadingButton).toHaveAttribute('aria-busy', 'true')
    await user.click(loadingButton)
    expect(fetchMock).toHaveBeenCalledTimes(1)

    resolveRequest?.(createInterpretationResponse())
    expect(
      await screen.findByText('입력한 내용을 조건에 반영했어요'),
    ).toBeInTheDocument()
  })
})
