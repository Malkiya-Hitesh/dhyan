// pages/Tasks.jsx
import { useState } from 'react'
import { FiPlus, FiTrash2 } from 'react-icons/fi'
import { useApp } from '../store/AppContext'
import Modal from '../components/ui/Modal'
import { isOverdue, formatDate } from '../utils/date'
import { useStaggerIn, usePageTransition } from '../hooks/useGsap'

const FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'pending', label: 'Pending' },
  { key: 'inprogress', label: 'In Progress' },
  { key: 'done', label: 'Done' },
  { key: 'high', label: '🔴 High' },
  { key: 'medium', label: '🟡 Medium' },
  { key: 'low', label: '🟢 Low' },
]

export default function Tasks({ showToast }) {
  const { tasks, addTask, cycleTaskStatus, deleteTask } = useApp()
  const [filter,   setFilter]  = useState('all')
  const [modal,    setModal]   = useState(false)
  const [form,     setForm]    = useState({ title: '', priority: 'medium', status: 'pending', deadline: '' })

  const pageRef = usePageTransition()
  const listRef = useStaggerIn([tasks.length, filter])

  const filtered = tasks.filter(t => {
    if (filter === 'all') return true
    return t.status === filter || t.priority === filter
  })

  const handleAdd = async () => {
    if (!form.title.trim()) return showToast('Enter task title')
    await addTask({ ...form, deadline: form.deadline || null })
    setForm({ title: '', priority: 'medium', status: 'pending', deadline: '' })
    setModal(false)
    showToast('Task added! ✅')
  }

  return (
    <div ref={pageRef} className="p-4 pb-24 w-full max-w-full md:max-w-2xl lg:max-w-4xl mx-auto">
      <div className="flex flex-col gap-3 mb-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="font-sans text-xl font-bold text-ink">Tasks</h1>
        <div className="flex w-full justify-center sm:w-auto sm:justify-end">
          <button className="btn-gold text-sm" onClick={() => setModal(true)}>
            <FiPlus size={14} /> Add Task
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-4 scrollbar-hide">
        {FILTERS.map(f => (
          <button key={f.key} onClick={() => setFilter(f.key)}
            className={`px-3 py-1.5 rounded-full text-[11px] border whitespace-nowrap shrink-0 transition-all duration-200
              ${filter === f.key
                ? 'bg-gold-dim text-gold border-gold/30'
                : 'border-subtle text-ink-2 hover:text-ink'}`}>
            {f.label}
          </button>
        ))}
      </div>

      {/* Task list */}
      <div ref={listRef}>
        {filtered.length === 0 ? (
          <div className="text-center py-12 text-ink-3">
            <div className="text-4xl mb-3 opacity-40">📋</div>
            <p className="text-sm">No tasks here</p>
          </div>
        ) : (
          filtered.map(t => {
            const overdue = isOverdue(t.deadline) && t.status !== 'done'
            return (
              <div key={t.id}
                className={`bg-bg-1 border border-subtle rounded-xl p-3 mb-2 flex items-start gap-3
                  hover:border-medium hover:translate-x-0.5 transition-all duration-200
                  ${t.status === 'done' ? 'opacity-40' : ''}`}>
                <button
                  onClick={() => cycleTaskStatus(t.id)}
                  className={`w-5 h-5 rounded-full border shrink-0 mt-0.5 flex items-center justify-center transition-all duration-200
                    ${t.status === 'done' ? 'bg-teal border-teal' : 'border-ink-3'}`}>
                  {t.status === 'done' && <span className="text-bg text-[10px] font-bold">✓</span>}
                </button>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm text-ink ${t.status === 'done' ? 'line-through' : ''}`}>{t.title}</p>
                  <div className="flex gap-1.5 flex-wrap mt-1.5 items-center">
                    <span className={`badge-${t.priority}`}>{t.priority}</span>
                    <span className={`badge-${t.status}`}>{t.status}</span>
                    {t.deadline && (
                      <span className={`text-[10px] ${overdue ? 'text-coral' : 'text-ink-2'}`}>
                        {overdue ? '⚠ ' : ''}{t.deadline}
                      </span>
                    )}
                  </div>
                </div>
                <button onClick={() => deleteTask(t.id)} className="text-ink-3 hover:text-coral transition-colors shrink-0">
                  <FiTrash2 size={13} />
                </button>
              </div>
            )
          })
        )}
      </div>

      {/* Add Task Modal */}
      <Modal open={modal} onClose={() => setModal(false)} title="Add Task">
        <div className="space-y-3">
          <div>
            <label className="text-[10px] text-ink-2 uppercase tracking-wider mb-1 block">Title</label>
            <input className="dhyan-input" placeholder="Task title..."
              value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
              onKeyDown={e => e.key === 'Enter' && handleAdd()} />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] text-ink-2 uppercase tracking-wider mb-1 block">Priority</label>
              <select className="dhyan-input" value={form.priority} onChange={e => setForm(p => ({ ...p, priority: e.target.value }))}>
                <option value="high">🔴 High</option>
                <option value="medium">🟡 Medium</option>
                <option value="low">🟢 Low</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] text-ink-2 uppercase tracking-wider mb-1 block">Status</label>
              <select className="dhyan-input" value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value }))}>
                <option value="pending">Pending</option>
                <option value="inprogress">In Progress</option>
                <option value="done">Done</option>
              </select>
            </div>
          </div>
          <div>
            <label className="text-[10px] text-ink-2 uppercase tracking-wider mb-1 block">Deadline (optional)</label>
            <input className="dhyan-input" type="date" value={form.deadline} onChange={e => setForm(p => ({ ...p, deadline: e.target.value }))} />
          </div>
          <div className="sticky top-0 bg-bg-1 z-10 pb-3">
            <div className="flex gap-2">
              <button className="btn-gold flex-1" onClick={handleAdd}>Add Task</button>
              <button className="btn-ghost" onClick={() => setModal(false)}>Cancel</button>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  )
}
