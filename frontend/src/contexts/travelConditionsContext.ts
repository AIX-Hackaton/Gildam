import { createContext } from 'react'

import type {
  DepartureId,
  DurationId,
  MobilityId,
  PreferenceId,
  TravelConditions,
} from '../types/travelConditions.ts'

export interface TravelConditionsContextValue {
  conditions: TravelConditions
  setDeparture: (departure: DepartureId) => void
  setDuration: (duration: DurationId) => void
  togglePreference: (preference: PreferenceId) => void
  setMobility: (mobility: MobilityId) => void
  reset: () => void
  isComplete: boolean
  missingFields: string[]
}

export const TravelConditionsContext =
  createContext<TravelConditionsContextValue | null>(null)
