import styles from './CourseInfoCard.module.css'

interface CourseInfoCardProps {
  label: string
  title?: string
  description?: string
  items?: string[]
}

export function CourseInfoCard({
  label,
  title,
  description,
  items,
}: CourseInfoCardProps) {
  return (
    <section className={styles.card}>
      <p className={styles.label}>{label}</p>
      {title ? <h2>{title}</h2> : null}
      {description ? (
        <p className={styles.description}>{description}</p>
      ) : null}
      {items?.length ? (
        <ul className={styles.items}>
          {items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      ) : null}
    </section>
  )
}
