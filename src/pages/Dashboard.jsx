// pages/Dashboard.jsx
import { useEffect, useRef } from 'react'
import {
  LineChart, Line, BarChart, Bar,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ReferenceLine,
} from 'recharts'
import { FiActivity, FiClock, FiCheckSquare, FiTarget, FiZap, FiTrendingUp } from 'react-icons/fi'
import { HiSparkles, HiLightningBolt, HiStar, HiFire, HiCheckCircle, HiClipboardCheck } from 'react-icons/hi'
import { BsFire, BsTrophy, BsGraphUp, BsJournalText, BsCheckAll, BsAlarmFill } from 'react-icons/bs'
import { useApp } from '../store/AppContext'
import { calcScore, habitPct, getSuggestions } from '../utils/score'
import { getLast7Days, getLast30Days, getDayLabel, getShortDateLabel } from '../utils/date'
import { usePageTransition, useStaggerIn } from '../hooks/useGsap'

const ACHIEVEMENTS = [
  { id: 'first_habit',  Icon: HiSparkles,     name: 'First Habit',   check: ({ habits }) => habits.length >= 1 },
  { id: 'streak3',      Icon: BsFire,          name: '3-Day Streak',  check: ({ habits }) => habits.some(h => h.streak >= 3) },
  { id: 'streak7',      Icon: HiLightningBolt, name: 'Week Warrior',  check: ({ habits }) => habits.some(h => h.streak >= 7) },
  { id: 'focus1hr',     Icon: FiClock,         name: 'Deep Work',     check: ({ settings }) => settings.focusMins >= 60 },
  { id: 'focus10hr',    Icon: BsAlarmFill,     name: 'Flow State',    check: ({ settings }) => settings.focusMins >= 600 },
  { id: 'perfect_day',  Icon: HiStar,          name: 'Perfect Day',   check: ({ habits }) => habits.length > 0 && habits.every(h => h.doneToday) },
  { id: 'goal_added',   Icon: FiTarget,        name: 'Goal Setter',   check: ({ goals }) => goals.length >= 1 },
  { id: 'task10',       Icon: BsCheckAll,      name: 'Task Master',   check: ({ tasks }) => tasks.filter(t => t.status === 'done').length >= 10 },
  { id: 'note5',        Icon: BsJournalText,   name: 'Reflector',     check: ({ notes }) => notes.length >= 5 },
]

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-bg-2 border border-subtle rounded-xl px-3 py-2 text-xs text-ink shadow-xl">
      <p className="text-ink-2 mb-1">{label}</p>
      <p className="text-gold font-semibold">Score: {payload[0].value}</p>
    </div>
  )
}

function buildChartData(dailyLogs) {
  const last30 = getLast30Days()
  const daysTracked = last30.filter(dateKey =>
    dailyLogs.some(l => l.date === dateKey)
  ).length

  const data = last30.map((dateKey) => {
    const log = dailyLogs.find(l => l.date === dateKey)
    // score field use karo — j actual discipline score che (0-100)
    // juna logs ma score nahi hoy to habitPct fallback
    const val = log ? (log.score ?? log.habitPct ?? 0) : null
    return {
      dateKey,
      label: getShortDateLabel(dateKey),
      shortLabel: getDayLabel(dateKey),
      pct: val,
      hasData: !!log,
    }
  })

  return { data, daysTracked }
}

function tickFormatter(val, idx) {
  if (idx % 5 === 0) return val
  return ''
}

// Score breakdown bar — value direct points che (e.g. 27/40)
function ScoreBar({ label, value, max, color, icon: Icon }) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0
  return (
    <div className="mb-3 last:mb-0">
      <div className="flex items-center justify-between text-[11px] mb-1.5">
        <span className="flex items-center gap-1.5 text-ink-2">
          <Icon size={12} style={{ color }} />
          {label}
        </span>
        <span className="font-semibold" style={{ color }}>{value}/{max}</span>
      </div>
      <div className="prog-bar">
        <div className="prog-fill transition-all duration-700"
          style={{ width: pct + '%', background: color }} />
      </div>
    </div>
  )
}

