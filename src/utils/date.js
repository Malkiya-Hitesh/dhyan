// utils/date.js

// Always use ISO date strings (YYYY-MM-DD) — consistent across all comparisons
export const TODAY_KEY = new Date().toISOString().split('T')[0]

// Keep TODAY as ISO key for backward compatibility (was toDateString() — now fixed)
export const TODAY = TODAY_KEY

export function formatDate(dateStr) {
  if (!dateStr) return ''
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })
}

export function isOverdue(deadline) {
  if (!deadline) return false
  return new Date(deadline + 'T00:00:00') < new Date()
}

export function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return { time: 'Good morning', emoji: '🌅' }
  if (h < 17) return { time: 'Good afternoon', emoji: '☀️' }
  if (h < 21) return { time: 'Good evening', emoji: '🌆' }
  return { time: 'Good night', emoji: '🌙' }
}

export function getLast7Days() {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (6 - i))
    return d.toISOString().split('T')[0]
  })
}

// Rolling 30-day window
export function getLast30Days() {
  return Array.from({ length: 30 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (29 - i))
    return d.toISOString().split('T')[0]
  })
}

export function getDayLabel(dateKey) {
  // Append T00:00:00 to avoid timezone shift causing wrong day
  return new Date(dateKey + 'T00:00:00').toLocaleDateString('en', { weekday: 'short' })
}

export function getShortDateLabel(dateKey) {
  return new Date(dateKey + 'T00:00:00').toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })
}

export function getYesterdayKey() {
  const d = new Date()
  d.setDate(d.getDate() - 1)
  return d.toISOString().split('T')[0]
}