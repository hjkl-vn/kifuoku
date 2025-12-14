import React from 'react'

export default function GameInfo({ gameInfo }) {
  if (!gameInfo) return null

  const hasInfo = gameInfo.blackPlayer || gameInfo.whitePlayer ||
                  gameInfo.gameName || gameInfo.date ||
                  gameInfo.result || gameInfo.rules

  if (!hasInfo) return null

  return (
    <div style={styles.container}>
      {gameInfo.gameName && (
        <div style={styles.gameName}>{gameInfo.gameName}</div>
      )}

      {(gameInfo.blackPlayer || gameInfo.whitePlayer) && (
        <div style={styles.players}>
          {gameInfo.blackPlayer && (
            <div style={styles.player}>
              <span style={styles.stoneBlack}>●</span>
              <span>{gameInfo.blackPlayer}</span>
              {gameInfo.blackRank && (
                <span style={styles.rank}>{gameInfo.blackRank}</span>
              )}
            </div>
          )}
          {gameInfo.whitePlayer && (
            <div style={styles.player}>
              <span style={styles.stoneWhite}>○</span>
              <span>{gameInfo.whitePlayer}</span>
              {gameInfo.whiteRank && (
                <span style={styles.rank}>{gameInfo.whiteRank}</span>
              )}
            </div>
          )}
        </div>
      )}

      <div style={styles.details}>
        {gameInfo.date && (
          <div style={styles.detailRow}>
            <span style={styles.label}>Date:</span>
            <span>{gameInfo.date}</span>
          </div>
        )}
        {gameInfo.result && (
          <div style={styles.detailRow}>
            <span style={styles.label}>Result:</span>
            <span>{gameInfo.result}</span>
          </div>
        )}
        {gameInfo.rules && (
          <div style={styles.detailRow}>
            <span style={styles.label}>Rules:</span>
            <span>{gameInfo.rules}</span>
          </div>
        )}
      </div>
    </div>
  )
}

const styles = {
  container: {
    backgroundColor: '#f5f5f5',
    borderRadius: '8px',
    padding: '15px',
    fontSize: '14px'
  },
  gameName: {
    fontWeight: 'bold',
    fontSize: '16px',
    marginBottom: '10px'
  },
  players: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    marginBottom: '10px'
  },
  player: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  },
  stoneBlack: {
    fontSize: '18px'
  },
  stoneWhite: {
    fontSize: '18px'
  },
  rank: {
    color: '#666',
    fontSize: '13px'
  },
  details: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    borderTop: '1px solid #ddd',
    paddingTop: '10px'
  },
  detailRow: {
    display: 'flex',
    gap: '8px'
  },
  label: {
    color: '#666',
    minWidth: '50px'
  }
}
