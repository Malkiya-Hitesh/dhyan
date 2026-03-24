// hooks/useTimer.js
// Focus timer — tab close, reload, mobile sleep ma pan sahi rehvu joie
// Logic: timer start thay tyare startedAt (wall clock) localStorage ma store karo
//        reload/wapas aavo to elapsed = now - startedAt → timeLeft = saved - elapsed

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

const STORAGE_KEY = 'dhyan_timer_v2'

// localStorage ma save karo
function saveState(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {}
}

// localStorage mathi load karo + elapsed time adjust karo
function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const saved = JSON.parse(raw)

    if (saved.running && saved.startedAt) {
      // Actual wall-clock elapsed seconds
      const elapsedSec = Math.floor((Date.now() - saved.startedAt) / 1000)
      const newTimeLeft = Math.max(0, saved.timeLeft - elapsedSec)

      // Agar timer expire thayo hoy tab close/reload vachhe
      if (newTimeLeft === 0) {
        return {
          ...saved,
          timeLeft: 0,
          running: false,
          expired: true,   // caller ne khabar padse
          startedAt: null,
        }
      }

      return { ...saved, timeLeft: newTimeLeft }
    }

    return saved
  } catch {
    return null
  }
}

export function useTimer(onSessionComplete) {
  const savedRef = useRef(loadState())
  const saved    = savedRef.current

  const [mode,     setModeKey] = useState(saved?.mode     || 'pomodoro')
  const [timeLeft, setLeft]    = useState(
    saved?.timeLeft ?? MODES[saved?.mode || 'pomodoro'].mins * 60
  )
  const [running,  setRun]     = useState(saved?.running  || false)
  const [phase,    setPhase]   = useState(saved?.phase    || 'focus')

  const intervalRef     = useRef(null)
  const onCompleteRef   = useRef(onSessionComplete)
  onCompleteRef.current = onSessionComplete

  // Mount pe — agar expire thayel hoy to session complete fire karo
  useEffect(() => {
    if (saved?.expired && saved?.phase === 'focus') {
      onCompleteRef.current(MODES[saved.mode]?.mins || 25)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Timer interval — har second timeLeft ghatado
  useEffect(() => {
    if (!running) {
      clearInterval(intervalRef.current)
      return
    }

    intervalRef.current = setInterval(() => {
      setLeft(prev => {
        const next = prev - 1

        // localStorage update karo — startedAt recalculate karo
        // (so mobile sleep pachi bhi accurate rehvu)
        saveState({
          mode,
          timeLeft: next,
          running: true,
          phase,
          startedAt: Date.now() - (MODES[mode].mins * 60 - next) * 1000,
        })

        if (next <= 0) {
          clearInterval(intervalRef.current)
          setRun(false)

          // Focus session complete
          if (phase === 'focus') {
            onCompleteRef.current(MODES[mode].mins)
          }

          // Pomodoro: auto-switch to break
          if (mode === 'pomodoro') {
            setModeKey('short')
            setPhase('break')
            const breakTime = MODES.short.mins * 60
            saveState({ mode: 'short', timeLeft: breakTime, running: false, phase: 'break', startedAt: null })
            return breakTime
          }

          saveState({ mode, timeLeft: 0, running: false, phase, startedAt: null })
          return 0
        }

        return next
      })
    }, 1000)

    return () => clearInterval(intervalRef.current)
  }, [running, mode, phase])

  // Mode change (sirf jyare running na hoy)
  const setMode = useCallback((key) => {
    if (running) return
    const newTime = MODES[key].mins * 60
    setModeKey(key)
    setLeft(newTime)
    setPhase(MODES[key].phase)
    saveState({ mode: key, timeLeft: newTime, running: false, phase: MODES[key].phase, startedAt: null })
  }, [running])

  // Play/Pause toggle
  const toggle = useCallback(() => {
    setRun(r => {
      const next = !r
      saveState({
        mode,
        timeLeft,
        running: next,
        phase,
        startedAt: next ? Date.now() : null,
      })
      return next
    })
  }, [mode, timeLeft, phase])

  // Manual reset
  const reset = useCallback(() => {
    clearInterval(intervalRef.current)
    setRun(false)
    const newTime = MODES[mode].mins * 60
    setLeft(newTime)
    saveState({ mode, timeLeft: newTime, running: false, phase, startedAt: null })
  }, [mode, phase])

  // mm:ss display
  const display = `${String(Math.floor(timeLeft / 60)).padStart(2, '0')}:${String(timeLeft % 60).padStart(2, '0')}`

  // Arc progress 0 → 1
  const progress = 1 - timeLeft / (MODES[mode].mins * 60)

  return {
    mode, setMode,
    timeLeft, display,
    running, toggle, reset,
    phase, progress,
    modes: MODES,
    modeData: MODES[mode],
  }
}