import React from 'react'
import styles from '../styles/BottomBar.module.css'

export default function BottomBar({ canGoPrev, canGoNext, onPrev, onNext }) {
  return (
    <div className={styles.container}>
      <button
        className={styles.button}
        onClick={onPrev}
        disabled={!canGoPrev}
      >
        ◀ Prev
      </button>
      <button
        className={styles.button}
        onClick={onNext}
        disabled={!canGoNext}
      >
        Next ▶
      </button>
    </div>
  )
}
