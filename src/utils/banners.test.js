import { describe, expect, it, vi } from 'vitest'
import { getActiveBanner } from './banners.js'

describe('getActiveBanner', () => {
  const onDismissStorage = vi.fn()
  const onInstall = vi.fn()
  const onDismissInstall = vi.fn()

  it('returns null when no banners apply', () => {
    expect(
      getActiveBanner({
        storageError: '',
        onDismissStorage,
        showInstallBanner: false,
        showManualHint: false,
        onInstall,
        onDismissInstall,
      }),
    ).toBeNull()
  })

  it('returns storage banner when storage error is set', () => {
    const banner = getActiveBanner({
      storageError: 'Storage full',
      onDismissStorage,
      showInstallBanner: false,
      showManualHint: false,
      onInstall,
      onDismissInstall,
    })

    expect(banner).toMatchObject({
      variant: 'error',
      message: 'Storage full',
      onDismiss: onDismissStorage,
    })
  })

  it('returns install banner when install prompt is available', () => {
    const banner = getActiveBanner({
      storageError: '',
      onDismissStorage,
      showInstallBanner: true,
      showManualHint: false,
      onInstall,
      onDismissInstall,
    })

    expect(banner).toMatchObject({
      variant: 'promo',
      title: 'Install Lizard Music',
      action: { label: 'Install', onClick: onInstall },
      onDismiss: onDismissInstall,
    })
  })

  it('returns manual install hint when native prompt is unavailable', () => {
    const banner = getActiveBanner({
      storageError: '',
      onDismissStorage,
      showInstallBanner: false,
      showManualHint: true,
      onInstall,
      onDismissInstall,
    })

    expect(banner).toMatchObject({
      variant: 'promo',
      title: 'Install this app',
      manualInstallHint: true,
      onDismiss: onDismissInstall,
    })
  })

  it('prefers storage error over install banner', () => {
    const banner = getActiveBanner({
      storageError: 'Storage full',
      onDismissStorage,
      showInstallBanner: true,
      showManualHint: true,
      onInstall,
      onDismissInstall,
    })

    expect(banner).toMatchObject({
      variant: 'error',
      message: 'Storage full',
    })
  })
})
