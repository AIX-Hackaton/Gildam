import styles from './CourseInfoCard.module.css'

interface CourseInfoCardProps {
  label: string
  title: string
  description: string
}

export function CourseInfoCard({
  label,
  title,
  description,
}: CourseInfoCardProps) {
  return (
    <section className={styles.card}>
      <p className={styles.label}>{label}</p>
      <h2>{title}</h2>
      <p className={styles.description}>{description}</p>
    </section>
  )
}
