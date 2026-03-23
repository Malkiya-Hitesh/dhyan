// components/ui/ScoreRing.jsx
import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { scoreColor } from '../../utils/score'

const R = 72
const CIRC = 2 * Math.PI * R

export default function ScoreRing({ score = 0, size = 170 }) {
  const arcRef  = useRef(null)
  const numRef  = useRef(null)
  const prevVal = useRef(0)

  useEffect(() => {
    if (!arcRef.current) return
    const offset = CIRC - (score / 100) * CIRC
    gsap.to(arcRef.current, {
      strokeDashoffset: offset,
      stroke: scoreColor(score),
      duration: 1.2,
      ease: 'power3.out',
    })
    // Animate number
    gsap.to(prevVal, {
      current: score,
      duration: 1,
      ease: 'power2.out',
      onUpdate() {
        if (numRef.current) numRef.current.textContent = Math.round(prevVal.current)
      },
    })
  }, [score])

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}
        style={{ filter: 'drop-shadow(0 0 20px rgba(232,197,71,0.3))' }}>
        <circle cx={size/2} cy={size/2} r={R} fill="none"
          stroke="rgba(255,255,255,0.05)" strokeWidth="10"/>
        <circle ref={arcRef} cx={size/2} cy={size/2} r={R} fill="none"
          stroke="#e8c547" strokeWidth="10" strokeLinecap="round"
          strokeDasharray={CIRC} strokeDashoffset={CIRC}
          transform={`rotate(-90 ${size/2} ${size/2})`}/>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span ref={numRef} className="font-sans text-4xl font-bold text-gold leading-none">0</span>
        <span className="text-[9px] text-ink-2 uppercase tracking-widest mt-1">discipline score</span>
      </div>
    </div>
  )
}
