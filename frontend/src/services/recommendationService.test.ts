import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import type { TravelConditions } from '../types/travelConditions.ts'
import { ApiError } from './apiClient.ts'
import { getCourseById, getRecommendations } from './recommendationService.ts'

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

const completeConditions: TravelConditions = {
  departure: 'USQUARE',
  duration: 'SIX_HOURS',
  preferences: ['HISTORY_CULTURE', 'FOOD_MARKET'],
  mobility: 'MIN_TRANSFER',
}

describe('recommendationService', () => {
  const fetchMock = vi.fn()

  beforeEach(() => {
    fetchMock.mockReset()
    vi.stubGlobal('fetch', fetchMock)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('필수 조건이 비어 있으면 API를 호출하지 않는다', async () => {
    const conditions: TravelConditions = {
      departure: null,
      duration: 'FULL_DAY',
      preferences: ['NATURE_WALK'],
      mobility: 'ANY',
    }

    await expect(getRecommendations(conditions)).resolves.toEqual({
      courses: [],
      exclusions: [],
      suggestions: [],
    })
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('취향을 하나도 고르지 않으면 API를 호출하지 않는다', async () => {
    await expect(
      getRecommendations({ ...completeConditions, preferences: [] }),
    ).resolves.toEqual({ courses: [], exclusions: [], suggestions: [] })
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('이동 부담 조건을 요청 본문에 함께 보낸다', async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse({ courses: [], exclusions: [], suggestions: [] }),
    )

    await getRecommendations(completeConditions)

    const init = fetchMock.mock.calls[0][1] as RequestInit
    expect(JSON.parse(String(init.body))).toEqual({
      departure: 'USQUARE',
      duration: 'SIX_HOURS',
      preferences: ['HISTORY_CULTURE', 'FOOD_MARKET'],
      mobility: 'MIN_TRANSFER',
    })
  })

  it('추천 코스와 제외 사유, 대안 제안을 함께 반환한다', async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse({
        courses: [
          {
            id: 'NJ_LOW_01',
            title: '나주 읍성·곰탕 저환승 코스',
            region: '나주',
          },
        ],
        exclusions: [
          {
            id: 'MP_NORMAL_01',
            title: '목포 갓바위·자연사 문화 코스',
            reasons: [
              { code: 'BLOCKED_BY_EXPOSURE_POLICY', message: '노출 제외 코스입니다.' },
            ],
          },
        ],
        suggestions: [
          {
            code: 'RELAX_DURATION',
            message: '하루 종일로 바꾸면 2개를 볼 수 있어요.',
            availableCount: 2,
          },
        ],
        meta: { dataSnapshotDate: '2026-08-06' },
      }),
    )

    const result = await getRecommendations(completeConditions)

    expect(result.courses).toHaveLength(1)
    expect(result.courses[0]?.id).toBe('NJ_LOW_01')
    expect(result.exclusions[0]?.id).toBe('MP_NORMAL_01')
    expect(result.suggestions[0]?.code).toBe('RELAX_DURATION')
    expect(result.meta?.dataSnapshotDate).toBe('2026-08-06')
  })

  it('exclusions·suggestions가 없는 응답도 안전하게 처리한다', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ courses: [] }))

    const result = await getRecommendations(completeConditions)

    expect(result.exclusions).toEqual([])
    expect(result.suggestions).toEqual([])
  })

  it('서버 오류는 코드와 메시지를 보존한 ApiError로 전달한다', async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse(
        { code: 'SERVER_ERROR', message: '일시적인 오류가 발생했습니다.' },
        500,
      ),
    )

    await expect(getRecommendations(completeConditions)).rejects.toBeInstanceOf(
      ApiError,
    )
  })

  it('네트워크 실패는 NETWORK_ERROR로 변환한다', async () => {
    fetchMock.mockRejectedValueOnce(new TypeError('Failed to fetch'))

    await expect(getRecommendations(completeConditions)).rejects.toMatchObject({
      code: 'NETWORK_ERROR',
    })
  })

  it('노출되지 않는 코스는 null을 반환한다', async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse(
        { code: 'NOT_FOUND', message: '요청한 코스를 찾을 수 없습니다.' },
        404,
      ),
    )

    await expect(getCourseById('MP_NORMAL_01')).resolves.toBeNull()
  })

  it('선택한 시간 조건을 상세 조회에 함께 전달한다', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ id: 'NJ_LOW_01' }))

    await getCourseById('NJ_LOW_01', 'SIX_HOURS')

    expect(String(fetchMock.mock.calls[0][0])).toContain(
      '/api/courses/NJ_LOW_01?duration=SIX_HOURS',
    )
  })
})
