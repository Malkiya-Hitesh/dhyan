// hooks/useGsap.js
// Reusable GSAP animation hooks

import { useEffect, useRef } from 'react'
import gsap from 'gsap'

/**
 * Fade + slide up animation on mount for a list of elements
 * Usage: const ref = useStaggerIn()  →  <div ref={ref}>
 */
export function useStaggerIn(deps = []) {
  const ref = useRef(null)
  useEffect(() => {
    if (!ref.current) return
    const children = ref.current.children
    if (!children.length) return
    gsap.fromTo(children,
      { opacity: 0, y: 16 },
      { opacity: 1, y: 0, duration: 0.4, stagger: 0.07, ease: 'power2.out', clearProps: 'transform' }
    )
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)
  return ref
}

/**
 * Fade in on mount
 * Usage: const ref = useFadeIn()  →  <div ref={ref}>
 */
export function useFadeIn(delay = 0) {
  const ref = useRef(null)
  useEffect(() => {
    if (!ref.current) return
    gsap.fromTo(ref.current,
      { opacity: 0, y: 10 },
      { opacity: 1, y: 0, duration: 0.5, delay, ease: 'power3.out', clearProps: 'transform' }
    )
  }, [delay])
  return ref
}

/**
 * Animate a number counter
 * Usage: const ref = useCountUp(score)  →  <span ref={ref} />
 */
export function useCountUp(value) {
  const ref   = useRef(null)
  const prev  = useRef(0)
  useEffect(() => {
    if (!ref.current) return
    gsap.to(prev, {
      current: value,
      duration: 1,
      ease: 'power2.out',
      onUpdate() {
        if (ref.current) ref.current.textContent = Math.round(prev.current)
      },
    })
  }, [value])
  return ref
}

/**
 * Scale bounce on click
 */
export function bounceClick(element) {
  gsap.fromTo(element,
    { scale: 0.9 },
    { scale: 1, duration: 0.35, ease: 'back.out(2)' }
  )
}

/**
 * Page transition — slide in from bottom
 */
export function usePageTransition() {
  const ref = useRef(null)
  useEffect(() => {
    if (!ref.current) return
    gsap.fromTo(ref.current,
      { opacity: 0, y: 20 },
      { opacity: 1, y: 0, duration: 0.35, ease: 'power3.out', clearProps: 'transform' }
    )
  }, [])
  return ref
}
