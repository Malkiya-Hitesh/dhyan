// store/AppContext.jsx
import { createContext, useContext, useReducer, useEffect, useCallback, useRef } from 'react'
import { openDB } from 'idb'
import * as db from '../utils/db'
import { TODAY_KEY } from '../utils/date'

const AppContext = createContext(null)

const initialState = {
  habits:    [],
  tasks:     [],
  goals:     [],
  notes:     [],
  dailyLogs: [],
  settings:  { focusSessions: 0, focusMins: 0, lastDate: '', streak: 0 },
  loading:   true,
  activePage: 'home',
}

function reducer(state, action) {
  switch (action.type) {
    case 'SET_ALL':       return { ...state, ...action.payload, loading: false }
    case 'SET_HABITS':    return { ...state, habits:    action.payload }
    case 'SET_TASKS':     return { ...state, tasks:     action.payload }
    case 'SET_GOALS':     return { ...state, goals:     action.payload }
    case 'SET_NOTES':     return { ...state, notes:     action.payload }
    case 'SET_LOGS':      return { ...state, dailyLogs: action.payload }
    case 'SET_SETTINGS':  return { ...state, settings:  action.payload }
    case 'SET_PAGE':      return { ...state, activePage: action.payload }
    default:              return state
  }
}

// ── Infinity DB helpers ───────────────────────────────────────────────
const INF_DB      = 'DhyanInfinityDB'
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

// Returns today's total MINUTES from infinity sessions (no halving — full credit)
async function calcTodayInfinityMins() {
  try {
    const idb   = await getInfDB()
    const today = TODAY_KEY
    const rows  = await idb.getAllFromIndex('sessions', 'dateKey', today)
    const totalSecs = rows.reduce((s, r) => s + (r.durationSecs || 0), 0)
    return Math.round(totalSecs / 60)
  } catch {
    return 0
  }
}

