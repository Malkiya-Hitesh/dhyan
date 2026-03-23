// hooks/useTimer.js
// Focus timer logic as a reusable hook

import { useState, useEffect, useRef, useCallback } from 'react'

const MODES = {
  pomodoro:  { mins: 25, phase: 'focus',      label: 'Pomodoro' },
  short:     { mins: 5,  phase: 'break',      label: 'Short Break' },
  long:      { mins: 15, phase: 'long break', label: 'Long Break' },
  focus15:   { mins: 15, phase: 'focus',      label: '15 min' },
  focus30:   { mins: 30, phase: 'focus',      label: '30 min' },
  focus45:   { mins: 45, phase: 'focus',      label: '45 min' },
  focus60:   { mins: 60, phase: 'focus',      label: '60 min' },
}

export function useTimer(onSessionComplete) {
  const [mode, setModeKey]  = useState('pomodoro')
  const [timeLeft, setLeft] = useState(25 * 60)
  const [running, setRun]   = useState(false)
  const [phase, setPhase]   = useState('focus')
  const intervalRef         = useRef(null)
  const modeData            = MODES[mode]

  // Reset when mode changes
  const setMode = useCallback((key) => {
    if (running) return
    setModeKey(key)
    setLeft(MODES[key].mins * 60)
    setPhase(MODES[key].phase)
  }, [running])

  const toggle = useCallback(() => setRun(r => !r), [])

  const reset = useCallback(() => {
    setRun(false)
    setLeft(modeData.mins * 60)
  }, [modeData])

  useEffect(() => {
    if (!running) {
      clearInterval(intervalRef.current)
      return
    }
    intervalRef.current = setInterval(() => {
      setLeft(prev => {
        if (prev <= 1) {
          clearInterval(intervalRef.current)
          setRun(false)
          // Notify parent if it's a focus session
          if (phase === 'focus') onSessionComplete(modeData.mins)
          // Auto switch pomodoro to break
          if (mode === 'pomodoro') {
            setModeKey('short')
            setPhase('break')
            return MODES.short.mins * 60
          }
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(intervalRef.current)
  }, [running, mode, phase, modeData, onSessionComplete])

  // Format mm:ss
  const display = `${String(Math.floor(timeLeft / 60)).padStart(2, '0')}:${String(timeLeft % 60).padStart(2, '0')}`

  // Arc progress (0 → 1)
  const progress = 1 - timeLeft / (modeData.mins * 60)

  return { mode, setMode, timeLeft, display, running, toggle, reset, phase, progress, modes: MODES, modeData }
}
