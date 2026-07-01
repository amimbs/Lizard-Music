import { useState, useRef, useEffect, useCallback } from 'react'
import {
  DEFAULT_DURATIONS,
  DEFAULT_DAILY_GOAL,
  validateAllDurations,
  validateDailyGoal,
  durationToSeconds,
} from '../utils/pomodoroValidation.js'

const TICK_MS = 1000

export function usePomodoroTimer({ onChime } = {}) {
  const [phase, setPhase] = useState('idle')
  const [isPaused, setIsPaused] = useState(false)
  const [remainingSeconds, setRemainingSeconds] = useState(0)
  const [pomodoroCount, setPomodoroCount] = useState(0)
  const [completedCycles, setCompletedCycles] = useState(0)
  const [dailyGoal, setDailyGoalState] = useState(DEFAULT_DAILY_GOAL)
  const [selectedTimerType, setSelectedTimerTypeState] = useState('pomodoro')
  const [goalComplete, setGoalComplete] = useState(false)
  const [durations, setDurationsState] = useState({ ...DEFAULT_DURATIONS })

  const intervalRef = useRef(null)
  const onChimeRef = useRef(onChime)
  const durationsRef = useRef(durations)
  const pomodoroCountRef = useRef(pomodoroCount)
  const completedCyclesRef = useRef(completedCycles)
  const dailyGoalRef = useRef(dailyGoal)
  const isPausedRef = useRef(isPaused)
  const selectedTimerTypeRef = useRef(selectedTimerType)
  const pomodoroCompletedBeforeRestRef = useRef(false)

  onChimeRef.current = onChime
  durationsRef.current = durations
  pomodoroCountRef.current = pomodoroCount
  completedCyclesRef.current = completedCycles
  dailyGoalRef.current = dailyGoal
  isPausedRef.current = isPaused
  selectedTimerTypeRef.current = selectedTimerType

  const clearTimer = useCallback(() => {
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }, [])

  const startInterval = useCallback(() => {
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
  }, [])

  const beginCountdown = useCallback(
    (nextPhase, seconds) => {
      clearTimer()
      setIsPaused(false)
      isPausedRef.current = false
      setPhase(nextPhase)
      setRemainingSeconds(seconds)
      startInterval()
    },
    [clearTimer, startInterval],
  )

  const checkGoalComplete = useCallback(
    (nextCompletedCycles) => {
      if (nextCompletedCycles >= dailyGoalRef.current) {
        clearTimer()
        setIsPaused(false)
        isPausedRef.current = false
        setPhase('idle')
        setRemainingSeconds(0)
        setGoalComplete(true)
        return true
      }
      return false
    },
    [clearTimer],
  )

  const handlePhaseComplete = useCallback(
    (completedPhase) => {
      if (completedPhase === 'pomodoro') {
        onChimeRef.current?.('pomodoroEnd')
        pomodoroCompletedBeforeRestRef.current = true
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
        const shouldIncrement = pomodoroCompletedBeforeRestRef.current
        pomodoroCompletedBeforeRestRef.current = false

        if (shouldIncrement) {
          const nextCompleted = completedCyclesRef.current + 1
          completedCyclesRef.current = nextCompleted
          setCompletedCycles(nextCompleted)
          if (checkGoalComplete(nextCompleted)) return
        }

        setPhase('idle')
        setRemainingSeconds(0)
        return
      }

      if (completedPhase === 'longRest') {
        onChimeRef.current?.('longRestEnd')
        pomodoroCompletedBeforeRestRef.current = false
        pomodoroCountRef.current = 0
        setPomodoroCount(0)
        setPhase('idle')
        setRemainingSeconds(0)
      }
    },
    [beginCountdown, checkGoalComplete],
  )

  useEffect(() => {
    if (isPausedRef.current) return
    if (remainingSeconds !== 0 || phase === 'idle') return
    handlePhaseComplete(phase)
  }, [remainingSeconds, phase, handlePhaseComplete])

  useEffect(() => () => clearTimer(), [clearTimer])

  const setDurations = useCallback(
    (next) => {
      if (phase !== 'idle') return
      durationsRef.current = next
      setDurationsState(next)
    },
    [phase],
  )

  const setDailyGoal = useCallback(
    (goal) => {
      if (phase !== 'idle') return
      if (!validateDailyGoal(goal)) return
      setDailyGoalState(goal)
      dailyGoalRef.current = goal
      if (goal <= completedCyclesRef.current) {
        setGoalComplete(true)
      }
    },
    [phase],
  )

  const setSelectedTimerType = useCallback(
    (type) => {
      if (phase !== 'idle') return
      selectedTimerTypeRef.current = type
      setSelectedTimerTypeState(type)
    },
    [phase],
  )

  const start = useCallback(() => {
    if (phase !== 'idle' || goalComplete) return
    const currentDurations = durationsRef.current
    const timerType = selectedTimerTypeRef.current
    const { valid } = validateAllDurations(currentDurations)
    if (!valid) return
    if (!validateDailyGoal(dailyGoalRef.current)) return
    pomodoroCompletedBeforeRestRef.current = false
    beginCountdown(timerType, durationToSeconds(currentDurations[timerType]))
  }, [phase, goalComplete, beginCountdown])

  const pause = useCallback(() => {
    if (phase === 'idle' || isPaused) return
    clearTimer()
    setIsPaused(true)
    isPausedRef.current = true
  }, [phase, isPaused, clearTimer])

  const resume = useCallback(() => {
    if (phase === 'idle' || !isPaused) return
    setIsPaused(false)
    isPausedRef.current = false
    startInterval()
  }, [phase, isPaused, startInterval])

  const reset = useCallback(() => {
    clearTimer()
    setIsPaused(false)
    isPausedRef.current = false
    pomodoroCompletedBeforeRestRef.current = false
    setPhase('idle')
    setRemainingSeconds(0)
  }, [clearTimer])

  const dismissGoalComplete = useCallback(() => {
    clearTimer()
    setIsPaused(false)
    isPausedRef.current = false
    pomodoroCompletedBeforeRestRef.current = false
    pomodoroCountRef.current = 0
    completedCyclesRef.current = 0
    dailyGoalRef.current = DEFAULT_DAILY_GOAL
    setPhase('idle')
    setRemainingSeconds(0)
    setPomodoroCount(0)
    setCompletedCycles(0)
    setDailyGoalState(DEFAULT_DAILY_GOAL)
    setSelectedTimerTypeState('pomodoro')
    setGoalComplete(false)
    setDurationsState({ ...DEFAULT_DURATIONS })
  }, [clearTimer])

  return {
    phase,
    isPaused,
    remainingSeconds,
    pomodoroCount,
    completedCycles,
    dailyGoal,
    selectedTimerType,
    goalComplete,
    durations,
    setDurations,
    setDailyGoal,
    setSelectedTimerType,
    start,
    pause,
    resume,
    reset,
    dismissGoalComplete,
  }
}
