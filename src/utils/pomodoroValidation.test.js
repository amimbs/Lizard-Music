import { describe, expect, it } from 'vitest'
import {
  validatePomodoroMinutes,
  validateShortRestMinutes,
  validateLongRestMinutes,
  validateAllDurations,
  validateDailyGoal,
  formatCycleBullets,
  POMODORO_MIN,
  POMODORO_MAX,
  SHORT_REST_MIN,
  SHORT_REST_MAX,
  LONG_REST_MIN,
  LONG_REST_MAX,
  DAILY_GOAL_MIN,
  DAILY_GOAL_MAX,
  validateLongRestFrequency,
  getNextTimerPrompt,
  LONG_REST_FREQUENCY_MIN,
  LONG_REST_FREQUENCY_MAX,
} from './pomodoroValidation.js'

describe('validatePomodoroMinutes', () => {
  it('allows 5–60 minutes only', () => {
    expect(validatePomodoroMinutes(POMODORO_MIN)).toBe(true)
    expect(validatePomodoroMinutes(POMODORO_MAX)).toBe(true)
    expect(validatePomodoroMinutes(25)).toBe(true)
    expect(validatePomodoroMinutes(POMODORO_MIN - 1)).toBe(false)
    expect(validatePomodoroMinutes(POMODORO_MAX + 1)).toBe(false)
    expect(validatePomodoroMinutes(25.5)).toBe(false)
    expect(validatePomodoroMinutes('25')).toBe(false)
    expect(validatePomodoroMinutes(NaN)).toBe(false)
  })
})

describe('validateShortRestMinutes', () => {
  it('allows 5–30 minutes only', () => {
    expect(validateShortRestMinutes(SHORT_REST_MIN)).toBe(true)
    expect(validateShortRestMinutes(SHORT_REST_MAX)).toBe(true)
    expect(validateShortRestMinutes(SHORT_REST_MIN - 1)).toBe(false)
    expect(validateShortRestMinutes(SHORT_REST_MAX + 1)).toBe(false)
    expect(validateShortRestMinutes(10.5)).toBe(false)
  })
})

describe('validateLongRestMinutes', () => {
  it('allows 15–60 minutes only', () => {
    expect(validateLongRestMinutes(LONG_REST_MIN)).toBe(true)
    expect(validateLongRestMinutes(LONG_REST_MAX)).toBe(true)
    expect(validateLongRestMinutes(LONG_REST_MIN - 1)).toBe(false)
    expect(validateLongRestMinutes(LONG_REST_MAX + 1)).toBe(false)
    expect(validateLongRestMinutes(20.5)).toBe(false)
  })
})

describe('validateAllDurations', () => {
  it('returns valid for all in-range values', () => {
    const result = validateAllDurations({ pomodoro: 25, shortRest: 5, longRest: 15 })
    expect(result.valid).toBe(true)
    expect(result.errors).toEqual({})
  })

  it('returns errors for each invalid field', () => {
    const result = validateAllDurations({ pomodoro: 4, shortRest: 31, longRest: 14 })
    expect(result.valid).toBe(false)
    expect(result.errors.pomodoro).toBeDefined()
    expect(result.errors.shortRest).toBeDefined()
    expect(result.errors.longRest).toBeDefined()
  })
})

describe('validateDailyGoal', () => {
  it('allows 1–12 cycles only', () => {
    expect(validateDailyGoal(DAILY_GOAL_MIN)).toBe(true)
    expect(validateDailyGoal(DAILY_GOAL_MAX)).toBe(true)
    expect(validateDailyGoal(4)).toBe(true)
    expect(validateDailyGoal(DAILY_GOAL_MIN - 1)).toBe(false)
    expect(validateDailyGoal(DAILY_GOAL_MAX + 1)).toBe(false)
    expect(validateDailyGoal(4.5)).toBe(false)
    expect(validateDailyGoal('4')).toBe(false)
    expect(validateDailyGoal(NaN)).toBe(false)
  })
})

describe('validateLongRestFrequency', () => {
  it('allows 2–12 cycles only', () => {
    expect(validateLongRestFrequency(LONG_REST_FREQUENCY_MIN)).toBe(true)
    expect(validateLongRestFrequency(LONG_REST_FREQUENCY_MAX)).toBe(true)
    expect(validateLongRestFrequency(4)).toBe(true)
    expect(validateLongRestFrequency(LONG_REST_FREQUENCY_MIN - 1)).toBe(false)
    expect(validateLongRestFrequency(LONG_REST_FREQUENCY_MAX + 1)).toBe(false)
    expect(validateLongRestFrequency(4.5)).toBe(false)
    expect(validateLongRestFrequency('4')).toBe(false)
    expect(validateLongRestFrequency(NaN)).toBe(false)
  })
})

describe('getNextTimerPrompt', () => {
  it('returns the correct prompt for each phase', () => {
    expect(getNextTimerPrompt('pomodoro')).toBe('Start Pomodoro?')
    expect(getNextTimerPrompt('shortRest')).toBe('Start Short Rest?')
    expect(getNextTimerPrompt('longRest')).toBe('Start Long Rest?')
  })
})

describe('formatCycleBullets', () => {
  it('renders filled and open bullets for progress', () => {
    expect(formatCycleBullets(0, 4)).toBe('○ ○ ○ ○')
    expect(formatCycleBullets(2, 4)).toBe('● ● ○ ○')
    expect(formatCycleBullets(4, 4)).toBe('● ● ● ●')
  })
})
