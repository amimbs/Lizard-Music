import { useState, useRef, useEffect, useCallback } from 'react'
import {
  DEFAULT_DURATIONS,
  DEFAULT_DAILY_GOAL,
  DEFAULT_LONG_REST_FREQUENCY,
  validateAllDurations,
  validateDailyGoal,
  validateLongRestFrequency,
  durationToSeconds,
} from '../utils/pomodoroValidation.js'

const TICK_MS = 1000

export function usePomodoroTimer({ onChime, isFormOpenRef } = {}) {
  const [phase, setPhase] = useState('idle')
  const [isPaused, setIsPaused] = useState(false)
  const [remainingSeconds, setRemainingSeconds] = useState(0)
  const [pomodoroCount, setPomodoroCount] = useState(0)
  const [completedCycles, setCompletedCycles] = useState(0)
  const [dailyGoal, setDailyGoalState] = useState(DEFAULT_DAILY_GOAL)
  const [longRestFrequency, setLongRestFrequencyState] = useState(DEFAULT_LONG_REST_FREQUENCY)
  const [selectedTimerType, setSelectedTimerTypeState] = useState('pomodoro')
  const [goalComplete, setGoalComplete] = useState(false)
  const [pendingNextPhase, setPendingNextPhase] = useState(null)
  const [durations, setDurationsState] = useState({ ...DEFAULT_DURATIONS })

  const intervalRef = useRef(null)
  const onChimeRef = useRef(onChime)
  const isFormOpenRefInternal = useRef(true)
  const durationsRef = useRef(durations)
  const pomodoroCountRef = useRef(pomodoroCount)
  const completedCyclesRef = useRef(completedCycles)
  const dailyGoalRef = useRef(dailyGoal)
  const longRestFrequencyRef = useRef(longRestFrequency)
  const isPausedRef = useRef(isPaused)
  const selectedTimerTypeRef = useRef(selectedTimerType)
  const pomodoroCompletedBeforeRestRef = useRef(false)
  const pendingNextPhaseRef = useRef(null)

  onChimeRef.current = onChime
  isFormOpenRefInternal.current = isFormOpenRef?.current ?? true
  durationsRef.current = durations
  pomodoroCountRef.current = pomodoroCount
  completedCyclesRef.current = completedCycles
  dailyGoalRef.current = dailyGoal
  longRestFrequencyRef.current = longRestFrequency
  isPausedRef.current = isPaused
  selectedTimerTypeRef.current = selectedTimerType
  pendingNextPhaseRef.current = pendingNextPhase

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

  const goIdle = useCallback(() => {
    clearTimer()
    setIsPaused(false)
    isPausedRef.current = false
    setPhase('idle')
    setRemainingSeconds(0)
  }, [clearTimer])

  const checkGoalComplete = useCallback(
    (nextCompletedCycles) => {
      if (nextCompletedCycles >= dailyGoalRef.current) {
        goIdle()
        setGoalComplete(true)
        return true
      }
      return false
    },
    [goIdle],
  )

  const incrementCompletedCycle = useCallback(() => {
    const nextCompleted = completedCyclesRef.current + 1
    completedCyclesRef.current = nextCompleted
    setCompletedCycles(nextCompleted)
    return checkGoalComplete(nextCompleted)
  }, [checkGoalComplete])

  const handleRestComplete = useCallback(
    (completedPhase) => {
      if (completedPhase === 'shortRest') {
        onChimeRef.current?.('shortRestEnd')
      } else {
        onChimeRef.current?.('longRestEnd')
        pomodoroCountRef.current = 0
        setPomodoroCount(0)
      }

      const shouldIncrement = pomodoroCompletedBeforeRestRef.current
      pomodoroCompletedBeforeRestRef.current = false

      if (shouldIncrement) {
        if (incrementCompletedCycle()) return true
      }

      return false
    },
    [incrementCompletedCycle],
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
        const restPhase =
          nextCount % longRestFrequencyRef.current === 0 ? 'longRest' : 'shortRest'
        const restDuration = restPhase === 'longRest' ? longRest : shortRest
        const formOpen = isFormOpenRef?.current ?? isFormOpenRefInternal.current
        if (formOpen) {
          beginCountdown(restPhase, durationToSeconds(restDuration))
        } else {
          pendingNextPhaseRef.current = restPhase
          setPendingNextPhase(restPhase)
          goIdle()
        }
        return
      }

      if (completedPhase === 'shortRest' || completedPhase === 'longRest') {
        if (handleRestComplete(completedPhase)) return

        const formOpen = isFormOpenRef?.current ?? isFormOpenRefInternal.current
        if (formOpen) {
          goIdle()
        } else {
          pendingNextPhaseRef.current = 'pomodoro'
          setPendingNextPhase('pomodoro')
          goIdle()
        }
      }
    },
    [beginCountdown, goIdle, handleRestComplete, isFormOpenRef],
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

  const setLongRestFrequency = useCallback(
    (frequency) => {
      if (phase !== 'idle') return
      if (!validateLongRestFrequency(frequency)) return
      setLongRestFrequencyState(frequency)
      longRestFrequencyRef.current = frequency
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
    if (!validateLongRestFrequency(longRestFrequencyRef.current)) return
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
    pendingNextPhaseRef.current = null
    setPendingNextPhase(null)
    setPhase('idle')
    setRemainingSeconds(0)
  }, [clearTimer])

  const confirmPendingNext = useCallback(() => {
    const nextPhase = pendingNextPhaseRef.current
    if (!nextPhase || phase !== 'idle' || goalComplete) return
    pendingNextPhaseRef.current = null
    setPendingNextPhase(null)
    beginCountdown(nextPhase, durationToSeconds(durationsRef.current[nextPhase]))
  }, [phase, goalComplete, beginCountdown])

  const dismissPendingNext = useCallback(() => {
    pendingNextPhaseRef.current = null
    setPendingNextPhase(null)
  }, [])

  const dismissGoalComplete = useCallback(() => {
    clearTimer()
    setIsPaused(false)
    isPausedRef.current = false
    pomodoroCompletedBeforeRestRef.current = false
    pomodoroCountRef.current = 0
    completedCyclesRef.current = 0
    dailyGoalRef.current = DEFAULT_DAILY_GOAL
    longRestFrequencyRef.current = DEFAULT_LONG_REST_FREQUENCY
    pendingNextPhaseRef.current = null
    setPhase('idle')
    setRemainingSeconds(0)
    setPomodoroCount(0)
    setCompletedCycles(0)
    setDailyGoalState(DEFAULT_DAILY_GOAL)
    setLongRestFrequencyState(DEFAULT_LONG_REST_FREQUENCY)
    setSelectedTimerTypeState('pomodoro')
    setGoalComplete(false)
    setPendingNextPhase(null)
    setDurationsState({ ...DEFAULT_DURATIONS })
  }, [clearTimer])

  return {
    phase,
    isPaused,
    remainingSeconds,
    pomodoroCount,
    completedCycles,
    dailyGoal,
    longRestFrequency,
    selectedTimerType,
    goalComplete,
    pendingNextPhase,
    durations,
    setDurations,
    setDailyGoal,
    setLongRestFrequency,
    setSelectedTimerType,
    start,
    pause,
    resume,
    reset,
    confirmPendingNext,
    dismissPendingNext,
    dismissGoalComplete,
  }
}
