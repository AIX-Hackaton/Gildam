export type DepartureId = 'GWANGJU_SONGJEONG' | 'USQUARE'
export type DurationId = 'SIX_HOURS' | 'FULL_DAY'
export type PreferenceId =
  | 'NATURE_WALK'
  | 'HISTORY_CULTURE'
  | 'FOOD_MARKET'
  | 'MEMORY'

export interface TravelConditions {
  departure: DepartureId | null
  duration: DurationId | null
  preferences: PreferenceId[]
}
