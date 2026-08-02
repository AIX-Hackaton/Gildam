import { createContext } from 'react'

import type {
  DepartureId,
  DurationId,
  PreferenceId,
  TravelConditions,
} from '../types/travelConditions.ts'

export interface TravelConditionsContextValue {
  conditions: TravelConditions
  setDeparture: (departure: DepartureId) => void
  setDuration: (duration: DurationId) => void
  togglePreference: (preference: PreferenceId) => void
  isComplete: boolean
}

export const TravelConditionsContext =
  createContext<TravelConditionsContextValue | null>(null)
