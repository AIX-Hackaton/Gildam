import type { ReactNode } from 'react'

import styles from './PageHeader.module.css'

interface PageHeaderProps {
  title?: string
  showBack?: boolean
  onBack?: () => void
  rightActions?: ReactNode
}

export function PageHeader({
  title,
  showBack = false,
  onBack,
  rightActions,
}: PageHeaderProps) {
  return (
    <header className={styles.header}>
      <div>
        {showBack ? (
          <button
            className={styles.action}
            type="button"
            aria-label="뒤로 가기"
            onClick={onBack}
          >
            <span aria-hidden="true">←</span>
          </button>
        ) : null}
      </div>
      {title ? (
        <p className={styles.title}>{title}</p>
      ) : (
        <p className={styles.brand}>길담</p>
      )}
      <div className={styles.end}>{rightActions}</div>
    </header>
  )
}
