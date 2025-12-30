import React from 'react'
import { ANNOTATION_TOOLS } from '../game/constants'
import ProgressBar from './ProgressBar'
import styles from '../styles/BottomBar.module.css'

export default function BottomBar({
  canGoPrev,
  canGoNext,
  onPrev,
  onNext,
  current,
  total,
  selectedTool,
  onSelectTool,
  pendingMove,
  onConfirm,
  onCancel
}) {
  const hasNavButtons = onPrev && onNext
  const hasAnnotationTools = onSelectTool !== undefined
  const hasConfirmCancel = pendingMove && onConfirm && onCancel

  return (
    <div className={styles.container}>
      <div className={styles.progressWrapper}>
        <ProgressBar current={current} total={total} />
      </div>
      <div className={styles.controls}>
        {hasAnnotationTools && !hasConfirmCancel && (
          <div className={styles.tools}>
            {ANNOTATION_TOOLS.map((tool) => (
              <button
                key={tool.id}
                className={[styles.toolButton, selectedTool === tool.id ? styles.toolSelected : '']
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
        {hasConfirmCancel ? (
          <div className={styles.buttons}>
            <button className={styles.cancelButton} onClick={onCancel}>
              Cancel
            </button>
            <button className={styles.confirmButton} onClick={onConfirm}>
              Confirm
            </button>
          </div>
        ) : (
          hasNavButtons && (
            <div className={styles.buttons}>
              <button className={styles.button} onClick={onPrev} disabled={!canGoPrev}>
                ◀ Prev
              </button>
              <button className={styles.button} onClick={onNext} disabled={!canGoNext}>
                Next ▶
              </button>
            </div>
          )
        )}
      </div>
    </div>
  )
}
