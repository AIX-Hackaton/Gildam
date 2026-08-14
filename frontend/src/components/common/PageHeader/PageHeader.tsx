import type { ReactNode } from 'react'

import styles from './PageHeader.module.css'

interface PageHeaderProps {
  title?: string
  visuallyHiddenTitle?: boolean
  backAlignedToContent?: boolean
  showBack?: boolean
  onBack?: () => void
  rightActions?: ReactNode
}

export function PageHeader({
  title,
  visuallyHiddenTitle = false,
  backAlignedToContent = false,
  showBack = false,
  onBack,
  rightActions,
}: PageHeaderProps) {
  return (
    <header
      className={`${styles.header} ${backAlignedToContent ? styles.backAligned : ''}`}
    >
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
        <p className={visuallyHiddenTitle ? 'sr-only' : styles.title}>{title}</p>
      ) : (
        <p className={styles.brand}>길담</p>
      )}
      <div className={styles.end}>{rightActions}</div>
    </header>
  )
}
