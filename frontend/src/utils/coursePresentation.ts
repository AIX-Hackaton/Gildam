import type {
  FatigueLevel,
  ReturnFeasibilityStatus,
} from '../types/course.ts'

export const fatigueLabels: Record<FatigueLevel, string> = {
  LOW: '낮음',
  MEDIUM: '보통',
  HIGH: '높음',
}

export function formatDuration(minutes: number) {
  const hours = Math.floor(minutes / 60)
  const remainingMinutes = minutes % 60

  return remainingMinutes ? `${hours}시간 ${remainingMinutes}분` : `${hours}시간`
}

export function formatCompactLabel(label: string) {
  return label.replaceAll('·', '')
}

export function formatRecommendationReason(reason: string) {
  return `• ${reason.trim().replace(/[.!?]+$/u, '')}.`
}

export function getReturnFeasibilityLabel(status: ReturnFeasibilityStatus) {
  if (status === 'FEASIBLE') return '귀가 가능'
  if (status === 'TIGHT') return '귀가 빠듯'
  return null
}
