import type { ReactNode } from 'react'

import styles from './StickyBottomCTA.module.css'

interface StickyBottomCTAProps {
  children: ReactNode
}

export function StickyBottomCTA({ children }: StickyBottomCTAProps) {
  return (
    <div className={styles.bar}>
      <div className={styles.actions}>{children}</div>
    </div>
  )
}
