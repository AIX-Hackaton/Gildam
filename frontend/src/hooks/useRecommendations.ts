import { useEffect, useState } from 'react'

import { getRecommendations } from '../services/recommendationService.ts'
import type { CourseSummary } from '../types/course.ts'
import type { TravelConditions } from '../types/travelConditions.ts'

export function useRecommendations(
  conditions: TravelConditions,
  enabled: boolean,
) {
  const [courses, setCourses] = useState<CourseSummary[]>([])
  const [isLoading, setIsLoading] = useState(enabled)
  const [hasError, setHasError] = useState(false)
  const [retryKey, setRetryKey] = useState(0)

  useEffect(() => {
    let isCurrent = true

    if (!enabled) {
      setCourses([])
      setHasError(false)
      setIsLoading(false)
      return () => {
        isCurrent = false
      }
    }

    setIsLoading(true)
    setHasError(false)
    getRecommendations(conditions)
      .then((recommendations) => {
        if (!isCurrent) return
        setCourses(recommendations)
        setIsLoading(false)
      })
      .catch(() => {
        if (!isCurrent) return
        setCourses([])
        setHasError(true)
        setIsLoading(false)
      })

    return () => {
      isCurrent = false
    }
  }, [conditions, enabled, retryKey])

  return {
    courses,
    isLoading,
    hasError,
    retry: () => setRetryKey((current) => current + 1),
  }
}
