import { act, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'

import { useTravelConditions } from '../hooks/useTravelConditions.ts'
import { TravelConditionsProvider } from './TravelConditionsProvider.tsx'

const STORAGE_KEY = 'gildam:travel-conditions'

let controls: ReturnType<typeof useTravelConditions> | null = null

function ConditionsProbe() {
  const value = useTravelConditions()
  controls = value

  return (
    <output aria-label="여행 조건 상태">
      {JSON.stringify(value.conditions)}|
      {value.isComplete ? 'complete' : 'incomplete'}|
      {value.missingFields.join(',')}
    </output>
  )
}

function renderProvider() {
  render(
    <TravelConditionsProvider>
      <ConditionsProbe />
    </TravelConditionsProvider>,
  )
}

function probe() {
  return screen.getByLabelText('여행 조건 상태')
}

describe('TravelConditionsProvider', () => {
  beforeEach(() => {
    sessionStorage.clear()
    controls = null
  })

  it('세션에 저장된 유효한 조건을 복원한다', () => {
    sessionStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        departure: 'USQUARE',
        duration: 'SIX_HOURS',
        preferences: ['FOOD_MARKET'],
        mobility: 'MIN_TRANSFER',
      }),
    )

    renderProvider()

    expect(probe()).toHaveTextContent('"departure":"USQUARE"')
    expect(probe()).toHaveTextContent('"mobility":"MIN_TRANSFER"')
    expect(probe()).toHaveTextContent('complete')
  })

  it('이동 부담 필드가 없던 이전 세션도 기본값으로 복원한다', () => {
    sessionStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        departure: 'USQUARE',
        duration: 'SIX_HOURS',
        preferences: ['FOOD_MARKET'],
      }),
    )

    renderProvider()

    expect(probe()).toHaveTextContent('"mobility":"ANY"')
    expect(probe()).toHaveTextContent('complete')
  })

  it('저장된 값이 손상된 경우 기본 조건을 사용한다', () => {
    sessionStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ departure: 'UNKNOWN', preferences: null }),
    )

    renderProvider()

    expect(probe()).toHaveTextContent(
      '{"departure":null,"duration":null,"preferences":[],"mobility":"ANY"}|incomplete',
    )
  })

  it('빠진 조건을 missingFields로 알려준다', () => {
    renderProvider()

    expect(probe()).toHaveTextContent('departure,duration,preferences')

    act(() => {
      controls?.setDeparture('USQUARE')
    })

    expect(probe()).toHaveTextContent('duration,preferences')
  })

  it('reset은 조건과 세션 저장값을 모두 비운다', () => {
    renderProvider()

    act(() => {
      controls?.setDeparture('USQUARE')
      controls?.setDuration('FULL_DAY')
      controls?.togglePreference('MEMORY')
      controls?.setMobility('LOW_BURDEN')
    })

    expect(probe()).toHaveTextContent('complete')

    act(() => {
      controls?.reset()
    })

    expect(probe()).toHaveTextContent('incomplete')
    expect(probe()).toHaveTextContent('"mobility":"ANY"')
  })
})
