import { useEffect, useState, type FormEvent } from 'react'
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
import styles from './PlanPage.module.css'

export function PlanPage() {
  const navigate = useNavigate()
  const {
    conditions,
    setDeparture,
    setDuration,
    setMobility,
    togglePreference,
    isComplete,
  } = useTravelConditions()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showPreferenceToast, setShowPreferenceToast] = useState(false)

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
