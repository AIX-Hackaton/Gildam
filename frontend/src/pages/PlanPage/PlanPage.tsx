import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'

import { AppShell } from '../../components/common/AppShell/AppShell.tsx'
import { Button } from '../../components/common/Button/Button.tsx'
import { PageHeader } from '../../components/common/PageHeader/PageHeader.tsx'
import { SelectableChip } from '../../components/common/SelectableChip/SelectableChip.tsx'
import { StickyBottomCTA } from '../../components/common/StickyBottomCTA/StickyBottomCTA.tsx'
import { useTravelConditions } from '../../contexts/TravelConditionsContext.tsx'
import type {
  DepartureId,
  DurationId,
  PreferenceId,
} from '../../types/travelConditions.ts'
import styles from './PlanPage.module.css'

const departures: Array<{ id: DepartureId; label: string }> = [
  { id: 'GWANGJU_SONGJEONG', label: '광주송정역' },
  { id: 'USQUARE', label: '유스퀘어' },
]

const durations: Array<{ id: DurationId; label: string }> = [
  { id: 'SIX_HOURS', label: '6시간' },
  { id: 'FULL_DAY', label: '하루 종일' },
]

const preferences: Array<{
  id: PreferenceId
  label: string
}> = [
  { id: 'NATURE_WALK', label: '자연·산책' },
  { id: 'HISTORY_CULTURE', label: '역사·문화' },
  { id: 'FOOD_MARKET', label: '음식·시장' },
  { id: 'MEMORY', label: '감성기록' },
]

export function PlanPage() {
  const navigate = useNavigate()
  const {
    conditions,
    setDeparture,
    setDuration,
    togglePreference,
    isComplete,
  } = useTravelConditions()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!isComplete || isSubmitting) return

    setIsSubmitting(true)
    navigate('/results')
  }

  return (
    <AppShell>
      <PageHeader
        title="여행 조건"
        showBack
        onBack={() => navigate('/')}
      />

      <main className={`page-content ${styles.main}`}>
        <section className={styles.intro}>
          <h1 className={styles.heading}>여행 조건을 선택해주세요</h1>
          <p className={styles.description}>
            선택한 조건을 바탕으로 완주 가능한 코스를 추천해드려요.
          </p>
        </section>

        <form
          id="travel-plan-form"
          className={styles.form}
          onSubmit={handleSubmit}
        >
          <fieldset className={styles.group}>
            <legend className={styles.legend}>출발지</legend>
            <div className={styles.twoColumn}>
              {departures.map((departure) => (
                <SelectableChip
                  key={departure.id}
                  label={departure.label}
                  selected={conditions.departure === departure.id}
                  onSelect={() => setDeparture(departure.id)}
                />
              ))}
            </div>
          </fieldset>

          <fieldset className={styles.group}>
            <legend className={styles.legend}>가능 시간</legend>
            <div className={styles.twoColumn}>
              {durations.map((duration) => (
                <SelectableChip
                  key={duration.id}
                  label={duration.label}
                  selected={conditions.duration === duration.id}
                  onSelect={() => setDuration(duration.id)}
                />
              ))}
            </div>
          </fieldset>

          <fieldset className={styles.group}>
            <legend className={styles.legend}>
              취향
              <span className={styles.hint}>복수 선택 가능</span>
            </legend>
            <div className={styles.preferenceGrid}>
              {preferences.map((preference) => (
                <SelectableChip
                  key={preference.id}
                  label={preference.label}
                  selected={conditions.preferences.includes(preference.id)}
                  onSelect={() => togglePreference(preference.id)}
                />
              ))}
            </div>
          </fieldset>
        </form>
      </main>

      <StickyBottomCTA>
        <Button
          type="submit"
          form="travel-plan-form"
          size="large"
          fullWidth
          disabled={!isComplete}
          loading={isSubmitting}
        >
          코스 추천받기
        </Button>
      </StickyBottomCTA>
    </AppShell>
  )
}
