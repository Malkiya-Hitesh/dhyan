// pages/InfinityTimer.jsx
import { useState, useEffect, useRef, useCallback } from 'react'
import { FiPlay, FiSquare, FiClock, FiTrash2, FiChevronLeft, FiChevronRight } from 'react-icons/fi'
import { BsInfinity } from 'react-icons/bs'
import { usePageTransition, useStaggerIn } from '../hooks/useGsap'
import { useApp } from '../store/AppContext'
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
async function saveSession(s)           { return (await getInfDB()).add('sessions', s) }
async function getSessionsByDate(dk) {
  const all = await (await getInfDB()).getAll('sessions')
  return all.filter(s => toDateKey(new Date(s.startTs)) === dk)
}
async function deleteSession(id)        { return (await getInfDB()).delete('sessions', id) }
async function getAllDatesWithSessions() {
  const all = await (await getInfDB()).getAll('sessions')
  return [...new Set(all.map(s => toDateKey(new Date(s.startTs))))].sort((a,b) => b.localeCompare(a))
}
async function getDateSecsMap() {
  const all = await (await getInfDB()).getAll('sessions')
  return all.reduce((m, s) => {
    const key = toDateKey(new Date(s.startTs))
    m[key] = (m[key] || 0) + (s.durationSecs || 0)
    return m
  }, {})
}

// ── localStorage ─────────────────────────────────────────────────────
const TIMER_KEY = 'dhyan_infinity_timer_v1'
function saveTimerState(obj) { try { localStorage.setItem(TIMER_KEY, JSON.stringify(obj)) } catch {} }
function loadTimerState() {
  try {
    const s = JSON.parse(localStorage.getItem(TIMER_KEY)||'null')
    if (!s) return null
    if (s.running && s.startTs) return { ...s, elapsed: Math.floor((Date.now()-s.startTs)/1000) }
    return s
  } catch { return null }
}
function clearTimerState() { try { localStorage.removeItem(TIMER_KEY) } catch {} }

// ── Formatting ───────────────────────────────────────────────────────
function fmtElapsed(secs) {
  const h=Math.floor(secs/3600), m=Math.floor((secs%3600)/60), s=secs%60
  if (h>0) return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`
  return `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`
}
function fmtDuration(secs) {
  const h=Math.floor(secs/3600), m=Math.floor((secs%3600)/60), s=secs%60
  if (h>0) return `${h}h ${m}m ${s}s`
  if (m>0) return `${m}m ${s}s`
  return `${s}s`
}
function fmtTime(ts) { return new Date(ts).toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit'}) }
function toDateKey(d=new Date()) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${dd}`
}
function toDisplayDate(dk) {
  const today=toDateKey(), yest=toDateKey(new Date(Date.now()-86400000))
  if (dk===today) return 'Today'
  if (dk===yest)  return 'Yesterday'
  return new Date(dk+'T00:00:00').toLocaleDateString('en-IN',{weekday:'short',month:'short',day:'numeric'})
}

const ACTIVITY_SUGGESTIONS = [
  'Deep Work','Reading','Exercise','Study','Meditation',
  'Writing','Coding','Meeting','Planning','Creative',
]

// ── Heatmap constants ────────────────────────────────────────────────
const MONTH_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
// Sun=0 Mon=1 Tue=2 Wed=3 Thu=4 Fri=5 Sat=6
const DAY_LABELS  = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']

// Gold intensity levels (5 values: 0=empty, 1–4=filled)
const GOLD = [
  'rgba(255,255,255,0.06)', // 0 empty
  'rgba(232,197,71,0.20)',  // 1 < 30 min
  'rgba(232,197,71,0.45)',  // 2 30–89 min
  'rgba(232,197,71,0.75)',  // 3 90–179 min
  '#e8c547',                // 4 180+ min
]

function intensityLevel(secs) {
  if (!secs) return 0
  const m = secs/60
  if (m<30)  return 1
  if (m<90)  return 2
  if (m<180) return 3
  return 4
}

