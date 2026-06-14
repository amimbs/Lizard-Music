export function InstallBanner({ showBanner, showManualHint, onInstall, onDismiss }) {
  if (!showBanner && !showManualHint) return null

  return (
    <div className="install-banner">
      <div className="install-banner-text">
        {showBanner ? (
          <>
            <strong>Install Lizard Music</strong>
            <span>Add to your home screen for quick access.</span>
          </>
        ) : (
          <>
            <strong>Install this app</strong>
            <span>In Chrome, tap <span className="install-menu">⋮</span> → <strong>Install app</strong>.</span>
          </>
        )}
      </div>
      <div className="install-banner-actions">
        {showBanner && (
          <button type="button" className="btn primary install-btn" onClick={onInstall}>
            Install
          </button>
        )}
        <button type="button" className="install-dismiss" onClick={onDismiss} aria-label="Dismiss">
          ×
        </button>
      </div>
    </div>
  )
}
