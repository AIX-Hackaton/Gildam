import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'

import type {
  DepartureId,
  DurationId,
  PreferenceId,
  TravelConditions,
} from '../types/travelConditions.ts'

const STORAGE_KEY = 'gildam:travel-conditions'

const defaultConditions: TravelConditions = {
  departure: null,
  duration: null,
  preferences: [],
}

interface TravelConditionsContextValue {
  conditions: TravelConditions
  setDeparture: (departure: DepartureId) => void
  setDuration: (duration: DurationId) => void
  togglePreference: (preference: PreferenceId) => void
  isComplete: boolean
}

const TravelConditionsContext =
  createContext<TravelConditionsContextValue | null>(null)

function readStoredConditions(): TravelConditions {
  try {
    const stored = sessionStorage.getItem(STORAGE_KEY)
    return stored ? (JSON.parse(stored) as TravelConditions) : defaultConditions
  } catch {
    return defaultConditions
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
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(conditions))
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

export function useTravelConditions() {
  const context = useContext(TravelConditionsContext)

  if (!context) {
    throw new Error(
      'useTravelConditions must be used within TravelConditionsProvider',
    )
  }

  return context
}
