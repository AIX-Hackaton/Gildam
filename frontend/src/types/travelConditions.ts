export type DepartureId = 'GWANGJU_SONGJEONG' | 'USQUARE'
export type DurationId = 'SIX_HOURS' | 'FULL_DAY'
export type PreferenceId =
  | 'NATURE_WALK'
  | 'HISTORY_CULTURE'
  | 'FOOD_MARKET'
  | 'MEMORY'
/** 이동 부담 조건. 대표 시나리오의 '환승 최소' 선택을 실제 필터로 연결합니다. */
export type MobilityId = 'MIN_TRANSFER' | 'LOW_BURDEN' | 'ANY'

export interface TravelConditions {
  departure: DepartureId | null
  duration: DurationId | null
  preferences: PreferenceId[]
  mobility: MobilityId
}
