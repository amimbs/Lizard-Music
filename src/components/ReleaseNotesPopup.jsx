import { useEffect, useRef } from 'react'

export function ReleaseNotesPopup({ version, notes, theme, onDismiss }) {
  const dismissRef = useRef(null)
  const logoSrc =
    theme === 'light'
      ? `${import.meta.env.BASE_URL}lizard-logo-light.png`
      : `${import.meta.env.BASE_URL}lizard-logo-dark.png`

  useEffect(() => {
    dismissRef.current?.focus()
  }, [])

  return (
    <div className="modal-overlay" role="presentation" onClick={onDismiss}>
      <div
        className="modal release-notes-modal"
        role="dialog"
        aria-labelledby="release-notes-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="release-notes-header">
          <div className="release-notes-icon">
            <img className="release-notes-logo" src={logoSrc} alt="" width={64} height={64} />
          </div>
          <h2 id="release-notes-title" className="release-notes-title">
            What&apos;s new in v{version}
          </h2>
        </div>

        {notes.features?.length > 0 && (
          <section className="release-notes-section">
            <h3 className="release-notes-section-title">Features</h3>
            <ul className="release-notes-list">
              {notes.features.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </section>
        )}

        {notes.fixes?.length > 0 && (
          <section className="release-notes-section">
            <h3 className="release-notes-section-title">Fixes</h3>
            <ul className="release-notes-list">
              {notes.fixes.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </section>
        )}

        <div className="modal-actions">
          <button ref={dismissRef} type="button" className="btn primary" onClick={onDismiss}>
            Got it
          </button>
        </div>
      </div>
    </div>
  )
}
