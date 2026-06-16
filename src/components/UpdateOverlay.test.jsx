import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { UpdateOverlay } from './UpdateOverlay.jsx'

describe('UpdateOverlay', () => {
  it('renders status text and lizard logo', () => {
    render(<UpdateOverlay />)

    expect(screen.getByRole('status')).toHaveTextContent('Updating…')
    expect(screen.getByText('Restarting with the latest version')).toBeInTheDocument()
    expect(document.querySelector('.update-overlay-logo')).toHaveAttribute('alt', '')
  })
})
