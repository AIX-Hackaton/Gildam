import { useMemo, useState, type ReactNode } from 'react'

import type { TravelConditions } from '../types/travelConditions.ts'
import {
  TravelConditionsContext,
  type TravelConditionsContextValue,
} from './travelConditionsContext.ts'

function createDefaultConditions(): TravelConditions {
  return {
    departure: null,
    duration: null,
    preferences: [],
    mobility: null,
  }
}

interface TravelConditionsProviderProps {
  children: ReactNode
}

export function TravelConditionsProvider({
  children,
}: TravelConditionsProviderProps) {
  const [conditions, setConditions] = useState(createDefaultConditions)

  const value = useMemo<TravelConditionsContextValue>(
    () => ({
      conditions,
      setDeparture: (departure) =>
        setConditions((current) => ({ ...current, departure })),
      setDuration: (duration) =>
        setConditions((current) => ({ ...current, duration })),
      setMobility: (mobility) =>
        setConditions((current) => ({ ...current, mobility })),
      setPreferences: (preferences) =>
        setConditions((current) => ({ ...current, preferences })),
      togglePreference: (preference) =>
        setConditions((current) => ({
          ...current,
          preferences: current.preferences.includes(preference)
            ? current.preferences.filter((item) => item !== preference)
            : [...current.preferences, preference],
        })),
      isComplete:
        conditions.departure !== null &&
        conditions.duration !== null &&
        conditions.mobility !== null &&
        conditions.preferences.length > 0,
    }),
    [conditions],
  )

  return (
    <TravelConditionsContext.Provider value={value}>
      {children}
    </TravelConditionsContext.Provider>
  )
}
