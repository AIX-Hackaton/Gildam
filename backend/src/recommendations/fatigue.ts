export type FatigueLevel = 'LOW' | 'MEDIUM' | 'HIGH'

export interface FatigueMetrics {
  walkingMinutes: number
  transferCount: number
  roundTripTransitMinutes: number
}

export interface FatigueFactor {
  level: FatigueLevel
  score: number
  value: number
  weight: number
}

export interface FatigueResult {
  level: FatigueLevel
  score: number
  factors: {
    walking: FatigueFactor
    transfers: FatigueFactor
    roundTripTransit: FatigueFactor
  }
}

const FATIGUE_WEIGHTS = {
  walking: 0.4,
  transfers: 0.35,
  roundTripTransit: 0.25,
} as const

const FATIGUE_LEVEL_SCORES: Record<FatigueLevel, number> = {
  LOW: 1,
  MEDIUM: 2,
  HIGH: 3,
}

function assertNonNegativeMetric(name: string, value: number) {
  if (!Number.isFinite(value) || value < 0) {
    throw new RangeError(`${name} must be a non-negative number.`)
  }
}

function assertTransferCount(value: number) {
  assertNonNegativeMetric('transferCount', value)

  if (!Number.isInteger(value)) {
    throw new RangeError('transferCount must be an integer.')
  }
}

export function classifyWalkingBurden(walkingMinutes: number): FatigueLevel {
  assertNonNegativeMetric('walkingMinutes', walkingMinutes)

  if (walkingMinutes <= 15) return 'LOW'
  if (walkingMinutes <= 35) return 'MEDIUM'
  return 'HIGH'
}

export function classifyTransferBurden(transferCount: number): FatigueLevel {
  assertTransferCount(transferCount)

  if (transferCount === 0) return 'LOW'
  if (transferCount === 1) return 'MEDIUM'
  return 'HIGH'
}

export function classifyRoundTripTransitBurden(
  roundTripTransitMinutes: number,
): FatigueLevel {
  assertNonNegativeMetric('roundTripTransitMinutes', roundTripTransitMinutes)

  if (roundTripTransitMinutes <= 90) return 'LOW'
  if (roundTripTransitMinutes <= 180) return 'MEDIUM'
  return 'HIGH'
}

function buildFactor(
  level: FatigueLevel,
  value: number,
  weight: number,
): FatigueFactor {
  return {
    level,
    score: FATIGUE_LEVEL_SCORES[level],
    value,
    weight,
  }
}

function classifyOverallFatigue(score: number): FatigueLevel {
  if (score < 1.5) return 'LOW'
  if (score < 2.35) return 'MEDIUM'
  return 'HIGH'
}

export function calculateFatigue(metrics: FatigueMetrics): FatigueResult {
  const walkingLevel = classifyWalkingBurden(metrics.walkingMinutes)
  const transferLevel = classifyTransferBurden(metrics.transferCount)
  const transitLevel = classifyRoundTripTransitBurden(
    metrics.roundTripTransitMinutes,
  )

  const factors = {
    walking: buildFactor(
      walkingLevel,
      metrics.walkingMinutes,
      FATIGUE_WEIGHTS.walking,
    ),
    transfers: buildFactor(
      transferLevel,
      metrics.transferCount,
      FATIGUE_WEIGHTS.transfers,
    ),
    roundTripTransit: buildFactor(
      transitLevel,
      metrics.roundTripTransitMinutes,
      FATIGUE_WEIGHTS.roundTripTransit,
    ),
  }

  const score =
    factors.walking.score * factors.walking.weight +
    factors.transfers.score * factors.transfers.weight +
    factors.roundTripTransit.score * factors.roundTripTransit.weight

  const roundedScore = Number(score.toFixed(2))

  return {
    level: classifyOverallFatigue(roundedScore),
    score: roundedScore,
    factors,
  }
}