// ── Build heatmap grid data ───────────────────────────────────────────
// Returns 52 columns × 7 rows, Sunday-aligned, newest week on right
function buildGrid(dateSecsMap) {
  const todayDate = new Date()
  todayDate.setHours(0,0,0,0)
  const todayKey  = toDateKey(todayDate)
  const todayDow  = todayDate.getDay()  // 0=Sun

  // The rightmost column's Sunday = this week's Sunday
  const thisSun = new Date(todayDate)
  thisSun.setDate(todayDate.getDate() - todayDow)

  // Grid starts 51 weeks before thisSun → 52 columns total
  const gridStart = new Date(thisSun)
  gridStart.setDate(thisSun.getDate() - 51*7)

  const columns    = []  // 52 cols, each 7 days (Sun→Sat)
  const monthRow   = new Array(52).fill('')
  let   lastMonth  = -1

  for (let w = 0; w < 52; w++) {
    const days = []
    // Detect month label from first day of this week
    const weekSun = new Date(gridStart)
    weekSun.setDate(gridStart.getDate() + w*7)
    const wm = weekSun.getMonth()
    if (wm !== lastMonth) {
      monthRow[w] = MONTH_SHORT[wm]
      lastMonth = wm
    }

    for (let d = 0; d < 7; d++) {
      const date = new Date(gridStart)
      date.setDate(gridStart.getDate() + w*7 + d)
      // Skip future dates
      if (date > todayDate) { days.push(null); continue }
      const key  = toDateKey(date)
      const secs = dateSecsMap[key] || 0
      const dateLabel = date.toLocaleDateString('en-IN',{weekday:'short',month:'short',day:'numeric'})
      days.push({
        key,
        secs,
        isToday: key === todayKey,
        tip: secs>0 ? `${dateLabel} — ${fmtDuration(secs)}` : `${dateLabel} — No activity`,
      })
    }
    columns.push(days)
  }

  return { columns, monthRow }
}

// ── YearHeatmap component ────────────────────────────────────────────
const CELL = 11  // px
const GAP  = 3   // px between cells

function YearHeatmap({ dateSecsMap, totalDays, onDateClick }) {
  const [tip, setTip] = useState({ show:false, text:'', x:0, y:0 })
  const { columns, monthRow } = buildGrid(dateSecsMap)

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <p className="text-[10px] text-ink-2 uppercase tracking-widest">Days Tracked — Last Year</p>
        <p className="text-[10px] text-ink-3">{totalDays} days</p>
      </div>

      {/* Floating tooltip */}
      {tip.show && (
        <div style={{
          position:'fixed', left:tip.x+14, top:tip.y-36, zIndex:9999,
          background:'#141420', border:'1px solid rgba(255,255,255,0.15)',
          borderRadius:6, padding:'4px 10px', fontSize:11, color:'#e8e4dc',
          whiteSpace:'nowrap', pointerEvents:'none',
          boxShadow:'0 4px 16px rgba(0,0,0,0.5)',
        }}>
          {tip.text}
        </div>
      )}

      {/* Scrollable grid wrapper */}
      <div style={{ overflowX:'auto', paddingBottom:4 }}>
        <div style={{ display:'inline-flex', gap:0 }}>

          {/* Day-of-week label column (Sun–Sat) */}
          <div style={{
            display:'flex', flexDirection:'column', gap:GAP,
            marginRight:6, paddingTop: 14+4, // month row height + gap
          }}>
            {DAY_LABELS.map((label, d) => (
              <div key={d} style={{
                height: CELL,
                lineHeight: `${CELL}px`,
                fontSize: 10,
                color: 'rgba(255,255,255,0.35)',
                textAlign: 'right',
                width: 26,
                // Only show Mon, Wed, Fri
                visibility: (d===1||d===3||d===5) ? 'visible' : 'hidden',
              }}>
                {label}
              </div>
            ))}
          </div>

          {/* Columns: month labels row + week cells */}
          <div style={{ display:'flex', flexDirection:'column' }}>

            {/* Month label row */}
            <div style={{ display:'flex', gap:GAP, height:14, marginBottom:4 }}>
              {columns.map((_, w) => (
                <div key={w} style={{
                  width: CELL, minWidth: CELL,
                  fontSize: 10, color:'rgba(255,255,255,0.40)',
                  lineHeight:'14px', overflow:'hidden', whiteSpace:'nowrap',
                }}>
                  {monthRow[w] || ''}
                </div>
              ))}
            </div>

            {/* Week columns × day rows */}
            <div style={{ display:'flex', gap:GAP }}>
              {columns.map((week, w) => (
                <div key={w} style={{ display:'flex', flexDirection:'column', gap:GAP }}>
                  {week.map((day, d) => {
                    if (!day) {
                      // Future date — transparent placeholder
                      return <div key={d} style={{ width:CELL, height:CELL, borderRadius:2 }} />
                    }
                    const lvl = intensityLevel(day.secs)
                    return (
                      <div
                        key={d}
                        onClick={() => onDateClick(day.key)}
                        onMouseEnter={e => setTip({ show:true, text:day.tip, x:e.clientX, y:e.clientY })}
                        onMouseMove={e  => setTip(t => ({ ...t, x:e.clientX, y:e.clientY }))}
                        onMouseLeave={()  => setTip(t => ({ ...t, show:false }))}
                        style={{
                          width: CELL, height: CELL, borderRadius: 2,
                          background: GOLD[lvl],
                          border: day.isToday
                            ? '1.5px solid #e8c547'
                            : '1px solid rgba(255,255,255,0.08)',
                          cursor: 'pointer',
                          transition: 'transform 0.1s',
                          boxSizing: 'border-box',
                        }}
                        onMouseOver={e => { e.currentTarget.style.transform='scale(1.35)' }}
                        onMouseOut={e  => { e.currentTarget.style.transform='scale(1)'; setTip(t=>({...t,show:false})) }}
                      />
                    )
                  })}
                </div>
              ))}
            </div>

          </div>
        </div>
      </div>

      {/* Legend */}
      <div style={{ display:'flex', alignItems:'center', gap:5, marginTop:10, marginLeft:32 }}>
        <span style={{ fontSize:10, color:'rgba(255,255,255,0.32)' }}>Less</span>
        {GOLD.map((bg, i) => (
          <div key={i} style={{
            width:CELL, height:CELL, borderRadius:2,
            background: bg,
            border:'1px solid rgba(255,255,255,0.08)',
          }} />
        ))}
        <span style={{ fontSize:10, color:'rgba(255,255,255,0.32)' }}>More</span>
        <span style={{ fontSize:10, color:'rgba(255,255,255,0.20)', marginLeft:8 }}>· tap to browse</span>
      </div>
    </div>
  )
}

