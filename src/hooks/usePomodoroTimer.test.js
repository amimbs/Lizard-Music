import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { usePomodoroTimer } from './usePomodoroTimer.js'
import {
  DEFAULT_DAILY_GOAL,
  DEFAULT_LONG_REST_FREQUENCY,
} from '../utils/pomodoroValidation.js'

const MIN = 5 * 60 * 1000

function completePomodoroAndShortRest(result) {
  act(() => {
    result.current.start()
  })
  act(() => {
    vi.advanceTimersByTime(MIN)
  })
  act(() => {
    vi.advanceTimersByTime(MIN)
  })
}

function renderTimer(options = {}) {
  return renderHook(() => usePomodoroTimer(options))
}

describe('usePomodoroTimer', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('does not begin until the user clicks Start', () => {
    const onChime = vi.fn()
    const { result } = renderHook(() => usePomodoroTimer({ onChime }))

    expect(result.current.phase).toBe('idle')
    expect(result.current.remainingSeconds).toBe(0)

    act(() => {
      vi.advanceTimersByTime(60_000)
    })

    expect(result.current.phase).toBe('idle')
    expect(onChime).not.toHaveBeenCalled()
  })

  it('transitions idle → pomodoro on start', () => {
    const { result } = renderHook(() => usePomodoroTimer({ onChime: vi.fn() }))

    act(() => {
      result.current.start()
    })

    expect(result.current.phase).toBe('pomodoro')
    expect(result.current.remainingSeconds).toBe(25 * 60)
  })

  it('starts short rest automatically after pomodoro completion', () => {
    const onChime = vi.fn()
    const { result } = renderHook(() => usePomodoroTimer({ onChime }))

    act(() => {
      result.current.setDurations({ pomodoro: 5, shortRest: 5, longRest: 15 })
    })

    act(() => {
      result.current.start()
    })

    act(() => {
      vi.advanceTimersByTime(MIN)
    })

    expect(onChime).toHaveBeenCalledWith('pomodoroEnd')
    expect(result.current.phase).toBe('shortRest')
    expect(result.current.remainingSeconds).toBe(5 * 60)
    expect(result.current.pomodoroCount).toBe(1)
  })

  it('starts long rest after every 4th pomodoro', () => {
    const onChime = vi.fn()
    const { result } = renderHook(() => usePomodoroTimer({ onChime }))

    act(() => {
      result.current.setDurations({ pomodoro: 5, shortRest: 5, longRest: 15 })
    })

    for (let i = 0; i < 3; i++) {
      act(() => {
        result.current.start()
      })
      act(() => {
        vi.advanceTimersByTime(MIN)
      })
      act(() => {
        vi.advanceTimersByTime(MIN)
      })
    }

    act(() => {
      result.current.start()
    })
    act(() => {
      vi.advanceTimersByTime(MIN)
    })

    expect(result.current.phase).toBe('longRest')
    expect(result.current.remainingSeconds).toBe(15 * 60)
    expect(result.current.pomodoroCount).toBe(4)
  })

  it('returns to idle after short rest and does not auto-start next pomodoro', () => {
    const onChime = vi.fn()
    const { result } = renderHook(() => usePomodoroTimer({ onChime }))

    act(() => {
      result.current.setDurations({ pomodoro: 5, shortRest: 5, longRest: 15 })
    })

    act(() => {
      result.current.start()
    })
    act(() => {
      vi.advanceTimersByTime(MIN)
    })
    act(() => {
      vi.advanceTimersByTime(MIN)
    })

    expect(onChime).toHaveBeenCalledWith('shortRestEnd')
    expect(result.current.phase).toBe('idle')

    act(() => {
      vi.advanceTimersByTime(120_000)
    })

    expect(result.current.phase).toBe('idle')
  })

  it('returns to idle after long rest and resets pomodoro count', () => {
    const onChime = vi.fn()
    const { result } = renderHook(() => usePomodoroTimer({ onChime }))

    act(() => {
      result.current.setDurations({ pomodoro: 5, shortRest: 5, longRest: 15 })
    })

    for (let i = 0; i < 4; i++) {
      act(() => {
        result.current.start()
      })
      act(() => {
        vi.advanceTimersByTime(MIN)
      })
      if (i < 3) {
        act(() => {
          vi.advanceTimersByTime(MIN)
        })
      }
    }

    act(() => {
      vi.advanceTimersByTime(15 * 60 * 1000)
    })

    expect(onChime).toHaveBeenCalledWith('longRestEnd')
    expect(result.current.phase).toBe('idle')
    expect(result.current.pomodoroCount).toBe(0)
  })

  it('triggers correct chime for each phase end', () => {
    const onChime = vi.fn()
    const { result } = renderHook(() => usePomodoroTimer({ onChime }))

    act(() => {
      result.current.setDurations({ pomodoro: 5, shortRest: 5, longRest: 15 })
    })

    act(() => {
      result.current.start()
    })
    act(() => {
      vi.advanceTimersByTime(MIN)
    })
    expect(onChime).toHaveBeenLastCalledWith('pomodoroEnd')

    act(() => {
      vi.advanceTimersByTime(MIN)
    })
    expect(onChime).toHaveBeenLastCalledWith('shortRestEnd')
  })

  it('does not start with invalid durations', () => {
    const { result } = renderHook(() => usePomodoroTimer({ onChime: vi.fn() }))

    act(() => {
      result.current.setDurations({ pomodoro: 4, shortRest: 5, longRest: 15 })
    })
    act(() => {
      result.current.start()
    })

    expect(result.current.phase).toBe('idle')
  })

  it('increments completed cycles only after pomodoro and short rest', () => {
    const { result } = renderHook(() => usePomodoroTimer({ onChime: vi.fn() }))

    act(() => {
      result.current.setDurations({ pomodoro: 5, shortRest: 5, longRest: 15 })
    })

    act(() => {
      result.current.start()
    })
    act(() => {
      vi.advanceTimersByTime(MIN)
    })

    expect(result.current.completedCycles).toBe(0)

    act(() => {
      vi.advanceTimersByTime(MIN)
    })

    expect(result.current.completedCycles).toBe(1)
  })

  it('does not increment completed cycles after pomodoro alone', () => {
    const { result } = renderHook(() => usePomodoroTimer({ onChime: vi.fn() }))

    act(() => {
      result.current.setDurations({ pomodoro: 5, shortRest: 5, longRest: 15 })
    })

    act(() => {
      result.current.start()
    })
    act(() => {
      vi.advanceTimersByTime(MIN)
    })

    expect(result.current.completedCycles).toBe(0)
    expect(result.current.phase).toBe('shortRest')
  })

  it('increments completed cycles after assigned long rest', () => {
    const { result } = renderHook(() => usePomodoroTimer({ onChime: vi.fn() }))

    act(() => {
      result.current.setDurations({ pomodoro: 5, shortRest: 5, longRest: 15 })
      result.current.setDailyGoal(12)
    })

    for (let i = 0; i < 3; i++) {
      completePomodoroAndShortRest(result)
    }

    act(() => {
      result.current.start()
    })
    act(() => {
      vi.advanceTimersByTime(MIN)
    })
    act(() => {
      vi.advanceTimersByTime(15 * 60 * 1000)
    })

    expect(result.current.completedCycles).toBe(4)
  })

  it('does not increment completed cycles for manual short rest without pomodoro', () => {
    const { result } = renderHook(() => usePomodoroTimer({ onChime: vi.fn() }))

    act(() => {
      result.current.setDurations({ pomodoro: 5, shortRest: 5, longRest: 15 })
      result.current.setSelectedTimerType('shortRest')
    })

    act(() => {
      result.current.start()
    })
    act(() => {
      vi.advanceTimersByTime(MIN)
    })

    expect(result.current.completedCycles).toBe(0)
  })

  it('sets goalComplete when daily goal is reached', () => {
    const { result } = renderHook(() => usePomodoroTimer({ onChime: vi.fn() }))

    act(() => {
      result.current.setDurations({ pomodoro: 5, shortRest: 5, longRest: 15 })
      result.current.setDailyGoal(1)
    })

    completePomodoroAndShortRest(result)

    expect(result.current.goalComplete).toBe(true)
    expect(result.current.phase).toBe('idle')
    expect(result.current.completedCycles).toBe(1)
  })

  it('resets to defaults after dismissGoalComplete', () => {
    const { result } = renderHook(() => usePomodoroTimer({ onChime: vi.fn() }))

    act(() => {
      result.current.setDurations({ pomodoro: 5, shortRest: 5, longRest: 15 })
      result.current.setDailyGoal(1)
    })

    completePomodoroAndShortRest(result)

    act(() => {
      result.current.dismissGoalComplete()
    })

    expect(result.current.goalComplete).toBe(false)
    expect(result.current.completedCycles).toBe(0)
    expect(result.current.dailyGoal).toBe(DEFAULT_DAILY_GOAL)
    expect(result.current.longRestFrequency).toBe(DEFAULT_LONG_REST_FREQUENCY)
    expect(result.current.durations).toEqual({ pomodoro: 25, shortRest: 5, longRest: 15 })
    expect(result.current.selectedTimerType).toBe('pomodoro')
  })

  it('pause stops the countdown', () => {
    const { result } = renderHook(() => usePomodoroTimer({ onChime: vi.fn() }))

    act(() => {
      result.current.setDurations({ pomodoro: 5, shortRest: 5, longRest: 15 })
      result.current.start()
    })

    act(() => {
      vi.advanceTimersByTime(60_000)
    })

    const remainingBeforePause = result.current.remainingSeconds

    act(() => {
      result.current.pause()
    })

    expect(result.current.isPaused).toBe(true)

    act(() => {
      vi.advanceTimersByTime(120_000)
    })

    expect(result.current.remainingSeconds).toBe(remainingBeforePause)
  })

  it('resume continues from paused remaining time', () => {
    const { result } = renderHook(() => usePomodoroTimer({ onChime: vi.fn() }))

    act(() => {
      result.current.setDurations({ pomodoro: 5, shortRest: 5, longRest: 15 })
      result.current.start()
    })

    act(() => {
      vi.advanceTimersByTime(60_000)
    })

    act(() => {
      result.current.pause()
    })

    const remainingAtPause = result.current.remainingSeconds

    act(() => {
      result.current.resume()
    })

    expect(result.current.isPaused).toBe(false)

    act(() => {
      vi.advanceTimersByTime(30_000)
    })

    expect(result.current.remainingSeconds).toBe(remainingAtPause - 30)
  })

  it('reset stops timer, returns idle, and preserves completed cycles', () => {
    const { result } = renderHook(() => usePomodoroTimer({ onChime: vi.fn() }))

    act(() => {
      result.current.setDurations({ pomodoro: 5, shortRest: 5, longRest: 15 })
    })

    completePomodoroAndShortRest(result)
    expect(result.current.completedCycles).toBe(1)

    act(() => {
      result.current.start()
    })

    act(() => {
      result.current.reset()
    })

    expect(result.current.phase).toBe('idle')
    expect(result.current.isPaused).toBe(false)
    expect(result.current.remainingSeconds).toBe(0)
    expect(result.current.completedCycles).toBe(1)
  })

  it('does not allow timer type switching while running', () => {
    const { result } = renderHook(() => usePomodoroTimer({ onChime: vi.fn() }))

    act(() => {
      result.current.start()
    })

    act(() => {
      result.current.setSelectedTimerType('shortRest')
    })

    expect(result.current.selectedTimerType).toBe('pomodoro')
  })

  it('does not allow timer type switching while paused', () => {
    const { result } = renderHook(() => usePomodoroTimer({ onChime: vi.fn() }))

    act(() => {
      result.current.start()
    })
    act(() => {
      result.current.pause()
    })

    act(() => {
      result.current.setSelectedTimerType('longRest')
    })

    expect(result.current.selectedTimerType).toBe('pomodoro')
  })

  it('allows timer type switching after reset', () => {
    const { result } = renderHook(() => usePomodoroTimer({ onChime: vi.fn() }))

    act(() => {
      result.current.start()
    })
    act(() => {
      result.current.reset()
    })
    act(() => {
      result.current.setSelectedTimerType('shortRest')
    })

    expect(result.current.selectedTimerType).toBe('shortRest')
  })

  it('start respects selected timer type', () => {
    const { result } = renderHook(() => usePomodoroTimer({ onChime: vi.fn() }))

    act(() => {
      result.current.setDurations({ pomodoro: 5, shortRest: 5, longRest: 15 })
      result.current.setSelectedTimerType('longRest')
      result.current.start()
    })

    expect(result.current.phase).toBe('longRest')
    expect(result.current.remainingSeconds).toBe(15 * 60)
  })

  it('preserves completed cycles when daily goal is increased', () => {
    const { result } = renderHook(() => usePomodoroTimer({ onChime: vi.fn() }))

    act(() => {
      result.current.setDurations({ pomodoro: 5, shortRest: 5, longRest: 15 })
    })

    completePomodoroAndShortRest(result)
    expect(result.current.completedCycles).toBe(1)

    act(() => {
      result.current.setDailyGoal(8)
    })

    expect(result.current.completedCycles).toBe(1)
    expect(result.current.goalComplete).toBe(false)
  })

  it('triggers goalComplete when daily goal is lowered below completed cycles', () => {
    const { result } = renderHook(() => usePomodoroTimer({ onChime: vi.fn() }))

    act(() => {
      result.current.setDurations({ pomodoro: 5, shortRest: 5, longRest: 15 })
    })

    completePomodoroAndShortRest(result)
    expect(result.current.completedCycles).toBe(1)

    act(() => {
      result.current.setDailyGoal(1)
    })

    expect(result.current.goalComplete).toBe(true)
  })

  it('duration changes apply only to future timers', () => {
    const { result } = renderHook(() => usePomodoroTimer({ onChime: vi.fn() }))

    act(() => {
      result.current.setDurations({ pomodoro: 5, shortRest: 5, longRest: 15 })
    })

    completePomodoroAndShortRest(result)

    act(() => {
      result.current.setDurations({ pomodoro: 10, shortRest: 10, longRest: 20 })
      result.current.start()
    })

    expect(result.current.remainingSeconds).toBe(10 * 60)
  })

  it.each([2, 4, 6])(
    'selects short rest before threshold and long rest at frequency %i',
    (frequency) => {
      const { result } = renderTimer({ onChime: vi.fn() })

      act(() => {
        result.current.setDurations({ pomodoro: 5, shortRest: 5, longRest: 15 })
        result.current.setLongRestFrequency(frequency)
        result.current.setDailyGoal(12)
      })

      for (let i = 1; i < frequency; i++) {
        act(() => {
          result.current.start()
        })
        act(() => {
          vi.advanceTimersByTime(MIN)
        })
        expect(result.current.phase).toBe('shortRest')
        act(() => {
          vi.advanceTimersByTime(MIN)
        })
        expect(result.current.pomodoroCount).toBe(i)
      }

      act(() => {
        result.current.start()
      })
      act(() => {
        vi.advanceTimersByTime(MIN)
      })

      expect(result.current.phase).toBe('longRest')
      expect(result.current.pomodoroCount).toBe(frequency)
    },
  )

  it('continues timer when form is closed', () => {
    const isFormOpenRef = { current: false }
    const { result } = renderTimer({ onChime: vi.fn(), isFormOpenRef })

    act(() => {
      result.current.setDurations({ pomodoro: 5, shortRest: 5, longRest: 15 })
      result.current.start()
    })

    act(() => {
      vi.advanceTimersByTime(60_000)
    })

    expect(result.current.phase).toBe('pomodoro')
    expect(result.current.remainingSeconds).toBeLessThan(5 * 60)
  })

  it('sets pendingNextPhase when pomodoro completes with form closed', () => {
    const isFormOpenRef = { current: false }
    const { result } = renderTimer({ onChime: vi.fn(), isFormOpenRef })

    act(() => {
      result.current.setDurations({ pomodoro: 5, shortRest: 5, longRest: 15 })
      result.current.start()
    })

    act(() => {
      vi.advanceTimersByTime(MIN)
    })

    expect(result.current.phase).toBe('idle')
    expect(result.current.pendingNextPhase).toBe('shortRest')
  })

  it('sets pendingNextPhase to longRest at configured frequency with form closed', () => {
    const isFormOpenRef = { current: false }
    const { result } = renderTimer({ onChime: vi.fn(), isFormOpenRef })

    act(() => {
      result.current.setDurations({ pomodoro: 5, shortRest: 5, longRest: 15 })
      result.current.setLongRestFrequency(2)
      result.current.start()
    })

    act(() => {
      vi.advanceTimersByTime(MIN)
    })

    act(() => {
      result.current.confirmPendingNext()
    })

    act(() => {
      vi.advanceTimersByTime(MIN)
    })

    act(() => {
      result.current.dismissPendingNext()
    })

    act(() => {
      result.current.start()
    })

    act(() => {
      vi.advanceTimersByTime(MIN)
    })

    expect(result.current.pendingNextPhase).toBe('longRest')
  })

  it('sets pendingNextPhase to pomodoro when rest completes with form closed', () => {
    const isFormOpenRef = { current: false }
    const { result } = renderTimer({ onChime: vi.fn(), isFormOpenRef })

    act(() => {
      result.current.setDurations({ pomodoro: 5, shortRest: 5, longRest: 15 })
      result.current.start()
    })

    act(() => {
      vi.advanceTimersByTime(MIN)
    })

    act(() => {
      result.current.confirmPendingNext()
    })

    act(() => {
      vi.advanceTimersByTime(MIN)
    })

    expect(result.current.pendingNextPhase).toBe('pomodoro')
    expect(result.current.phase).toBe('idle')
  })

  it('confirmPendingNext starts the pending timer', () => {
    const isFormOpenRef = { current: false }
    const { result } = renderTimer({ onChime: vi.fn(), isFormOpenRef })

    act(() => {
      result.current.setDurations({ pomodoro: 5, shortRest: 5, longRest: 15 })
      result.current.start()
    })

    act(() => {
      vi.advanceTimersByTime(MIN)
    })

    expect(result.current.pendingNextPhase).toBe('shortRest')

    act(() => {
      result.current.confirmPendingNext()
    })

    expect(result.current.pendingNextPhase).toBe(null)
    expect(result.current.phase).toBe('shortRest')
    expect(result.current.remainingSeconds).toBe(5 * 60)
  })

  it('dismissPendingNext leaves timer idle', () => {
    const isFormOpenRef = { current: false }
    const { result } = renderTimer({ onChime: vi.fn(), isFormOpenRef })

    act(() => {
      result.current.setDurations({ pomodoro: 5, shortRest: 5, longRest: 15 })
      result.current.start()
    })

    act(() => {
      vi.advanceTimersByTime(MIN)
    })

    act(() => {
      result.current.dismissPendingNext()
    })

    expect(result.current.pendingNextPhase).toBe(null)
    expect(result.current.phase).toBe('idle')
  })

  it('sets goalComplete instead of pendingNextPhase when daily goal is met with form closed', () => {
    const isFormOpenRef = { current: false }
    const { result } = renderTimer({ onChime: vi.fn(), isFormOpenRef })

    act(() => {
      result.current.setDurations({ pomodoro: 5, shortRest: 5, longRest: 15 })
      result.current.setDailyGoal(1)
      result.current.start()
    })

    act(() => {
      vi.advanceTimersByTime(MIN)
    })

    act(() => {
      result.current.confirmPendingNext()
    })

    act(() => {
      vi.advanceTimersByTime(MIN)
    })

    expect(result.current.goalComplete).toBe(true)
    expect(result.current.pendingNextPhase).toBe(null)
  })
})
