import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { PomodoroCompletionPopup } from './PomodoroCompletionPopup.jsx'

describe('PomodoroCompletionPopup', () => {
  it('displays the correct next timer name for short rest', () => {
    render(
      <PomodoroCompletionPopup
        nextPhase="shortRest"
        onConfirm={vi.fn()}
        onDismiss={vi.fn()}
      />,
    )

    expect(screen.getByText('Start Short Rest?')).toBeInTheDocument()
  })

  it('displays the correct next timer name for long rest', () => {
    render(
      <PomodoroCompletionPopup
        nextPhase="longRest"
        onConfirm={vi.fn()}
        onDismiss={vi.fn()}
      />,
    )

    expect(screen.getByText('Start Long Rest?')).toBeInTheDocument()
  })

  it('displays the correct next timer name for pomodoro', () => {
    render(
      <PomodoroCompletionPopup
        nextPhase="pomodoro"
        onConfirm={vi.fn()}
        onDismiss={vi.fn()}
      />,
    )

    expect(screen.getByText('Start Pomodoro?')).toBeInTheDocument()
  })

  it('calls onConfirm when Yes is clicked', async () => {
    const user = userEvent.setup()
    const onConfirm = vi.fn()
    render(
      <PomodoroCompletionPopup
        nextPhase="pomodoro"
        onConfirm={onConfirm}
        onDismiss={vi.fn()}
      />,
    )

    await user.click(screen.getByRole('button', { name: 'Yes' }))
    expect(onConfirm).toHaveBeenCalledOnce()
  })

  it('calls onDismiss when No is clicked', async () => {
    const user = userEvent.setup()
    const onDismiss = vi.fn()
    render(
      <PomodoroCompletionPopup
        nextPhase="pomodoro"
        onConfirm={vi.fn()}
        onDismiss={onDismiss}
      />,
    )

    await user.click(screen.getByRole('button', { name: 'No' }))
    expect(onDismiss).toHaveBeenCalledOnce()
  })
})
