import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import type { CourseSummary } from '../../types/course.ts'
import type { TravelConditions } from '../../types/travelConditions.ts'
import { ResultsContent } from './ResultsContent.tsx'

const conditions: TravelConditions = {
  departure: 'USQUARE',
  duration: 'FULL_DAY',
  mobility: 'ANY',
  preferences: ['HISTORY_CULTURE'],
}

function createCourse(id: string): CourseSummary {
  return {
    id,
    title: `${id} 코스`,
    region: '나주',
    thumbnailUrl: '/images/course-naju.svg',
    tags: ['역사·문화'],
    fatigueLevel: 'LOW',
    durationMinutes: 300,
    walkingMinutes: 20,
    transferCount: 0,
    recommendationReasons: ['역사·문화 취향과 잘 맞아요.'],
    returnFeasibility: { status: 'FEASIBLE' },
  }
}

describe('ResultsContent', () => {
  it('추천 코스를 점수순 최대 3위까지 표시한다', () => {
    render(
      <ResultsContent
        conditions={conditions}
        courses={[
          createCourse('첫 번째'),
          createCourse('두 번째'),
          createCourse('세 번째'),
          createCourse('네 번째'),
        ]}
        excludedCourses={[]}
        onOpenCourse={vi.fn()}
      />,
    )

    expect(screen.getByText('추천 1위')).toBeInTheDocument()
    expect(screen.getByText('추천 2위')).toBeInTheDocument()
    expect(screen.getByText('추천 3위')).toBeInTheDocument()
    expect(screen.queryByText('네 번째 코스')).not.toBeInTheDocument()
  })

  it('사용자가 이해할 수 있는 코스 제외 이유만 표시한다', () => {
    render(
      <ResultsContent
        conditions={conditions}
        courses={[createCourse('첫 번째')]}
        excludedCourses={[
          {
            id: 'time-excluded',
            title: '시간 초과 코스',
            reasons: [
              {
                code: 'TIME_LIMIT_EXCEEDED',
                message: '계획 시간이 선택한 시간을 초과해요.',
              },
            ],
          },
          {
            id: 'internal-excluded',
            title: '내부 검토 코스',
            reasons: [
              {
                code: 'BLOCKED_BY_EXPOSURE_POLICY',
                message: '내부 노출 정책 메시지',
              },
            ],
          },
        ]}
        onOpenCourse={vi.fn()}
      />,
    )

    expect(screen.getByText('다른 코스가 제외된 이유')).toBeInTheDocument()
    expect(screen.getByText('시간 초과 코스')).toBeInTheDocument()
    expect(screen.queryByText('내부 검토 코스')).not.toBeInTheDocument()
  })
})
