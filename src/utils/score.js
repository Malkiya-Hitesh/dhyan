// utils/score.js
// Discipline score calculation logic

/**
 * Calculate discipline score out of 100
 * Habits   → 40%
 * Tasks    → 35%
 * Focus    → 25% (120 min = full score)
 */
export function calcScore({ habits = [], tasks = [], focusMins = 0 }) {
  const habitDone = habits.filter(h => h.doneToday).length
  const habitPct  = habits.length > 0 ? (habitDone / habits.length) * 100 : 100
  const habitScore = habitPct * 0.4

  const taskDone  = tasks.filter(t => t.status === 'done').length
  const taskPct   = tasks.length > 0 ? (taskDone / tasks.length) * 100 : 100
  const taskScore = taskPct * 0.35

  const focusScore = Math.min((focusMins / 120) * 100, 100) * 0.25

  return Math.round(habitScore + taskScore + focusScore)
}

/**
 * Get score color class based on value
 */
export function scoreColor(score) {
  if (score >= 80) return '#4ecca3'   // teal — excellent
  if (score >= 50) return '#e8c547'   // gold  — good
  return '#ff6b6b'                    // coral — needs work
}

/**
 * Get habit completion percentage
 */
export function habitPct(habits) {
  if (!habits.length) return 0
  return Math.round((habits.filter(h => h.doneToday).length / habits.length) * 100)
}

/**
 * Generate smart suggestions based on data
 */
export function getSuggestions({ habits, tasks, focusMins, score }) {
  const suggestions = []
  const hPct = habitPct(habits)

  if (hPct < 70)
    suggestions.push({ icon: '🌱', text: 'Habit completion is below 70%. Try finishing 2 habits before noon.' })
  if (focusMins < 60)
    suggestions.push({ icon: '⏱', text: 'Less than 1 hour of focus today. Even 25 minutes makes a difference.' })
  if (tasks.filter(t => t.status === 'done').length === 0)
    suggestions.push({ icon: '✅', text: 'No tasks completed yet. Pick your #1 priority and start now.' })
  if (score >= 80)
    suggestions.push({ icon: '🏆', text: "Excellent score! You're building real discipline. Keep it up!" })
  if (!suggestions.length)
    suggestions.push({ icon: '✨', text: 'Keep tracking daily. Consistency compounds into results.' })

  return suggestions
}
