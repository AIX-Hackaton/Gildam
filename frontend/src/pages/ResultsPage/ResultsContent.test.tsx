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
    returnFeasibility: {
      status: 'FEASIBLE',
      confidence: 'NEEDS_DAY_OF_CHECK',
      returnTransport: {
        type: 'HEADWAY_SERVICE',
        requiresDayOfCheck: true,
      },
    },
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
        onOpenCourse={vi.fn()}
      />,
    )

    expect(screen.getByText('추천 1위')).toBeInTheDocument()
    expect(screen.getByText('추천 2위')).toBeInTheDocument()
    expect(screen.getByText('추천 3위')).toBeInTheDocument()
    expect(screen.queryByText('네 번째 코스')).not.toBeInTheDocument()
    expect(
      screen.getAllByText('출발 전 버스 도착정보 확인 필요'),
    ).toHaveLength(3)
  })
})
