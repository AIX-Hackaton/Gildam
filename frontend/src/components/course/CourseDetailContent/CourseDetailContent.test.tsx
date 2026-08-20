import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import type { Course } from '../../../types/course.ts'
import { CourseDetailContent } from './CourseDetailContent.tsx'

const course: Course = {
  id: 'DY_LOW_01',
  title: '담양 느린 산책 코스',
  region: '담양',
  thumbnailUrl: '/images/courses/DY_LOW_01/관방제림.jpg',
  tags: ['자연·산책'],
  fatigueLevel: 'LOW',
  durationMinutes: 330,
  walkingMinutes: 18,
  transferCount: 1,
  recommendationReasons: ['자연 산책 취향과 잘 맞아요.'],
  returnFeasibility: {
    status: 'FEASIBLE',
    confidence: 'NEEDS_DAY_OF_CHECK',
    departureTime: '08:10',
    plannedReturnTime: '14:54',
    latestReturnTime: '15:20',
    slackMinutes: 40,
    bookingRequired: false,
    returnTransport: {
      type: 'HEADWAY_SERVICE',
      plannedBoardingAfter: '13:30',
      headwayMinutes: 15,
      requiresDayOfCheck: true,
      note: '13:30 이후 BIS에서 버스 도착정보를 확인합니다.',
    },
  },
  description: '담양의 숲길을 천천히 걷는 코스예요.',
  itinerary: [],
  localFood: [],
  localPoints: [],
  scenePrompts: [],
  mapUrl: 'https://example.com/map',
  directionsUrl: 'https://example.com/directions',
}

describe('CourseDetailContent', () => {
  it('귀가 시간과 재확인 항목, 데이터 출처를 표시한다', () => {
    render(<CourseDetailContent course={course} />)

    expect(screen.getByRole('heading', { name: '귀가 정보' })).toBeInTheDocument()
    expect(
      screen.getByText('출발 전 버스 도착정보 확인 필요'),
    ).toBeInTheDocument()
    expect(screen.getByText('08:10 → 14:54')).toBeInTheDocument()
    expect(
      screen.getByText(
        '13:30 이후 버스정보시스템에서 버스 도착정보를 확인합니다.',
      ),
    ).toBeInTheDocument()
    expect(screen.queryByText('데이터 출처')).not.toBeInTheDocument()
  })
})
