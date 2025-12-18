import React, { useState } from 'react'
import { isValidOgsUrl, extractGameId, fetchOgsSgf } from '../lib/ogs.js'
import styles from '../styles/UploadPhase.module.css'

export default function UploadPhase({ onFileLoaded }) {
  const [dragOver, setDragOver] = useState(false)
  const [error, setError] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [urlValue, setUrlValue] = useState('')

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

  const handleUrlPaste = async (e) => {
    const text = e.clipboardData.getData('text')
    if (!text) return

    setError(null)

    if (!isValidOgsUrl(text)) {
      setError('Please enter a valid online-go.com game URL')
      return
    }

    const gameId = extractGameId(text)
    setIsLoading(true)

    try {
      const sgf = await fetchOgsSgf(gameId)
      setUrlValue('')
      onFileLoaded(sgf)
    } catch (err) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  const dropZoneClass = [
    styles.dropZone,
    dragOver ? styles.dropZoneActive : '',
    isLoading ? styles.disabled : ''
  ].filter(Boolean).join(' ')

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Kifu-oku (棋譜憶)</h1>
      <div
        className={dropZoneClass}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={isLoading ? undefined : handleDrop}
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
            disabled={isLoading}
          />
        </label>
      </div>

      <p className={styles.divider}>─── or ───</p>

      <input
        type="text"
        className={styles.urlInput}
        placeholder="Paste online-go.com link here"
        value={urlValue}
        onChange={(e) => setUrlValue(e.target.value)}
        onPaste={handleUrlPaste}
        disabled={isLoading}
      />

      {isLoading && (
        <p className={styles.loading}>Loading game from OGS...</p>
      )}

      {error && (
        <p className={styles.error}>{error}</p>
      )}

      <div className={styles.info}>
        <p><strong>How to play:</strong></p>
        <ol>
          <li>Upload a Go game (SGF format)</li>
          <li>Study the game using prev/next buttons (or arrow keys)</li>
          <li>Replay the game from memory</li>
          <li>You'll get hints when you make mistakes</li>
        </ol>
      </div>
    </div>
  )
}
