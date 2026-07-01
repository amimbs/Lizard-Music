import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { usePomodoroTimer } from './usePomodoroTimer.js'

const MIN = 5 * 60 * 1000

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
})
