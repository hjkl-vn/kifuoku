import React from 'react'
import ProgressBar from './ProgressBar'
import RangeSlider from './RangeSlider'
import styles from '../styles/RightPanel.module.css'
import buttons from '../styles/Buttons.module.css'

export default function RightPanel({
  phase,
  current,
  total,
  canGoPrev,
  canGoNext,
  onPrev,
  onNext,
  rangeStart,
  rangeEnd,
  totalMoves,
  onRangeChange,
  onStartReplay,
  gameInfo,
  replaySide,
  stats,
  difficultMoves,
  onSelectDifficultMove,
  selectedMoveIndex,
  onRestart,
  onGoHome,
  onPass,
  isUserTurn
}) {
  return (
    <aside className={styles.panel}>
      <div className={styles.section}>
        <ProgressBar current={current} total={total} />
      </div>

      {phase === 'study' && (
        <>
          <div className={[styles.section, buttons.controls].join(' ')}>
            <button className={buttons.buttonFlex} onClick={onPrev} disabled={!canGoPrev}>
              Prev
            </button>
            <button className={buttons.buttonFlex} onClick={onNext} disabled={!canGoNext}>
              Next
            </button>
          </div>
          <div className={styles.section}>
            <RangeSlider
              min={0}
              max={totalMoves - 1}
              start={rangeStart}
              end={rangeEnd}
              onChange={onRangeChange}
            />
            <div className={buttons.replayButtonGroup}>
              <button className={buttons.primaryButton} onClick={() => onStartReplay()}>
                Replay All
              </button>
              <button className={buttons.replayAsBlack} onClick={() => onStartReplay('B')}>
                Replay as {gameInfo?.blackPlayer || 'Black'}
              </button>
              <button className={buttons.replayAsWhite} onClick={() => onStartReplay('W')}>
                Replay as {gameInfo?.whitePlayer || 'White'}
              </button>
            </div>
          </div>
        </>
      )}

      {phase === 'replay' && stats && (
        <>
          {replaySide && (
            <div className={styles.playingAs}>
              Playing as {replaySide === 'B' ? 'Black' : 'White'}
            </div>
          )}
          <div className={styles.section}>
            <button
              type="button"
              className={styles.passButton}
              onClick={onPass}
              disabled={!isUserTurn}
            >
              Pass
            </button>
          </div>
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
        </>
      )}

      {phase === 'complete' && (
        <>
          <div className={styles.completionStats}>
            <div className={styles.bigStat}>
              <span className={styles.bigStatValue}>{stats?.accuracy}%</span>
              <span className={styles.bigStatLabel}>Accuracy</span>
            </div>
            <div className={styles.statRow}>
              <span>Total time</span>
              <span>{stats?.totalTimeFormatted}s</span>
            </div>
            <div className={styles.statRow}>
              <span>Avg per move</span>
              <span>{stats?.avgTimeFormatted}s</span>
            </div>
          </div>

          {difficultMoves && difficultMoves.length > 0 && (
            <div className={styles.section}>
              <h3 className={styles.sectionTitle}>Mistakes</h3>
              <ul className={styles.difficultList}>
                {difficultMoves.map((move) => (
                  <li key={move.moveIndex}>
                    <button
                      className={[
                        styles.difficultItem,
                        selectedMoveIndex === move.moveIndex ? styles.selected : ''
                      ]
                        .filter(Boolean)
                        .join(' ')}
                      onClick={() => onSelectDifficultMove(move)}
                    >
                      <span>Move {move.moveIndex + 1}</span>
                      <span className={styles.attemptBadge}>
                        {move.attemptCount} {move.attemptCount === 1 ? 'attempt' : 'attempts'}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className={styles.actions}>
            <button className={buttons.button} onClick={onRestart}>
              Play Again
            </button>
            <button className={buttons.primaryButton} onClick={onGoHome}>
              New Game
            </button>
          </div>
        </>
      )}
    </aside>
  )
}
