import { useEffect, useState } from 'react'

import { getRecommendations } from '../services/recommendationService.ts'
import type { RecommendationResult } from '../types/course.ts'
import type { TravelConditions } from '../types/travelConditions.ts'

const EMPTY_RESULT: RecommendationResult = {
  courses: [],
  exclusions: [],
  suggestions: [],
}

export function useRecommendations(
  conditions: TravelConditions,
  enabled: boolean,
) {
  const [result, setResult] = useState<RecommendationResult>(EMPTY_RESULT)
  const [isLoading, setIsLoading] = useState(enabled)
  const [hasError, setHasError] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [retryKey, setRetryKey] = useState(0)

  useEffect(() => {
    let isCurrent = true

    if (!enabled) {
      setResult(EMPTY_RESULT)
      setHasError(false)
      setErrorMessage(null)
      setIsLoading(false)
      return () => {
        isCurrent = false
      }
    }

    setIsLoading(true)
    setHasError(false)
    setErrorMessage(null)

    getRecommendations(conditions)
      .then((recommendations) => {
        if (!isCurrent) return
        setResult(recommendations)
        setIsLoading(false)
      })
      .catch((error: unknown) => {
        if (!isCurrent) return
        setResult(EMPTY_RESULT)
        setHasError(true)
        setErrorMessage(
          error instanceof Error && error.message ? error.message : null,
        )
        setIsLoading(false)
      })

    return () => {
      isCurrent = false
    }
  }, [conditions, enabled, retryKey])

  return {
    courses: result.courses,
    exclusions: result.exclusions,
    suggestions: result.suggestions,
    meta: result.meta,
    isLoading,
    hasError,
    errorMessage,
    retry: () => setRetryKey((current) => current + 1),
  }
}
