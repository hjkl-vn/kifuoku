import React, { memo } from 'react'
import PropTypes from 'prop-types'
import { ANNOTATION_TOOLS } from '../game/constants'
import ProgressBar from './ProgressBar'

const BottomBar = memo(function BottomBar({
  canGoPrev,
  canGoNext,
  onPrev,
  onNext,
  current,
  total,
  replaySide,
  selectedTool,
  onSelectTool,
  pendingMove,
  onConfirm,
  onPass,
  isUserTurn
}) {
  const hasNavButtons = onPrev && onNext
  const hasAnnotationTools = onSelectTool !== undefined
  const hasReplayControls = onPass !== undefined

  const toolButtonBase =
    'w-11 h-11 flex items-center justify-center text-xl bg-gray-100 border-2 border-gray-300 rounded-lg cursor-pointer transition-all duration-150 active:bg-blue-50 active:border-primary'
  const navButtonBase =
    'flex-1 py-3.5 px-5 text-base font-bold bg-primary text-white border-none rounded-lg cursor-pointer disabled:bg-gray-300 disabled:cursor-not-allowed active:not-disabled:bg-blue-700'

  return (
    <div className="flex flex-col fixed bottom-0 left-0 right-0 px-4 py-3 bg-white border-t border-gray-300 gap-3 z-[5]">
      <div className="w-full">
        <ProgressBar current={current} total={total} replaySide={replaySide} />
      </div>
      <div className="flex gap-3 items-center">
        {hasReplayControls ? (
          <div className="flex gap-3 flex-1">
            <button
              type="button"
              className="flex-1 py-3.5 px-5 text-base font-bold bg-neutral text-white border-none rounded-lg cursor-pointer hover:not-disabled:bg-gray-500 active:not-disabled:bg-gray-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
              onClick={onPass}
              disabled={!isUserTurn}
            >
              Pass
            </button>
            <button
              type="button"
              className="flex-1 py-3.5 px-5 text-base font-bold bg-success text-white border-none rounded-lg cursor-pointer hover:bg-green-600 active:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
              onClick={onConfirm}
              disabled={!pendingMove}
            >
              Confirm
            </button>
          </div>
        ) : (
          hasNavButtons && (
            <div className="flex gap-3 flex-1">
              <button className={navButtonBase} onClick={onPrev} disabled={!canGoPrev}>
                ◀ Prev
              </button>
              <button className={navButtonBase} onClick={onNext} disabled={!canGoNext}>
                Next ▶
              </button>
            </div>
          )
        )}
        {hasAnnotationTools && !hasReplayControls && (
          <div className="flex gap-1.5">
            {ANNOTATION_TOOLS.map((tool) => (
              <button
                key={tool.id}
                className={[
                  toolButtonBase,
                  selectedTool === tool.id ? 'border-primary bg-primary text-white' : ''
                ]
                  .filter(Boolean)
                  .join(' ')}
                onClick={() => onSelectTool(selectedTool === tool.id ? null : tool.id)}
                title={tool.title}
                aria-pressed={selectedTool === tool.id}
              >
                {tool.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
})

BottomBar.propTypes = {
  canGoPrev: PropTypes.bool,
  canGoNext: PropTypes.bool,
  onPrev: PropTypes.func,
  onNext: PropTypes.func,
  current: PropTypes.number,
  total: PropTypes.number,
  selectedTool: PropTypes.string,
  onSelectTool: PropTypes.func,
  replaySide: PropTypes.oneOf(['B', 'W', null]),
  pendingMove: PropTypes.object,
  onConfirm: PropTypes.func,
  onPass: PropTypes.func,
  isUserTurn: PropTypes.bool
}

export default BottomBar
