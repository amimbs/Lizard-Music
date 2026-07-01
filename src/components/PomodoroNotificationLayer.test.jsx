import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { PomodoroNotificationLayer } from './PomodoroNotificationLayer.jsx'

describe('PomodoroNotificationLayer', () => {
  const defaultProps = {
    formOpen: false,
    goalComplete: false,
    pendingNextPhase: null,
    dailyGoal: 4,
    theme: 'original',
    onConfirmPending: vi.fn(),
    onDismissPending: vi.fn(),
    onDismissGoalComplete: vi.fn(),
  }

  it('shows completion popup when timer completes with form closed', () => {
    render(
      <PomodoroNotificationLayer
        {...defaultProps}
        pendingNextPhase="shortRest"
      />,
    )

    expect(screen.getByText('Start Short Rest?')).toBeInTheDocument()
  })

  it('shows goal complete popup when form is closed', () => {
    render(
      <PomodoroNotificationLayer
        {...defaultProps}
        goalComplete
      />,
    )

    expect(screen.getByText('Daily goal complete!')).toBeInTheDocument()
  })

  it('does not show completion popup when form is open', () => {
    render(
      <PomodoroNotificationLayer
        {...defaultProps}
        formOpen
        pendingNextPhase="shortRest"
      />,
    )

    expect(screen.queryByText('Start Short Rest?')).not.toBeInTheDocument()
  })

  it('prioritizes goal complete popup over completion popup', () => {
    render(
      <PomodoroNotificationLayer
        {...defaultProps}
        goalComplete
        pendingNextPhase="pomodoro"
      />,
    )

    expect(screen.getByText('Daily goal complete!')).toBeInTheDocument()
    expect(screen.queryByText('Start Pomodoro?')).not.toBeInTheDocument()
  })

  it('calls onDismissGoalComplete when Done is clicked', async () => {
    const user = userEvent.setup()
    const onDismissGoalComplete = vi.fn()
    render(
      <PomodoroNotificationLayer
        {...defaultProps}
        goalComplete
        onDismissGoalComplete={onDismissGoalComplete}
      />,
    )

    await user.click(screen.getByRole('button', { name: 'Done' }))
    expect(onDismissGoalComplete).toHaveBeenCalledOnce()
  })

  it('renders nothing when form is closed with no pending state', () => {
    const { container } = render(<PomodoroNotificationLayer {...defaultProps} />)

    expect(container).toBeEmptyDOMElement()
  })
})
