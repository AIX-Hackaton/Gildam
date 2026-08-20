import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { interpretPreferences } from './aiPreferenceService.ts'

describe('aiPreferenceService', () => {
  const fetchMock = vi.fn<typeof fetch>()

  beforeEach(() => {
    fetchMock.mockReset()
    vi.stubGlobal('fetch', fetchMock)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('sends the natural-language preference text to the backend API', async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          preferences: ['HISTORY_CULTURE', 'FOOD_MARKET'],
          mobility: 'LOW_BURDEN',
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      ),
    )

    await expect(
      interpretPreferences('조용한 옛날 거리와 시장을 둘러보고 싶어요.'),
    ).resolves.toEqual({
      preferences: ['HISTORY_CULTURE', 'FOOD_MARKET'],
      mobility: 'LOW_BURDEN',
    })
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/ai/interpret-preferences',
      {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: '조용한 옛날 거리와 시장을 둘러보고 싶어요.',
        }),
      },
    )
  })

  it('rejects a response containing unsupported condition codes', async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          preferences: ['HISTORY_CULTURE', 'UNKNOWN'],
          mobility: 'LOW_BURDEN',
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      ),
    )

    await expect(interpretPreferences('오래된 거리를 걷고 싶어요.')).rejects.toThrow(
      'Invalid AI preference interpretation response.',
    )
  })
})
