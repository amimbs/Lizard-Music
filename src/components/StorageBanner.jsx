export function StorageBanner({ message, onDismiss }) {
  if (!message) return null

  return (
    <div className="storage-banner" role="alert">
      {message}
      <button type="button" onClick={onDismiss} aria-label="Dismiss">
        ×
      </button>
    </div>
  )
}
