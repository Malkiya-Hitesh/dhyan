// hooks/useTimer.js
//
// SIMPLE WALL-CLOCK LOGIC:
//   Start karo   → startedAt = Date.now() (ms)  localStorage ma save
//   Interval     → timeLeft = totalSecs - Math.floor((Date.now() - startedAt) / 1000)
//   Tab close / mobile sleep / reload → load karo, same formula → correct time
//   Pause karo   → remaining = current timeLeft, startedAt = null
//   Resume karo  → startedAt = Date.now() - (totalSecs - remaining) * 1000

import { useState, useEffect, useRef, useCallback } from 'react'

const MODES = {
  pomodoro: { mins: 25, phase: 'focus',  label: 'Pomodoro' },
  short:    { mins: 5,  phase: 'break',  label: 'Short Break' },
  long:     { mins: 15, phase: 'break',  label: 'Long Break' },
  focus15:  { mins: 15, phase: 'focus',  label: '15 min' },
  focus30:  { mins: 30, phase: 'focus',  label: '30 min' },
  focus45:  { mins: 45, phase: 'focus',  label: '45 min' },
  focus60:  { mins: 60, phase: 'focus',  label: '60 min' },
}

const KEY = 'dhyan_timer_v3'

function save(obj) {
  try { localStorage.setItem(KEY, JSON.stringify(obj)) } catch {}
}

function load() {
  try {
    const s = JSON.parse(localStorage.getItem(KEY) || 'null')
    if (!s) return null

    if (s.running && s.startedAt) {
      // Wall-clock calculation — simple subtract
      const elapsed  = Math.floor((Date.now() - s.startedAt) / 1000)
      const timeLeft = s.totalSecs - elapsed

      if (timeLeft <= 0) {
        // Timer expired while app was closed
        return { ...s, timeLeft: 0, running: false, expired: true, startedAt: null }
      }
      return { ...s, timeLeft }
    }
    return s
  } catch { return null }
}

export function useTimer(onSessionComplete) {
  const init = useRef(load())
  const s    = init.current

  const [mode,     setModeKey] = useState(s?.mode  || 'pomodoro')
  const [phase,    setPhase]   = useState(s?.phase || 'focus')
  const [running,  setRun]     = useState(s?.running || false)
  const [timeLeft, setLeft]    = useState(
    s?.timeLeft ?? MODES[s?.mode || 'pomodoro'].mins * 60
  )

  const timerRef  = useRef(null)
  const onDoneRef = useRef(onSessionComplete)
  onDoneRef.current = onSessionComplete

  // Agar app band hatu tyare expire thayel hoy
  useEffect(() => {
    if (init.current?.expired && init.current?.phase === 'focus') {
      onDoneRef.current(MODES[init.current.mode]?.mins || 25)
    }
  }, []) // eslint-disable-line

  // Interval — wall-clock thi calculate kartu rehvu
  useEffect(() => {
    clearInterval(timerRef.current)
    if (!running) return

    // startedAt localStorage mathi lo
    const startedAt = (() => {
      try {
        const s = JSON.parse(localStorage.getItem(KEY) || 'null')
        return s?.startedAt || Date.now()
      } catch { return Date.now() }
    })()

    const totalSecs = MODES[mode].mins * 60

    timerRef.current = setInterval(() => {
      // Direct wall-clock subtract — mobile sleep ke reload pachi bhi sahi
      const elapsed = Math.floor((Date.now() - startedAt) / 1000)
      const left    = totalSecs - elapsed

      if (left <= 0) {
        clearInterval(timerRef.current)
        setLeft(0)
        setRun(false)
        save({ mode, phase, totalSecs, timeLeft: 0, running: false, startedAt: null })

        if (phase === 'focus') onDoneRef.current(MODES[mode].mins)

        // Pomodoro: auto-switch to break
        if (mode === 'pomodoro') {
          const breakSecs = MODES.short.mins * 60
          setModeKey('short')
          setPhase('break')
          setLeft(breakSecs)
          save({ mode: 'short', phase: 'break', totalSecs: breakSecs, timeLeft: breakSecs, running: false, startedAt: null })
        }
        return
      }

      setLeft(left)
    }, 500) // 500ms poll — smoother display, no missed seconds

    return () => clearInterval(timerRef.current)
  }, [running, mode, phase]) // eslint-disable-line

  // ── Actions ──

  const setMode = useCallback((key) => {
    if (running) return
    const totalSecs = MODES[key].mins * 60
    setModeKey(key)
    setPhase(MODES[key].phase)
    setLeft(totalSecs)
    save({ mode: key, phase: MODES[key].phase, totalSecs, timeLeft: totalSecs, running: false, startedAt: null })
  }, [running])

  const toggle = useCallback(() => {
    setRun(prev => {
      const next = !prev

      if (next) {
        // Start / Resume
        // startedAt backtrack: jano ke totalSecs - timeLeft seconds pahela start thyel hatu
        const totalSecs = MODES[mode].mins * 60
        const startedAt = Date.now() - (totalSecs - timeLeft) * 1000
        save({ mode, phase, totalSecs, timeLeft, running: true, startedAt })
      } else {
        // Pause — startedAt null, remaining time save
        save({ mode, phase, totalSecs: MODES[mode].mins * 60, timeLeft, running: false, startedAt: null })
      }

      return next
    })
  }, [mode, phase, timeLeft])

  const reset = useCallback(() => {
    clearInterval(timerRef.current)
    setRun(false)
    const totalSecs = MODES[mode].mins * 60
    setLeft(totalSecs)
    save({ mode, phase, totalSecs, timeLeft: totalSecs, running: false, startedAt: null })
  }, [mode, phase])

  const display  = `${String(Math.floor(timeLeft / 60)).padStart(2, '0')}:${String(timeLeft % 60).padStart(2, '0')}`
  const progress = 1 - timeLeft / (MODES[mode].mins * 60)

  return { mode, setMode, timeLeft, display, running, toggle, reset, phase, progress, modeData: MODES[mode] }
}