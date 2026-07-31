import { useContext } from 'react'

import { TravelConditionsContext } from '../contexts/travelConditionsContext.ts'

export function useTravelConditions() {
  const context = useContext(TravelConditionsContext)

  if (!context) {
    throw new Error(
      'useTravelConditions must be used within TravelConditionsProvider',
    )
  }

  return context
}
