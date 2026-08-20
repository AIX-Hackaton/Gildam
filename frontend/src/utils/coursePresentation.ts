import type {
  CourseSummary,
  FatigueLevel,
  RecommendationScoreBreakdown,
  ReturnFeasibility,
  ReturnFeasibilityStatus,
} from '../types/course.ts'

const preferenceLabels: Record<string, string> = {
  NATURE_WALK: '자연·산책',
  HISTORY_CULTURE: '역사·문화',
  FOOD_MARKET: '음식·시장',
  MEMORY: '감성기록',
}

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

export function getTopRecommendationReasons(
  course: CourseSummary,
  limit: number,
) {
  const breakdown = course.scoreBreakdown

  if (!breakdown) return course.recommendationReasons.slice(0, limit)

  const factors: Array<{
    weightedScore: number
    reason: (scoreBreakdown: RecommendationScoreBreakdown) => string
  }> = [
    {
      weightedScore: breakdown.preferenceMatch.weightedScore,
      reason: ({ preferenceMatch }) => {
        const matchedPreferences = preferenceMatch.matchedPreferences.map(
          (preference) => preferenceLabels[preference] ?? preference,
        )

        if (matchedPreferences.length === 1) {
          return `${course.title} 코스는 ${matchedPreferences[0]} 취향과 잘 맞아요.`
        }

        return `${course.title} 코스는 ${matchedPreferences.join(', ')} 취향과 잘 맞아요.`
      },
    },
    {
      weightedScore: breakdown.mobility.weightedScore,
      reason: ({ mobility }) =>
        mobility.transferCount === 0
          ? `환승 없이 이동하고, 관광지 사이는 총 ${mobility.walkingMinutes}분 걸어요.`
          : `환승 ${mobility.transferCount}회, 관광지 사이는 총 ${mobility.walkingMinutes}분 걸어요.`,
    },
    {
      weightedScore: breakdown.returnMargin.weightedScore,
      reason: ({ returnMargin }) =>
        returnMargin.slackMinutes > 0
          ? `일정을 마친 뒤에도 귀가 시간까지 ${returnMargin.slackMinutes}분 여유가 있어요.`
          : '선택한 시간에 맞춰 귀가할 수 있어요.',
    },
    {
      weightedScore: breakdown.localResource.weightedScore,
      reason: () =>
        `${course.region}의 지역 음식과 로컬 장소를 함께 둘러볼 수 있어요.`,
    },
    {
      weightedScore: breakdown.recordFit.weightedScore,
      reason: () => '코스에 사진과 기록으로 남길 장면이 포함되어 있어요.',
    },
  ]

  return factors
    .sort((a, b) => b.weightedScore - a.weightedScore)
    .slice(0, limit)
    .map(({ reason }) => reason(breakdown))
}

export interface MobilityRankComparison {
  weights: Array<{ label: string; value: number }>
  reason: string
}

function withSubjectParticle(label: string) {
  const lastCharacter = label.at(-1)
  if (!lastCharacter) return label

  const codePoint = lastCharacter.charCodeAt(0) - 0xac00
  const hasFinalConsonant =
    codePoint >= 0 && codePoint <= 0xd7a3 - 0xac00 && codePoint % 28 !== 0

  return `${label}${hasFinalConsonant ? '은' : '는'}`
}

export function getMobilityRankComparison(
  courses: CourseSummary[],
): MobilityRankComparison | null {
  if (courses.length < 3) return null

  const reference = courses[0].scoreBreakdown?.mobility
  const second = courses[1]
  const third = courses[2]
  const secondMobility = second.scoreBreakdown?.mobility
  const thirdMobility = third.scoreBreakdown?.mobility

  if (!reference || !secondMobility || !thirdMobility) return null

  const { walking, transfer, transit } = reference.componentWeights
  const secondSubject = withSubjectParticle(second.title)
  const weights = [
    { label: '도보', value: walking },
    { label: '환승', value: transfer },
    { label: '왕복 이동', value: transit },
  ]

  if (transfer > walking && transfer > transit) {
    const transferDescription =
      secondMobility.transferCount === 0
        ? '환승 없이 이동할 수 있어'
        : `환승 ${secondMobility.transferCount}회로 ${third.title}의 ${thirdMobility.transferCount}회보다 적어`

    return {
      weights,
      reason: `${secondSubject} ${transferDescription} ${third.title}보다 앞섰어요.`,
    }
  }

  const secondTransit = secondMobility.roundTripTransitMinutes
  const thirdTransit = thirdMobility.roundTripTransitMinutes
  const hasLowerWalking = secondMobility.walkingMinutes < thirdMobility.walkingMinutes
  const hasLowerTransit = secondTransit < thirdTransit

  if (hasLowerWalking && hasLowerTransit) {
    return {
      weights,
      reason: `${secondSubject} 도보 ${secondMobility.walkingMinutes}분·왕복 이동 ${secondTransit}분으로 ${third.title}보다 이동 부담이 낮아 2위가 됐어요.`,
    }
  }

  if (hasLowerWalking) {
    return {
      weights,
      reason: `${secondSubject} 도보 ${secondMobility.walkingMinutes}분으로 ${third.title}보다 적게 걸어 2위가 됐어요.`,
    }
  }

  if (hasLowerTransit) {
    return {
      weights,
      reason: `${secondSubject} 왕복 이동 ${secondTransit}분으로 ${third.title}보다 이동시간이 짧아 2위가 됐어요.`,
    }
  }

  return {
    weights,
    reason: `${secondSubject} 도보·환승·왕복 이동을 함께 반영한 결과 ${third.title}보다 앞섰어요.`,
  }
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
