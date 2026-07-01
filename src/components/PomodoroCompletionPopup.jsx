import { getNextTimerPrompt } from '../utils/pomodoroValidation.js'

export function PomodoroCompletionPopup({ nextPhase, onConfirm, onDismiss }) {
  return (
    <div
      className="pomodoro-completion-popup"
      role="alertdialog"
      aria-labelledby="pomodoro-completion-title"
      aria-modal="true"
    >
      <p id="pomodoro-completion-title" className="pomodoro-completion-popup-title">
        {getNextTimerPrompt(nextPhase)}
      </p>
      <div className="pomodoro-completion-popup-actions">
        <button type="button" className="btn" onClick={onDismiss}>
          No
        </button>
        <button type="button" className="btn primary" onClick={onConfirm}>
          Yes
        </button>
      </div>
    </div>
  )
}
