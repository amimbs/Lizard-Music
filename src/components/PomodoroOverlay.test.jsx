import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { PomodoroOverlay } from './PomodoroOverlay.jsx'
import { DEFAULT_DURATIONS, DEFAULT_DAILY_GOAL, DEFAULT_LONG_REST_FREQUENCY } from '../utils/pomodoroValidation.js'

describe('PomodoroOverlay', () => {
  const defaultProps = {
    phase: 'idle',
    isPaused: false,
    remainingSeconds: 0,
    durations: DEFAULT_DURATIONS,
    dailyGoal: DEFAULT_DAILY_GOAL,
    longRestFrequency: DEFAULT_LONG_REST_FREQUENCY,
    completedCycles: 0,
    selectedTimerType: 'pomodoro',
    goalComplete: false,
    theme: 'original',
    onDurationsChange: vi.fn(),
    onDailyGoalChange: vi.fn(),
    onLongRestFrequencyChange: vi.fn(),
    onTimerTypeChange: vi.fn(),
    onStart: vi.fn(),
    onPause: vi.fn(),
    onResume: vi.fn(),
    onReset: vi.fn(),
    onDismissGoalComplete: vi.fn(),
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
    expect(screen.getByLabelText(/Daily goal \(cycles\)/)).toBeInTheDocument()
    expect(screen.getByLabelText(/Long rest every \(cycles\)/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Start' })).toBeInTheDocument()
  })

  it('renders long rest frequency field with supported range', () => {
    render(<PomodoroOverlay {...defaultProps} />)

    const frequencyInput = screen.getByLabelText(/Long rest every \(cycles\)/)
    expect(frequencyInput).toHaveAttribute('min', '2')
    expect(frequencyInput).toHaveAttribute('max', '12')
    expect(frequencyInput).toHaveValue(DEFAULT_LONG_REST_FREQUENCY)
  })

  it('disables Start for invalid long rest frequency', async () => {
    const user = userEvent.setup()
    render(<PomodoroOverlay {...defaultProps} />)

    const frequencyInput = screen.getByLabelText(/Long rest every \(cycles\)/)
    await user.clear(frequencyInput)
    await user.type(frequencyInput, '1')

    expect(screen.getByRole('button', { name: 'Start' })).toBeDisabled()
  })

  it('disables long rest frequency field while timer is active', () => {
    render(<PomodoroOverlay {...defaultProps} phase="pomodoro" remainingSeconds={300} />)

    expect(screen.getByLabelText(/Long rest every \(cycles\)/)).toBeDisabled()
  })

  it('renders daily goal field with supported range', () => {
    render(<PomodoroOverlay {...defaultProps} />)

    const dailyGoalInput = screen.getByLabelText(/Daily goal \(cycles\)/)
    expect(dailyGoalInput).toHaveAttribute('min', '1')
    expect(dailyGoalInput).toHaveAttribute('max', '12')
  })

  it('disables Start for invalid durations', async () => {
    const user = userEvent.setup()
    render(<PomodoroOverlay {...defaultProps} />)

    const pomodoroInput = screen.getByLabelText(/Pomodoro \(minutes\)/)
    await user.clear(pomodoroInput)
    await user.type(pomodoroInput, '4')

    expect(screen.getByRole('button', { name: 'Start' })).toBeDisabled()
  })

  it('disables Start for invalid daily goal', async () => {
    const user = userEvent.setup()
    render(<PomodoroOverlay {...defaultProps} />)

    const dailyGoalInput = screen.getByLabelText(/Daily goal \(cycles\)/)
    await user.clear(dailyGoalInput)
    await user.type(dailyGoalInput, '13')

    expect(screen.getByRole('button', { name: 'Start' })).toBeDisabled()
  })

  it('calls onStart when Start is clicked with valid durations', async () => {
    const user = userEvent.setup()
    const onStart = vi.fn()
    render(<PomodoroOverlay {...defaultProps} onStart={onStart} />)

    await user.click(screen.getByRole('button', { name: 'Start' }))
    expect(onStart).toHaveBeenCalledOnce()
  })

  it('shows progress bullets for completed vs incomplete cycles', () => {
    render(<PomodoroOverlay {...defaultProps} completedCycles={2} dailyGoal={4} />)

    expect(screen.getByLabelText('2 of 4 cycles completed')).toHaveTextContent('● ● ○ ○')
  })

  it('shows countdown during active phase', () => {
    render(
      <PomodoroOverlay
        {...defaultProps}
        phase="pomodoro"
        remainingSeconds={125}
      />,
    )

    expect(document.querySelector('.pomodoro-phase')).toHaveTextContent('Pomodoro')
    expect(screen.getByText('2:05')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Start' })).not.toBeInTheDocument()
  })

  it('shows lizard congrats when goalComplete', () => {
    render(<PomodoroOverlay {...defaultProps} goalComplete dailyGoal={4} />)

    expect(screen.getByText('Daily goal complete!')).toBeInTheDocument()
    expect(screen.queryByLabelText(/Daily goal \(cycles\)/)).not.toBeInTheDocument()
  })

  it('calls onDismissGoalComplete when Done is clicked', async () => {
    const user = userEvent.setup()
    const onDismissGoalComplete = vi.fn()
    render(
      <PomodoroOverlay
        {...defaultProps}
        goalComplete
        onDismissGoalComplete={onDismissGoalComplete}
      />,
    )

    await user.click(screen.getByRole('button', { name: 'Done' }))
    expect(onDismissGoalComplete).toHaveBeenCalledOnce()
  })

  it('shows Pause and Reset during active timer', () => {
    render(<PomodoroOverlay {...defaultProps} phase="pomodoro" remainingSeconds={300} />)

    expect(screen.getByRole('button', { name: 'Pause' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Reset' })).toBeInTheDocument()
  })

  it('shows Resume when paused', () => {
    render(
      <PomodoroOverlay
        {...defaultProps}
        phase="pomodoro"
        isPaused
        remainingSeconds={300}
      />,
    )

    expect(screen.getByRole('button', { name: 'Resume' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Pause' })).not.toBeInTheDocument()
  })

  it('calls onPause and onReset when clicked', async () => {
    const user = userEvent.setup()
    const onPause = vi.fn()
    const onReset = vi.fn()
    render(
      <PomodoroOverlay
        {...defaultProps}
        phase="pomodoro"
        remainingSeconds={300}
        onPause={onPause}
        onReset={onReset}
      />,
    )

    await user.click(screen.getByRole('button', { name: 'Pause' }))
    expect(onPause).toHaveBeenCalledOnce()

    await user.click(screen.getByRole('button', { name: 'Reset' }))
    expect(onReset).toHaveBeenCalledOnce()
  })

  it('disables timer type switching while running', () => {
    render(<PomodoroOverlay {...defaultProps} phase="pomodoro" remainingSeconds={300} />)

    expect(screen.getByRole('radio', { name: 'Short rest' })).toBeDisabled()
    expect(screen.getByRole('radio', { name: 'Long rest' })).toBeDisabled()
  })

  it('disables timer type switching while paused', () => {
    render(
      <PomodoroOverlay
        {...defaultProps}
        phase="pomodoro"
        isPaused
        remainingSeconds={300}
      />,
    )

    expect(screen.getByRole('radio', { name: 'Short rest' })).toBeDisabled()
  })

  it('enables timer type switching when idle', () => {
    render(<PomodoroOverlay {...defaultProps} />)

    expect(screen.getByRole('radio', { name: 'Short rest' })).toBeEnabled()
    expect(screen.getByRole('radio', { name: 'Long rest' })).toBeEnabled()
  })

  it('calls onTimerTypeChange when idle', async () => {
    const user = userEvent.setup()
    const onTimerTypeChange = vi.fn()
    render(<PomodoroOverlay {...defaultProps} onTimerTypeChange={onTimerTypeChange} />)

    await user.click(screen.getByRole('radio', { name: 'Short rest' }))
    expect(onTimerTypeChange).toHaveBeenCalledWith('shortRest')
  })

  it('disables settings while running', () => {
    render(<PomodoroOverlay {...defaultProps} phase="pomodoro" remainingSeconds={300} />)

    expect(screen.getByLabelText(/Pomodoro \(minutes\)/)).toBeDisabled()
    expect(screen.getByLabelText(/Daily goal \(cycles\)/)).toBeDisabled()
  })

  it('disables settings while paused', () => {
    render(
      <PomodoroOverlay
        {...defaultProps}
        phase="pomodoro"
        isPaused
        remainingSeconds={300}
      />,
    )

    expect(screen.getByLabelText(/Pomodoro \(minutes\)/)).toBeDisabled()
    expect(screen.getByLabelText(/Daily goal \(cycles\)/)).toBeDisabled()
  })

  it('uses the active app theme via CSS variables', () => {
    document.documentElement.setAttribute('data-theme', 'light')
    render(<PomodoroOverlay {...defaultProps} theme="light" />)

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
