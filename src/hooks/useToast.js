// hooks/useToast.js
import { useState, useCallback, useRef } from 'react'

export function useToast() {
  const [toast, setToast] = useState({ msg: '', show: false })
  const timerRef = useRef(null)

  const showToast = useCallback((msg) => {
    clearTimeout(timerRef.current)
    setToast({ msg, show: true })
    timerRef.current = setTimeout(() => setToast({ msg: '', show: false }), 2800)
  }, [])

  return { toast, showToast }
}
