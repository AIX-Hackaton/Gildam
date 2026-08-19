import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { useTravelConditions } from '../hooks/useTravelConditions.ts'
import { TravelConditionsProvider } from './TravelConditionsProvider.tsx'

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
  it('starts with default conditions even when session storage contains prior values', () => {
    sessionStorage.setItem(
      'gildam:travel-conditions',
      JSON.stringify({
        departure: 'USQUARE',
        duration: 'SIX_HOURS',
        preferences: ['FOOD_MARKET'],
      }),
    )

    renderProvider()

    expect(screen.getByLabelText('여행 조건 상태')).toHaveTextContent(
      '{"departure":null,"duration":null,"preferences":[],"mobility":"ANY"}|incomplete',
    )
  })
})
