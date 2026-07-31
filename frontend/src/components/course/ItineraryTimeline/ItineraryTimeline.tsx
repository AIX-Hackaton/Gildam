import type { ItineraryItem } from '../../../types/course.ts'
import styles from './ItineraryTimeline.module.css'

const itineraryTypeLabels: Record<ItineraryItem['type'], string> = {
  transport: '이동',
  place: '장소',
  food: '식사',
}

interface ItineraryTimelineProps {
  items: ItineraryItem[]
}

export function ItineraryTimeline({ items }: ItineraryTimelineProps) {
  return (
    <ol className={styles.timeline}>
      {items.map((item) => (
        <li key={item.id}>
          <div className={styles.marker} aria-hidden="true" />
          <div className={styles.content}>
            <div className={styles.meta}>
              <span className={styles.time}>{item.time}</span>
              <span className={styles.type}>
                {itineraryTypeLabels[item.type]}
              </span>
              {item.durationMinutes ? (
                <span className={styles.duration}>{item.durationMinutes}분</span>
              ) : null}
            </div>
            <h3>{item.name}</h3>
            {item.note ? <p>{item.note}</p> : null}
          </div>
        </li>
      ))}
    </ol>
  )
}
