export function AppBanner({ variant, title, message, manualInstallHint, action, onDismiss }) {
  return (
    <div
      className={`app-banner app-banner--${variant}`}
      role={variant === 'error' ? 'alert' : undefined}
    >
      <div className="app-banner-text">
        {title && <strong>{title}</strong>}
        {manualInstallHint ? (
          <span>
            In Chrome, tap <span className="install-menu">⋮</span> → <strong>Install app</strong>.
          </span>
        ) : (
          message && (title ? <span>{message}</span> : message)
        )}
      </div>
      <div className="app-banner-actions">
        {action && (
          <button type="button" className="btn primary app-banner-action" onClick={action.onClick}>
            {action.label}
          </button>
        )}
        <button type="button" className="app-banner-dismiss" onClick={onDismiss} aria-label="Dismiss">
          ×
        </button>
      </div>
    </div>
  )
}
