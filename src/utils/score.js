// utils/score.js

/**
 * Calculate discipline score out of 100
 * Habits  → 40pts  (completion %)
 * Tasks   → 30pts  (completion %)
 * Focus   → 30pts  (600 min = 10h total = full 30 points)
 *
 * focusMins = infinity sessions (full credit, no halving) + pomodoro sessions
 */
export function calcScore({ habits = [], tasks = [], focusMins = 0 }) {
  const habitDone  = habits.filter(h => h.doneToday).length
  const habitScore = habits.length > 0 ? (habitDone / habits.length) * 40 : 0

  const taskDone   = tasks.filter(t => t.status === 'done').length
  const taskScore  = tasks.length > 0 ? (taskDone / tasks.length) * 30 : 0

  // 600 min (10h) = full 30 points
  const focusScore = Math.min((focusMins / 600) * 30, 30)

  return Math.round(habitScore + taskScore + focusScore)
}

export function scoreColor(score) {
  if (score >= 80) return '#4ecca3'
  if (score >= 50) return '#e8c547'
  if (score > 0)   return '#ff6b6b'
  return '#3a342a'
}

export function habitPct(habits) {
  if (!habits.length) return 0
  return Math.round((habits.filter(h => h.doneToday).length / habits.length) * 100)
}

export function getSuggestions({ habits, tasks, focusMins, score }) {
  const suggestions = []
  const hPct = habitPct(habits)

  if (habits.length === 0)
    suggestions.push({ icon: '🌱', text: 'Koi habit add kari nathi. Home tab mathi sharu karo.' })
  else if (hPct < 70)
    suggestions.push({ icon: '🌱', text: 'Habit completion 70% thi ochhu che. Benak 2 habits subah ma puri karo.' })

  if (focusMins < 60)
    suggestions.push({ icon: '⏱', text: '1 kalaak thi ochho focus time. Infinity timer start karo — har minute count thase.' })
  else if (focusMins < 300)
    suggestions.push({ icon: '🎯', text: `${Math.round(focusMins / 60 * 10) / 10} kalaak focus thayo. 10 kalaak = pura 30 points!` })

  if (tasks.length > 0 && tasks.filter(t => t.status === 'done').length === 0)
    suggestions.push({ icon: '✅', text: 'Koi task complete nathi thayo. Aaje #1 priority select karo.' })

  if (score >= 80)
    suggestions.push({ icon: '🏆', text: 'Excellent score! Sacchi discipline banavo cho. Aage vadho!' })

  if (!suggestions.length)
    suggestions.push({ icon: '✨', text: 'Roz track karo. Consistency compounds into results.' })

  return suggestions
}