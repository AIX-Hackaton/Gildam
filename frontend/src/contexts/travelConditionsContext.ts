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
  setMobility: (mobility: MobilityId) => void
  togglePreference: (preference: PreferenceId) => void
  isComplete: boolean
}

export const TravelConditionsContext =
  createContext<TravelConditionsContextValue | null>(null)
