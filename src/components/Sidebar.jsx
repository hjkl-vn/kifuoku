import React from 'react'
import GameInfo from './GameInfo'
import RangeSlider from './RangeSlider'
import styles from '../styles/Sidebar.module.css'
import buttons from '../styles/buttons.module.css'

export default function Sidebar({
  gameInfo,
  phase,
  canGoPrev,
  canGoNext,
  onPrev,
  onNext,
  totalMoves,
  rangeStart,
  rangeEnd,
  onRangeChange,
  onStartReplay,
  stats
}) {
  return (
    <aside className={styles.sidebar}>
      <GameInfo gameInfo={gameInfo} />

      {phase === 'study' && (
        <div className={styles.section}>
          <div className={buttons.controls}>
            <button
              className={buttons.buttonFlex}
              onClick={onPrev}
              disabled={!canGoPrev}
            >
              Prev
            </button>
            <button
              className={buttons.buttonFlex}
              onClick={onNext}
              disabled={!canGoNext}
            >
              Next
            </button>
          </div>
        </div>
      )}

      {phase === 'study' && (
        <div className={styles.section}>
          <RangeSlider
            min={0}
            max={totalMoves - 1}
            start={rangeStart}
            end={rangeEnd}
            onChange={onRangeChange}
          />
          <button
            className={buttons.primaryButton}
            onClick={onStartReplay}
          >
            Start Replay
          </button>
        </div>
      )}

      {phase === 'replay' && stats && (
        <div className={styles.statsBox}>
          <div className={styles.statRow}>
            <span>Correct (1st try)</span>
            <span>{stats.correctFirstTry}</span>
          </div>
          <div className={styles.statRow}>
            <span>Wrong attempts</span>
            <span>{stats.wrongMoveCount}</span>
          </div>
        </div>
      )}
    </aside>
  )
}
