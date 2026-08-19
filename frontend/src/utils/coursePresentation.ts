import type {
  FatigueLevel,
  ReturnFeasibility,
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

export function getReturnActionLabel(feasibility: ReturnFeasibility) {
  const transport = feasibility.returnTransport

  if (
    transport?.type === 'RESERVATION_REQUIRED' ||
    transport?.ticketingModel === 'ADVANCE_RESERVATION'
  ) {
    return '왕복 교통편 사전 예약 필요'
  }

  if (transport?.ticketingModel === 'ONSITE_TICKET') {
    return '도착 직후 귀가편 승차권 확보 필요'
  }

  if (feasibility.confidence === 'CONFIRMED') return null

  if (
    transport?.type === 'HEADWAY_SERVICE' &&
    transport.requiresDayOfCheck !== false
  ) {
    return '출발 전 버스 도착정보 확인 필요'
  }

  if (
    transport?.type === 'SCHEDULED_SERVICE' &&
    transport.requiresDayOfCheck !== false
  ) {
    return '이용일 귀가편 시간 재확인 필요'
  }

  return feasibility.confidence ? '교통 정보 재확인 필요' : null
}

export function formatTransportGuidance(guidance: string) {
  return guidance.replaceAll('BIS', '버스정보시스템')
}
