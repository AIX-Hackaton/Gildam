import type { ButtonHTMLAttributes, ReactNode } from 'react'

import styles from './IconButton.module.css'

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  label: string
  icon: ReactNode
  variant?: 'default' | 'outline'
  selected?: boolean
}

export function IconButton({
  label,
  icon,
  variant = 'default',
  selected = false,
  className = '',
  ...props
}: IconButtonProps) {
  const classes = [
    styles.button,
    variant === 'outline' ? styles.outline : '',
    selected ? styles.selected : '',
    className,
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <button className={classes} type="button" aria-label={label} {...props}>
      <span className={styles.icon} aria-hidden="true">
        {icon}
      </span>
    </button>
  )
}
