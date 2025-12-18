import React from 'react'
import styles from '../styles/GameInfo.module.css'

export default function GameInfo({ gameInfo, currentTurn }) {
  if (!gameInfo) return null

  const hasInfo =
    gameInfo.blackPlayer ||
    gameInfo.whitePlayer ||
    gameInfo.gameName ||
    gameInfo.date ||
    gameInfo.result ||
    gameInfo.rules

  if (!hasInfo) return null

  return (
    <div className={styles.container}>
      {gameInfo.gameName && <div className={styles.gameName}>{gameInfo.gameName}</div>}

      {(gameInfo.blackPlayer || gameInfo.whitePlayer) && (
        <div className={styles.players}>
          {gameInfo.blackPlayer && (
            <div
              className={[styles.player, currentTurn === 'B' ? styles.activeTurn : '']
                .filter(Boolean)
                .join(' ')}
            >
              <span className={styles.stoneBlack}>●</span>
              <span>{gameInfo.blackPlayer}</span>
              {gameInfo.blackRank && <span className={styles.rank}>{gameInfo.blackRank}</span>}
            </div>
          )}
          {gameInfo.whitePlayer && (
            <div
              className={[styles.player, currentTurn === 'W' ? styles.activeTurn : '']
                .filter(Boolean)
                .join(' ')}
            >
              <span className={styles.stoneWhite}>○</span>
              <span>{gameInfo.whitePlayer}</span>
              {gameInfo.whiteRank && <span className={styles.rank}>{gameInfo.whiteRank}</span>}
            </div>
          )}
        </div>
      )}

      <div className={styles.details}>
        {gameInfo.date && (
          <div className={styles.detailRow}>
            <span className={styles.label}>Date:</span>
            <span>{gameInfo.date}</span>
          </div>
        )}
        {gameInfo.result && (
          <div className={styles.detailRow}>
            <span className={styles.label}>Result:</span>
            <span>{gameInfo.result}</span>
          </div>
        )}
        {gameInfo.rules && (
          <div className={styles.detailRow}>
            <span className={styles.label}>Rules:</span>
            <span>{gameInfo.rules}</span>
          </div>
        )}
      </div>
    </div>
  )
}
