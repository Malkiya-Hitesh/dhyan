// hooks/useTimer.js
// Focus timer — page change karta pan reset nathi thato, sirf manual reset thi j

import { useState, useEffect, useRef, useCallback } from 'react'

const MODES = {
  pomodoro: { mins: 25, phase: 'focus',      label: 'Pomodoro' },
  short:    { mins: 5,  phase: 'break',      label: 'Short Break' },
  long:     { mins: 15, phase: 'long break', label: 'Long Break' },
  focus15:  { mins: 15, phase: 'focus',      label: '15 min' },
  focus30:  { mins: 30, phase: 'focus',      label: '30 min' },
  focus45:  { mins: 45, phase: 'focus',      label: '45 min' },
  focus60:  { mins: 60, phase: 'focus',      label: '60 min' },
}

const STORAGE_KEY = 'dhyan_timer'

function loadTimerState() {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const saved = JSON.parse(raw)
    // Agar timer running hatu to elapsed time calculate karo
    if (saved.running && saved.savedAt) {
      const elapsed = Math.floor((Date.now() - saved.savedAt) / 1000)
      const newTimeLeft = Math.max(0, saved.timeLeft - elapsed)
      return { ...saved, timeLeft: newTimeLeft }
    }
    return saved
  } catch {
    return null
  }
}

function saveTimerState(state) {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify({
      ...state,
      savedAt: Date.now(),
    }))
  } catch {}
}

export function useTimer(onSessionComplete) {
  const saved = loadTimerState()

  const [mode,     setModeKey] = useState(saved?.mode     || 'pomodoro')
  const [timeLeft, setLeft]    = useState(saved?.timeLeft ?? MODES[saved?.mode || 'pomodoro'].mins * 60)
  const [running,  setRun]     = useState(saved?.running  || false)
  const [phase,    setPhase]   = useState(saved?.phase    || 'focus')

  const intervalRef     = useRef(null)
  const modeData        = MODES[mode]
  const onCompleteRef   = useRef(onSessionComplete)
  onCompleteRef.current = onSessionComplete

  // State persist karo sessionStorage ma — drekhe change par
  useEffect(() => {
    saveTimerState({ mode, timeLeft, running, phase })
  }, [mode, timeLeft, running, phase])

  // Timer interval
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
          // Focus session complete — notify
          if (phase === 'focus') {
            onCompleteRef.current(MODES[mode].mins)
          }
          // Pomodoro auto-switch to break
          if (mode === 'pomodoro') {
            setModeKey('short')
            setPhase('break')
            saveTimerState({ mode: 'short', timeLeft: MODES.short.mins * 60, running: false, phase: 'break' })
            return MODES.short.mins * 60
          }
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(intervalRef.current)
  }, [running, mode, phase])

  const setMode = useCallback((key) => {
    if (running) return  // Timer chaltu hoy tyare mode na badlav
    setModeKey(key)
    setLeft(MODES[key].mins * 60)
    setPhase(MODES[key].phase)
    saveTimerState({ mode: key, timeLeft: MODES[key].mins * 60, running: false, phase: MODES[key].phase })
  }, [running])

  const toggle = useCallback(() => setRun(r => !r), [])

  const reset = useCallback(() => {
    setRun(false)
    const newTime = MODES[mode].mins * 60
    setLeft(newTime)
    saveTimerState({ mode, timeLeft: newTime, running: false, phase })
  }, [mode, phase])

  // mm:ss format
  const display = `${String(Math.floor(timeLeft / 60)).padStart(2, '0')}:${String(timeLeft % 60).padStart(2, '0')}`

  // Arc progress 0→1
  const progress = 1 - timeLeft / (MODES[mode].mins * 60)

  return { mode, setMode, timeLeft, display, running, toggle, reset, phase, progress, modes: MODES, modeData }
}