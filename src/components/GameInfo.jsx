import React from 'react'

export default function GameInfo({ gameInfo, currentTurn }) {
  if (!gameInfo) return null

  const hasInfo =
    gameInfo.blackPlayer ||
    gameInfo.whitePlayer ||
    gameInfo.gameName ||
    gameInfo.date ||
    gameInfo.result ||
    gameInfo.rules ||
    gameInfo.handicap ||
    gameInfo.komi !== null ||
    gameInfo.sourceUrl

  if (!hasInfo) return null

  return (
    <div className="bg-gray-100 rounded-lg p-4 text-sm">
      {gameInfo.gameName && <div className="font-bold text-base mb-2.5">{gameInfo.gameName}</div>}

      {(gameInfo.blackPlayer || gameInfo.whitePlayer) && (
        <div className="flex flex-col gap-1.5 mb-2.5">
          {gameInfo.blackPlayer && (
            <div
              className={[
                'flex items-center gap-2 py-1 px-2 rounded transition-colors duration-200',
                currentTurn === 'B' ? 'bg-blue-100 font-medium' : ''
              ]
                .filter(Boolean)
                .join(' ')}
            >
              <span className="text-2xl">●</span>
              <span>{gameInfo.blackPlayer}</span>
              {gameInfo.blackRank && (
                <span className="text-gray-500 text-[13px]">{gameInfo.blackRank}</span>
              )}
            </div>
          )}
          {gameInfo.whitePlayer && (
            <div
              className={[
                'flex items-center gap-2 py-1 px-2 rounded transition-colors duration-200',
                currentTurn === 'W' ? 'bg-blue-100 font-medium' : ''
              ]
                .filter(Boolean)
                .join(' ')}
            >
              <span className="text-2xl">○</span>
              <span>{gameInfo.whitePlayer}</span>
              {gameInfo.whiteRank && (
                <span className="text-gray-500 text-[13px]">{gameInfo.whiteRank}</span>
              )}
            </div>
          )}
        </div>
      )}

      <div className="flex flex-col gap-1 border-t border-gray-300 pt-2.5">
        {gameInfo.date && (
          <div className="flex items-baseline gap-2">
            <span className="text-gray-500 min-w-[50px] text-sm">Date:</span>
            <span>{gameInfo.date}</span>
          </div>
        )}
        {gameInfo.result && (
          <div className="flex items-baseline gap-2">
            <span className="text-gray-500 min-w-[50px] text-sm">Result:</span>
            <span>{gameInfo.result}</span>
          </div>
        )}
        {gameInfo.rules && (
          <div className="flex items-baseline gap-2">
            <span className="text-gray-500 min-w-[50px] text-sm">Rules:</span>
            <span>{gameInfo.rules}</span>
          </div>
        )}
        {gameInfo.handicap && (
          <div className="flex items-baseline gap-2">
            <span className="text-gray-500 min-w-[50px] text-sm">Handicap:</span>
            <span>{gameInfo.handicap} stones</span>
          </div>
        )}
        {gameInfo.komi !== null && (
          <div className="flex items-baseline gap-2">
            <span className="text-gray-500 min-w-[50px] text-sm">Komi:</span>
            <span>{gameInfo.komi}</span>
          </div>
        )}
        {gameInfo.sourceUrl && (
          <div className="flex items-baseline gap-2">
            <span className="text-gray-500 min-w-[50px] text-sm">Source:</span>
            <a
              href={gameInfo.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 no-underline text-sm hover:underline"
            >
              View game ↗
            </a>
          </div>
        )}
      </div>
    </div>
  )
}
