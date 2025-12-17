import React from 'react'
import styles from '../styles/CompletionModal.module.css'
import buttons from '../styles/buttons.module.css'

function getAccuracyClass(accuracy) {
  if (accuracy >= 90) return styles.accuracyExcellent
  if (accuracy >= 70) return styles.accuracyGood
  if (accuracy >= 50) return styles.accuracyFair
  return styles.accuracyPoor
}

export default function CompletionModal({ stats, onRestart, onGoHome }) {
  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <h1 className={styles.title}>Game Complete!</h1>

        <div className={styles.statsGrid}>
          <div className={styles.statItem}>
            <span className={styles.statValue}>{stats.totalMoves}</span>
            <span className={styles.statLabel}>Moves</span>
          </div>
          <div className={styles.statItem}>
            <span className={[styles.statValue, getAccuracyClass(stats.accuracy)].join(' ')}>
              {stats.accuracy}%
            </span>
            <span className={styles.statLabel}>Accuracy</span>
          </div>
          <div className={styles.statItem}>
            <span className={styles.statValue}>{stats.totalTimeFormatted}s</span>
            <span className={styles.statLabel}>Total Time</span>
          </div>
          <div className={styles.statItem}>
            <span className={styles.statValue}>{stats.avgTimeFormatted}s</span>
            <span className={styles.statLabel}>Avg per Move</span>
          </div>
        </div>

        <div className={styles.details}>
          <div className={styles.detailRow}>
            <span>Correct (1st try)</span>
            <span className={styles.correctValue}>{stats.correctFirstTry}</span>
          </div>
          <div className={styles.detailRow}>
            <span>Wrong attempts</span>
            <span className={styles.wrongValue}>{stats.wrongMoveCount}</span>
          </div>
        </div>

        <div className={styles.actions}>
          <button className={buttons.button} onClick={onRestart}>
            Play Again
          </button>
          <button className={buttons.primaryButton} onClick={onGoHome}>
            New Game
          </button>
        </div>
      </div>
    </div>
  )
}
