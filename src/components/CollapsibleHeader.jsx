import React, { useState } from 'react'
import GameInfo from './GameInfo'
import RangeSlider from './RangeSlider'
import styles from './CollapsibleHeader.module.css'
import buttons from '../styles/buttons.module.css'

export default function CollapsibleHeader({
  gameInfo,
  phase,
  totalMoves,
  rangeStart,
  rangeEnd,
  onRangeChange,
  onStartReplay,
  stats
}) {
  const [isExpanded, setIsExpanded] = useState(false)

  const playerSummary = gameInfo
    ? `${gameInfo.blackPlayer || 'Black'} vs ${gameInfo.whitePlayer || 'White'}`
    : 'Game'

  return (
    <div className={styles.container}>
      <button
        className={styles.headerBar}
        onClick={() => setIsExpanded(!isExpanded)}
        aria-expanded={isExpanded}
      >
        <span className={styles.arrow}>{isExpanded ? '▲' : '▼'}</span>
        <span className={styles.summary}>{playerSummary}</span>
      </button>

      {isExpanded && (
        <>
          <div
            className={styles.overlay}
            onClick={() => setIsExpanded(false)}
          />
          <div className={styles.dropdown}>
            <GameInfo gameInfo={gameInfo} />

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
                  onClick={() => {
                    onStartReplay()
                    setIsExpanded(false)
                  }}
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
          </div>
        </>
      )}
    </div>
  )
}
