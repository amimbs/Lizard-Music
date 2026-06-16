import { describe, expect, it, vi } from 'vitest'
import { getActiveBanner } from './banners.js'

describe('getActiveBanner', () => {
  const onDismissStorage = vi.fn()
  const onUpdate = vi.fn()
  const onDismissUpdate = vi.fn()
  const onInstall = vi.fn()
  const onDismissInstall = vi.fn()

  const baseArgs = {
    storageError: '',
    onDismissStorage,
    showUpdateBanner: false,
    onUpdate,
    onDismissUpdate,
    showInstallBanner: false,
    showManualHint: false,
    onInstall,
    onDismissInstall,
  }

  it('returns null when no banners apply', () => {
    expect(getActiveBanner(baseArgs)).toBeNull()
  })

  it('returns storage banner when storage error is set', () => {
    const banner = getActiveBanner({
      ...baseArgs,
      storageError: 'Storage full',
    })

    expect(banner).toMatchObject({
      variant: 'error',
      message: 'Storage full',
      onDismiss: onDismissStorage,
    })
  })

  it('returns update banner when an update is available', () => {
    const banner = getActiveBanner({
      ...baseArgs,
      showUpdateBanner: true,
    })

    expect(banner).toMatchObject({
      variant: 'promo',
      title: 'Update available',
      action: { label: 'Update', onClick: onUpdate },
      onDismiss: onDismissUpdate,
    })
  })

  it('returns install banner when install prompt is available', () => {
    const banner = getActiveBanner({
      ...baseArgs,
      showInstallBanner: true,
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
      ...baseArgs,
      showManualHint: true,
    })

    expect(banner).toMatchObject({
      variant: 'promo',
      title: 'Install this app',
      manualInstallHint: true,
      onDismiss: onDismissInstall,
    })
  })

  it('prefers storage error over update and install banners', () => {
    const banner = getActiveBanner({
      ...baseArgs,
      storageError: 'Storage full',
      showUpdateBanner: true,
      showInstallBanner: true,
      showManualHint: true,
    })

    expect(banner).toMatchObject({
      variant: 'error',
      message: 'Storage full',
    })
  })

  it('prefers update banner over install banner', () => {
    const banner = getActiveBanner({
      ...baseArgs,
      showUpdateBanner: true,
      showInstallBanner: true,
      showManualHint: true,
    })

    expect(banner).toMatchObject({
      variant: 'promo',
      title: 'Update available',
    })
  })
})
