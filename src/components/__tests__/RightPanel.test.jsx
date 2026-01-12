import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/preact'
import userEvent from '@testing-library/user-event'
import RightPanel from '../RightPanel'

describe('RightPanel', () => {
  const defaultProps = {
    phase: 'study',
    current: 5,
    total: 10,
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
    replaySide: null,
    stats: null,
    difficultMoves: null,
    onSelectDifficultMove: vi.fn(),
    selectedMoveIndex: null,
    onRestart: vi.fn(),
    onGoHome: vi.fn(),
    onPass: vi.fn(),
    isUserTurn: true,
    oneColorMode: false,
    onOneColorModeChange: vi.fn()
  }

  describe('Study Phase', () => {
    it('renders navigation buttons (Prev/Next)', () => {
      render(<RightPanel {...defaultProps} />)

      expect(screen.getByRole('button', { name: 'Prev' })).toBeTruthy()
      expect(screen.getByRole('button', { name: 'Next' })).toBeTruthy()
    })

    it('disables Prev button when canGoPrev is false', () => {
      render(<RightPanel {...defaultProps} canGoPrev={false} />)

      expect(screen.getByRole('button', { name: 'Prev' }).disabled).toBe(true)
    })

    it('disables Next button when canGoNext is false', () => {
      render(<RightPanel {...defaultProps} canGoNext={false} />)

      expect(screen.getByRole('button', { name: 'Next' }).disabled).toBe(true)
    })

    it('calls onPrev when Prev button is clicked', async () => {
      const onPrev = vi.fn()
      const user = userEvent.setup()
      render(<RightPanel {...defaultProps} onPrev={onPrev} />)

      await user.click(screen.getByRole('button', { name: 'Prev' }))

      expect(onPrev).toHaveBeenCalledTimes(1)
    })

    it('calls onNext when Next button is clicked', async () => {
      const onNext = vi.fn()
      const user = userEvent.setup()
      render(<RightPanel {...defaultProps} onNext={onNext} />)

      await user.click(screen.getByRole('button', { name: 'Next' }))

      expect(onNext).toHaveBeenCalledTimes(1)
    })

    it('renders replay buttons with default player names', () => {
      render(<RightPanel {...defaultProps} />)

      expect(screen.getByRole('button', { name: 'Replay' })).toBeTruthy()
      expect(screen.getByRole('button', { name: 'Replay as Black' })).toBeTruthy()
      expect(screen.getByRole('button', { name: 'Replay as White' })).toBeTruthy()
    })

    it('renders replay buttons with custom player names from gameInfo', () => {
      const gameInfo = {
        blackPlayer: 'Alice',
        whitePlayer: 'Bob'
      }
      render(<RightPanel {...defaultProps} gameInfo={gameInfo} />)

      expect(screen.getByRole('button', { name: 'Replay as Alice' })).toBeTruthy()
      expect(screen.getByRole('button', { name: 'Replay as Bob' })).toBeTruthy()
    })

    it('calls onStartReplay with no args for Replay button', async () => {
      const onStartReplay = vi.fn()
      const user = userEvent.setup()
      render(<RightPanel {...defaultProps} onStartReplay={onStartReplay} />)

      await user.click(screen.getByRole('button', { name: 'Replay' }))

      expect(onStartReplay).toHaveBeenCalledTimes(1)
      expect(onStartReplay).toHaveBeenCalledWith()
    })

    it('calls onStartReplay with "B" for Replay as Black button', async () => {
      const onStartReplay = vi.fn()
      const user = userEvent.setup()
      render(<RightPanel {...defaultProps} onStartReplay={onStartReplay} />)

      await user.click(screen.getByRole('button', { name: 'Replay as Black' }))

      expect(onStartReplay).toHaveBeenCalledTimes(1)
      expect(onStartReplay).toHaveBeenCalledWith('B')
    })

    it('calls onStartReplay with "W" for Replay as White button', async () => {
      const onStartReplay = vi.fn()
      const user = userEvent.setup()
      render(<RightPanel {...defaultProps} onStartReplay={onStartReplay} />)

      await user.click(screen.getByRole('button', { name: 'Replay as White' }))

      expect(onStartReplay).toHaveBeenCalledTimes(1)
      expect(onStartReplay).toHaveBeenCalledWith('W')
    })

    it('renders one-color mode checkbox', () => {
      render(<RightPanel {...defaultProps} />)

      expect(screen.getByRole('checkbox')).toBeTruthy()
      expect(screen.getByText('One color Go')).toBeTruthy()
    })

    it('checkbox reflects oneColorMode prop when false', () => {
      render(<RightPanel {...defaultProps} oneColorMode={false} />)

      expect(screen.getByRole('checkbox').checked).toBe(false)
    })

    it('checkbox reflects oneColorMode prop when true', () => {
      render(<RightPanel {...defaultProps} oneColorMode={true} />)

      expect(screen.getByRole('checkbox').checked).toBe(true)
    })

    it('calls onOneColorModeChange when checkbox is toggled', async () => {
      const onOneColorModeChange = vi.fn()
      const user = userEvent.setup()
      render(
        <RightPanel
          {...defaultProps}
          oneColorMode={false}
          onOneColorModeChange={onOneColorModeChange}
        />
      )

      await user.click(screen.getByRole('checkbox'))

      expect(onOneColorModeChange).toHaveBeenCalledTimes(1)
      expect(onOneColorModeChange).toHaveBeenCalledWith(true)
    })

    it('passes annotation props to StudyPanel', () => {
      const onSelectTool = vi.fn()
      render(
        <RightPanel
          {...defaultProps}
          phase="study"
          selectedTool="triangle"
          onSelectTool={onSelectTool}
        />
      )

      expect(screen.getByText('Annotate')).toBeTruthy()
    })
  })

  describe('Replay Phase', () => {
    const replayProps = {
      ...defaultProps,
      phase: 'replay',
      stats: {
        correctFirstTry: 3,
        wrongMoveCount: 2
      }
    }

    it('renders playing side indicator for Black', () => {
      render(<RightPanel {...replayProps} replaySide="B" />)

      expect(screen.getByText('Playing as Black')).toBeTruthy()
    })

    it('renders playing side indicator for White', () => {
      render(<RightPanel {...replayProps} replaySide="W" />)

      expect(screen.getByText('Playing as White')).toBeTruthy()
    })

    it('does not render playing side indicator when replaySide is null', () => {
      render(<RightPanel {...replayProps} replaySide={null} />)

      expect(screen.queryByText(/Playing as/)).toBeNull()
    })

    it('renders stats during replay (correct first try)', () => {
      render(<RightPanel {...replayProps} />)

      expect(screen.getByText('Correct (1st try)')).toBeTruthy()
      expect(screen.getByText('3')).toBeTruthy()
    })

    it('renders stats during replay (wrong attempts)', () => {
      render(<RightPanel {...replayProps} />)

      expect(screen.getByText('Wrong attempts')).toBeTruthy()
      expect(screen.getByText('2')).toBeTruthy()
    })

    it('renders pass button', () => {
      render(<RightPanel {...replayProps} />)

      expect(screen.getByRole('button', { name: 'Pass' })).toBeTruthy()
    })

    it('disables pass button when not user turn', () => {
      render(<RightPanel {...replayProps} isUserTurn={false} />)

      expect(screen.getByRole('button', { name: 'Pass' }).disabled).toBe(true)
    })

    it('enables pass button when user turn', () => {
      render(<RightPanel {...replayProps} isUserTurn={true} />)

      expect(screen.getByRole('button', { name: 'Pass' }).disabled).toBe(false)
    })

    it('calls onPass when pass button is clicked', async () => {
      const onPass = vi.fn()
      const user = userEvent.setup()
      render(<RightPanel {...replayProps} onPass={onPass} />)

      await user.click(screen.getByRole('button', { name: 'Pass' }))

      expect(onPass).toHaveBeenCalledTimes(1)
    })
  })

  describe('Complete Phase', () => {
    const completeProps = {
      ...defaultProps,
      phase: 'complete',
      stats: {
        accuracy: 85,
        totalTimeFormatted: '2:30',
        avgTimeFormatted: '5s'
      },
      difficultMoves: [
        { moveIndex: 5, attemptCount: 3 },
        { moveIndex: 12, attemptCount: 2 }
      ]
    }

    it('renders accuracy percentage', () => {
      render(<RightPanel {...completeProps} />)

      expect(screen.getByText('85%')).toBeTruthy()
      expect(screen.getByText('Accuracy')).toBeTruthy()
    })

    it('renders total time stat', () => {
      render(<RightPanel {...completeProps} />)

      expect(screen.getByText('Total time')).toBeTruthy()
      expect(screen.getByText('2:30')).toBeTruthy()
    })

    it('renders avg per move stat', () => {
      render(<RightPanel {...completeProps} />)

      expect(screen.getByText('Avg per move')).toBeTruthy()
      expect(screen.getByText('5s')).toBeTruthy()
    })

    it('renders difficult moves list', () => {
      render(<RightPanel {...completeProps} />)

      expect(screen.getByText('Mistakes')).toBeTruthy()
      expect(screen.getByText('Move 6')).toBeTruthy()
      expect(screen.getByText('Move 13')).toBeTruthy()
    })

    it('calls onSelectDifficultMove when move is clicked', async () => {
      const onSelectDifficultMove = vi.fn()
      const user = userEvent.setup()
      render(<RightPanel {...completeProps} onSelectDifficultMove={onSelectDifficultMove} />)

      await user.click(screen.getByText('Move 6'))

      expect(onSelectDifficultMove).toHaveBeenCalledTimes(1)
      expect(onSelectDifficultMove).toHaveBeenCalledWith({ moveIndex: 5, attemptCount: 3 })
    })

    it('highlights selected difficult move', () => {
      render(<RightPanel {...completeProps} selectedMoveIndex={5} />)

      const selectedButton = screen.getByText('Move 6').closest('button')
      expect(selectedButton.className).toContain('bg-blue-50')
      expect(selectedButton.className).toContain('border-primary')
    })

    it('does not highlight non-selected difficult moves', () => {
      render(<RightPanel {...completeProps} selectedMoveIndex={5} />)

      const nonSelectedButton = screen.getByText('Move 13').closest('button')
      expect(nonSelectedButton.className).not.toContain('bg-blue-50')
    })

    it('renders action buttons (Play Again, New Game)', () => {
      render(<RightPanel {...completeProps} />)

      expect(screen.getByRole('button', { name: 'Play Again' })).toBeTruthy()
      expect(screen.getByRole('button', { name: 'New Game' })).toBeTruthy()
    })

    it('calls onRestart when Play Again is clicked', async () => {
      const onRestart = vi.fn()
      const user = userEvent.setup()
      render(<RightPanel {...completeProps} onRestart={onRestart} />)

      await user.click(screen.getByRole('button', { name: 'Play Again' }))

      expect(onRestart).toHaveBeenCalledTimes(1)
    })

    it('calls onGoHome when New Game is clicked', async () => {
      const onGoHome = vi.fn()
      const user = userEvent.setup()
      render(<RightPanel {...completeProps} onGoHome={onGoHome} />)

      await user.click(screen.getByRole('button', { name: 'New Game' }))

      expect(onGoHome).toHaveBeenCalledTimes(1)
    })

    it('does not render mistakes section when no difficult moves', () => {
      render(<RightPanel {...completeProps} difficultMoves={[]} />)

      expect(screen.queryByText('Mistakes')).toBeNull()
    })

    it('does not render mistakes section when difficultMoves is null', () => {
      render(<RightPanel {...completeProps} difficultMoves={null} />)

      expect(screen.queryByText('Mistakes')).toBeNull()
    })

    it('renders singular "attempt" for single attempt', () => {
      const propsWithSingleAttempt = {
        ...completeProps,
        difficultMoves: [{ moveIndex: 5, attemptCount: 1 }]
      }
      render(<RightPanel {...propsWithSingleAttempt} />)

      expect(screen.getByText('1 attempt')).toBeTruthy()
    })

    it('renders plural "attempts" for multiple attempts', () => {
      render(<RightPanel {...completeProps} />)

      expect(screen.getByText('3 attempts')).toBeTruthy()
      expect(screen.getByText('2 attempts')).toBeTruthy()
    })
  })
})
