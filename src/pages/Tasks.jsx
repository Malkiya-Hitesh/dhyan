// pages/Tasks.jsx
import { useState } from 'react'
import { FiPlus, FiTrash2, FiCircle, FiCheckCircle, FiClock } from 'react-icons/fi'
import { useApp } from '../store/AppContext'
import Modal from '../components/ui/Modal'
import { isOverdue, formatDate } from '../utils/date'
import { useStaggerIn, usePageTransition } from '../hooks/useGsap'

// Golden ratio scale: base 13px × 1.618
// 13 → 21 → 34 → 8 → 10
const FILTERS = [
  { key: 'all',        label: 'All' },
  { key: 'pending',    label: 'Pending' },
  { key: 'inprogress', label: 'In Progress' },
  { key: 'done',       label: 'Done' },
  { key: 'high',       label: 'High' },
  { key: 'medium',     label: 'Medium' },
  { key: 'low',        label: 'Low' },
]

const PRIORITY_CONFIG = {
  high:   { dot: '#ff6b6b', label: 'High',   bg: 'bg-coral-dim',                    text: 'text-coral' },
  medium: { dot: '#e8c547', label: 'Medium', bg: 'bg-gold-dim',                     text: 'text-gold' },
  low:    { dot: '#4ecca3', label: 'Low',    bg: 'bg-teal-dim',                     text: 'text-teal' },
}

const STATUS_CONFIG = {
  pending:    { label: 'Pending',     text: 'text-ink-2' },
  inprogress: { label: 'In Progress', text: 'text-gold' },
  done:       { label: 'Done',        text: 'text-teal' },
}

