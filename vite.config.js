import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      'preact/hooks': path.resolve('./node_modules/react'),
      'preact': path.resolve('./node_modules/react')
    }
  },
  server: {
    port: 3000
  }
})
