import { useEffect, useRef, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'

import { AppShell } from '../../components/common/AppShell/AppShell.tsx'
import { Button } from '../../components/common/Button/Button.tsx'
import { PageHeader } from '../../components/common/PageHeader/PageHeader.tsx'
import { StickyBottomCTA } from '../../components/common/StickyBottomCTA/StickyBottomCTA.tsx'
import { ConditionGroup } from '../../components/plan/ConditionGroup/ConditionGroup.tsx'
import {
  departureOptions,
  durationOptions,
  mobilityOptions,
  preferenceOptions,
} from '../../constants/travelConditionOptions.ts'
import { useTravelConditions } from '../../hooks/useTravelConditions.ts'
import { interpretPreferences } from '../../services/aiPreferenceService.ts'
import styles from './PlanPage.module.css'

type InterpretationStatus = 'success' | 'error' | null

export function PlanPage() {
  const navigate = useNavigate()
  const {
    conditions,
    setDeparture,
    setDuration,
    setMobility,
    setPreferences,
    togglePreference,
    isComplete,
  } = useTravelConditions()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showPreferenceToast, setShowPreferenceToast] = useState(false)
  const [preferenceText, setPreferenceText] = useState('')
  const [isInterpreting, setIsInterpreting] = useState(false)
  const [interpretationStatus, setInterpretationStatus] =
    useState<InterpretationStatus>(null)
  const interpretationInFlight = useRef(false)

  useEffect(() => {
    if (!showPreferenceToast) return

    const timeoutId = window.setTimeout(() => {
      setShowPreferenceToast(false)
    }, 2500)

    return () => window.clearTimeout(timeoutId)
  }, [showPreferenceToast])

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (isSubmitting) return

    if (conditions.preferences.length === 0) {
      setShowPreferenceToast(true)
      return
    }

    if (!isComplete) return

    setIsSubmitting(true)
    navigate('/results')
  }

  const handlePreferenceSelect = (
    preference: Parameters<typeof togglePreference>[0],
  ) => {
    setShowPreferenceToast(false)
    togglePreference(preference)
  }

  const handleInterpretPreferences = async () => {
    const trimmedText = preferenceText.trim()
    if (!trimmedText || interpretationInFlight.current) return

    interpretationInFlight.current = true
    setIsInterpreting(true)
    setInterpretationStatus(null)

    try {
      const interpretation = await interpretPreferences(trimmedText)

      setPreferences(interpretation.preferences)
      setMobility(interpretation.mobility)
      setShowPreferenceToast(false)
      setInterpretationStatus('success')
    } catch {
      setInterpretationStatus('error')
    } finally {
      interpretationInFlight.current = false
      setIsInterpreting(false)
    }
  }

  return (
    <AppShell>
      <PageHeader
        title="여행 조건"
        visuallyHiddenTitle
        backAlignedToContent
        showBack
        onBack={() => navigate('/')}
      />

      <main className={`page-content ${styles.main}`}>
        <section className={styles.intro}>
          <h1 className={styles.heading}>여행 조건을 선택해주세요</h1>
          <p className={styles.description}>
            선택한 조건을 바탕으로 최적의 코스를 추천 드려요
          </p>
        </section>

        <form
          id="travel-plan-form"
          className={styles.form}
          onSubmit={handleSubmit}
        >
          <ConditionGroup
            legend="출발지"
            options={departureOptions}
            isSelected={(id) => conditions.departure === id}
            onSelect={setDeparture}
          />

          <ConditionGroup
            legend="가능 시간"
            options={durationOptions}
            isSelected={(id) => conditions.duration === id}
            onSelect={setDuration}
          />

          <section
            className={styles.preferenceInterpreter}
            aria-busy={isInterpreting}
          >
            <label
              className={styles.interpreterLabel}
              htmlFor="travel-preference-text"
            >
              여행 취향을 문장으로 입력
            </label>
            <p
              id="travel-preference-description"
              className={styles.interpreterDescription}
            >
              원하는 분위기와 이동 방식을 적으면 AI가 아래 조건으로 정리해요.
            </p>
            <textarea
              id="travel-preference-text"
              className={styles.preferenceTextarea}
              value={preferenceText}
              onChange={(event) => {
                setPreferenceText(event.target.value)
                setInterpretationStatus(null)
              }}
              placeholder="예: 많이 걷지 않고 오래된 거리와 시장을 둘러보고 싶어요"
              aria-describedby="travel-preference-description"
              disabled={isInterpreting}
              rows={4}
            />
            <Button
              type="button"
              variant="secondary"
              className={styles.interpretButton}
              fullWidth
              disabled={preferenceText.trim().length === 0 || isInterpreting}
              loading={isInterpreting}
              onClick={handleInterpretPreferences}
            >
              조건에 반영하기
            </Button>
            <div
              className={styles.interpretationStatus}
              role="status"
              aria-live="polite"
              aria-atomic="true"
            >
              {interpretationStatus === 'success'
                ? '입력한 내용을 조건에 반영했어요'
                : null}
              {interpretationStatus === 'error'
                ? '문장을 해석하지 못했어요. 아래에서 직접 선택해주세요.'
                : null}
            </div>
          </section>

          <ConditionGroup
            legend="이동 부담"
            options={mobilityOptions}
            isSelected={(id) => conditions.mobility === id}
            onSelect={setMobility}
          />

          <ConditionGroup
            legend="취향"
            hint="복수 선택 가능"
            options={preferenceOptions}
            isSelected={(id) => conditions.preferences.includes(id)}
            onSelect={handlePreferenceSelect}
          />
        </form>
      </main>

      {showPreferenceToast ? (
        <div className={styles.toast} role="alert" aria-live="assertive">
          취향을 선택해주세요
        </div>
      ) : null}

      <StickyBottomCTA className={styles.ctaBar}>
        <Button
          type="submit"
          form="travel-plan-form"
          className={styles.cta}
          fullWidth
          disabled={
            conditions.departure === null || conditions.duration === null
          }
          loading={isSubmitting}
        >
          코스 추천받기
        </Button>
      </StickyBottomCTA>
    </AppShell>
  )
}