export default function Dashboard() {
  const { habits, tasks, goals, notes, dailyLogs, settings } = useApp()
  const pageRef = usePageTransition()
  const achRef  = useStaggerIn([habits.length])

  const score    = calcScore({ habits, tasks, focusMins: settings.focusMins })
  const hPct     = habitPct(habits)
  const focusHrs = Math.round((settings.focusMins / 60) * 10) / 10

  // Score breakdown — same formula as calcScore (empty = 0, not full)
  const habitDone  = habits.filter(h => h.doneToday).length
  const habitScore = habits.length > 0 ? Math.round((habitDone / habits.length) * 40) : 0
  const taskDone   = tasks.filter(t => t.status === 'done').length
  const taskScore  = tasks.length > 0 ? Math.round((taskDone / tasks.length) * 30) : 0
  const focusScore = Math.min(Math.round((settings.focusMins / 600) * 30), 30)

  // 30-day chart
  const { data: chartData, daysTracked } = buildChartData(dailyLogs)
  const dataPoints = chartData.filter(d => d.hasData)
  const monthAvg = dataPoints.length > 0
    ? Math.round(dataPoints.reduce((s, d) => s + (d.pct || 0), 0) / dataPoints.length)
    : 0

  // Best / worst
  const sorted   = [...dataPoints].sort((a, b) => (b.pct || 0) - (a.pct || 0))
  const bestDay  = sorted[0]
  const worstDay = sorted[sorted.length - 1]

  // 7-day heatmap
  const last7       = getLast7Days()
  const days7Labels = ['S','M','T','W','T','F','S']
  const weekDots    = last7.map((dateKey, i) => {
    const log = dailyLogs.find(l => l.date === dateKey)
    const pct = log ? (log.habitPct || 0) : 0
    const bg  = pct >= 70 ? 'bg-gold' : pct >= 30 ? 'bg-gold/40' : pct > 0 ? 'bg-gold/15' : 'bg-bg-3'
    return { label: days7Labels[i], bg, pct }
  })

  const suggestions = getSuggestions({ habits, tasks, focusMins: settings.focusMins, score })

  return (
    <div ref={pageRef} className="p-4 pb-24 w-full max-w-full md:max-w-2xl lg:max-w-4xl mx-auto space-y-4">
      <h1 className="font-sans text-xl font-bold text-ink">Analytics</h1>

      {/* Top stats */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { val: score,           label: 'Score',     color: 'text-gold',      Icon: BsTrophy },
          { val: monthAvg + '%',  label: '30d Avg',   color: 'text-teal',      Icon: BsGraphUp },
          { val: focusHrs + 'h', label: 'Focus',     color: 'text-blue-400',  Icon: FiClock },
        ].map(s => (
          <div key={s.label} className="bg-bg-2 rounded-xl p-3 text-center border border-subtle">
            <s.Icon size={14} className={`mx-auto mb-1 ${s.color}`} />
            <div className={`font-sans text-xl font-bold ${s.color}`}>{s.val}</div>
            <div className="text-[9px] text-ink-2 uppercase tracking-wider mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Score Breakdown */}
      <div className="dhyan-card">
        <div className="flex items-center gap-2 mb-3">
          <FiActivity size={14} className="text-gold" />
          <p className="text-[10px] text-ink-2 uppercase tracking-widest">Score Breakdown</p>
        </div>
        <ScoreBar label="Habits (40pts)" value={habitScore} max={40} color="#4ecca3" icon={HiFire} />
        <ScoreBar label="Tasks (30pts)"  value={taskScore}  max={30} color="#e8c547" icon={HiCheckCircle} />
        <ScoreBar label={`Focus (30pts) — ${settings.focusMins}min / 600min`} value={focusScore} max={30} color="#60a5fa" icon={FiClock} />
        <div className="mt-3 pt-3 border-t border-subtle flex items-center justify-between">
          <span className="text-[11px] text-ink-2">Total Score</span>
          <span className="font-sans text-2xl font-bold text-gold">{score}<span className="text-sm text-ink-2">/100</span></span>
        </div>
      </div>

      {/* 7-day heatmap */}
      <div className="dhyan-card">
        <div className="flex items-center gap-2 mb-3">
          <FiTrendingUp size={14} className="text-teal" />
          <p className="text-[10px] text-ink-2 uppercase tracking-widest">This Week — Habit %</p>
        </div>
        <div className="grid grid-cols-7 gap-1.5">
          {weekDots.map((d, i) => (
            <div key={i} className="text-center">
              <p className="text-[9px] text-ink-3 mb-1">{d.label}</p>
              <div className={`aspect-square rounded-md ${d.bg} transition-all duration-300 relative`}
                title={`${d.pct}%`} />
              <p className="text-[8px] text-ink-3 mt-1">{d.pct > 0 ? d.pct + '%' : '—'}</p>
            </div>
          ))}
        </div>
      </div>

      {/* 30-day rolling line chart */}
      <div className="dhyan-card">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <BsGraphUp size={13} className="text-gold" />
            <p className="text-[10px] text-ink-2 uppercase tracking-widest">Discipline Score — Last 30 Days</p>
          </div>
          <span className="text-[10px] text-ink-2">
            {daysTracked}/{30} days
          </span>
        </div>

        {/* Window fill bar */}
        <div className="prog-bar mb-3">
          <div className="prog-fill bg-gold/40"
            style={{ width: `${(daysTracked / 30) * 100}%` }} />
        </div>

        {daysTracked === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <BsGraphUp size={32} className="text-ink-3 mb-3 opacity-40" />
            <p className="text-xs text-ink-3">Aaj thi track thavanu sharu thase.</p>
            <p className="text-[11px] text-ink-3 mt-1">Habits toggle karo ane chart bharavanu shuru thase.</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={160}>
            <LineChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis
                dataKey="label"
                tick={{ fill: '#7a7060', fontSize: 9 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(val, idx) => tickFormatter(val, idx)}
                interval={0}
              />
              <YAxis
                domain={[0, 100]}
                tick={{ fill: '#7a7060', fontSize: 10 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip content={<CustomTooltip />} />
              {monthAvg > 0 && (
                <ReferenceLine y={monthAvg} stroke="rgba(232,197,71,0.3)"
                  strokeDasharray="4 4" label={{ value: `avg ${monthAvg}%`, fill: '#7a7060', fontSize: 9 }} />
              )}
              <Line
                type="monotone"
                dataKey="pct"
                stroke="#e8c547"
                strokeWidth={2}
                dot={{ r: 3, fill: '#e8c547', strokeWidth: 0 }}
                activeDot={{ r: 5, fill: '#e8c547' }}
                connectNulls={false}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Habit streaks */}
      <div className="dhyan-card">
        <div className="flex items-center gap-2 mb-3">
          <BsFire size={14} className="text-coral" />
          <p className="text-[10px] text-ink-2 uppercase tracking-widest">Habit Streaks</p>
        </div>
        {habits.length === 0 ? (
          <p className="text-xs text-ink-3 py-4 text-center">Koi habit nathi. Home tab mathi add karo.</p>
        ) : (
          habits.map(h => (
            <div key={h.id} className="mb-3 last:mb-0">
              <div className="flex justify-between text-[11px] mb-1.5">
                <span className="text-ink-2">{h.icon} {h.name}</span>
                <span className="flex items-center gap-1 text-gold">
                  <BsFire size={10} />{h.streak}d
                </span>
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
        <div className="flex items-center gap-2 mb-3">
          <BsTrophy size={14} className="text-gold" />
          <h2 className="sec-title">Achievements</h2>
        </div>
        <div ref={achRef} className="grid grid-cols-3 gap-2">
          {ACHIEVEMENTS.map(a => {
            const unlocked = a.check({ habits, tasks, goals, notes, settings })
            return (
              <div key={a.id}
                className={`rounded-xl p-3 text-center border transition-all duration-300
                  ${unlocked ? 'bg-gold-dim border-gold/25' : 'bg-bg-2 border-subtle opacity-40'}`}>
                <a.Icon size={22} className={`mx-auto mb-1.5 ${unlocked ? 'text-gold' : 'text-ink-3'}`} />
                <div className={`text-[10px] leading-tight ${unlocked ? 'text-gold' : 'text-ink-2'}`}>
                  {a.name}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* 30-Day Review */}
      <div className="dhyan-card">
        <div className="flex items-center gap-2 mb-3">
          <FiActivity size={14} className="text-blue-400" />
          <h2 className="sec-title">30-Day Review</h2>
        </div>
        <div className="bg-bg-2 rounded-xl p-4 text-center border border-subtle mb-3">
          <div className="font-sans text-4xl font-bold text-gold">{focusHrs}h</div>
          <div className="text-[10px] text-ink-2 uppercase tracking-wider mt-1">Total Focus Time</div>
          <div className="text-[10px] text-ink-3 mt-1">Target: 10h/day = 30 points</div>
        </div>
        <div className="grid grid-cols-3 gap-2 mb-4">
          <div className="bg-bg-2 rounded-xl p-3 text-center border border-subtle">
            <div className="font-sans text-sm font-bold text-teal">{bestDay?.label || '—'}</div>
            <div className="text-[9px] text-ink-2 uppercase tracking-wider mt-0.5">Best Day</div>
          </div>
          <div className="bg-bg-2 rounded-xl p-3 text-center border border-subtle">
            <div className="font-sans text-sm font-bold text-coral">{worstDay?.label || '—'}</div>
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