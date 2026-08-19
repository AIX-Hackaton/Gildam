import { useEffect, useState } from 'react'

import { getRecommendations } from '../services/recommendationService.ts'
import type { RecommendationResult } from '../types/recommendation.ts'
import type { TravelConditions } from '../types/travelConditions.ts'

const EMPTY_RESULT: RecommendationResult = {
  courses: [],
  exclusions: [],
  suggestions: [],
  meta: null,
}

export function useRecommendations(
  conditions: TravelConditions,
  enabled: boolean,
) {
  const [result, setResult] = useState<RecommendationResult>(EMPTY_RESULT)
  const [isLoading, setIsLoading] = useState(enabled)
  const [hasError, setHasError] = useState(false)
  const [retryKey, setRetryKey] = useState(0)

  useEffect(() => {
    let isCurrent = true

    if (!enabled) {
      setResult(EMPTY_RESULT)
      setHasError(false)
      setIsLoading(false)
      return () => {
        isCurrent = false
      }
    }

    setIsLoading(true)
    setHasError(false)
    getRecommendations(conditions)
      .then((recommendationResult) => {
        if (!isCurrent) return
        setResult(recommendationResult)
        setIsLoading(false)
      })
      .catch(() => {
        if (!isCurrent) return
        setResult(EMPTY_RESULT)
        setHasError(true)
        setIsLoading(false)
      })

    return () => {
      isCurrent = false
    }
  }, [conditions, enabled, retryKey])

  return {
    ...result,
    isLoading,
    hasError,
    retry: () => setRetryKey((current) => current + 1),
  }
}
