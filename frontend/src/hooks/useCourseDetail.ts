import { useEffect, useState } from 'react'

import { getCourseById } from '../services/recommendationService.ts'
import type { Course } from '../types/course.ts'

export function useCourseDetail(courseId: string) {
  const [course, setCourse] = useState<Course | null>()
  const [hasError, setHasError] = useState(false)
  const [retryKey, setRetryKey] = useState(0)

  useEffect(() => {
    let isCurrent = true

    setCourse(undefined)
    setHasError(false)
    getCourseById(courseId)
      .then((result) => {
        if (isCurrent) setCourse(result)
      })
      .catch(() => {
        if (!isCurrent) return
        setHasError(true)
        setCourse(null)
      })

    return () => {
      isCurrent = false
    }
  }, [courseId, retryKey])

  return {
    course,
    hasError,
    retry: () => setRetryKey((current) => current + 1),
  }
}
