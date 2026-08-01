import { SelectableChip } from '../../common/SelectableChip/SelectableChip.tsx'
import styles from './ConditionGroup.module.css'

interface ConditionOption<T extends string> {
  id: T
  label: string
}

interface ConditionGroupProps<T extends string> {
  legend: string
  hint?: string
  options: Array<ConditionOption<T>>
  isSelected: (id: T) => boolean
  onSelect: (id: T) => void
}

export function ConditionGroup<T extends string>({
  legend,
  hint,
  options,
  isSelected,
  onSelect,
}: ConditionGroupProps<T>) {
  return (
    <fieldset className={styles.group}>
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
    </fieldset>
  )
}
