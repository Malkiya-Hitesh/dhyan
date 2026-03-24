// utils/score.js
// Discipline score calculation logic

/**
 * Calculate discipline score out of 100
 * Habits  → 40%  (completion %)
 * Tasks   → 30%  (completion %)
 * Focus   → 30%  (600 min = 10h = full 30 points)
 */
export function calcScore({ habits = [], tasks = [], focusMins = 0 }) {
  // Habits: 40 points
  const habitDone  = habits.filter(h => h.doneToday).length
  const habitPct   = habits.length > 0 ? (habitDone / habits.length) : 1
  const habitScore = habitPct * 40

  // Tasks: 30 points
  const taskDone   = tasks.filter(t => t.status === 'done').length
  const taskPct    = tasks.length > 0 ? (taskDone / tasks.length) : 1
  const taskScore  = taskPct * 30

  // Focus: 30 points — 10 hours (600 min) = full 30
  const focusScore = Math.min((focusMins / 600) * 30, 30)

  return Math.round(habitScore + taskScore + focusScore)
}

/**
 * Get score color based on value
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

  if (habits.length === 0)
    suggestions.push({ icon: '🌱', text: 'Koi habit add kari nathi. Home tab mathi sharu karo.' })
  else if (hPct < 70)
    suggestions.push({ icon: '🌱', text: 'Habit completion 70% thi ochhu che. Benak 2 habits subah ma puri karo.' })

  if (focusMins < 60)
    suggestions.push({ icon: '⏱', text: '1 kalaak thi ochho focus time. 25 minutes pan fark padse.' })
  else if (focusMins < 300)
    suggestions.push({ icon: '🎯', text: `${Math.round(focusMins/60*10)/10} kalaak focus thayo. 10 kalaak = pura 30 points!` })

  if (tasks.length > 0 && tasks.filter(t => t.status === 'done').length === 0)
    suggestions.push({ icon: '✅', text: 'Koi task complete nathi thayo. Aaje #1 priority select karo.' })

  if (score >= 80)
    suggestions.push({ icon: '🏆', text: 'Excellent score! Sacchi discipline banavo cho. Aage vadho!' })

  if (!suggestions.length)
    suggestions.push({ icon: '✨', text: 'Roz track karo. Consistency compounds into results.' })

  return suggestions
}