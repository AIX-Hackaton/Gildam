import type { ReactNode } from 'react'

import styles from './StickyBottomCTA.module.css'

interface StickyBottomCTAProps {
  children: ReactNode
  className?: string
}

export function StickyBottomCTA({
  children,
  className = '',
}: StickyBottomCTAProps) {
  return (
    <div className={`${styles.bar} ${className}`}>
      <div className={styles.actions}>{children}</div>
    </div>
  )
}
