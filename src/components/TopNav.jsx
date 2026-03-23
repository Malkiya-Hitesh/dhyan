// components/TopNav.jsx
import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { useApp } from '../store/AppContext'
import { calcScore } from '../utils/score'
import { scoreColor } from '../utils/score'

export default function TopNav({ isOnline = true }) {
  const { habits, tasks, settings } = useApp()
  const score    = calcScore({ habits, tasks, focusMins: settings.focusMins })
  const scoreRef = useRef(null)
  const prevScore = useRef(0)

  useEffect(() => {
    gsap.to(prevScore, {
      current: score,
      duration: 0.8,
      ease: 'power2.out',
      onUpdate() {
        if (scoreRef.current) scoreRef.current.textContent = Math.round(prevScore.current)
      },
    })
  }, [score])

  return (
    <header className="shrink-0 h-14 flex items-center justify-between px-4
      bg-bg/90 backdrop-blur-xl border-b border-subtle relative z-50">
      <div>
        <span className="font-sans text-lg font-bold text-gold">Dhyan</span>
        <span className="text-[9px] text-ink-2 block uppercase tracking-widest -mt-0.5">
          focus & discipline
        </span>
        <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${isOnline ? 'bg-teal-dim text-teal' : 'bg-coral-dim text-coral'}`}>
          {isOnline ? 'Online' : 'Offline'}
        </span>
      </div>
      <div className="flex items-center gap-2 bg-gold-dim border border-gold/20 rounded-full px-3 py-1.5">
        <span className="text-[10px] text-ink-2">Score</span>
        <span ref={scoreRef}
          className="font-sans text-base font-bold"
          style={{ color: scoreColor(score) }}>
          {score}
        </span>
      </div>
    </header>
  )
}
