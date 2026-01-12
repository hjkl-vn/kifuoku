import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/preact'
import userEvent from '@testing-library/user-event'
import StudyPanel from '../StudyPanel'

describe('StudyPanel', () => {
  const defaultProps = {
    canGoPrev: true,
    canGoNext: true,
    onPrev: vi.fn(),
    onNext: vi.fn(),
    rangeStart: 0,
    rangeEnd: 9,
    totalMoves: 10,
    onRangeChange: vi.fn(),
    onStartReplay: vi.fn(),
    gameInfo: null,
    oneColorMode: false,
    onOneColorModeChange: vi.fn()
  }

  describe('Navigation Buttons', () => {
    it('renders Prev and Next buttons', () => {
      render(<StudyPanel {...defaultProps} />)

      expect(screen.getByRole('button', { name: 'Prev' })).toBeTruthy()
      expect(screen.getByRole('button', { name: 'Next' })).toBeTruthy()
    })

    it('disables Prev button when canGoPrev is false', () => {
      render(<StudyPanel {...defaultProps} canGoPrev={false} />)

      expect(screen.getByRole('button', { name: 'Prev' }).disabled).toBe(true)
    })

    it('enables Prev button when canGoPrev is true', () => {
      render(<StudyPanel {...defaultProps} canGoPrev={true} />)

      expect(screen.getByRole('button', { name: 'Prev' }).disabled).toBe(false)
    })

    it('disables Next button when canGoNext is false', () => {
      render(<StudyPanel {...defaultProps} canGoNext={false} />)

      expect(screen.getByRole('button', { name: 'Next' }).disabled).toBe(true)
    })

    it('enables Next button when canGoNext is true', () => {
      render(<StudyPanel {...defaultProps} canGoNext={true} />)

      expect(screen.getByRole('button', { name: 'Next' }).disabled).toBe(false)
    })

    it('calls onPrev when Prev button is clicked', async () => {
      const onPrev = vi.fn()
      const user = userEvent.setup()
      render(<StudyPanel {...defaultProps} onPrev={onPrev} />)

      await user.click(screen.getByRole('button', { name: 'Prev' }))

      expect(onPrev).toHaveBeenCalledTimes(1)
    })

    it('calls onNext when Next button is clicked', async () => {
      const onNext = vi.fn()
      const user = userEvent.setup()
      render(<StudyPanel {...defaultProps} onNext={onNext} />)

      await user.click(screen.getByRole('button', { name: 'Next' }))

      expect(onNext).toHaveBeenCalledTimes(1)
    })

    it('does not call onPrev when Prev button is disabled and clicked', async () => {
      const onPrev = vi.fn()
      const user = userEvent.setup()
      render(<StudyPanel {...defaultProps} canGoPrev={false} onPrev={onPrev} />)

      await user.click(screen.getByRole('button', { name: 'Prev' }))

      expect(onPrev).not.toHaveBeenCalled()
    })

    it('does not call onNext when Next button is disabled and clicked', async () => {
      const onNext = vi.fn()
      const user = userEvent.setup()
      render(<StudyPanel {...defaultProps} canGoNext={false} onNext={onNext} />)

      await user.click(screen.getByRole('button', { name: 'Next' }))

      expect(onNext).not.toHaveBeenCalled()
    })
  })

  describe('Replay Buttons', () => {
    it('renders Replay All button', () => {
      render(<StudyPanel {...defaultProps} />)

      expect(screen.getByRole('button', { name: 'Replay All' })).toBeTruthy()
    })

    it('renders replay buttons with default player names when gameInfo is null', () => {
      render(<StudyPanel {...defaultProps} gameInfo={null} />)

      expect(screen.getByRole('button', { name: 'Replay as Black' })).toBeTruthy()
      expect(screen.getByRole('button', { name: 'Replay as White' })).toBeTruthy()
    })

    it('renders replay buttons with custom player names from gameInfo', () => {
      const gameInfo = {
        blackPlayer: 'Alice',
        whitePlayer: 'Bob'
      }
      render(<StudyPanel {...defaultProps} gameInfo={gameInfo} />)

      expect(screen.getByRole('button', { name: 'Replay as Alice' })).toBeTruthy()
      expect(screen.getByRole('button', { name: 'Replay as Bob' })).toBeTruthy()
    })

    it('uses default name when blackPlayer is missing from gameInfo', () => {
      const gameInfo = { whitePlayer: 'Bob' }
      render(<StudyPanel {...defaultProps} gameInfo={gameInfo} />)

      expect(screen.getByRole('button', { name: 'Replay as Black' })).toBeTruthy()
      expect(screen.getByRole('button', { name: 'Replay as Bob' })).toBeTruthy()
    })

    it('uses default name when whitePlayer is missing from gameInfo', () => {
      const gameInfo = { blackPlayer: 'Alice' }
      render(<StudyPanel {...defaultProps} gameInfo={gameInfo} />)

      expect(screen.getByRole('button', { name: 'Replay as Alice' })).toBeTruthy()
      expect(screen.getByRole('button', { name: 'Replay as White' })).toBeTruthy()
    })

    it('calls onStartReplay with no args for Replay All button', async () => {
      const onStartReplay = vi.fn()
      const user = userEvent.setup()
      render(<StudyPanel {...defaultProps} onStartReplay={onStartReplay} />)

      await user.click(screen.getByRole('button', { name: 'Replay All' }))

      expect(onStartReplay).toHaveBeenCalledTimes(1)
      expect(onStartReplay).toHaveBeenCalledWith()
    })

    it('calls onStartReplay with "B" for Replay as Black button', async () => {
      const onStartReplay = vi.fn()
      const user = userEvent.setup()
      render(<StudyPanel {...defaultProps} onStartReplay={onStartReplay} />)

      await user.click(screen.getByRole('button', { name: 'Replay as Black' }))

      expect(onStartReplay).toHaveBeenCalledTimes(1)
      expect(onStartReplay).toHaveBeenCalledWith('B')
    })

    it('calls onStartReplay with "W" for Replay as White button', async () => {
      const onStartReplay = vi.fn()
      const user = userEvent.setup()
      render(<StudyPanel {...defaultProps} onStartReplay={onStartReplay} />)

      await user.click(screen.getByRole('button', { name: 'Replay as White' }))

      expect(onStartReplay).toHaveBeenCalledTimes(1)
      expect(onStartReplay).toHaveBeenCalledWith('W')
    })

    it('calls onStartReplay with "B" when clicking custom black player button', async () => {
      const onStartReplay = vi.fn()
      const user = userEvent.setup()
      const gameInfo = { blackPlayer: 'Alice', whitePlayer: 'Bob' }
      render(<StudyPanel {...defaultProps} onStartReplay={onStartReplay} gameInfo={gameInfo} />)

      await user.click(screen.getByRole('button', { name: 'Replay as Alice' }))

      expect(onStartReplay).toHaveBeenCalledTimes(1)
      expect(onStartReplay).toHaveBeenCalledWith('B')
    })

    it('calls onStartReplay with "W" when clicking custom white player button', async () => {
      const onStartReplay = vi.fn()
      const user = userEvent.setup()
      const gameInfo = { blackPlayer: 'Alice', whitePlayer: 'Bob' }
      render(<StudyPanel {...defaultProps} onStartReplay={onStartReplay} gameInfo={gameInfo} />)

      await user.click(screen.getByRole('button', { name: 'Replay as Bob' }))

      expect(onStartReplay).toHaveBeenCalledTimes(1)
      expect(onStartReplay).toHaveBeenCalledWith('W')
    })
  })

  describe('One-color Mode Checkbox', () => {
    it('renders one-color mode checkbox with label', () => {
      render(<StudyPanel {...defaultProps} />)

      expect(screen.getByRole('checkbox')).toBeTruthy()
      expect(screen.getByText('One-color go')).toBeTruthy()
    })

    it('checkbox is unchecked when oneColorMode is false', () => {
      render(<StudyPanel {...defaultProps} oneColorMode={false} />)

      expect(screen.getByRole('checkbox').checked).toBe(false)
    })

    it('checkbox is checked when oneColorMode is true', () => {
      render(<StudyPanel {...defaultProps} oneColorMode={true} />)

      expect(screen.getByRole('checkbox').checked).toBe(true)
    })

    it('calls onOneColorModeChange with true when checkbox is checked', async () => {
      const onOneColorModeChange = vi.fn()
      const user = userEvent.setup()
      render(
        <StudyPanel
          {...defaultProps}
          oneColorMode={false}
          onOneColorModeChange={onOneColorModeChange}
        />
      )

      await user.click(screen.getByRole('checkbox'))

      expect(onOneColorModeChange).toHaveBeenCalledTimes(1)
      expect(onOneColorModeChange).toHaveBeenCalledWith(true)
    })

    it('calls onOneColorModeChange with false when checkbox is unchecked', async () => {
      const onOneColorModeChange = vi.fn()
      const user = userEvent.setup()
      render(
        <StudyPanel
          {...defaultProps}
          oneColorMode={true}
          onOneColorModeChange={onOneColorModeChange}
        />
      )

      await user.click(screen.getByRole('checkbox'))

      expect(onOneColorModeChange).toHaveBeenCalledTimes(1)
      expect(onOneColorModeChange).toHaveBeenCalledWith(false)
    })

    it('checkbox can be toggled by clicking the label', async () => {
      const onOneColorModeChange = vi.fn()
      const user = userEvent.setup()
      render(
        <StudyPanel
          {...defaultProps}
          oneColorMode={false}
          onOneColorModeChange={onOneColorModeChange}
        />
      )

      await user.click(screen.getByText('One-color go'))

      expect(onOneColorModeChange).toHaveBeenCalledTimes(1)
      expect(onOneColorModeChange).toHaveBeenCalledWith(true)
    })
  })

  describe('RangeSlider Integration', () => {
    it('renders the range slider', () => {
      render(<StudyPanel {...defaultProps} totalMoves={10} rangeStart={0} rangeEnd={9} />)

      expect(screen.getByText('10 moves selected (1-10)')).toBeTruthy()
    })

    it('displays correct move count based on range', () => {
      render(<StudyPanel {...defaultProps} totalMoves={20} rangeStart={5} rangeEnd={14} />)

      expect(screen.getByText('10 moves selected (6-15)')).toBeTruthy()
    })
  })
})
