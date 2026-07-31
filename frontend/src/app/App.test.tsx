import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'

import App from './App.tsx'
import { TravelConditionsProvider } from '../contexts/TravelConditionsProvider.tsx'

describe('App', () => {
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
})
