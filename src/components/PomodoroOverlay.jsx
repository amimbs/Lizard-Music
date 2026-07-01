import { useEffect, useRef, useState } from 'react'
import { formatTime } from '../utils/format.js'
import {
  DEFAULT_DURATIONS,
  DEFAULT_DAILY_GOAL,
  DAILY_GOAL_MIN,
  DAILY_GOAL_MAX,
  DEFAULT_LONG_REST_FREQUENCY,
  LONG_REST_FREQUENCY_MIN,
  LONG_REST_FREQUENCY_MAX,
  getDurationConfig,
  validateAllDurations,
  validateDailyGoal,
  validateLongRestFrequency,
  formatCycleBullets,
} from '../utils/pomodoroValidation.js'

const PHASE_LABELS = {
  idle: 'Ready',
  pomodoro: 'Pomodoro',
  shortRest: 'Short rest',
  longRest: 'Long rest',
}

const TIMER_TYPES = [
  { id: 'pomodoro', label: 'Pomodoro' },
  { id: 'shortRest', label: 'Short rest' },
  { id: 'longRest', label: 'Long rest' },
]

export function PomodoroOverlay({
  phase,
  isPaused,
  remainingSeconds,
  durations,
  dailyGoal,
  longRestFrequency,
  completedCycles,
  selectedTimerType,
  goalComplete,
  theme,
  onDurationsChange,
  onDailyGoalChange,
  onLongRestFrequencyChange,
  onTimerTypeChange,
  onStart,
  onPause,
  onResume,
  onReset,
  onDismissGoalComplete,
  onClose,
}) {
  const [localDurations, setLocalDurations] = useState(durations ?? DEFAULT_DURATIONS)
  const [localDailyGoal, setLocalDailyGoal] = useState(dailyGoal ?? DEFAULT_DAILY_GOAL)
  const [localLongRestFrequency, setLocalLongRestFrequency] = useState(
    longRestFrequency ?? DEFAULT_LONG_REST_FREQUENCY,
  )
  const onCloseRef = useRef(onClose)
  onCloseRef.current = onClose

  useEffect(() => {
    if (phase === 'idle') {
      setLocalDurations(durations)
      setLocalDailyGoal(dailyGoal)
      setLocalLongRestFrequency(longRestFrequency)
    }
  }, [durations, dailyGoal, longRestFrequency, phase])

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
  const canEditSettings = isIdle && !goalComplete
  const canSwitchTimerType = isIdle && !goalComplete
  const validation = validateAllDurations(localDurations)
  const dailyGoalValid = validateDailyGoal(localDailyGoal)
  const longRestFrequencyValid = validateLongRestFrequency(localLongRestFrequency)
  const formValid = validation.valid && dailyGoalValid && longRestFrequencyValid
  const { limits, label: durationLabel } = getDurationConfig()

  const logoSrc =
    theme === 'light'
      ? `${import.meta.env.BASE_URL}lizard-logo-light.png`
      : `${import.meta.env.BASE_URL}lizard-logo-dark.png`

  const handleDurationChange = (field, value) => {
    const parsed = value === '' ? '' : Number(value)
    const next = { ...localDurations, [field]: parsed }
    setLocalDurations(next)
    if (canEditSettings) {
      onDurationsChange(next)
    }
  }

  const handleDailyGoalChange = (value) => {
    const parsed = value === '' ? '' : Number(value)
    setLocalDailyGoal(parsed)
    if (canEditSettings && validateDailyGoal(parsed)) {
      onDailyGoalChange(parsed)
    }
  }

  const handleLongRestFrequencyChange = (value) => {
    const parsed = value === '' ? '' : Number(value)
    setLocalLongRestFrequency(parsed)
    if (canEditSettings && validateLongRestFrequency(parsed)) {
      onLongRestFrequencyChange(parsed)
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!formValid || !canEditSettings) return
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

        {goalComplete ? (
          <div className="pomodoro-congrats">
            <div className="pomodoro-congrats-icon">
              <img className="pomodoro-congrats-logo" src={logoSrc} alt="" width={64} height={64} />
            </div>
            <p className="pomodoro-congrats-title">Daily goal complete!</p>
            <p className="pomodoro-congrats-subtitle">
              You finished {dailyGoal} Pomodoro cycle{dailyGoal === 1 ? '' : 's'}. Nice work!
            </p>
            <div className="modal-actions">
              <button type="button" className="btn primary" onClick={onDismissGoalComplete}>
                Done
              </button>
            </div>
          </div>
        ) : (
          <>
            <div
              className="pomodoro-cycle-progress"
              aria-label={`${completedCycles} of ${dailyGoal} cycles completed`}
            >
              {formatCycleBullets(completedCycles, dailyGoal)}
            </div>

            {!isIdle && (
              <div className="pomodoro-status" aria-live="polite">
                <p className="pomodoro-phase">{PHASE_LABELS[phase]}</p>
                <p className="pomodoro-countdown">{formatTime(remainingSeconds)}</p>
              </div>
            )}

            <fieldset className="pomodoro-timer-type" disabled={!canSwitchTimerType}>
              <legend className="modal-field-label">Timer type</legend>
              {TIMER_TYPES.map(({ id, label }) => (
                <label key={id} className="pomodoro-timer-type-option">
                  <input
                    type="radio"
                    name="timer-type"
                    value={id}
                    checked={selectedTimerType === id}
                    onChange={() => onTimerTypeChange(id)}
                    disabled={!canSwitchTimerType}
                  />
                  {label}
                </label>
              ))}
            </fieldset>

            <form className="modal-form" onSubmit={handleSubmit}>
              <label className="modal-field">
                <span className="modal-field-label">Daily goal (cycles)</span>
                <input
                  type="number"
                  min={DAILY_GOAL_MIN}
                  max={DAILY_GOAL_MAX}
                  step={1}
                  value={localDailyGoal}
                  onChange={(e) => handleDailyGoalChange(e.target.value)}
                  disabled={!canEditSettings}
                  aria-invalid={!dailyGoalValid}
                  aria-describedby={!dailyGoalValid ? 'daily-goal-error' : undefined}
                />
                {!dailyGoalValid && (
                  <span id="daily-goal-error" className="pomodoro-field-error">
                    Daily goal must be {DAILY_GOAL_MIN}–{DAILY_GOAL_MAX} cycles
                  </span>
                )}
              </label>

              <label className="modal-field">
                <span className="modal-field-label">Long rest every (cycles)</span>
                <input
                  type="number"
                  min={LONG_REST_FREQUENCY_MIN}
                  max={LONG_REST_FREQUENCY_MAX}
                  step={1}
                  value={localLongRestFrequency}
                  onChange={(e) => handleLongRestFrequencyChange(e.target.value)}
                  disabled={!canEditSettings}
                  aria-invalid={!longRestFrequencyValid}
                  aria-describedby={
                    !longRestFrequencyValid ? 'long-rest-frequency-error' : undefined
                  }
                />
                {!longRestFrequencyValid && (
                  <span id="long-rest-frequency-error" className="pomodoro-field-error">
                    Long rest frequency must be {LONG_REST_FREQUENCY_MIN}–{LONG_REST_FREQUENCY_MAX}{' '}
                    cycles
                  </span>
                )}
              </label>

              <label className="modal-field">
                <span className="modal-field-label">Pomodoro ({durationLabel})</span>
                <input
                  type="number"
                  min={limits.pomodoro[0]}
                  max={limits.pomodoro[1]}
                  step={1}
                  value={localDurations.pomodoro}
                  onChange={(e) => handleDurationChange('pomodoro', e.target.value)}
                  disabled={!canEditSettings}
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
                  onChange={(e) => handleDurationChange('shortRest', e.target.value)}
                  disabled={!canEditSettings}
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
                  onChange={(e) => handleDurationChange('longRest', e.target.value)}
                  disabled={!canEditSettings}
                  aria-invalid={Boolean(validation.errors.longRest)}
                  aria-describedby={validation.errors.longRest ? 'long-rest-error' : undefined}
                />
                {validation.errors.longRest && (
                  <span id="long-rest-error" className="pomodoro-field-error">
                    {validation.errors.longRest}
                  </span>
                )}
              </label>

              {!isIdle && (
                <div className="modal-actions pomodoro-active-actions">
                  {isPaused ? (
                    <button type="button" className="btn primary" onClick={onResume}>
                      Resume
                    </button>
                  ) : (
                    <button type="button" className="btn" onClick={onPause}>
                      Pause
                    </button>
                  )}
                  <button type="button" className="btn" onClick={onReset}>
                    Reset
                  </button>
                </div>
              )}

              {isIdle && (
                <div className="modal-actions">
                  <button type="button" className="btn" onClick={onClose}>
                    Cancel
                  </button>
                  <button type="submit" className="btn primary" disabled={!formValid}>
                    Start
                  </button>
                </div>
              )}
            </form>
          </>
        )}
      </div>
    </div>
  )
}
