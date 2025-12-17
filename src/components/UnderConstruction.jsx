import styles from '../styles/UnderConstruction.module.css'

export default function UnderConstruction({ title }) {
  return (
    <div className={styles.container}>
      <h1 className={styles.title}>{title}</h1>
      <p className={styles.message}>This feature is coming soon.</p>
    </div>
  )
}