// ── Main Page ────────────────────────────────────────────────────────
export default function InfinityTimer({ showToast }) {
  const pageRef = usePageTransition()
  const { syncFocusMins } = useApp()

  const savedTimer = useRef(loadTimerState())
  const sv = savedTimer.current

  const [running,     setRunning]     = useState(sv?.running  || false)
  const [elapsed,     setElapsed]     = useState(sv?.elapsed  || 0)
  const [startTs,     setStartTs]     = useState(sv?.startTs  || null)
  const [activity,    setActivity]    = useState(sv?.activity || '')
  const [showSuggest, setShowSuggest] = useState(false)

  const [histTab,     setHistTab]     = useState('today')
  const [sessions,    setSessions]    = useState([])
  const [allDates,    setAllDates]    = useState([])
  const [dateSecsMap, setDateSecsMap] = useState({})
  const [browseDate,  setBrowseDate]  = useState(toDateKey())
  const [loading,     setLoading]     = useState(false)

  const intervalRef = useRef(null)
  const histRef     = useStaggerIn([sessions.length])

  const loadSessions = useCallback(async (dk) => {
    setLoading(true)
    try { setSessions((await getSessionsByDate(dk)).sort((a,b) => b.startTs-a.startTs)) }
    catch { setSessions([]) }
    setLoading(false)
  }, [])

  const loadAllDates = useCallback(async () => {
    setAllDates(await getAllDatesWithSessions())
    setDateSecsMap(await getDateSecsMap())
  }, [])

  useEffect(() => { loadSessions(toDateKey()); loadAllDates() }, [loadSessions, loadAllDates])
  useEffect(() => { loadSessions(histTab==='browse' ? browseDate : toDateKey()) }, [browseDate, histTab, loadSessions])

  // Wall-clock tick
  useEffect(() => {
    clearInterval(intervalRef.current)
    if (!running || !startTs) return
    intervalRef.current = setInterval(() => {
      const ne = Math.floor((Date.now()-startTs)/1000)
      setElapsed(ne)
      saveTimerState({ running:true, startTs, activity, elapsed:ne })
    }, 500)
    return () => clearInterval(intervalRef.current)
  }, [running, startTs, activity])

  const handleStart = () => {
    if (!activity.trim()) return showToast('Activity name dakhlo pehla')
    const ts = Date.now()
    setStartTs(ts); setElapsed(0); setRunning(true); setShowSuggest(false)
    saveTimerState({ running:true, startTs:ts, activity:activity.trim(), elapsed:0 })
  }

  const handleStop = async () => {
    clearInterval(intervalRef.current)
    setRunning(false)
    const endTs = Date.now()
    const dur   = Math.floor((endTs-startTs)/1000)
    clearTimerState()
    if (dur < 5) { showToast('5s thi ochhu — save nahi thayo'); setElapsed(0); setStartTs(null); return }
    await saveSession({ activity:activity.trim(), startTs, endTs, durationSecs:dur, dateKey:toDateKey(new Date(startTs)) })
    await loadSessions(toDateKey())
    await loadAllDates()
    await syncFocusMins()
    const m=Math.floor(dur/60), s=dur%60
    showToast(`✅ ${activity} — ${m>0?m+'m ':''}${s}s saved`)
    setElapsed(0); setStartTs(null); setActivity('')
  }

  const handleDelete = async (id) => {
    await deleteSession(id)
    await loadSessions(histTab==='browse' ? browseDate : toDateKey())
    await loadAllDates()
    await syncFocusMins()
    showToast('Session deleted')
  }

  const totalToday = sessions.reduce((s,x) => s+x.durationSecs, 0)
  const byActivity = sessions.reduce((acc,s) => { acc[s.activity]=(acc[s.activity]||0)+s.durationSecs; return acc }, {})
  const activeDate = histTab==='browse' ? browseDate : toDateKey()

  const browsePrev = () => { const i=allDates.indexOf(browseDate); if (i<allDates.length-1) setBrowseDate(allDates[i+1]) }
  const browseNext = () => { const i=allDates.indexOf(browseDate); if (i>0) setBrowseDate(allDates[i-1]) }

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
        <div className="text-center mb-5">
          <div className={`font-sans font-bold transition-all duration-300
            ${elapsed>=3600?'text-5xl':'text-6xl'} ${running?'text-gold':'text-ink'}`}>
            {fmtElapsed(elapsed)}
          </div>
          {running && (
            <p className="text-[11px] text-ink-2 mt-2 uppercase tracking-widest">
              {activity} · Started {fmtTime(startTs)}
            </p>
          )}
        </div>

        {!running && (
          <div className="mb-4 relative">
            <label className="text-[10px] text-ink-2 uppercase tracking-wider mb-1.5 block">
              Activity — kem karo cho?
            </label>
            <input className="dhyan-input" placeholder="e.g. Deep Work, Reading..."
              value={activity}
              onChange={e => { setActivity(e.target.value); setShowSuggest(true) }}
              onFocus={() => setShowSuggest(true)}
              onBlur={() => setTimeout(() => setShowSuggest(false), 150)} />
            {showSuggest && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-bg-2 border border-subtle rounded-xl overflow-hidden z-50 shadow-lg">
                {ACTIVITY_SUGGESTIONS.filter(s => !activity||s.toLowerCase().includes(activity.toLowerCase())).slice(0,6).map(s => (
                  <button key={s} onMouseDown={() => { setActivity(s); setShowSuggest(false) }}
                    className="w-full text-left px-4 py-2.5 text-sm text-ink-2 hover:bg-bg-3 hover:text-ink transition-colors border-b border-subtle last:border-0">
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="flex justify-center gap-3">
          {!running ? (
            <button onClick={handleStart} className="btn-gold px-8"><FiPlay size={15}/> Start</button>
          ) : (
            <button onClick={handleStop}
              className="flex items-center gap-2 bg-coral text-white font-sans font-semibold text-sm px-8 py-2.5 rounded-xl hover:brightness-110 active:scale-95 transition-all duration-150">
              <FiSquare size={15}/> Stop & Save
            </button>
          )}
        </div>

        {running && elapsed>0 && (
          <div className="mt-4 bg-gold-dim border border-gold/20 rounded-xl p-3 text-center">
            <p className="text-[10px] text-ink-2 uppercase tracking-widest mb-1">Focus Credit on Save</p>
            <p className="font-sans font-bold text-gold text-lg">+{Math.floor(elapsed/60)}m {elapsed%60}s</p>
          </div>
        )}
      </div>

      {/* History section */}
      <div className="dhyan-card">
        <div className="flex gap-2 mb-4">
          {[{key:'today',label:"Today's Log"},{key:'browse',label:'Browse History'}].map(t => (
            <button key={t.key} onClick={() => setHistTab(t.key)}
              className={`flex-1 py-2 rounded-xl text-xs font-medium transition-all duration-200
                ${histTab===t.key ? 'bg-gold-dim text-gold border border-gold/25' : 'bg-bg-2 text-ink-2 border border-subtle hover:text-ink'}`}>
              {t.label}
            </button>
          ))}
        </div>

        {histTab==='browse' && (
          <>
            <div className="flex items-center justify-between mb-4 bg-bg-2 rounded-xl p-2">
              <button onClick={browsePrev} disabled={allDates.indexOf(browseDate)>=allDates.length-1}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-ink-2 hover:text-ink disabled:opacity-30 transition-colors">
                <FiChevronLeft size={16}/>
              </button>
              <div className="text-center">
                <p className="font-sans text-sm font-semibold text-ink">{toDisplayDate(browseDate)}</p>
                <p className="text-[10px] text-ink-2">{browseDate}</p>
              </div>
              <button onClick={browseNext} disabled={allDates.indexOf(browseDate)<=0}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-ink-2 hover:text-ink disabled:opacity-30 transition-colors">
                <FiChevronRight size={16}/>
              </button>
            </div>
            <div className="mb-4">
              <label className="text-[10px] text-ink-2 uppercase tracking-wider mb-1.5 block">Date select karo</label>
              <input type="date" className="dhyan-input" value={browseDate}
                max={toDateKey()} min={toDateKey(new Date(Date.now()-365*86400000))}
                onChange={e => {
                  setBrowseDate(e.target.value)
                  if (!allDates.includes(e.target.value))
                    setAllDates(p => [...new Set([e.target.value,...p])].sort((a,b)=>b.localeCompare(a)))
                }} />
            </div>
          </>
        )}

        {sessions.length>0 && (
          <div className="bg-bg-2 rounded-xl p-3 mb-4 flex items-center justify-between">
            <div className="text-center flex-1">
              <div className="font-sans text-lg font-bold text-teal">{fmtDuration(totalToday)}</div>
              <div className="text-[9px] text-ink-2 uppercase tracking-wider mt-0.5">Total Time</div>
            </div>
            <div className="w-px h-8 bg-subtle"/>
            <div className="text-center flex-1">
              <div className="font-sans text-lg font-bold text-gold">{sessions.length}</div>
              <div className="text-[9px] text-ink-2 uppercase tracking-wider mt-0.5">Sessions</div>
            </div>
            <div className="w-px h-8 bg-subtle"/>
            <div className="text-center flex-1">
              <div className="font-sans text-lg font-bold text-blue-400">{Object.keys(byActivity).length}</div>
              <div className="text-[9px] text-ink-2 uppercase tracking-wider mt-0.5">Activities</div>
            </div>
          </div>
        )}

        {Object.keys(byActivity).length>1 && (
          <div className="mb-4 space-y-2">
            <p className="text-[10px] text-ink-2 uppercase tracking-widest mb-2">Activity Breakdown</p>
            {Object.entries(byActivity).sort((a,b)=>b[1]-a[1]).map(([act,secs]) => (
              <div key={act}>
                <div className="flex justify-between text-[11px] mb-1">
                  <span className="text-ink-2">{act}</span>
                  <span className="text-gold">{fmtDuration(secs)}</span>
                </div>
                <div className="prog-bar">
                  <div className="prog-fill bg-gold" style={{width:`${Math.min((secs/totalToday)*100,100)}%`}}/>
                </div>
              </div>
            ))}
          </div>
        )}

        {loading ? (
          <div className="text-center py-6 text-ink-3 text-xs animate-pulse">Loading...</div>
        ) : sessions.length===0 ? (
          <div className="text-center py-10">
            <FiClock size={32} className="mx-auto text-ink-3 opacity-20 mb-3"/>
            <p className="text-ink-3 text-sm">
              {histTab==='today' ? 'Aaj koi session nathi' : `${toDisplayDate(activeDate)} — koi data nathi`}
            </p>
          </div>
        ) : (
          <div ref={histRef} className="space-y-2">
            <p className="text-[10px] text-ink-2 uppercase tracking-widest mb-2">Sessions</p>
            {sessions.map(s => (
              <div key={s.id}
                className="group flex items-center gap-3 bg-bg-2 rounded-xl p-3 border border-subtle hover:border-medium transition-all duration-150">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-ink truncate">{s.activity}</p>
                  <p className="text-[10px] text-ink-2 mt-0.5">{fmtTime(s.startTs)} → {fmtTime(s.endTs)}</p>
                </div>
                <p className="font-sans text-sm font-bold text-teal shrink-0">{fmtDuration(s.durationSecs)}</p>
                <button onClick={() => handleDelete(s.id)}
                  className="text-ink-3 opacity-0 group-hover:opacity-100 hover:text-coral transition-all duration-150 ml-1">
                  <FiTrash2 size={13}/>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Year heatmap — GitHub style */}
      <div className="dhyan-card">
        <YearHeatmap
          dateSecsMap={dateSecsMap}
          totalDays={allDates.length}
          onDateClick={(key) => { setBrowseDate(key); setHistTab('browse') }}
        />
      </div>

    </div>
  )
}
