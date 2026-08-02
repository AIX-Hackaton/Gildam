import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'

import { useTravelConditions } from '../hooks/useTravelConditions.ts'
import { TravelConditionsProvider } from './TravelConditionsProvider.tsx'

const STORAGE_KEY = 'gildam:travel-conditions'

function ConditionsProbe() {
  const { conditions, isComplete } = useTravelConditions()

  return (
    <output aria-label="여행 조건 상태">
      {JSON.stringify(conditions)}|{isComplete ? 'complete' : 'incomplete'}
    </output>
  )
}

function renderProvider() {
  render(
    <TravelConditionsProvider>
      <ConditionsProbe />
    </TravelConditionsProvider>,
  )
}

describe('TravelConditionsProvider', () => {
  beforeEach(() => {
    sessionStorage.clear()
  })

  it('restores valid conditions from session storage', () => {
    sessionStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        departure: 'USQUARE',
        duration: 'SIX_HOURS',
        preferences: ['FOOD_MARKET'],
      }),
    )

    renderProvider()

    expect(screen.getByLabelText('여행 조건 상태')).toHaveTextContent(
      '"departure":"USQUARE"',
    )
    expect(screen.getByLabelText('여행 조건 상태')).toHaveTextContent(
      'complete',
    )
  })

  it('uses default conditions when stored data is invalid', () => {
    sessionStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ departure: 'UNKNOWN', preferences: null }),
    )

    renderProvider()

    expect(screen.getByLabelText('여행 조건 상태')).toHaveTextContent(
      '{"departure":null,"duration":null,"preferences":[]}|incomplete',
    )
  })
})
