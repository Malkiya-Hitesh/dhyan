// components/FocusTimer.jsx
import { useRef, useEffect } from 'react'
import { FiPlay, FiPause, FiRefreshCw } from 'react-icons/fi'
import gsap from 'gsap'
import { useApp } from '../store/AppContext'
import { useTimer } from '../hooks/useTimer'

const CIRC = 2 * Math.PI * 80

const MODE_BTNS = [
  { key: 'pomodoro', label: 'Pomodoro 25m' },
  { key: 'focus15',  label: '15 min' },
  { key: 'focus30',  label: '30 min' },
  { key: 'focus45',  label: '45 min' },
  { key: 'focus60',  label: '60 min' },
]

export default function FocusTimer({ showToast }) {
  const { addFocusSession, settings } = useApp()
  const arcRef = useRef(null)

  const onComplete = async (mins) => {
    await addFocusSession(mins)
    showToast('🎉 Session done! Great work!')
  }

  const { mode, setMode, display, running, toggle, reset, phase, progress, modeData } = useTimer(onComplete)

  // Animate arc
  useEffect(() => {
    if (!arcRef.current) return
    const offset = CIRC * progress
    const color  = phase === 'focus' ? '#e8c547' : '#4ecca3'
    gsap.to(arcRef.current, { strokeDashoffset: offset, stroke: color, duration: 0.5, ease: 'power2.out' })
  }, [progress, phase])

  return (
    <div className="dhyan-card">
      <h2 className="sec-title mb-3">Focus Timer</h2>

      {/* Mode pills */}
      <div className="flex gap-2 flex-wrap mb-4">
        {MODE_BTNS.map(btn => (
          <button key={btn.key} onClick={() => setMode(btn.key)}
            className={`px-3 py-1.5 rounded-full text-[11px] border transition-all duration-200
              ${mode === btn.key
                ? 'bg-gold-dim text-gold border-gold/30'
                : 'border-subtle text-ink-2 hover:text-ink hover:border-medium'}`}>
            {btn.label}
          </button>
        ))}
      </div>

      {/* Timer circle */}
      <div className="flex justify-center mb-4">
        <div className="relative" style={{ width: 180, height: 180 }}>
          <svg width="180" height="180" viewBox="0 0 180 180"
            style={{ filter: 'drop-shadow(0 0 16px rgba(232,197,71,0.25))' }}>
            <circle cx="90" cy="90" r="80" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="8"/>
            <circle ref={arcRef} cx="90" cy="90" r="80" fill="none"
              stroke="#e8c547" strokeWidth="8" strokeLinecap="round"
              strokeDasharray={CIRC} strokeDashoffset={0}
              transform="rotate(-90 90 90)"
              style={{ transition: 'none' }}/>
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="font-sans text-4xl font-bold text-ink">{display}</span>
            <span className="text-[9px] text-ink-2 uppercase tracking-widest mt-1">
              {phase === 'focus' ? 'Focus' : 'Break'}
            </span>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex gap-2 justify-center mb-4">
        <button className="btn-gold" onClick={toggle}>
          {running ? <FiPause size={14} /> : <FiPlay size={14} />}
          {running ? 'Pause' : 'Start'}
        </button>
        <button className="btn-ghost" onClick={reset}>
          <FiRefreshCw size={14} /> Reset
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-2">
        <div className="bg-bg-2 rounded-xl p-3 text-center">
          <div className="font-sans text-xl font-bold text-gold">{settings.focusSessions}</div>
          <div className="text-[9px] text-ink-2 uppercase tracking-wider mt-0.5">Sessions</div>
        </div>
        <div className="bg-bg-2 rounded-xl p-3 text-center">
          <div className="font-sans text-xl font-bold text-teal">{settings.focusMins}m</div>
          <div className="text-[9px] text-ink-2 uppercase tracking-wider mt-0.5">Total Focus</div>
        </div>
      </div>
    </div>
  )
}
