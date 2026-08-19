import { describe, expect, it } from 'vitest'

import { getReturnFeasibilityLabel } from './coursePresentation.ts'

describe('getReturnFeasibilityLabel', () => {
  it.each([
    ['FEASIBLE', '귀가가능'],
    ['TIGHT', '귀가빠듯'],
    ['NOT_FEASIBLE', null],
  ] as const)('%s 상태의 뱃지 문구를 반환한다', (status, label) => {
    expect(getReturnFeasibilityLabel(status)).toBe(label)
  })
})
