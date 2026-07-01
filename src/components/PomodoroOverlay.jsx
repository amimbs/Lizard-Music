import { useEffect, useRef, useState } from 'react'
import { formatTime } from '../utils/format.js'
import {
  DEFAULT_DURATIONS,
  getDurationConfig,
  validateAllDurations,
} from '../utils/pomodoroValidation.js'

const PHASE_LABELS = {
  idle: 'Ready',
  pomodoro: 'Pomodoro',
  shortRest: 'Short rest',
  longRest: 'Long rest',
}

export function PomodoroOverlay({
  phase,
  remainingSeconds,
  durations,
  onDurationsChange,
  onStart,
  onClose,
}) {
  const [localDurations, setLocalDurations] = useState(durations ?? DEFAULT_DURATIONS)
  const onCloseRef = useRef(onClose)
  onCloseRef.current = onClose

  useEffect(() => {
    if (phase === 'idle') {
      setLocalDurations(durations)
    }
  }, [durations, phase])

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        onCloseRef.current()
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  const isIdle = phase === 'idle'
  const validation = validateAllDurations(localDurations)
  const { limits, label: durationLabel } = getDurationConfig()

  const handleChange = (field, value) => {
    const parsed = value === '' ? '' : Number(value)
    const next = { ...localDurations, [field]: parsed }
    setLocalDurations(next)
    if (isIdle) {
      onDurationsChange(next)
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!validation.valid || !isIdle) return
    onStart()
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal pomodoro-modal"
        role="dialog"
        aria-labelledby="pomodoro-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h2 id="pomodoro-title">Pomodoro timer</h2>
          <button type="button" className="modal-close" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>

        {!isIdle && (
          <div className="pomodoro-status" aria-live="polite">
            <p className="pomodoro-phase">{PHASE_LABELS[phase]}</p>
            <p className="pomodoro-countdown">{formatTime(remainingSeconds)}</p>
          </div>
        )}

        <form className="modal-form" onSubmit={handleSubmit}>
          <label className="modal-field">
            <span className="modal-field-label">Pomodoro ({durationLabel})</span>
            <input
              type="number"
              min={limits.pomodoro[0]}
              max={limits.pomodoro[1]}
              step={1}
              value={localDurations.pomodoro}
              onChange={(e) => handleChange('pomodoro', e.target.value)}
              disabled={!isIdle}
              aria-invalid={Boolean(validation.errors.pomodoro)}
              aria-describedby={validation.errors.pomodoro ? 'pomodoro-error' : undefined}
            />
            {validation.errors.pomodoro && (
              <span id="pomodoro-error" className="pomodoro-field-error">
                {validation.errors.pomodoro}
              </span>
            )}
          </label>

          <label className="modal-field">
            <span className="modal-field-label">Short rest ({durationLabel})</span>
            <input
              type="number"
              min={limits.shortRest[0]}
              max={limits.shortRest[1]}
              step={1}
              value={localDurations.shortRest}
              onChange={(e) => handleChange('shortRest', e.target.value)}
              disabled={!isIdle}
              aria-invalid={Boolean(validation.errors.shortRest)}
              aria-describedby={validation.errors.shortRest ? 'short-rest-error' : undefined}
            />
            {validation.errors.shortRest && (
              <span id="short-rest-error" className="pomodoro-field-error">
                {validation.errors.shortRest}
              </span>
            )}
          </label>

          <label className="modal-field">
            <span className="modal-field-label">Long rest ({durationLabel})</span>
            <input
              type="number"
              min={limits.longRest[0]}
              max={limits.longRest[1]}
              step={1}
              value={localDurations.longRest}
              onChange={(e) => handleChange('longRest', e.target.value)}
              disabled={!isIdle}
              aria-invalid={Boolean(validation.errors.longRest)}
              aria-describedby={validation.errors.longRest ? 'long-rest-error' : undefined}
            />
            {validation.errors.longRest && (
              <span id="long-rest-error" className="pomodoro-field-error">
                {validation.errors.longRest}
              </span>
            )}
          </label>

          {isIdle && (
            <div className="modal-actions">
              <button type="button" className="btn" onClick={onClose}>
                Cancel
              </button>
              <button type="submit" className="btn primary" disabled={!validation.valid}>
                Start
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  )
}
