import React from 'react'
import ProgressBar from './ProgressBar'
import styles from '../styles/BottomBar.module.css'

export default function BottomBar({ canGoPrev, canGoNext, onPrev, onNext, current, total }) {
  const hasButtons = onPrev && onNext

  return (
    <div className={styles.container}>
      <div className={styles.progressWrapper}>
        <ProgressBar current={current} total={total} />
      </div>
      {hasButtons && (
        <div className={styles.buttons}>
          <button className={styles.button} onClick={onPrev} disabled={!canGoPrev}>
            ◀ Prev
          </button>
          <button className={styles.button} onClick={onNext} disabled={!canGoNext}>
            Next ▶
          </button>
        </div>
      )}
    </div>
  )
}
