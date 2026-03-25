// pages/InfinityTimer.jsx
// Infinity Timer — counts up from 0, log activity, browse history by date
import { useState, useEffect, useRef, useCallback } from 'react'
import { FiPlay, FiSquare, FiClock, FiCalendar, FiTrash2, FiChevronLeft, FiChevronRight } from 'react-icons/fi'
import { BsInfinity } from 'react-icons/bs'
import { usePageTransition, useStaggerIn } from '../hooks/useGsap'
import { openDB } from 'idb'

// ── IndexedDB helpers ────────────────────────────────────────────────
const INF_DB = 'DhyanInfinityDB'
const INF_VERSION = 1

async function getInfDB() {
  return openDB(INF_DB, INF_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains('sessions')) {
        const store = db.createObjectStore('sessions', { keyPath: 'id', autoIncrement: true })
        store.createIndex('dateKey', 'dateKey', { unique: false })
      }
    },
  })
}

async function saveSession(session) {
  const db = await getInfDB()
  return db.add('sessions', session)
}

async function getSessionsByDate(dateKey) {
  const db = await getInfDB()
  return db.getAllFromIndex('sessions', 'dateKey', dateKey)
}

async function deleteSession(id) {
  const db = await getInfDB()
  return db.delete('sessions', id)
}

async function getAllDatesWithSessions() {
  const db = await getInfDB()
  const all = await db.getAll('sessions')
  const dates = [...new Set(all.map(s => s.dateKey))].sort((a, b) => b.localeCompare(a))
  return dates
}

