import { describe, it, expect } from 'vitest'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, resolve } from 'path'

describe('One-Color Mode CSS', () => {
  const __dirname = dirname(fileURLToPath(import.meta.url))
  const css = readFileSync(resolve(__dirname, '../index.css'), 'utf-8')

  it('overrides black stone image to white', () => {
    expect(css).toContain('.one-color-mode .shudan-stone-image.shudan-sign_1')
    expect(css).toContain('stone_-1.svg')
  })

  it('overrides black ghost stone to white', () => {
    expect(css).toContain('.one-color-mode .shudan-vertex.shudan-ghost_1')
  })

  it('overrides marker stroke color on black stones', () => {
    expect(css).toContain('.one-color-mode .shudan-vertex.shudan-sign_1 .shudan-marker')
    expect(css).toContain('stroke: var(--shudan-white-foreground-color)')
  })

  it('overrides marker fill color on black stones (point markers)', () => {
    expect(css).toContain('.one-color-mode .shudan-vertex.shudan-marker_point.shudan-sign_1')
    expect(css).toContain('fill: var(--shudan-white-foreground-color)')
  })

  it('overrides marker text color on black stones (label markers)', () => {
    expect(css).toContain('.one-color-mode .shudan-vertex.shudan-marker_label.shudan-sign_1')
    expect(css).toContain('color: var(--shudan-white-foreground-color)')
  })
})
