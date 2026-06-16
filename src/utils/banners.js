/** Lower number = higher priority. Update slot reserved for a future PWA refresh banner. */
export const BANNER_PRIORITY = {
  storage: 1,
  update: 2,
  install: 3,
}

const INSTALL_BANNER = {
  variant: 'promo',
  title: 'Install Lizard Music',
  message: 'Add to your home screen for quick access.',
}

const MANUAL_INSTALL_HINT = {
  variant: 'promo',
  title: 'Install this app',
  manualInstallHint: true,
}

/**
 * Returns the single highest-priority banner config, or null when none apply.
 */
export function getActiveBanner({
  storageError,
  onDismissStorage,
  showInstallBanner,
  showManualHint,
  onInstall,
  onDismissInstall,
}) {
  const candidates = []

  if (storageError) {
    candidates.push({
      priority: BANNER_PRIORITY.storage,
      config: {
        variant: 'error',
        message: storageError,
        onDismiss: onDismissStorage,
      },
    })
  }

  if (showInstallBanner) {
    candidates.push({
      priority: BANNER_PRIORITY.install,
      config: {
        ...INSTALL_BANNER,
        action: { label: 'Install', onClick: onInstall },
        onDismiss: onDismissInstall,
      },
    })
  } else if (showManualHint) {
    candidates.push({
      priority: BANNER_PRIORITY.install,
      config: {
        ...MANUAL_INSTALL_HINT,
        onDismiss: onDismissInstall,
      },
    })
  }

  if (candidates.length === 0) return null

  candidates.sort((a, b) => a.priority - b.priority)
  return candidates[0].config
}
