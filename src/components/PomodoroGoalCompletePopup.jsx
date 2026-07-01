export function PomodoroGoalCompletePopup({ dailyGoal, theme, onDismiss }) {
  const logoSrc =
    theme === 'light'
      ? `${import.meta.env.BASE_URL}lizard-logo-light.png`
      : `${import.meta.env.BASE_URL}lizard-logo-dark.png`

  return (
    <div
      className="modal-overlay"
      role="presentation"
      onClick={onDismiss}
    >
      <div
        className="modal pomodoro-modal"
        role="dialog"
        aria-labelledby="pomodoro-goal-complete-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="pomodoro-congrats">
          <div className="pomodoro-congrats-icon">
            <img className="pomodoro-congrats-logo" src={logoSrc} alt="" width={64} height={64} />
          </div>
          <p id="pomodoro-goal-complete-title" className="pomodoro-congrats-title">
            Daily goal complete!
          </p>
          <p className="pomodoro-congrats-subtitle">
            You finished {dailyGoal} Pomodoro cycle{dailyGoal === 1 ? '' : 's'}. Nice work!
          </p>
          <div className="modal-actions">
            <button type="button" className="btn primary" onClick={onDismiss}>
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