function TaskCard({ t, onCycle, onDelete }) {
  const overdue = isOverdue(t.deadline) && t.status !== 'done'
  const pri     = PRIORITY_CONFIG[t.priority] || PRIORITY_CONFIG.medium
  const isDone  = t.status === 'done'

  return (
    <div className={`group relative bg-bg-1 border rounded-2xl p-4 mb-2.5
      transition-all duration-200 hover:border-medium
      ${isDone ? 'opacity-50 border-subtle' : 'border-subtle'}`}>

      {/* Priority bar — left edge */}
      <div className="absolute left-0 top-3 bottom-3 w-0.5 rounded-full"
        style={{ background: isDone ? 'transparent' : pri.dot }} />

      <div className="flex items-start gap-3 pl-2">
        {/* Status toggle */}
        <button
          onClick={() => onCycle(t.id)}
          className="mt-0.5 shrink-0 transition-transform duration-150 active:scale-90"
        >
          {isDone
            ? <FiCheckCircle size={18} className="text-teal" />
            : <FiCircle size={18} className="text-ink-3 group-hover:text-ink-2 transition-colors" />
          }
        </button>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Title — golden ratio: 13px body */}
          <p className={`leading-snug font-medium
            ${isDone ? 'line-through text-ink-3' : 'text-ink'}
          `} style={{ fontSize: '20px' }}>
            {t.title}
          </p>

          {/* Meta row */}
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            {/* Priority pill */}
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full ${pri.bg} ${pri.text}`}
              style={{ fontSize: '10px', fontWeight: 600, letterSpacing: '0.04em' }}>
              <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: pri.dot }} />
              {pri.label}
            </span>

            {/* Status */}
            <span className={`${STATUS_CONFIG[t.status]?.text || 'text-ink-2'}`}
              style={{ fontSize: '10px' }}>
              {STATUS_CONFIG[t.status]?.label || t.status}
            </span>

            {/* Deadline */}
            {t.deadline && (
              <span className={`flex items-center gap-1 ${overdue ? 'text-coral' : 'text-ink-3'}`}
                style={{ fontSize: '10px' }}>
                <FiClock size={9} />
                {overdue ? 'Overdue · ' : ''}{t.deadline}
              </span>
            )}
          </div>
        </div>

        {/* Delete */}
        <button
          onClick={() => onDelete(t.id)}
          className="shrink-0 mt-0.5 text-ink-3 opacity-0 group-hover:opacity-100 hover:text-coral transition-all duration-150"
        >
          <FiTrash2 size={13} />
        </button>
      </div>
    </div>
  )
}

export default function Tasks({ showToast }) {
  const { tasks, addTask, cycleTaskStatus, deleteTask } = useApp()
  const [filter, setFilter] = useState('all')
  const [modal,  setModal]  = useState(false)
  const [form,   setForm]   = useState({ title: '', priority: 'medium', status: 'pending', deadline: '' })

  const pageRef = usePageTransition()
  const listRef = useStaggerIn([tasks.length, filter])

  const filtered = tasks.filter(t => {
    if (filter === 'all') return true
    return t.status === filter || t.priority === filter
  })

  // Counts
  const pending  = tasks.filter(t => t.status === 'pending').length
  const done     = tasks.filter(t => t.status === 'done').length
  const total    = tasks.length

  const handleAdd = async () => {
    if (!form.title.trim()) return showToast('Enter task title')
    await addTask({ ...form, deadline: form.deadline || null })
    setForm({ title: '', priority: 'medium', status: 'pending', deadline: '' })
    setModal(false)
    showToast('Task added ✓')
  }

  return (
    <div ref={pageRef} className="p-4 pb-28 w-full max-w-lg mx-auto">

      {/* Header */}
      <div className="flex items-end justify-between mb-5">
        <div>
          {/* Page title — 21px (13 × 1.618) */}
          <h1 className="font-sans font-bold text-ink leading-none"
            style={{ fontSize: '21px' }}>Tasks</h1>
          {/* Subtitle — 10px (13 ÷ 1.318) */}
          <p className="text-ink-2 mt-1" style={{ fontSize: '10px', letterSpacing: '0.06em' }}>
            {done}/{total} COMPLETE
          </p>
        </div>
        <button
          onClick={() => setModal(true)}
          className="flex items-center gap-1.5 bg-gold text-bg font-sans font-semibold
            px-4 py-2 rounded-xl hover:brightness-110 active:scale-95 transition-all duration-150"
          style={{ fontSize: '12px' }}>
          <FiPlus size={13} /> New Task
        </button>
      </div>

      {/* Progress bar */}
      {total > 0 && (
        <div className="mb-4">
          <div className="h-1 bg-bg-3 rounded-full overflow-hidden">
            <div className="h-full bg-teal rounded-full transition-all duration-700"
              style={{ width: `${(done / total) * 100}%` }} />
          </div>
        </div>
      )}

      {/* Filter pills */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 mb-4 scrollbar-hide">
        {FILTERS.map(f => (
          <button key={f.key} onClick={() => setFilter(f.key)}
            className={`px-3 py-1.5 rounded-full border whitespace-nowrap shrink-0 transition-all duration-200 font-medium`}
            
            style={{
              fontSize: '11px',
              backgroundColor: filter === f.key ? 'rgba(232,197,71,0.12)' : 'transparent',
              color: filter === f.key ? '#e8c547' : '#7a7060',
              borderColor: filter === f.key ? 'rgba(232,197,71,0.3)' : 'rgba(255,255,255,0.07)',
            }}>
            {f.label}
          </button>
        ))}
      </div>

      {/* Task list */}
      <div ref={listRef}>
        {filtered.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-4xl mb-3 opacity-20">📋</div>
            <p className="text-ink-3" style={{ fontSize: '13px' }}>No tasks here</p>
          </div>
        ) : (
          filtered.map(t => (
            <TaskCard
              key={t.id}
              t={t}
              onCycle={cycleTaskStatus}
              onDelete={deleteTask}
            />
          ))
        )}
      </div>

      {/* Add Task Modal */}
      <Modal open={modal} onClose={() => setModal(false)} title="New Task">
        <div className="space-y-4">
          <div>
            <label className="block text-ink-2 mb-1.5 uppercase tracking-widest"
              style={{ fontSize: '10px' }}>Title</label>
            <input className="dhyan-input" placeholder="What needs to be done?"
              style={{ fontSize: '13px' }}
              value={form.title}
              onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
              onKeyDown={e => e.key === 'Enter' && handleAdd()} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-ink-2 mb-1.5 uppercase tracking-widest"
                style={{ fontSize: '10px' }}>Priority</label>
              <select className="dhyan-input" style={{ fontSize: '13px' }}
                value={form.priority}
                onChange={e => setForm(p => ({ ...p, priority: e.target.value }))}>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
            <div>
              <label className="block text-ink-2 mb-1.5 uppercase tracking-widest"
                style={{ fontSize: '10px' }}>Status</label>
              <select className="dhyan-input" style={{ fontSize: '13px' }}
                value={form.status}
                onChange={e => setForm(p => ({ ...p, status: e.target.value }))}>
                <option value="pending">Pending</option>
                <option value="inprogress">In Progress</option>
                <option value="done">Done</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-ink-2 mb-1.5 uppercase tracking-widest"
              style={{ fontSize: '10px' }}>Deadline (optional)</label>
            <input className="dhyan-input" type="date" style={{ fontSize: '13px' }}
              value={form.deadline}
              onChange={e => setForm(p => ({ ...p, deadline: e.target.value }))} />
          </div>

          <div className="flex gap-2 pt-1">
            <button className="btn-gold flex-1" style={{ fontSize: '13px' }} onClick={handleAdd}>
              Add Task
            </button>
            <button className="btn-ghost" style={{ fontSize: '13px' }}
              onClick={() => setModal(false)}>
              Cancel
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}