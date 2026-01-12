import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/preact'
import userEvent from '@testing-library/user-event'
import CompletePanel from '../CompletePanel'

describe('CompletePanel', () => {
  const defaultStats = {
    accuracy: 85,
    totalTimeFormatted: '2:30',
    avgTimeFormatted: '5s'
  }

  const defaultProps = {
    stats: defaultStats,
    difficultMoves: [],
    onSelectDifficultMove: vi.fn(),
    selectedMoveIndex: null,
    onRestart: vi.fn(),
    onGoHome: vi.fn()
  }

  describe('Accuracy Display', () => {
    it('renders accuracy percentage', () => {
      render(<CompletePanel {...defaultProps} />)

      expect(screen.getByText('85%')).toBeTruthy()
      expect(screen.getByText('Accuracy')).toBeTruthy()
    })

    it('renders different accuracy values', () => {
      render(<CompletePanel {...defaultProps} stats={{ ...defaultStats, accuracy: 100 }} />)

      expect(screen.getByText('100%')).toBeTruthy()
    })
  })

  describe('Time Stats', () => {
    it('renders total time', () => {
      render(<CompletePanel {...defaultProps} />)

      expect(screen.getByText('Total time')).toBeTruthy()
      expect(screen.getByText('2:30')).toBeTruthy()
    })

    it('renders average time per move', () => {
      render(<CompletePanel {...defaultProps} />)

      expect(screen.getByText('Avg per move')).toBeTruthy()
      expect(screen.getByText('5s')).toBeTruthy()
    })

    it('renders different time values', () => {
      const customStats = {
        accuracy: 75,
        totalTimeFormatted: '10:45',
        avgTimeFormatted: '15s'
      }
      render(<CompletePanel {...defaultProps} stats={customStats} />)

      expect(screen.getByText('10:45')).toBeTruthy()
      expect(screen.getByText('15s')).toBeTruthy()
    })
  })

  describe('Difficult Moves List', () => {
    const difficultMoves = [
      { moveIndex: 5, attemptCount: 3 },
      { moveIndex: 12, attemptCount: 2 }
    ]

    it('renders difficult moves list when moves exist', () => {
      render(<CompletePanel {...defaultProps} difficultMoves={difficultMoves} />)

      expect(screen.getByText('Mistakes')).toBeTruthy()
      expect(screen.getByText('Move 6')).toBeTruthy()
      expect(screen.getByText('Move 13')).toBeTruthy()
    })

    it('does not render mistakes section when no difficult moves', () => {
      render(<CompletePanel {...defaultProps} difficultMoves={[]} />)

      expect(screen.queryByText('Mistakes')).toBeNull()
    })

    it('does not render mistakes section when difficultMoves is null', () => {
      render(<CompletePanel {...defaultProps} difficultMoves={null} />)

      expect(screen.queryByText('Mistakes')).toBeNull()
    })

    it('renders attempt count for each move', () => {
      render(<CompletePanel {...defaultProps} difficultMoves={difficultMoves} />)

      expect(screen.getByText('3 attempts')).toBeTruthy()
      expect(screen.getByText('2 attempts')).toBeTruthy()
    })

    it('renders singular "attempt" for single attempt', () => {
      const singleAttemptMoves = [{ moveIndex: 5, attemptCount: 1 }]
      render(<CompletePanel {...defaultProps} difficultMoves={singleAttemptMoves} />)

      expect(screen.getByText('1 attempt')).toBeTruthy()
    })

    it('calls onSelectDifficultMove when move is clicked', async () => {
      const onSelectDifficultMove = vi.fn()
      const user = userEvent.setup()
      render(
        <CompletePanel
          {...defaultProps}
          difficultMoves={difficultMoves}
          onSelectDifficultMove={onSelectDifficultMove}
        />
      )

      await user.click(screen.getByText('Move 6'))

      expect(onSelectDifficultMove).toHaveBeenCalledTimes(1)
      expect(onSelectDifficultMove).toHaveBeenCalledWith(difficultMoves[0])
    })

    it('highlights selected difficult move', () => {
      const { container } = render(
        <CompletePanel {...defaultProps} difficultMoves={difficultMoves} selectedMoveIndex={5} />
      )

      const selectedButton = container.querySelector('.bg-blue-50')
      expect(selectedButton).toBeTruthy()
      expect(selectedButton.textContent).toContain('Move 6')
    })

    it('does not highlight non-selected moves', () => {
      const { container } = render(
        <CompletePanel {...defaultProps} difficultMoves={difficultMoves} selectedMoveIndex={5} />
      )

      const buttons = container.querySelectorAll('li button')
      const nonSelectedButton = Array.from(buttons).find((btn) =>
        btn.textContent.includes('Move 13')
      )
      expect(nonSelectedButton.classList.contains('bg-blue-50')).toBe(false)
    })
  })

  describe('Action Buttons', () => {
    it('renders Play Again button', () => {
      render(<CompletePanel {...defaultProps} />)

      expect(screen.getByRole('button', { name: 'Play Again' })).toBeTruthy()
    })

    it('renders New Game button', () => {
      render(<CompletePanel {...defaultProps} />)

      expect(screen.getByRole('button', { name: 'New Game' })).toBeTruthy()
    })

    it('calls onRestart when Play Again is clicked', async () => {
      const onRestart = vi.fn()
      const user = userEvent.setup()
      render(<CompletePanel {...defaultProps} onRestart={onRestart} />)

      await user.click(screen.getByRole('button', { name: 'Play Again' }))

      expect(onRestart).toHaveBeenCalledTimes(1)
    })

    it('calls onGoHome when New Game is clicked', async () => {
      const onGoHome = vi.fn()
      const user = userEvent.setup()
      render(<CompletePanel {...defaultProps} onGoHome={onGoHome} />)

      await user.click(screen.getByRole('button', { name: 'New Game' }))

      expect(onGoHome).toHaveBeenCalledTimes(1)
    })
  })
})
