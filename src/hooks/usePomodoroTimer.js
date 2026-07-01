import { useState, useRef, useEffect, useCallback } from 'react'
import { DEFAULT_DURATIONS, validateAllDurations, durationToSeconds } from '../utils/pomodoroValidation.js'

const TICK_MS = 1000

export function usePomodoroTimer({ onChime } = {}) {
  const [phase, setPhase] = useState('idle')
  const [remainingSeconds, setRemainingSeconds] = useState(0)
  const [pomodoroCount, setPomodoroCount] = useState(0)
  const [durations, setDurationsState] = useState({ ...DEFAULT_DURATIONS })

  const intervalRef = useRef(null)
  const onChimeRef = useRef(onChime)
  const durationsRef = useRef(durations)
  const pomodoroCountRef = useRef(pomodoroCount)
  onChimeRef.current = onChime
  durationsRef.current = durations
  pomodoroCountRef.current = pomodoroCount

  const clearTimer = useCallback(() => {
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }, [])

  const beginCountdown = useCallback(
    (nextPhase, seconds) => {
      clearTimer()
      setPhase(nextPhase)
      setRemainingSeconds(seconds)

      intervalRef.current = setInterval(() => {
        setRemainingSeconds((prev) => {
          if (prev <= 1) {
            clearInterval(intervalRef.current)
            intervalRef.current = null
            return 0
          }
          return prev - 1
        })
      }, TICK_MS)
    },
    [clearTimer],
  )

  const handlePhaseComplete = useCallback(
    (completedPhase) => {
      if (completedPhase === 'pomodoro') {
        onChimeRef.current?.('pomodoroEnd')
        const nextCount = pomodoroCountRef.current + 1
        pomodoroCountRef.current = nextCount
        setPomodoroCount(nextCount)
        const { shortRest, longRest } = durationsRef.current
        if (nextCount % 4 === 0) {
          beginCountdown('longRest', durationToSeconds(longRest))
        } else {
          beginCountdown('shortRest', durationToSeconds(shortRest))
        }
        return
      }

      if (completedPhase === 'shortRest') {
        onChimeRef.current?.('shortRestEnd')
        setPhase('idle')
        return
      }

      if (completedPhase === 'longRest') {
        onChimeRef.current?.('longRestEnd')
        pomodoroCountRef.current = 0
        setPomodoroCount(0)
        setPhase('idle')
      }
    },
    [beginCountdown],
  )

  useEffect(() => {
    if (remainingSeconds !== 0 || phase === 'idle') return
    handlePhaseComplete(phase)
  }, [remainingSeconds, phase, handlePhaseComplete])

  useEffect(() => () => clearTimer(), [clearTimer])

  const setDurations = useCallback(
    (next) => {
      if (phase !== 'idle') return
      setDurationsState(next)
    },
    [phase],
  )

  const start = useCallback(() => {
    if (phase !== 'idle') return
    const { valid } = validateAllDurations(durations)
    if (!valid) return
    beginCountdown('pomodoro', durationToSeconds(durations.pomodoro))
  }, [phase, durations, beginCountdown])

  const reset = useCallback(() => {
    clearTimer()
    pomodoroCountRef.current = 0
    setPhase('idle')
    setRemainingSeconds(0)
    setPomodoroCount(0)
  }, [clearTimer])

  return {
    phase,
    remainingSeconds,
    pomodoroCount,
    durations,
    setDurations,
    start,
    reset,
  }
}
