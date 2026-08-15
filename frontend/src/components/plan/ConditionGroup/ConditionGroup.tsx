import { SelectableChip } from '../../common/SelectableChip/SelectableChip.tsx'
import styles from './ConditionGroup.module.css'

interface ConditionOption<T extends string> {
  id: T
  label: string
  hint?: string
}

interface ConditionGroupProps<T extends string> {
  legend: string
  hint?: string
  options: Array<ConditionOption<T>>
  isSelected: (id: T) => boolean
  onSelect: (id: T) => void
  error?: string
}

export function ConditionGroup<T extends string>({
  legend,
  hint,
  options,
  isSelected,
  onSelect,
  error,
}: ConditionGroupProps<T>) {
  const errorId = error ? `${legend}-error` : undefined

  return (
    <fieldset
      className={styles.group}
      aria-invalid={error ? true : undefined}
      aria-describedby={errorId}
    >
      <legend className={styles.legend}>
        {legend}
        {hint ? <span className={styles.hint}>{hint}</span> : null}
      </legend>
      <div className={styles.options}>
        {options.map((option) => (
          <SelectableChip
            key={option.id}
            label={option.label}
            selected={isSelected(option.id)}
            onSelect={() => onSelect(option.id)}
          />
        ))}
      </div>
      {error ? (
        <p className={styles.error} id={errorId} role="alert">
          {error}
        </p>
      ) : null}
    </fieldset>
  )
}
