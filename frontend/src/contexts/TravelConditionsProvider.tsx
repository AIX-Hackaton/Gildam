import { useEffect, useMemo, useState, type ReactNode } from 'react'

import type {
  DepartureId,
  DurationId,
  PreferenceId,
  TravelConditions,
} from '../types/travelConditions.ts'
import {
  TravelConditionsContext,
  type TravelConditionsContextValue,
} from './travelConditionsContext.ts'

const STORAGE_KEY = 'gildam:travel-conditions'
const departureIds: DepartureId[] = ['GWANGJU_SONGJEONG', 'USQUARE']
const durationIds: DurationId[] = ['SIX_HOURS', 'FULL_DAY']
const preferenceIds: PreferenceId[] = [
  'NATURE_WALK',
  'HISTORY_CULTURE',
  'FOOD_MARKET',
  'MEMORY',
]

function createDefaultConditions(): TravelConditions {
  return { departure: null, duration: null, preferences: [] }
}

function isTravelConditions(value: unknown): value is TravelConditions {
  if (!value || typeof value !== 'object') return false

  const conditions = value as Partial<TravelConditions>

  return (
    (conditions.departure === null ||
      departureIds.includes(conditions.departure as DepartureId)) &&
    (conditions.duration === null ||
      durationIds.includes(conditions.duration as DurationId)) &&
    Array.isArray(conditions.preferences) &&
    conditions.preferences.every((preference) =>
      preferenceIds.includes(preference),
    )
  )
}

function readStoredConditions(): TravelConditions {
  try {
    const stored = sessionStorage.getItem(STORAGE_KEY)
    if (!stored) return createDefaultConditions()

    const parsed: unknown = JSON.parse(stored)
    return isTravelConditions(parsed) ? parsed : createDefaultConditions()
  } catch {
    return createDefaultConditions()
  }
}

interface TravelConditionsProviderProps {
  children: ReactNode
}

export function TravelConditionsProvider({
  children,
}: TravelConditionsProviderProps) {
  const [conditions, setConditions] = useState(readStoredConditions)

  useEffect(() => {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(conditions))
    } catch {
      // The current session can continue even when browser storage is unavailable.
    }
  }, [conditions])

  const value = useMemo<TravelConditionsContextValue>(
    () => ({
      conditions,
      setDeparture: (departure) =>
        setConditions((current) => ({ ...current, departure })),
      setDuration: (duration) =>
        setConditions((current) => ({ ...current, duration })),
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
