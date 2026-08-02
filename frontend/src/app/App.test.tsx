import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it } from 'vitest'

import App from './App.tsx'
import { TravelConditionsProvider } from '../contexts/TravelConditionsProvider.tsx'

describe('App', () => {
  beforeEach(() => {
    sessionStorage.clear()
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
        name: '차 없이도 충분한 전남 당일치기 여행',
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
    await user.click(submitButton)

    expect(
      await screen.findByRole('heading', {
        name: '내 조건에 맞는 코스를 찾았어요',
      }),
    ).toBeInTheDocument()
  })
})
