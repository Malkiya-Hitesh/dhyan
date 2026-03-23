// pages/Dashboard.jsx
import { useEffect, useRef } from 'react'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { useApp } from '../store/AppContext'
import { calcScore, habitPct, getSuggestions } from '../utils/score'
import { getLast7Days, getDayLabel } from '../utils/date'
import { usePageTransition, useStaggerIn } from '../hooks/useGsap'

const ACHIEVEMENTS = [
  { id: 'first_habit',  icon: '🌱', name: 'First Habit',   check: ({ habits }) => habits.length >= 1 },
  { id: 'streak3',      icon: '🔥', name: '3-Day Streak',  check: ({ habits }) => habits.some(h => h.streak >= 3) },
  { id: 'streak7',      icon: '⚡', name: 'Week Warrior',  check: ({ habits }) => habits.some(h => h.streak >= 7) },
  { id: 'focus1hr',     icon: '⏱', name: 'Deep Work',     check: ({ settings }) => settings.focusMins >= 60 },
  { id: 'focus5hr',     icon: '🧠', name: 'Flow State',    check: ({ settings }) => settings.focusMins >= 300 },
  { id: 'perfect_day',  icon: '💯', name: 'Perfect Day',   check: ({ habits }) => habits.length > 0 && habits.every(h => h.doneToday) },
  { id: 'goal_added',   icon: '🎯', name: 'Goal Setter',   check: ({ goals }) => goals.length >= 1 },
  { id: 'task10',       icon: '✅', name: 'Task Master',   check: ({ tasks }) => tasks.filter(t => t.status === 'done').length >= 10 },
  { id: 'note5',        icon: '📝', name: 'Reflector',     check: ({ notes }) => notes.length >= 5 },
]

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-bg-2 border border-subtle rounded-xl px-3 py-2 text-xs text-ink">
      <p className="text-ink-2 mb-1">{label}</p>
      <p className="text-gold font-medium">{payload[0].value}%</p>
    </div>
  )
}

