import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { StorageBanner } from './StorageBanner.jsx'

describe('StorageBanner', () => {
  it('renders nothing when message is empty', () => {
    const { container } = render(<StorageBanner message="" onDismiss={() => {}} />)
    expect(container).toBeEmptyDOMElement()
  })

  it('shows the message and calls onDismiss', async () => {
    const user = userEvent.setup()
    const onDismiss = vi.fn()

    render(<StorageBanner message="Storage full" onDismiss={onDismiss} />)

    expect(screen.getByRole('alert')).toHaveTextContent('Storage full')

    await user.click(screen.getByRole('button', { name: 'Dismiss' }))
    expect(onDismiss).toHaveBeenCalledOnce()
  })
})
