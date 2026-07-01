export const POMODORO_MIN = 5
export const POMODORO_MAX = 60
export const SHORT_REST_MIN = 5
export const SHORT_REST_MAX = 30
export const LONG_REST_MIN = 15
export const LONG_REST_MAX = 60

/** Fast second-based durations for manual testing in `npm run dev` only. */
export const POMODORO_FAST_DEV = import.meta.env.DEV && !import.meta.env.VITEST

const PROD_CONFIG = {
  unit: 60,
  label: 'minutes',
  limits: {
    pomodoro: [POMODORO_MIN, POMODORO_MAX],
    shortRest: [SHORT_REST_MIN, SHORT_REST_MAX],
    longRest: [LONG_REST_MIN, LONG_REST_MAX],
  },
  defaults: { pomodoro: 25, shortRest: 5, longRest: 15 },
}

const DEV_CONFIG = {
  unit: 1,
  label: 'seconds',
  limits: {
    pomodoro: [5, 60],
    shortRest: [5, 30],
    longRest: [10, 60],
  },
  defaults: { pomodoro: 5, shortRest: 5, longRest: 10 },
}

export function getDurationConfig() {
  return POMODORO_FAST_DEV ? DEV_CONFIG : PROD_CONFIG
}

export const DEFAULT_DURATIONS = getDurationConfig().defaults

function isValidIntegerDuration(value, min, max) {
  if (typeof value !== 'number') return false
  return Number.isInteger(value) && value >= min && value <= max
}

export function validatePomodoroMinutes(value) {
  const [min, max] = getDurationConfig().limits.pomodoro
  return isValidIntegerDuration(value, min, max)
}

export function validateShortRestMinutes(value) {
  const [min, max] = getDurationConfig().limits.shortRest
  return isValidIntegerDuration(value, min, max)
}

export function validateLongRestMinutes(value) {
  const [min, max] = getDurationConfig().limits.longRest
  return isValidIntegerDuration(value, min, max)
}

export function validateAllDurations({ pomodoro, shortRest, longRest }) {
  const { limits, label } = getDurationConfig()
  const errors = {}
  if (!validatePomodoroMinutes(pomodoro)) {
    errors.pomodoro = `Pomodoro must be ${limits.pomodoro[0]}–${limits.pomodoro[1]} ${label}`
  }
  if (!validateShortRestMinutes(shortRest)) {
    errors.shortRest = `Short rest must be ${limits.shortRest[0]}–${limits.shortRest[1]} ${label}`
  }
  if (!validateLongRestMinutes(longRest)) {
    errors.longRest = `Long rest must be ${limits.longRest[0]}–${limits.longRest[1]} ${label}`
  }
  return { valid: Object.keys(errors).length === 0, errors }
}

export function durationToSeconds(value) {
  return value * getDurationConfig().unit
}
