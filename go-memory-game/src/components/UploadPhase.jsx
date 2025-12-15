import React, { useState } from 'react'
import styles from './UploadPhase.module.css'

export default function UploadPhase({ onFileLoaded }) {
  const [dragOver, setDragOver] = useState(false)
  const [error, setError] = useState(null)

  const handleFile = async (file) => {
    setError(null)

    if (!file.name.endsWith('.sgf')) {
      setError('Please upload a .sgf file')
      return
    }

    try {
      const text = await file.text()
      onFileLoaded(text)
    } catch (err) {
      setError(`Failed to read file: ${err.message}`)
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setDragOver(false)

    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  const handleFileInput = (e) => {
    const file = e.target.files[0]
    if (file) handleFile(file)
  }

  const dropZoneClass = [
    styles.dropZone,
    dragOver ? styles.dropZoneActive : ''
  ].filter(Boolean).join(' ')

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Go Memory Replay Game</h1>

      <div
        className={dropZoneClass}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
      >
        <p className={styles.dropText}>
          Drop SGF file here
        </p>
        <p className={styles.orText}>or</p>
        <label className={styles.button}>
          Choose File
          <input
            type="file"
            accept=".sgf"
            onChange={handleFileInput}
            className={styles.fileInput}
          />
        </label>
      </div>

      {error && (
        <p className={styles.error}>{error}</p>
      )}

      <div className={styles.info}>
        <p><strong>How to play:</strong></p>
        <ol>
          <li>Upload a game (SGF format, 19×19 only)</li>
          <li>Study the game using prev/next buttons (or arrow keys)</li>
          <li>Replay the game from memory</li>
          <li>You'll get hints when you make mistakes</li>
        </ol>
      </div>
    </div>
  )
}
