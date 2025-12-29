import React from 'react'
import ProgressBar from './ProgressBar'
import styles from '../styles/BottomBar.module.css'

const TOOLS = [
  { id: 'circle', label: '○', title: 'Circle' },
  { id: 'triangle', label: '△', title: 'Triangle' },
  { id: 'label', label: 'A', title: 'Label' }
]

export default function BottomBar({
  canGoPrev,
  canGoNext,
  onPrev,
  onNext,
  current,
  total,
  selectedTool,
  onSelectTool
}) {
  const hasNavButtons = onPrev && onNext
  const hasAnnotationTools = onSelectTool !== undefined

  return (
    <div className={styles.container}>
      <div className={styles.progressWrapper}>
        <ProgressBar current={current} total={total} />
      </div>
      <div className={styles.controls}>
        {hasAnnotationTools && (
          <div className={styles.tools}>
            {TOOLS.map((tool) => (
              <button
                key={tool.id}
                className={[styles.toolButton, selectedTool === tool.id ? styles.toolSelected : '']
                  .filter(Boolean)
                  .join(' ')}
                onClick={() => onSelectTool(selectedTool === tool.id ? null : tool.id)}
                title={tool.title}
              >
                {tool.label}
              </button>
            ))}
          </div>
        )}
        {hasNavButtons && (
          <div className={styles.buttons}>
            <button className={styles.button} onClick={onPrev} disabled={!canGoPrev}>
              ◀ Prev
            </button>
            <button className={styles.button} onClick={onNext} disabled={!canGoNext}>
              Next ▶
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
