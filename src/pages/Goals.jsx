// pages/Goals.jsx
import { useState } from 'react'
import { FiPlus, FiTrash2, FiCheck, FiTarget } from 'react-icons/fi'
import { useApp } from '../store/AppContext'
import Modal from '../components/ui/Modal'
import { useStaggerIn, usePageTransition } from '../hooks/useGsap'

// Golden ratio type scale (base 13px)
// 10 — meta / labels     (13 ÷ 1.3)
// 13 — body
// 21 — section title     (13 × 1.618)
// 34 — page hero         (21 × 1.618)

function GoalCard({ g, onToggle, onDelete }) {
  const milestones = g.milestones || []
  const done = milestones.filter(m => m.done).length
  const total = milestones.length
  const pct = total > 0 ? Math.round((done / total) * 100) : 0

  // Color based on progress
  const barColor = pct === 100 ? '#4ecca3' : pct >= 50 ? '#e8c547' : '#60a5fa'

  return (
    <div className="bg-bg-1 border border-subtle rounded-2xl overflow-hidden mb-3
      transition-all duration-200 hover:border-medium">

      {/* Top section */}
      <div className="p-4 pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            {/* Goal title — 16px (13 × 1.23, between scale steps) */}
            <h3 className="font-sans font-semibold text-ink leading-snug"
              style={{ fontSize: '20px' }}>
              {g.title}
            </h3>
            {g.desc && (
              <p className="text-ink-2 mt-1 leading-relaxed"
                style={{ fontSize: '12px' }}>
                {g.desc}
              </p>
            )}
          </div>

          {/* Progress % — 34px hero number */}
          <div className="text-right shrink-0">
            <span className="font-sans font-bold leading-none"
              style={{ fontSize: '34px', color: barColor }}>
              {pct}
            </span>
            <span className="text-ink-3 font-sans" style={{ fontSize: '13px' }}>%</span>
          </div>
        </div>

        {/* Progress bar */}
        <div className="h-1 bg-bg-3 rounded-full overflow-hidden mt-3">
          <div className="h-full rounded-full transition-all duration-700"
            style={{ width: pct + '%', background: barColor }} />
        </div>

        {/* Meta */}
        <div className="flex items-center justify-between mt-2">
          <span className="text-ink-3 uppercase tracking-widest"
            style={{ fontSize: '10px' }}>
            {done}/{total} milestones
          </span>
          <button onClick={() => onDelete(g.id)}
            className="text-ink-3 hover:text-coral transition-colors opacity-0 group-hover:opacity-100"
            style={{ fontSize: '10px' }}>
            <FiTrash2 size={12} />
          </button>
        </div>
      </div>

      {/* Milestones */}
      {milestones.length > 0 && (
        <div className="border-t border-subtle">
          {milestones.map((m, i) => (
            <button
              key={i}
              onClick={() => onToggle(g.id, i)}
              className={`w-full flex items-center gap-3 px-4 py-2.5 text-left
                border-b border-subtle last:border-0 transition-colors duration-150
                ${m.done ? 'bg-teal/[0.03]' : 'hover:bg-bg-2'}`}>

              {/* Checkbox */}
              <div className={`w-4 h-4 rounded-full border shrink-0 flex items-center justify-center
                transition-all duration-200
                ${m.done ? 'bg-teal border-teal' : 'border-ink-3'}`}>
                {m.done && <FiCheck size={9} className="text-bg font-bold" strokeWidth={3} />}
              </div>

              {/* Milestone text — 13px */}
              <span className={`flex-1 leading-snug transition-colors
                ${m.done ? 'line-through text-ink-3' : 'text-ink-2'}`}
                style={{ fontSize: '13px' }}>
                {m.text}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* Delete button visible on card level */}
      <div className="px-4 pb-3 pt-2 flex justify-end">
        <button onClick={() => onDelete(g.id)}
          className="flex items-center gap-1 text-ink-3 hover:text-coral transition-colors"
          style={{ fontSize: '11px' }}>
          <FiTrash2 size={11} /> Delete goal
        </button>
      </div>
    </div>
  )
}

export default function Goals({ showToast }) {
  const { goals, addGoal, toggleMilestone, deleteGoal } = useApp()
  const [modal, setModal] = useState(false)
  const [form,  setForm]  = useState({ title: '', desc: '', milestones: '' })

  const pageRef = usePageTransition()
  const listRef = useStaggerIn([goals.length])

  // Stats
  const totalMilestones = goals.reduce((s, g) => s + (g.milestones?.length || 0), 0)
  const doneMilestones  = goals.reduce((s, g) => s + (g.milestones?.filter(m => m.done).length || 0), 0)
  const completedGoals  = goals.filter(g =>
    g.milestones?.length > 0 && g.milestones.every(m => m.done)
  ).length

  const handleAdd = async () => {
    if (!form.title.trim()) return showToast('Enter goal title')
    const milestones = form.milestones.trim()
      ? form.milestones.split('\n').filter(Boolean).map(t => ({ text: t.trim(), done: false }))
      : []
    await addGoal({ title: form.title, desc: form.desc, milestones })
    setForm({ title: '', desc: '', milestones: '' })
    setModal(false)
    showToast('Goal added 🎯')
  }

  return (
    <div ref={pageRef} className="p-4 pb-28 w-full max-w-lg mx-auto">

      {/* Header */}
      <div className="flex items-end justify-between mb-5">
        <div>
          <h1 className="font-sans font-bold text-ink leading-none"
            style={{ fontSize: '21px' }}>Goals</h1>
          <p className="text-ink-2 mt-1 uppercase tracking-widest"
            style={{ fontSize: '10px' }}>
            {completedGoals}/{goals.length} COMPLETE
          </p>
        </div>
        <button
          onClick={() => setModal(true)}
          className="flex items-center gap-1.5 bg-gold text-bg font-sans font-semibold
            px-4 py-2 rounded-xl hover:brightness-110 active:scale-95 transition-all duration-150"
          style={{ fontSize: '12px' }}>
          <FiPlus size={13} /> New Goal
        </button>
      </div>

      {/* Summary stats — only if goals exist */}
      {goals.length > 0 && (
        <div className="grid grid-cols-3 gap-2 mb-5">
          {[
            { val: goals.length,       label: 'Goals',      color: 'text-gold' },
            { val: doneMilestones,     label: 'Done',        color: 'text-teal' },
            { val: totalMilestones - doneMilestones, label: 'Remaining', color: 'text-blue-400' },
          ].map(s => (
            <div key={s.label} className="bg-bg-2 rounded-xl p-3 text-center border border-subtle">
              <div className={`font-sans font-bold ${s.color}`}
                style={{ fontSize: '21px' }}>{s.val}</div>
              <div className="text-ink-3 uppercase tracking-widest mt-0.5"
                style={{ fontSize: '9px' }}>{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Goals list */}
      {goals.length === 0 ? (
        <div className="text-center py-16">
          <FiTarget size={40} className="mx-auto text-ink-3 opacity-20 mb-4" />
          <p className="text-ink-3" style={{ fontSize: '13px' }}>No goals yet. Dream big.</p>
          <button onClick={() => setModal(true)}
            className="mt-4 text-gold underline underline-offset-4"
            style={{ fontSize: '13px' }}>
            Add your first goal →
          </button>
        </div>
      ) : (
        <div ref={listRef}>
          {goals.map(g => (
            <GoalCard
              key={g.id}
              g={g}
              onToggle={toggleMilestone}
              onDelete={deleteGoal}
            />
          ))}
        </div>
      )}

      {/* Modal */}
      <Modal open={modal} onClose={() => setModal(false)} title="New Goal">
        <div className="space-y-4">
          <div>
            <label className="block text-ink-2 mb-1.5 uppercase tracking-widest"
              style={{ fontSize: '10px' }}>Goal Title</label>
            <input className="dhyan-input" placeholder="What do you want to achieve?"
              style={{ fontSize: '13px' }}
              value={form.title}
              onChange={e => setForm(p => ({ ...p, title: e.target.value }))} />
          </div>

          <div>
            <label className="block text-ink-2 mb-1.5 uppercase tracking-widest"
              style={{ fontSize: '10px' }}>Description (optional)</label>
            <input className="dhyan-input" placeholder="What does success look like?"
              style={{ fontSize: '13px' }}
              value={form.desc}
              onChange={e => setForm(p => ({ ...p, desc: e.target.value }))} />
          </div>

          <div>
            <label className="block text-ink-2 mb-1.5 uppercase tracking-widest"
              style={{ fontSize: '10px' }}>Milestones — one per line</label>
            <textarea className="dhyan-input" rows={5}
              style={{ fontSize: '13px', lineHeight: '1.618' }}
              placeholder={'Research the market\nBuild MVP\nGet first user\nLaunch publicly'}
              value={form.milestones}
              onChange={e => setForm(p => ({ ...p, milestones: e.target.value }))} />
          </div>

          <div className="flex gap-2 pt-1">
            <button className="btn-gold flex-1" style={{ fontSize: '13px' }} onClick={handleAdd}>
              Add Goal
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