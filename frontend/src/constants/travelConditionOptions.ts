import type {
  DepartureId,
  DurationId,
  MobilityId,
  PreferenceId,
} from '../types/travelConditions.ts'

interface TravelConditionOption<T extends string> {
  id: T
  label: string
}

export const departureOptions: Array<TravelConditionOption<DepartureId>> = [
  { id: 'GWANGJU_SONGJEONG', label: '광주송정역' },
  { id: 'USQUARE', label: '유스퀘어' },
]

export const durationOptions: Array<TravelConditionOption<DurationId>> = [
  { id: 'SIX_HOURS', label: '6시간' },
  { id: 'FULL_DAY', label: '하루 종일' },
]

export const preferenceOptions: Array<TravelConditionOption<PreferenceId>> = [
  { id: 'NATURE_WALK', label: '자연·산책' },
  { id: 'HISTORY_CULTURE', label: '역사·문화' },
  { id: 'FOOD_MARKET', label: '음식·시장' },
  { id: 'MEMORY', label: '감성기록' },
]

export const mobilityOptions: Array<TravelConditionOption<MobilityId>> = [
  { id: 'MIN_TRANSFER', label: '환승 최소' },
  { id: 'LOW_BURDEN', label: '이동 부담 낮게' },
  { id: 'ANY', label: '상관없음' },
]

export function getOptionLabel<T extends string>(
  options: Array<TravelConditionOption<T>>,
  id: T,
) {
  return options.find((option) => option.id === id)?.label ?? id
}
