// components/ui/Modal.jsx
import { useEffect, useRef } from 'react'
import gsap from 'gsap'

export default function Modal({ open, onClose, title, children }) {
  const overlayRef = useRef(null)
  const sheetRef   = useRef(null)

  useEffect(() => {
    if (!overlayRef.current || !sheetRef.current) return
    if (open) {
      gsap.to(overlayRef.current, { opacity: 1, duration: 0.2, ease: 'power2.out', pointerEvents: 'all' })
      gsap.fromTo(sheetRef.current, { y: 40, opacity: 0 }, { y: 0, opacity: 1, duration: 0.35, ease: 'back.out(1.5)' })
    } else {
      gsap.to(overlayRef.current, { opacity: 0, duration: 0.2, pointerEvents: 'none' })
      gsap.to(sheetRef.current,   { y: 30, opacity: 0, duration: 0.2 })
    }
  }, [open])

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 bg-black/70 flex items-start justify-center z-[200] opacity-0 pointer-events-none p-4 pt-[calc(env(safe-area-inset-top)+1rem)] pb-[calc(env(safe-area-inset-bottom)+1rem)]"
      onClick={e => e.target === overlayRef.current && onClose()}
    >
      <div ref={sheetRef} className="bg-bg-1 border border-subtle rounded-3xl p-5 w-full max-w-lg max-h-[calc(100dvh-2rem)] overflow-y-auto">
        {/* Handle */}
        <div className="w-9 h-1 bg-medium rounded-full mx-auto mb-5" />
        {title && <h2 className="font-sans text-base font-semibold text-ink mb-4">{title}</h2>}
        {children}
      </div>
    </div>
  )
}
