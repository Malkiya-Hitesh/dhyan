// utils/date.js

export const TODAY     = new Date().toDateString()

export const TODAY_KEY = new Date().toISOString().split('T')[0]

export function formatDate(dateStr) {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })
}

export function isOverdue(deadline) {
  if (!deadline) return false
  return new Date(deadline) < new Date()
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
// Day 1  → [day1]              (1 entry)
// Day 7  → [day1…day7]         (7 entries)
// Day 30 → [day1…day30]        (30 entries — window full)
// Day 31 → [day2…day31]        (day1 drops, 31 adds — always 30)
export function getLast30Days() {
  return Array.from({ length: 30 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (29 - i))
    return d.toISOString().split('T')[0]
  })
}

export function getDayLabel(dateKey) {
  return new Date(dateKey).toLocaleDateString('en', { weekday: 'short' })
}

// "Jan 5", "Feb 12" — 30-day chart labels mate
export function getShortDateLabel(dateKey) {
  return new Date(dateKey).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })
}

export function getYesterdayKey() {
  const d = new Date()
  d.setDate(d.getDate() - 1)
  return d.toISOString().split('T')[0]
}