export default function Dashboard() {
  const { habits, tasks, goals, notes, dailyLogs, settings } = useApp()
  const pageRef    = usePageTransition()
  const achRef     = useStaggerIn([habits.length])

  const score    = calcScore({ habits, tasks, focusMins: settings.focusMins })
  const hPct     = habitPct(habits)
  const focusHrs = Math.round((settings.focusMins / 60) * 10) / 10

  // Build last 7 days chart data
  const last7 = getLast7Days()
  const lineData = last7.map(dateKey => {
    const log = dailyLogs.find(l => l.date === dateKey)
    return {
      day: getDayLabel(dateKey),
      pct: log ? log.habitPct : 0,
    }
  })

  // Week avg
  const weekAvg = lineData.length
    ? Math.round(lineData.reduce((s, d) => s + d.pct, 0) / lineData.length)
    : 0

  // Best / worst day
  const sorted   = [...lineData].sort((a, b) => b.pct - a.pct)
  const bestDay  = sorted[0]
  const worstDay = sorted[sorted.length - 1]

  const suggestions = getSuggestions({ habits, tasks, focusMins: settings.focusMins, score })

  // Week heat map
  const days = ['S', 'M', 'T', 'W', 'T', 'F', 'S']
  const weekDots = last7.map((dateKey, i) => {
    const log = dailyLogs.find(l => l.date === dateKey)
    const pct = log ? log.habitPct : 0
    const bg  = pct >= 70 ? 'bg-gold' : pct >= 30 ? 'bg-gold/40' : pct > 0 ? 'bg-gold/15' : 'bg-bg-3'
    return { label: days[i], bg }
  })

  return (
    <div ref={pageRef} className="p-4 pb-24 w-full max-w-full md:max-w-2xl lg:max-w-4xl mx-auto space-y-4">
      <h1 className="font-sans text-xl font-bold text-ink">Analytics</h1>

      {/* Top stats */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { val: score,    label: 'Score',    color: 'text-gold' },
          { val: weekAvg + '%', label: 'Week Avg', color: 'text-teal' },
          { val: focusHrs + 'h', label: 'Focus',  color: 'text-blue-400' },
        ].map(s => (
          <div key={s.label} className="bg-bg-2 rounded-xl p-3 text-center border border-subtle">
            <div className={`font-sans text-xl font-bold ${s.color}`}>{s.val}</div>
            <div className="text-[9px] text-ink-2 uppercase tracking-wider mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Week heatmap */}
      <div className="dhyan-card">
        <p className="text-[10px] text-ink-2 uppercase tracking-widest mb-3">This Week</p>
        <div className="grid grid-cols-7 gap-1.5">
          {weekDots.map((d, i) => (
            <div key={i} className="text-center">
              <p className="text-[9px] text-ink-3 mb-1">{d.label}</p>
              <div className={`aspect-square rounded-md ${d.bg} transition-all duration-300`} />
            </div>
          ))}
        </div>
      </div>

      {/* Line chart */}
      <div className="dhyan-card">
        <p className="text-[10px] text-ink-2 uppercase tracking-widest mb-3">Daily Habit % (7 days)</p>
        <ResponsiveContainer width="100%" height={150}>
          <LineChart data={lineData} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
            <XAxis dataKey="day" tick={{ fill: '#7a7060', fontSize: 10 }} axisLine={false} tickLine={false} />
            <YAxis domain={[0, 100]} tick={{ fill: '#7a7060', fontSize: 10 }} axisLine={false} tickLine={false} />
            <Tooltip content={<CustomTooltip />} />
            <Line type="monotone" dataKey="pct" stroke="#e8c547" strokeWidth={2}
              dot={{ fill: '#e8c547', r: 3 }} activeDot={{ r: 5, fill: '#e8c547' }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Habit bars */}
      <div className="dhyan-card">
        <p className="text-[10px] text-ink-2 uppercase tracking-widest mb-3">Habit Streaks</p>
        {habits.length === 0 ? (
          <p className="text-xs text-ink-3 py-4 text-center">No habits yet</p>
        ) : (
          habits.map(h => (
            <div key={h.id} className="mb-3">
              <div className="flex justify-between text-[11px] mb-1.5">
                <span className="text-ink-2">{h.icon} {h.name}</span>
                <span className="text-ink">{h.streak}d</span>
              </div>
              <div className="prog-bar">
                <div className="prog-fill bg-teal"
                  style={{ width: Math.min((h.streak / 30) * 100, 100) + '%' }} />
              </div>
            </div>
          ))
        )}
      </div>

      {/* Achievements */}
      <div className="dhyan-card">
        <h2 className="sec-title mb-3">Achievements</h2>
        <div ref={achRef} className="grid grid-cols-3 gap-2">
          {ACHIEVEMENTS.map(a => {
            const unlocked = a.check({ habits, tasks, goals, notes, settings })
            return (
              <div key={a.id}
                className={`rounded-xl p-3 text-center border transition-all duration-300
                  ${unlocked
                    ? 'bg-gold-dim border-gold/25'
                    : 'bg-bg-2 border-subtle opacity-40'}`}>
                <div className={`text-2xl mb-1 ${!unlocked ? 'grayscale' : ''}`}>{a.icon}</div>
                <div className={`text-[10px] leading-tight ${unlocked ? 'text-gold' : 'text-ink-2'}`}>
                  {a.name}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Weekly Review */}
      <div className="dhyan-card">
        <h2 className="sec-title mb-3">Weekly Review</h2>
        <div className="bg-bg-2 rounded-xl p-4 text-center border border-subtle mb-3">
          <div className="font-sans text-4xl font-bold text-gold">{focusHrs}h</div>
          <div className="text-[10px] text-ink-2 uppercase tracking-wider mt-1">Total Focus This Week</div>
        </div>
        <div className="grid grid-cols-3 gap-2 mb-4">
          <div className="bg-bg-2 rounded-xl p-3 text-center border border-subtle">
            <div className="font-sans text-sm font-bold text-teal">{bestDay?.day || '—'}</div>
            <div className="text-[9px] text-ink-2 uppercase tracking-wider mt-0.5">Best Day</div>
          </div>
          <div className="bg-bg-2 rounded-xl p-3 text-center border border-subtle">
            <div className="font-sans text-sm font-bold text-coral">{worstDay?.day || '—'}</div>
            <div className="text-[9px] text-ink-2 uppercase tracking-wider mt-0.5">Worst Day</div>
          </div>
          <div className="bg-bg-2 rounded-xl p-3 text-center border border-subtle">
            <div className="font-sans text-xl font-bold text-gold">
              {Math.max(0, ...habits.map(h => h.streak || 0))}
            </div>
            <div className="text-[9px] text-ink-2 uppercase tracking-wider mt-0.5">Best Streak</div>
          </div>
        </div>
        <p className="text-[10px] text-ink-2 uppercase tracking-widest mb-2">Suggestions</p>
        {suggestions.map((s, i) => (
          <div key={i} className="flex gap-3 py-2.5 border-b border-subtle last:border-0 text-sm">
            <span className="text-base shrink-0">{s.icon}</span>
            <span className="text-ink-2 leading-relaxed">{s.text}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
