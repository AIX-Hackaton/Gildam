import type { MobilityId, PreferenceId } from './travelConditions.ts'

export interface AiPreferenceInterpretation {
  preferences: PreferenceId[]
  mobility: MobilityId
}
