import React, { useState } from 'react'

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

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Go Memory Replay Game</h1>

      <div
        style={{
          ...styles.dropZone,
          ...(dragOver ? styles.dropZoneActive : {})
        }}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
      >
        <p style={styles.dropText}>
          Drop SGF file here
        </p>
        <p style={styles.orText}>or</p>
        <label style={styles.button}>
          Choose File
          <input
            type="file"
            accept=".sgf"
            onChange={handleFileInput}
            style={styles.fileInput}
          />
        </label>
      </div>

      {error && (
        <p style={styles.error}>{error}</p>
      )}

      <div style={styles.info}>
        <p><strong>How to play:</strong></p>
        <ol>
          <li>Upload a Go game (SGF format, 19×19 only)</li>
          <li>Study the game using prev/next buttons</li>
          <li>Replay moves from memory</li>
          <li>Get hints when you make mistakes</li>
        </ol>
      </div>
    </div>
  )
}

const styles = {
  container: {
    maxWidth: '600px',
    margin: '50px auto',
    padding: '20px',
    fontFamily: 'sans-serif'
  },
  title: {
    textAlign: 'center',
    fontSize: '32px',
    marginBottom: '30px'
  },
  dropZone: {
    border: '3px dashed #ccc',
    borderRadius: '10px',
    padding: '60px 20px',
    textAlign: 'center',
    backgroundColor: '#f9f9f9',
    transition: 'all 0.2s'
  },
  dropZoneActive: {
    borderColor: '#4CAF50',
    backgroundColor: '#e8f5e9'
  },
  dropText: {
    fontSize: '18px',
    color: '#666',
    margin: '0 0 10px 0'
  },
  orText: {
    fontSize: '14px',
    color: '#999',
    margin: '10px 0'
  },
  button: {
    display: 'inline-block',
    padding: '12px 30px',
    backgroundColor: '#4CAF50',
    color: 'white',
    borderRadius: '5px',
    cursor: 'pointer',
    fontSize: '16px',
    fontWeight: 'bold',
    transition: 'background-color 0.2s'
  },
  fileInput: {
    display: 'none'
  },
  error: {
    color: '#f44336',
    textAlign: 'center',
    marginTop: '20px',
    fontSize: '14px'
  },
  info: {
    marginTop: '40px',
    padding: '20px',
    backgroundColor: '#e3f2fd',
    borderRadius: '5px',
    fontSize: '14px',
    lineHeight: '1.6'
  }
}
