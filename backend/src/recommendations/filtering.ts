export type DepartureId = 'GWANGJU_SONGJEONG' | 'USQUARE'
export type DurationId = 'SIX_HOURS' | 'FULL_DAY'

export type ExclusionReasonCode =
  | 'UNSUPPORTED_DEPARTURE'
  | 'TIME_LIMIT_EXCEEDED'
  | 'RETURN_NOT_FEASIBLE'

export interface RecommendationFilterConditions {
  departure: DepartureId
  duration: DurationId
}

export interface RecommendationFilterableCourse {
  departures: readonly DepartureId[]
  durationMinutes: number
  returnFeasible: boolean
}

export interface RecommendationFilterOptions {
  durationLimits?: Partial<Record<DurationId, number>>
}

export interface ExclusionReason {
  code: ExclusionReasonCode
  message: string
}

export interface ExcludedRecommendationCandidate<
  TCourse extends RecommendationFilterableCourse,
> {
  course: TCourse
  reasons: ExclusionReason[]
}

export interface RecommendationFilterResult<
  TCourse extends RecommendationFilterableCourse,
> {
  candidates: TCourse[]
  exclusions: Array<ExcludedRecommendationCandidate<TCourse>>
}

const DEFAULT_DURATION_LIMITS: Record<DurationId, number> = {
  SIX_HOURS: 360,
  FULL_DAY: 720,
}

function assertNonNegativeMinutes(name: string, value: number) {
  if (!Number.isFinite(value) || value < 0) {
    throw new RangeError(`${name} must be a non-negative number.`)
  }
}

function getDurationLimitMinutes(
  duration: DurationId,
  options: RecommendationFilterOptions,
) {
  const limit =
    options.durationLimits?.[duration] ?? DEFAULT_DURATION_LIMITS[duration]

  assertNonNegativeMinutes(`${duration} duration limit`, limit)

  return limit
}

function buildExclusionReason(
  code: ExclusionReasonCode,
  message: string,
): ExclusionReason {
  return { code, message }
}

export function getCourseExclusionReasons(
  course: RecommendationFilterableCourse,
  conditions: RecommendationFilterConditions,
  options: RecommendationFilterOptions = {},
): ExclusionReason[] {
  assertNonNegativeMinutes('durationMinutes', course.durationMinutes)

  const reasons: ExclusionReason[] = []

  if (!course.departures.includes(conditions.departure)) {
    reasons.push(
      buildExclusionReason(
        'UNSUPPORTED_DEPARTURE',
        '선택한 출발지에서 이용할 수 없는 코스입니다.',
      ),
    )
  }

  const durationLimitMinutes = getDurationLimitMinutes(
    conditions.duration,
    options,
  )

  if (course.durationMinutes > durationLimitMinutes) {
    reasons.push(
      buildExclusionReason(
        'TIME_LIMIT_EXCEEDED',
        '선택한 가능 시간을 초과하는 코스입니다.',
      ),
    )
  }

  if (!course.returnFeasible) {
    reasons.push(
      buildExclusionReason(
        'RETURN_NOT_FEASIBLE',
        '당일 귀가 가능성이 검증되지 않은 코스입니다.',
      ),
    )
  }

  return reasons
}

export function filterRecommendationCandidates<
  TCourse extends RecommendationFilterableCourse,
>(
  courses: readonly TCourse[],
  conditions: RecommendationFilterConditions,
  options: RecommendationFilterOptions = {},
): RecommendationFilterResult<TCourse> {
  return courses.reduce<RecommendationFilterResult<TCourse>>(
    (result, course) => {
      const reasons = getCourseExclusionReasons(course, conditions, options)

      if (reasons.length > 0) {
        result.exclusions.push({ course, reasons })
      } else {
        result.candidates.push(course)
      }

      return result
    },
    { candidates: [], exclusions: [] },
  )
}
