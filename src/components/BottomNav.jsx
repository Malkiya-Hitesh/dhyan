// components/BottomNav.jsx
import { useRef, useEffect } from 'react'
import { HiHome, HiCheckCircle, HiChartBar, HiFlag, HiPencil } from 'react-icons/hi'
import { BsInfinity } from 'react-icons/bs'
import gsap from 'gsap'

const TABS = [
  { key: 'home',      label: 'Home',      Icon: HiHome },
  { key: 'tasks',     label: 'Tasks',     Icon: HiCheckCircle },
  { key: 'dashboard', label: 'Stats',     Icon: HiChartBar },
  { key: 'goals',     label: 'Goals',     Icon: HiFlag },
  { key: 'infinity',  label: 'Infinity',  Icon: BsInfinity },
  { key: 'notes',     label: 'Notes',     Icon: HiPencil },
]

export default function BottomNav({ active, onChange }) {
  const indicatorRef = useRef(null)
  const tabRefs      = useRef({})

  useEffect(() => {
    const el = tabRefs.current[active]
    if (!el || !indicatorRef.current) return
    const rect    = el.getBoundingClientRect()
    const parent  = el.parentElement.getBoundingClientRect()
    const center  = rect.left - parent.left + rect.width / 2
    gsap.to(indicatorRef.current, {
      x: center - 16,
      duration: 0.35,
      ease: 'back.out(1.5)',
    })
  }, [active])

  const handleClick = (key, el) => {
    gsap.fromTo(el, { scale: 0.85 }, { scale: 1, duration: 0.35, ease: 'back.out(2)' })
    onChange(key)
  }

  return (
    <nav className="shrink-0 h-16 bg-bg/95 backdrop-blur-xl border-t border-subtle relative z-50">
      {/* Sliding indicator */}
      <div ref={indicatorRef} className="absolute top-0 w-8 h-0.5 bg-gold rounded-b-full" style={{ x: 0 }} />

      <div className="flex h-full">
        {TABS.map(({ key, label, Icon }) => (
          <button
            key={key}
            ref={el => (tabRefs.current[key] = el)}
            onClick={e => handleClick(key, e.currentTarget)}
            className={`flex-1 flex flex-col items-center justify-center gap-1 transition-colors duration-200
              ${active === key ? 'text-gold' : 'text-ink-2 hover:text-ink'}`}
          >
            <Icon size={18} />
            <span className="text-[8px] uppercase tracking-wider font-medium">{label}</span>
          </button>
        ))}
      </div>
    </nav>
  )
}