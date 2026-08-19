import type {
  FeasibilityConfidence,
  FeasibilityStatus,
  FatigueLevel,
} from '../types/course.ts'

export const fatigueLabels: Record<FatigueLevel, string> = {
  LOW: '낮음',
  MEDIUM: '보통',
  HIGH: '높음',
}

export const verificationLabels: Record<string, string> = {
  VERIFIED: '공식 확인 완료',
  VERIFIED_MAP: '지도 실측 확인',
  PARTIALLY_VERIFIED: '부분 확인',
  NEEDS_RECHECK: '재확인 필요',
  TEMPORARILY_UNAVAILABLE: '임시 미운영',
  REFERENCE: '참고 자료',
  BLOCKED: '노출 제외',
}

export const feasibilityLabels: Record<FeasibilityStatus, string> = {
  FEASIBLE: '귀가 가능',
  TIGHT: '귀가 빠듯',
  NOT_FEASIBLE: '귀가 불가',
}

export const confidenceLabels: Record<FeasibilityConfidence, string> = {
  CONFIRMED: '귀가편 확인 완료',
  NEEDS_DAY_OF_CHECK: '2차 확인 필요',
  UNVERIFIED: '2차 확인 필요',
}

export function formatDuration(minutes: number) {
  const hours = Math.floor(minutes / 60)
  const remainingMinutes = minutes % 60

  if (hours === 0) return `${remainingMinutes}분`

  return remainingMinutes ? `${hours}시간 ${remainingMinutes}분` : `${hours}시간`
}

export function formatMinutesRange(min: number, max: number) {
  if (min === max) return formatDuration(min)

  return `${formatDuration(min)} ~ ${formatDuration(max)}`
}

export function formatPercent(value: number) {
  return `${Math.round(value * 100)}%`
}
