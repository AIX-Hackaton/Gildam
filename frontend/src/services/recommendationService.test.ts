import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import type { TravelConditions } from '../types/travelConditions.ts'
import { getCourseById, getRecommendations } from './recommendationService.ts'

describe('recommendationService', () => {
  const fetchMock = vi.fn<typeof fetch>()

  beforeEach(() => {
    fetchMock.mockReset()
    vi.stubGlobal('fetch', fetchMock)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('returns no recommendations when required conditions are missing', async () => {
    const conditions: TravelConditions = {
      departure: null,
      duration: 'FULL_DAY',
      preferences: ['NATURE_WALK'],
    }

    await expect(getRecommendations(conditions)).resolves.toEqual([])
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('returns recommendations from the backend API', async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          courses: [
            {
              id: 'naju-history-walk',
              title: '나주 읍성 시간여행 코스',
              region: '나주',
              thumbnailUrl: '/images/course-naju.svg',
              tags: ['역사·문화', '음식·시장'],
              fatigueLevel: 'LOW',
              durationMinutes: 340,
              walkingMinutes: 20,
              transferCount: 0,
              recommendationReasons: [
                '환승 없이 나주 원도심을 둘러볼 수 있어요.',
              ],
            },
            {
              id: 'mokpo-port-culture',
              title: '목포 항구 문화 코스',
              region: '목포',
              thumbnailUrl: '/images/course-mokpo.svg',
              tags: ['역사·문화', '음식·시장', '감성기록'],
              fatigueLevel: 'MEDIUM',
              durationMinutes: 480,
              walkingMinutes: 32,
              transferCount: 1,
              recommendationReasons: [
                '근대문화 거리와 항구 풍경을 함께 만나요.',
              ],
            },
          ],
          exclusions: [],
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      ),
    )
    const conditions: TravelConditions = {
      departure: 'GWANGJU_SONGJEONG',
      duration: 'FULL_DAY',
      preferences: ['HISTORY_CULTURE', 'FOOD_MARKET', 'MEMORY'],
    }

    const courses = await getRecommendations(conditions)

    expect(courses.map((course) => course.id)).toEqual([
      'naju-history-walk',
      'mokpo-port-culture',
    ])
    expect(fetchMock).toHaveBeenCalledWith('/api/recommendations', {
      method: 'POST',
      headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify(conditions),
    })
  })

  it('returns complete details from the backend API', async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          id: 'damyang-slow-walk',
          title: '담양 느린 산책 코스',
          region: '담양',
          thumbnailUrl: '/images/course-damyang.svg',
          tags: ['자연·산책', '감성기록', '음식'],
          fatigueLevel: 'MEDIUM',
          fatigueScore: 2,
          durationMinutes: 360,
          walkingMinutes: 24,
          transferCount: 1,
          roundTripTransitMinutes: 130,
          recommendationReasons: ['자연·산책 취향과 주요 장소가 잘 맞아요.'],
          description:
            '천천히 걷고, 담양의 자연과 골목을 오롯이 느낄 수 있는 코스예요.',
          itinerary: [],
          localFood: [],
          localPoints: [],
          scenePrompts: [],
          primaryDestination: {
            name: '담양 관방제림',
            latitude: 35.3216,
            longitude: 126.9865,
          },
          mapUrl:
            'https://map.kakao.com/link/map/%EB%8B%B4%EC%96%91%20%EA%B4%80%EB%B0%A9%EC%A0%9C%EB%A6%BC,35.3216,126.9865',
          directionsUrl:
            'https://map.kakao.com/link/to/%EB%8B%B4%EC%96%91%20%EA%B4%80%EB%B0%A9%EC%A0%9C%EB%A6%BC,35.3216,126.9865',
          kakaoMapUrl:
            'https://map.kakao.com/link/map/%EB%8B%B4%EC%96%91%20%EA%B4%80%EB%B0%A9%EC%A0%9C%EB%A6%BC,35.3216,126.9865',
          kakaoDirectionsUrl:
            'https://map.kakao.com/link/to/%EB%8B%B4%EC%96%91%20%EA%B4%80%EB%B0%A9%EC%A0%9C%EB%A6%BC,35.3216,126.9865',
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      ),
    )

    const course = await getCourseById('damyang-slow-walk')

    expect(course).toMatchObject({
      id: 'damyang-slow-walk',
      title: '담양 느린 산책 코스',
      kakaoMapUrl:
        'https://map.kakao.com/link/map/%EB%8B%B4%EC%96%91%20%EA%B4%80%EB%B0%A9%EC%A0%9C%EB%A6%BC,35.3216,126.9865',
    })
    expect(fetchMock).toHaveBeenCalledWith('/api/courses/damyang-slow-walk', {
      headers: { Accept: 'application/json' },
    })
  })

  it('returns null when the backend API returns 404', async () => {
    fetchMock.mockResolvedValueOnce(new Response(null, { status: 404 }))

    await expect(getCourseById('unknown-course')).resolves.toBeNull()
  })
})
