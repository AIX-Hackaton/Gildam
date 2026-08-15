import { useEffect, useState } from 'react'

import { getCourseById } from '../services/recommendationService.ts'
import type { Course } from '../types/course.ts'

export function useCourseDetail(courseId: string, duration?: string | null) {
  const [course, setCourse] = useState<Course | null>()
  const [hasError, setHasError] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [retryKey, setRetryKey] = useState(0)

  useEffect(() => {
    let isCurrent = true

    setCourse(undefined)
    setHasError(false)
    setErrorMessage(null)

    getCourseById(courseId, duration)
      .then((result) => {
        if (isCurrent) setCourse(result)
      })
      .catch((error: unknown) => {
        if (!isCurrent) return
        setHasError(true)
        setErrorMessage(
          error instanceof Error && error.message ? error.message : null,
        )
        setCourse(null)
      })

    return () => {
      isCurrent = false
    }
  }, [courseId, duration, retryKey])

  return {
    course,
    hasError,
    errorMessage,
    retry: () => setRetryKey((current) => current + 1),
  }
}
