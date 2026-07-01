/** @type {Record<string, { features?: string[], fixes?: string[] }>} */
export const RELEASE_NOTES = {
  '1.0.0-alpha.5.3.5': {
    features: [
      'Pomodoro focus timer — tap the lizard icon in the top-left — with customizable work, short rest, and long rest durations',
      'Daily Pomodoro goal tracking with a completion celebration',
      'Chime alerts when a timer phase ends',
    ],
    fixes: [
      'Update flow now shows what changed after you install a new version',
    ],
  },
}

/**
 * Returns release notes for a version, or null when none are defined.
 */
export function getReleaseNotes(version) {
  const entry = RELEASE_NOTES[version]
  if (!entry) return null
  const hasContent = entry.features?.length || entry.fixes?.length
  return hasContent ? entry : null
}
