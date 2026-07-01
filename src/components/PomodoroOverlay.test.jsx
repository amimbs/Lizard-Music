import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { PomodoroOverlay } from './PomodoroOverlay.jsx'
import { DEFAULT_DURATIONS } from '../utils/pomodoroValidation.js'

describe('PomodoroOverlay', () => {
  const defaultProps = {
    phase: 'idle',
    remainingSeconds: 0,
    durations: DEFAULT_DURATIONS,
    onDurationsChange: vi.fn(),
    onStart: vi.fn(),
    onClose: vi.fn(),
  }

  beforeEach(() => {
    document.documentElement.setAttribute('data-theme', 'original')
  })

  afterEach(() => {
    document.documentElement.removeAttribute('data-theme')
  })

  it('renders configuration form when idle', () => {
    render(<PomodoroOverlay {...defaultProps} />)

    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByLabelText(/Pomodoro \(minutes\)/)).toBeInTheDocument()
    expect(screen.getByLabelText(/Short rest \(minutes\)/)).toBeInTheDocument()
    expect(screen.getByLabelText(/Long rest \(minutes\)/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Start' })).toBeInTheDocument()
  })

  it('disables Start for invalid durations', async () => {
    const user = userEvent.setup()
    render(<PomodoroOverlay {...defaultProps} />)

    const pomodoroInput = screen.getByLabelText(/Pomodoro \(minutes\)/)
    await user.clear(pomodoroInput)
    await user.type(pomodoroInput, '4')

    expect(screen.getByRole('button', { name: 'Start' })).toBeDisabled()
  })

  it('calls onStart when Start is clicked with valid durations', async () => {
    const user = userEvent.setup()
    const onStart = vi.fn()
    render(<PomodoroOverlay {...defaultProps} onStart={onStart} />)

    await user.click(screen.getByRole('button', { name: 'Start' }))
    expect(onStart).toHaveBeenCalledOnce()
  })

  it('shows countdown during active phase', () => {
    render(
      <PomodoroOverlay
        {...defaultProps}
        phase="pomodoro"
        remainingSeconds={125}
      />,
    )

    expect(screen.getByText('Pomodoro')).toBeInTheDocument()
    expect(screen.getByText('2:05')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Start' })).not.toBeInTheDocument()
  })

  it('uses the active app theme via CSS variables', () => {
    document.documentElement.setAttribute('data-theme', 'light')
    render(<PomodoroOverlay {...defaultProps} />)

    const modal = screen.getByRole('dialog')
    const styles = getComputedStyle(modal)
    expect(styles.backgroundColor).not.toBe('')
    expect(document.documentElement.getAttribute('data-theme')).toBe('light')
  })

  it('closes on Escape', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()
    render(<PomodoroOverlay {...defaultProps} onClose={onClose} />)

    await user.keyboard('{Escape}')
    expect(onClose).toHaveBeenCalledOnce()
  })
})
