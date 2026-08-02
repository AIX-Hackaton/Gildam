import styles from './SelectableChip.module.css'

interface SelectableChipProps {
  label: string
  selected: boolean
  onSelect: () => void
}

export function SelectableChip({
  label,
  selected,
  onSelect,
}: SelectableChipProps) {
  return (
    <button
      className={`${styles.chip} ${selected ? styles.selected : ''}`}
      type="button"
      aria-pressed={selected}
      onClick={onSelect}
    >
      <span>{label}</span>
    </button>
  )
}
