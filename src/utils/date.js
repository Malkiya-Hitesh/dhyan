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

export function getDayLabel(dateKey) {
  return new Date(dateKey).toLocaleDateString('en', { weekday: 'short' })
}
