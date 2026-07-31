import styles from './CourseCardSkeleton.module.css'

export function CourseCardSkeleton() {
  return (
    <section className={styles.skeleton} aria-live="polite">
      <span className="sr-only">추천 코스를 불러오는 중입니다.</span>
      <div className={styles.image} />
      <div className={styles.line} />
      <div className={styles.shortLine} />
    </section>
  )
}
