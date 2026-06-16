export function UpdateOverlay() {
  return (
    <div className="update-overlay" aria-busy="true">
      <div className="update-overlay-content" role="status" aria-live="polite">
        <div className="update-overlay-icon">
          <img
            className="update-overlay-logo"
            src={`${import.meta.env.BASE_URL}lizard-logo-dark.png`}
            alt=""
            width={64}
            height={64}
          />
        </div>
        <p className="update-overlay-title">Updating…</p>
        <p className="update-overlay-subtitle">Restarting with the latest version</p>
      </div>
    </div>
  )
}