// ── Formatting ───────────────────────────────────────────────────────
function fmtElapsed(secs) {
  const h = Math.floor(secs / 3600)
  const m = Math.floor((secs % 3600) / 60)
  const s = secs % 60
  if (h > 0) return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`
  return `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`
}

function fmtDuration(secs) {
  const h = Math.floor(secs / 3600)
  const m = Math.floor((secs % 3600) / 60)
  const s = secs % 60
  if (h > 0) return `${h}h ${m}m ${s}s`
  if (m > 0) return `${m}m ${s}s`
  return `${s}s`
}

function fmtTime(ts) {
  return new Date(ts).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
}

function toDateKey(date = new Date()) {
  return date.toISOString().split('T')[0]
}

function toDisplayDate(dateKey) {
  const d = new Date(dateKey + 'T00:00:00')
  const today = toDateKey()
  const yesterday = toDateKey(new Date(Date.now() - 86400000))
  if (dateKey === today) return 'Today'
  if (dateKey === yesterday) return 'Yesterday'
  return d.toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric' })
}

const ACTIVITY_SUGGESTIONS = [
  'Deep Work', 'Reading', 'Exercise', 'Study', 'Meditation',
  'Writing', 'Coding', 'Meeting', 'Planning', 'Creative',
]

// ── Main Component ───────────────────────────────────────────────────
export default function InfinityTimer({ showToast }) {
  const pageRef = usePageTransition()

  // Timer state
  const [running, setRunning]       = useState(false)
  const [elapsed, setElapsed]       = useState(0)
  const [startTs, setStartTs]       = useState(null)
  const [activity, setActivity]     = useState('')
  const [showSuggest, setShowSuggest] = useState(false)

  // History state
  const [histTab, setHistTab]       = useState('today')  // 'today' | 'browse'
  const [sessions, setSessions]     = useState([])
  const [allDates, setAllDates]     = useState([])
  const [browseDate, setBrowseDate] = useState(toDateKey())
  const [loading, setLoading]       = useState(false)

  const intervalRef = useRef(null)
  const histRef     = useStaggerIn([sessions.length])

  // ── Load sessions ────────────────────────────────────────────────
  const loadSessions = useCallback(async (dateKey) => {
    setLoading(true)
    try {
      const data = await getSessionsByDate(dateKey)
      setSessions(data.sort((a, b) => b.startTs - a.startTs))
    } catch (e) {
      setSessions([])
    }
    setLoading(false)
  }, [])

  const loadAllDates = useCallback(async () => {
    const dates = await getAllDatesWithSessions()
    setAllDates(dates)
  }, [])

  useEffect(() => {
    loadSessions(toDateKey())
    loadAllDates()
  }, [loadSessions, loadAllDates])

  useEffect(() => {
    const key = histTab === 'browse' ? browseDate : toDateKey()
    loadSessions(key)
  }, [browseDate, histTab, loadSessions])

  // ── Timer tick — wall-clock ──────────────────────────────────────
  useEffect(() => {
    clearInterval(intervalRef.current)
    if (!running || !startTs) return
    intervalRef.current = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTs) / 1000))
    }, 500)
    return () => clearInterval(intervalRef.current)
  }, [running, startTs])

  // ── Start ───────────────────────────────────────────────────────
  const handleStart = () => {
    if (!activity.trim()) return showToast('Activity name dakhlo pehla')
    const ts = Date.now()
    setStartTs(ts)
    setElapsed(0)
    setRunning(true)
    setShowSuggest(false)
  }

  // ── Stop & Save ─────────────────────────────────────────────────
  const handleStop = async () => {
    clearInterval(intervalRef.current)
    setRunning(false)
    const endTs = Date.now()
    const durationSecs = Math.floor((endTs - startTs) / 1000)
    if (durationSecs < 5) {
      showToast('5 second thi ochhu — save nahi thayo')
      setElapsed(0)
      setStartTs(null)
      return
    }
    const session = {
      activity: activity.trim(),
      startTs,
      endTs,
      durationSecs,
      dateKey: toDateKey(new Date(startTs)),
    }
    await saveSession(session)
    await loadSessions(toDateKey())
    await loadAllDates()
    showToast(`✅ ${activity} — ${fmtDuration(durationSecs)} saved`)
    setElapsed(0)
    setStartTs(null)
    setActivity('')
  }

  // ── Delete session ───────────────────────────────────────────────
  const handleDelete = async (id) => {
    await deleteSession(id)
    const key = histTab === 'browse' ? browseDate : toDateKey()
    await loadSessions(key)
    await loadAllDates()
    showToast('Session deleted')
  }

  // ── Stats ────────────────────────────────────────────────────────
  const totalToday = sessions.reduce((s, x) => s + x.durationSecs, 0)
  const byActivity = sessions.reduce((acc, s) => {
    acc[s.activity] = (acc[s.activity] || 0) + s.durationSecs
    return acc
  }, {})

  // ── Browse navigation ────────────────────────────────────────────
  const browsePrev = () => {
    const idx = allDates.indexOf(browseDate)
    if (idx < allDates.length - 1) setBrowseDate(allDates[idx + 1])
  }
  const browseNext = () => {
    const idx = allDates.indexOf(browseDate)
    if (idx > 0) setBrowseDate(allDates[idx - 1])
  }

  const activeDate = histTab === 'browse' ? browseDate : toDateKey()

  return (
    <div ref={pageRef} className="p-4 pb-28 w-full max-w-lg mx-auto space-y-4">

      {/* Header */}
      <div className="flex items-center gap-3">
        <BsInfinity size={22} className="text-gold" />
        <div>
          <h1 className="font-sans font-bold text-ink text-xl leading-none">Infinity Timer</h1>
          <p className="text-[10px] text-ink-2 uppercase tracking-widest mt-0.5">Count up · No limit</p>
        </div>
      </div>

      {/* Timer card */}
      <div className="dhyan-card">
        {/* Elapsed display */}
        <div className="text-center mb-5">
          <div className={`font-sans font-bold transition-all duration-300
            ${elapsed >= 3600 ? 'text-5xl' : 'text-6xl'}
            ${running ? 'text-gold' : 'text-ink'}`}>
            {fmtElapsed(elapsed)}
          </div>
          {running && (
            <p className="text-[11px] text-ink-2 mt-2 uppercase tracking-widest">
              {activity} · Started {fmtTime(startTs)}
            </p>
          )}
        </div>

        {/* Activity input (only when not running) */}
        {!running && (
          <div className="mb-4 relative">
            <label className="text-[10px] text-ink-2 uppercase tracking-wider mb-1.5 block">
              Activity — kem karo cho?
            </label>
            <input
              className="dhyan-input"
              placeholder="e.g. Deep Work, Reading..."
              value={activity}
              onChange={e => { setActivity(e.target.value); setShowSuggest(true) }}
              onFocus={() => setShowSuggest(true)}
              onBlur={() => setTimeout(() => setShowSuggest(false), 150)}
            />
            {/* Suggestions dropdown */}
            {showSuggest && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-bg-2 border border-subtle rounded-xl overflow-hidden z-50 shadow-lg">
                {ACTIVITY_SUGGESTIONS.filter(s =>
                  !activity || s.toLowerCase().includes(activity.toLowerCase())
                ).slice(0, 6).map(s => (
                  <button key={s}
                    onMouseDown={() => { setActivity(s); setShowSuggest(false) }}
                    className="w-full text-left px-4 py-2.5 text-sm text-ink-2 hover:bg-bg-3 hover:text-ink transition-colors border-b border-subtle last:border-0">
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Controls */}
        <div className="flex justify-center gap-3">
          {!running ? (
            <button onClick={handleStart}
              className="btn-gold px-8">
              <FiPlay size={15} /> Start
            </button>
          ) : (
            <button onClick={handleStop}
              className="flex items-center gap-2 bg-coral text-white font-sans font-semibold text-sm
                px-8 py-2.5 rounded-xl hover:brightness-110 active:scale-95 transition-all duration-150">
              <FiSquare size={15} /> Stop & Save
            </button>
          )}
        </div>
      </div>

      {/* History section */}
      <div className="dhyan-card">
        {/* Tab bar */}
        <div className="flex gap-2 mb-4">
          {[
            { key: 'today', label: "Today's Log" },
            { key: 'browse', label: 'Browse History' },
          ].map(t => (
            <button key={t.key} onClick={() => setHistTab(t.key)}
              className={`flex-1 py-2 rounded-xl text-xs font-medium transition-all duration-200
                ${histTab === t.key
                  ? 'bg-gold-dim text-gold border border-gold/25'
                  : 'bg-bg-2 text-ink-2 border border-subtle hover:text-ink'}`}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Browse date nav */}
        {histTab === 'browse' && (
          <div className="flex items-center justify-between mb-4 bg-bg-2 rounded-xl p-2">
            <button onClick={browsePrev}
              disabled={allDates.indexOf(browseDate) >= allDates.length - 1}
              className="w-8 h-8 flex items-center justify-center rounded-lg text-ink-2 hover:text-ink
                disabled:opacity-30 transition-colors">
              <FiChevronLeft size={16} />
            </button>
            <div className="text-center">
              <p className="font-sans text-sm font-semibold text-ink">{toDisplayDate(browseDate)}</p>
              <p className="text-[10px] text-ink-2">{browseDate}</p>
            </div>
            <button onClick={browseNext}
              disabled={allDates.indexOf(browseDate) <= 0}
              className="w-8 h-8 flex items-center justify-center rounded-lg text-ink-2 hover:text-ink
                disabled:opacity-30 transition-colors">
              <FiChevronRight size={16} />
            </button>
          </div>
        )}

        {/* Date picker for browse */}
        {histTab === 'browse' && (
          <div className="mb-4">
            <label className="text-[10px] text-ink-2 uppercase tracking-wider mb-1.5 block">
              Date select karo
            </label>
            <input type="date"
              className="dhyan-input"
              value={browseDate}
              max={toDateKey()}
              min={toDateKey(new Date(Date.now() - 365 * 86400000))}
              onChange={e => {
                setBrowseDate(e.target.value)
                if (!allDates.includes(e.target.value)) {
                  setAllDates(prev => [...new Set([e.target.value, ...prev])].sort((a,b) => b.localeCompare(a)))
                }
              }}
            />
          </div>
        )}

        {/* Summary stats */}
        {sessions.length > 0 && (
          <div className="bg-bg-2 rounded-xl p-3 mb-4 flex items-center justify-between">
            <div className="text-center flex-1">
              <div className="font-sans text-lg font-bold text-teal">{fmtDuration(totalToday)}</div>
              <div className="text-[9px] text-ink-2 uppercase tracking-wider mt-0.5">Total Time</div>
            </div>
            <div className="w-px h-8 bg-subtle" />
            <div className="text-center flex-1">
              <div className="font-sans text-lg font-bold text-gold">{sessions.length}</div>
              <div className="text-[9px] text-ink-2 uppercase tracking-wider mt-0.5">Sessions</div>
            </div>
            <div className="w-px h-8 bg-subtle" />
            <div className="text-center flex-1">
              <div className="font-sans text-lg font-bold text-blue-400">
                {Object.keys(byActivity).length}
              </div>
              <div className="text-[9px] text-ink-2 uppercase tracking-wider mt-0.5">Activities</div>
            </div>
          </div>
        )}

        {/* Activity breakdown */}
        {Object.keys(byActivity).length > 1 && (
          <div className="mb-4 space-y-2">
            <p className="text-[10px] text-ink-2 uppercase tracking-widest mb-2">Activity Breakdown</p>
            {Object.entries(byActivity)
              .sort((a, b) => b[1] - a[1])
              .map(([act, secs]) => (
                <div key={act}>
                  <div className="flex justify-between text-[11px] mb-1">
                    <span className="text-ink-2">{act}</span>
                    <span className="text-gold">{fmtDuration(secs)}</span>
                  </div>
                  <div className="prog-bar">
                    <div className="prog-fill bg-gold"
                      style={{ width: `${Math.min((secs / totalToday) * 100, 100)}%` }} />
                  </div>
                </div>
              ))}
          </div>
        )}

        {/* Session list */}
        {loading ? (
          <div className="text-center py-6 text-ink-3 text-xs animate-pulse">Loading...</div>
        ) : sessions.length === 0 ? (
          <div className="text-center py-10">
            <FiClock size={32} className="mx-auto text-ink-3 opacity-20 mb-3" />
            <p className="text-ink-3 text-sm">
              {histTab === 'today' ? 'Aaj koi session nathi' : `${toDisplayDate(activeDate)} — koi data nathi`}
            </p>
          </div>
        ) : (
          <div ref={histRef} className="space-y-2">
            <p className="text-[10px] text-ink-2 uppercase tracking-widest mb-2">Sessions</p>
            {sessions.map(s => (
              <div key={s.id}
                className="group flex items-center gap-3 bg-bg-2 rounded-xl p-3 border border-subtle
                  hover:border-medium transition-all duration-150">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-ink truncate">{s.activity}</p>
                  <p className="text-[10px] text-ink-2 mt-0.5">
                    {fmtTime(s.startTs)} → {fmtTime(s.endTs)}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-sans text-sm font-bold text-teal">{fmtDuration(s.durationSecs)}</p>
                </div>
                <button onClick={() => handleDelete(s.id)}
                  className="text-ink-3 opacity-0 group-hover:opacity-100 hover:text-coral
                    transition-all duration-150 ml-1">
                  <FiTrash2 size={13} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Year at a glance */}
      {allDates.length > 0 && (
        <div className="dhyan-card">
          <p className="text-[10px] text-ink-2 uppercase tracking-widest mb-3">Days Tracked (Last Year)</p>
          <div className="flex items-center gap-1 flex-wrap">
            {Array.from({ length: 52 }, (_, weekIdx) => {
              const weekStart = new Date(Date.now() - (51 - weekIdx) * 7 * 86400000)
              return Array.from({ length: 7 }, (_, dayIdx) => {
                const d = new Date(weekStart)
                d.setDate(d.getDate() + dayIdx - d.getDay())
                const key = toDateKey(d)
                const hasData = allDates.includes(key)
                return (
                  <div key={key}
                    onClick={() => { setBrowseDate(key); setHistTab('browse') }}
                    title={key}
                    className={`w-2 h-2 rounded-sm cursor-pointer transition-colors
                      ${hasData ? 'bg-gold hover:bg-gold/80' : 'bg-bg-3 hover:bg-bg-2'}`} />
                )
              })
            })}
          </div>
          <p className="text-[10px] text-ink-3 mt-2">{allDates.length} days with activity</p>
        </div>
      )}
    </div>
  )
}