// ── Provider ─────────────────────────────────────────────────────────
export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState)

  // Use refs so callbacks always have latest state without stale closures
  const habitsRef   = useRef([])
  const tasksRef    = useRef([])
  const settingsRef = useRef(initialState.settings)

  useEffect(() => { habitsRef.current   = state.habits   }, [state.habits])
  useEffect(() => { tasksRef.current    = state.tasks    }, [state.tasks])
  useEffect(() => { settingsRef.current = state.settings }, [state.settings])

  // ── Load everything from IndexedDB on mount ──
  useEffect(() => {
    async function load() {
      let [habits, tasks, goals, notes, dailyLogs] = await Promise.all([
        db.getAll('habits'), db.getAll('tasks'), db.getAll('goals'),
        db.getAll('notes'),  db.getAll('dailyLog'),
      ])
      let settings = await db.getSetting('main') || initialState.settings

      // New day reset — use ISO date strings for consistent comparison
      if (settings.lastDate !== TODAY_KEY) {
        habits = habits.map(h => ({ ...h, doneToday: false }))
        for (const h of habits) await db.put('habits', h)
        // On new day, pomodoro/focus timer sessions reset; infinity carries over separately
        const freshFocusMins = await calcTodayInfinityMins()
        settings = {
          ...settings,
          focusSessions: 0,
          focusMins: freshFocusMins,
          lastDate: TODAY_KEY,
        }
        await db.saveSetting('main', settings)
      } else {
        // Same day — recalculate infinity mins live (in case sessions were added externally)
        const liveMins = await calcTodayInfinityMins()
        // focusMins = infinity mins + pomodoro mins (stored separately)
        const pomodoroMins = settings.pomodoroMins || 0
        settings = { ...settings, focusMins: liveMins + pomodoroMins }
      }

      dispatch({ type: 'SET_ALL', payload: { habits, tasks, goals, notes, dailyLogs, settings } })
    }
    load()
  }, [])

  // ── Save daily log helper — uses refs to avoid stale closures ──
  const _saveDailyLog = useCallback(async (habits, tasks, focusMins) => {
    const doneH    = habits.filter(h => h.doneToday).length
    const habitPct = habits.length > 0 ? Math.round((doneH / habits.length) * 100) : 0

    const habitScore = habits.length > 0 ? (doneH / habits.length) * 40 : 0
    const taskDone   = tasks.filter(t => t.status === 'done').length
    const taskScore  = tasks.length > 0 ? (taskDone / tasks.length) * 30 : 0
    const focusScore = Math.min((focusMins / 600) * 30, 30)
    const score      = Math.round(habitScore + taskScore + focusScore)

    const log = { id: TODAY_KEY, date: TODAY_KEY, habitPct, score, tasksDone: taskDone, focusMins }
    await db.put('dailyLog', log)
    const logs = await db.getAll('dailyLog')
    dispatch({ type: 'SET_LOGS', payload: logs })
  }, [])

  // ── Actions ──

  const setPage = useCallback((page) => dispatch({ type: 'SET_PAGE', payload: page }), [])

  // Habits
  const toggleHabit = useCallback(async (id) => {
    const habits  = habitsRef.current
    const updated = habits.map(h => {
      if (h.id !== id) return h
      const done = !h.doneToday
      return { ...h, doneToday: done, streak: done ? (h.streak || 0) + 1 : Math.max(0, (h.streak || 0) - 1) }
    })
    for (const h of updated) if (h.id === id) await db.put('habits', h)
    dispatch({ type: 'SET_HABITS', payload: updated })
    await _saveDailyLog(updated, tasksRef.current, settingsRef.current.focusMins)
  }, [_saveDailyLog])

  const addHabit = useCallback(async ({ name, icon }) => {
    const rec = { name, icon: icon || '✅', streak: 0, doneToday: false, missReasons: [], createdAt: Date.now() }
    const id = await db.put('habits', rec)
    dispatch({ type: 'SET_HABITS', payload: [...habitsRef.current, { ...rec, id }] })
  }, [])

  const deleteHabit = useCallback(async (id) => {
    await db.remove('habits', id)
    dispatch({ type: 'SET_HABITS', payload: habitsRef.current.filter(h => h.id !== id) })
  }, [])

  const saveMissReason = useCallback(async (id, reason) => {
    const habits  = habitsRef.current
    const updated = habits.map(h => {
      if (h.id !== id) return h
      const reasons = [...(h.missReasons || []), { date: TODAY_KEY, reason }]
      return { ...h, missReasons: reasons }
    })
    const h = updated.find(h => h.id === id)
    if (h) await db.put('habits', h)
    dispatch({ type: 'SET_HABITS', payload: updated })
  }, [])

  // Tasks
  const addTask = useCallback(async (task) => {
    const rec = { ...task, status: task.status || 'pending', doneDate: null, createdAt: Date.now() }
    const id = await db.put('tasks', rec)
    dispatch({ type: 'SET_TASKS', payload: [...tasksRef.current, { ...rec, id }] })
  }, [])

  const cycleTaskStatus = useCallback(async (id) => {
    const cycle  = { pending: 'inprogress', inprogress: 'done', done: 'pending' }
    const tasks  = tasksRef.current
    const updated = tasks.map(t => {
      if (t.id !== id) return t
      const status = cycle[t.status]
      return { ...t, status, doneDate: status === 'done' ? TODAY_KEY : null }
    })
    const t = updated.find(t => t.id === id)
    if (t) await db.put('tasks', t)
    dispatch({ type: 'SET_TASKS', payload: updated })
    await _saveDailyLog(habitsRef.current, updated, settingsRef.current.focusMins)
  }, [_saveDailyLog])

  const deleteTask = useCallback(async (id) => {
    await db.remove('tasks', id)
    dispatch({ type: 'SET_TASKS', payload: tasksRef.current.filter(t => t.id !== id) })
  }, [])

  // Goals
  const addGoal = useCallback(async (goal) => {
    const goals = state.goals
    const rec = { ...goal, createdAt: Date.now() }
    const id = await db.put('goals', rec)
    dispatch({ type: 'SET_GOALS', payload: [...goals, { ...rec, id }] })
  }, [state.goals])

  const toggleMilestone = useCallback(async (goalId, idx) => {
    const goals   = state.goals
    const updated = goals.map(g => {
      if (g.id !== goalId) return g
      const milestones = g.milestones.map((m, i) => i === idx ? { ...m, done: !m.done } : m)
      return { ...g, milestones }
    })
    const g = updated.find(g => g.id === goalId)
    if (g) await db.put('goals', g)
    dispatch({ type: 'SET_GOALS', payload: updated })
  }, [state.goals])

  const deleteGoal = useCallback(async (id) => {
    await db.remove('goals', id)
    dispatch({ type: 'SET_GOALS', payload: state.goals.filter(g => g.id !== id) })
  }, [state.goals])

  // Notes
  const addNote = useCallback(async (note) => {
    const notes = state.notes
    const rec = { ...note, createdAt: Date.now() }
    const id = await db.put('notes', rec)
    dispatch({ type: 'SET_NOTES', payload: [...notes, { ...rec, id }] })
  }, [state.notes])

  const deleteNote = useCallback(async (id) => {
    await db.remove('notes', id)
    dispatch({ type: 'SET_NOTES', payload: state.notes.filter(n => n.id !== id) })
  }, [state.notes])

  // ── addFocusSession — Pomodoro/Focus timer calls this with actual minutes ──
  // Adds to pomodoroMins (separate from infinity), then updates total focusMins
  const addFocusSession = useCallback(async (mins) => {
    const current  = settingsRef.current
    const pomodoroMins = (current.pomodoroMins || 0) + (mins || 0)
    const infinityMins = await calcTodayInfinityMins()
    const focusMins    = infinityMins + pomodoroMins

    const updated = {
      ...current,
      focusSessions: (current.focusSessions || 0) + 1,
      pomodoroMins,
      focusMins,
    }
    await db.saveSetting('main', updated)
    dispatch({ type: 'SET_SETTINGS', payload: updated })
    await _saveDailyLog(habitsRef.current, tasksRef.current, focusMins)
  }, [_saveDailyLog])

  // ── syncFocusMins — call after every Infinity session save/delete ──
  // Recalculates infinity mins fresh and adds to pomodoro mins
  const syncFocusMins = useCallback(async () => {
    const current      = settingsRef.current
    const infinityMins = await calcTodayInfinityMins()
    const pomodoroMins = current.pomodoroMins || 0
    const focusMins    = infinityMins + pomodoroMins

    const updated = { ...current, focusMins }
    await db.saveSetting('main', updated)
    dispatch({ type: 'SET_SETTINGS', payload: updated })
    await _saveDailyLog(habitsRef.current, tasksRef.current, focusMins)
  }, [_saveDailyLog])

  // Manual save daily log
  const saveDailyLog = useCallback(async (dateKey, data) => {
    const log = { id: dateKey, date: dateKey, ...data }
    await db.put('dailyLog', log)
    const logs = await db.getAll('dailyLog')
    dispatch({ type: 'SET_LOGS', payload: logs })
  }, [])

  // Reset all data
  const resetAllData = useCallback(async () => {
    const stores = ['habits', 'tasks', 'goals', 'notes', 'dailyLog']
    const db_instance = await db.getDB()
    for (const store of stores) {
      const allRecords = await db_instance.getAll(store)
      for (const record of allRecords) {
        await db_instance.delete(store, record.id)
      }
    }
    await db.saveSetting('main', initialState.settings)
    dispatch({
      type: 'SET_ALL',
      payload: {
        habits: [],
        tasks: [],
        goals: [],
        notes: [],
        dailyLogs: [],
        settings: initialState.settings,
      },
    })
  }, [])

  return (
    <AppContext.Provider value={{
      ...state,
      setPage,
      toggleHabit, addHabit, deleteHabit, saveMissReason,
      addTask, cycleTaskStatus, deleteTask,
      addGoal, toggleMilestone, deleteGoal,
      addNote, deleteNote,
      addFocusSession,
      syncFocusMins,
      saveDailyLog,
      resetAllData,
    }}>
      {children}
    </AppContext.Provider>
  )
}

export const useApp = () => useContext(AppContext)