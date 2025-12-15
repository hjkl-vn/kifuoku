import React from 'react'
import styles from './ProgressBar.module.css'

export default function ProgressBar({ current, total }) {
  const percentage = total > 0 ? (current / total) * 100 : 0

  return (
    <div className={styles.container}>
      <div className={styles.barBackground}>
        <div className={styles.barFill} style={{ width: `${percentage}%` }} />
      </div>
      <div className={styles.text}>
        {current} / {total}
      </div>
    </div>
  )
}
