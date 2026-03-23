// store/AppContext.jsx
// Global state management using React Context + useReducer

import { createContext, useContext, useReducer, useEffect, useCallback } from 'react'
import * as db from '../utils/db'
import { TODAY, TODAY_KEY } from '../utils/date'

const AppContext = createContext(null)

const DEFAULT_HABITS = [
  { icon: '🌅', name: 'Wake up early',  streak: 0, doneToday: false, missReasons: [] },
  { icon: '💪', name: 'Workout',         streak: 0, doneToday: false, missReasons: [] },
  { icon: '📖', name: 'Reading 30min',   streak: 0, doneToday: false, missReasons: [] },
  { icon: '📵', name: 'No Instagram',    streak: 0, doneToday: false, missReasons: [] },
  { icon: '🧘', name: 'Meditation',      streak: 0, doneToday: false, missReasons: [] },
]

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

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState)

  // ── Load everything from IndexedDB on mount ──
  useEffect(() => {
    async function load() {
      let [habits, tasks, goals, notes, dailyLogs] = await Promise.all([
        db.getAll('habits'), db.getAll('tasks'), db.getAll('goals'),
        db.getAll('notes'),  db.getAll('dailyLog'),
      ])
      let settings = await db.getSetting('main') || initialState.settings

      // Seed default habits if none exist
      if (habits.length === 0) {
        for (const h of DEFAULT_HABITS) {
          const id = await db.put('habits', { ...h, createdAt: Date.now() })
          habits.push({ ...h, id, createdAt: Date.now() })
        }
      }

      // New day reset
      if (settings.lastDate !== TODAY) {
        habits = habits.map(h => ({ ...h, doneToday: false }))
        for (const h of habits) await db.put('habits', h)
        settings = { ...settings, focusSessions: 0, focusMins: 0, lastDate: TODAY }
        await db.saveSetting('main', settings)
      }

      dispatch({ type: 'SET_ALL', payload: { habits, tasks, goals, notes, dailyLogs, settings } })
    }
    load()
  }, [])

  // ── Actions ──

  const setPage = useCallback((page) => dispatch({ type: 'SET_PAGE', payload: page }), [])

  // Habits
  const toggleHabit = useCallback(async (id) => {
    const updated = state.habits.map(h => {
      if (h.id !== id) return h
      const done = !h.doneToday
      return { ...h, doneToday: done, streak: done ? (h.streak || 0) + 1 : Math.max(0, (h.streak || 0) - 1) }
    })
    for (const h of updated) if (h.id === id) await db.put('habits', h)
    dispatch({ type: 'SET_HABITS', payload: updated })
  }, [state.habits])

  const addHabit = useCallback(async ({ name, icon }) => {
    const rec = { name, icon: icon || '✅', streak: 0, doneToday: false, missReasons: [], createdAt: Date.now() }
    const id = await db.put('habits', rec)
    dispatch({ type: 'SET_HABITS', payload: [...state.habits, { ...rec, id }] })
  }, [state.habits])

  const deleteHabit = useCallback(async (id) => {
    await db.remove('habits', id)
    dispatch({ type: 'SET_HABITS', payload: state.habits.filter(h => h.id !== id) })
  }, [state.habits])

  const saveMissReason = useCallback(async (id, reason) => {
    const updated = state.habits.map(h => {
      if (h.id !== id) return h
      const reasons = [...(h.missReasons || []), { date: TODAY_KEY, reason }]
      return { ...h, missReasons: reasons }
    })
    const h = updated.find(h => h.id === id)
    if (h) await db.put('habits', h)
    dispatch({ type: 'SET_HABITS', payload: updated })
  }, [state.habits])

  // Tasks
  const addTask = useCallback(async (task) => {
    const rec = { ...task, status: task.status || 'pending', doneDate: null, createdAt: Date.now() }
    const id = await db.put('tasks', rec)
    dispatch({ type: 'SET_TASKS', payload: [...state.tasks, { ...rec, id }] })
  }, [state.tasks])

  const cycleTaskStatus = useCallback(async (id) => {
    const cycle = { pending: 'inprogress', inprogress: 'done', done: 'pending' }
    const updated = state.tasks.map(t => {
      if (t.id !== id) return t
      const status = cycle[t.status]
      return { ...t, status, doneDate: status === 'done' ? TODAY_KEY : null }
    })
    const t = updated.find(t => t.id === id)
    if (t) await db.put('tasks', t)
    dispatch({ type: 'SET_TASKS', payload: updated })
  }, [state.tasks])

  const deleteTask = useCallback(async (id) => {
    await db.remove('tasks', id)
    dispatch({ type: 'SET_TASKS', payload: state.tasks.filter(t => t.id !== id) })
  }, [state.tasks])

  // Goals
  const addGoal = useCallback(async (goal) => {
    const rec = { ...goal, createdAt: Date.now() }
    const id = await db.put('goals', rec)
    dispatch({ type: 'SET_GOALS', payload: [...state.goals, { ...rec, id }] })
  }, [state.goals])

  const toggleMilestone = useCallback(async (goalId, idx) => {
    const updated = state.goals.map(g => {
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
    const rec = { ...note, createdAt: Date.now() }
    const id = await db.put('notes', rec)
    dispatch({ type: 'SET_NOTES', payload: [...state.notes, { ...rec, id }] })
  }, [state.notes])

  const deleteNote = useCallback(async (id) => {
    await db.remove('notes', id)
    dispatch({ type: 'SET_NOTES', payload: state.notes.filter(n => n.id !== id) })
  }, [state.notes])

  // Focus timer session complete
  const addFocusSession = useCallback(async (mins) => {
    const updated = {
      ...state.settings,
      focusSessions: (state.settings.focusSessions || 0) + 1,
      focusMins:     (state.settings.focusMins || 0) + mins,
    }
    await db.saveSetting('main', updated)
    dispatch({ type: 'SET_SETTINGS', payload: updated })
  }, [state.settings])

  // Save daily log
  const saveDailyLog = useCallback(async (dateKey, data) => {
    const log = { id: dateKey, date: dateKey, ...data }
    await db.put('dailyLog', log)
    const logs = await db.getAll('dailyLog')
    dispatch({ type: 'SET_LOGS', payload: logs })
  }, [])

  return (
    <AppContext.Provider value={{
      ...state,
      setPage,
      toggleHabit, addHabit, deleteHabit, saveMissReason,
      addTask, cycleTaskStatus, deleteTask,
      addGoal, toggleMilestone, deleteGoal,
      addNote, deleteNote,
      addFocusSession, saveDailyLog,
    }}>
      {children}
    </AppContext.Provider>
  )
}

export const useApp = () => useContext(AppContext)
