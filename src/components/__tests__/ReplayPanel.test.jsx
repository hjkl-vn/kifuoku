import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/preact'
import userEvent from '@testing-library/user-event'
import ReplayPanel from '../ReplayPanel'

describe('ReplayPanel', () => {
  const defaultStats = {
    correctFirstTry: 0,
    wrongMoveCount: 0
  }

  describe('playing side indicator', () => {
    it('renders playing side indicator for Black', () => {
      render(
        <ReplayPanel replaySide="B" stats={defaultStats} onPass={() => {}} isUserTurn={true} />
      )

      expect(screen.getByText('Playing as Black')).toBeTruthy()
    })

    it('renders playing side indicator for White', () => {
      render(
        <ReplayPanel replaySide="W" stats={defaultStats} onPass={() => {}} isUserTurn={true} />
      )

      expect(screen.getByText('Playing as White')).toBeTruthy()
    })

    it('does not render side indicator when replaySide is null', () => {
      render(
        <ReplayPanel replaySide={null} stats={defaultStats} onPass={() => {}} isUserTurn={true} />
      )

      expect(screen.queryByText(/Playing as/)).toBeNull()
    })
  })

  describe('stats display', () => {
    it('renders stats with correctFirstTry and wrongMoveCount', () => {
      const stats = {
        correctFirstTry: 5,
        wrongMoveCount: 3
      }

      render(<ReplayPanel replaySide={null} stats={stats} onPass={() => {}} isUserTurn={true} />)

      expect(screen.getByText('Correct (1st try)')).toBeTruthy()
      expect(screen.getByText('5')).toBeTruthy()
      expect(screen.getByText('Wrong attempts')).toBeTruthy()
      expect(screen.getByText('3')).toBeTruthy()
    })
  })

  describe('pass button', () => {
    it('renders pass button', () => {
      render(
        <ReplayPanel replaySide={null} stats={defaultStats} onPass={() => {}} isUserTurn={true} />
      )

      expect(screen.getByRole('button', { name: 'Pass' })).toBeTruthy()
    })

    it('disables pass button when not user turn', () => {
      render(
        <ReplayPanel replaySide={null} stats={defaultStats} onPass={() => {}} isUserTurn={false} />
      )

      expect(screen.getByRole('button', { name: 'Pass' }).disabled).toBe(true)
    })

    it('enables pass button when user turn', () => {
      render(
        <ReplayPanel replaySide={null} stats={defaultStats} onPass={() => {}} isUserTurn={true} />
      )

      expect(screen.getByRole('button', { name: 'Pass' }).disabled).toBe(false)
    })

    it('calls onPass when pass button is clicked', async () => {
      const onPass = vi.fn()
      const user = userEvent.setup()

      render(
        <ReplayPanel replaySide={null} stats={defaultStats} onPass={onPass} isUserTurn={true} />
      )

      await user.click(screen.getByRole('button', { name: 'Pass' }))

      expect(onPass).toHaveBeenCalledTimes(1)
    })
  })
})
