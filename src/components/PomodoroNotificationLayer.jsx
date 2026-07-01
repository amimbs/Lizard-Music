import { PomodoroCompletionPopup } from './PomodoroCompletionPopup.jsx'
import { PomodoroGoalCompletePopup } from './PomodoroGoalCompletePopup.jsx'

export function PomodoroNotificationLayer({
  formOpen,
  goalComplete,
  pendingNextPhase,
  dailyGoal,
  theme,
  onConfirmPending,
  onDismissPending,
  onDismissGoalComplete,
}) {
  if (goalComplete && !formOpen) {
    return (
      <PomodoroGoalCompletePopup
        dailyGoal={dailyGoal}
        theme={theme}
        onDismiss={onDismissGoalComplete}
      />
    )
  }

  if (pendingNextPhase && !goalComplete && !formOpen) {
    return (
      <PomodoroCompletionPopup
        nextPhase={pendingNextPhase}
        onConfirm={onConfirmPending}
        onDismiss={onDismissPending}
      />
    )
  }

  return null
}
