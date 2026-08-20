import type { AiPreferenceInterpretation } from '../types/aiPreference.ts'
import type { MobilityId, PreferenceId } from '../types/travelConditions.ts'
import { fetchApiJson } from './apiClient.ts'

const allowedPreferences: PreferenceId[] = [
  'NATURE_WALK',
  'HISTORY_CULTURE',
  'FOOD_MARKET',
  'MEMORY',
]

const allowedMobility: MobilityId[] = [
  'MIN_TRANSFER',
  'LOW_BURDEN',
  'ANY',
]

function isAiPreferenceInterpretation(
  value: unknown,
): value is AiPreferenceInterpretation {
  if (!value || typeof value !== 'object') return false

  const response = value as Record<string, unknown>

  return (
    Array.isArray(response.preferences) &&
    response.preferences.every(
      (preference) =>
        typeof preference === 'string' &&
        allowedPreferences.includes(preference as PreferenceId),
    ) &&
    typeof response.mobility === 'string' &&
    allowedMobility.includes(response.mobility as MobilityId)
  )
}

export async function interpretPreferences(
  text: string,
): Promise<AiPreferenceInterpretation> {
  const response = await fetchApiJson<unknown>(
    '/api/ai/interpret-preferences',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    },
  )

  if (!isAiPreferenceInterpretation(response)) {
    throw new Error('Invalid AI preference interpretation response.')
  }

  return response
}
