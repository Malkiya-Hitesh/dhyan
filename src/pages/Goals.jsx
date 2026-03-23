// pages/Goals.jsx
import { useState } from 'react'
import { FiPlus, FiTrash2 } from 'react-icons/fi'
import { useApp } from '../store/AppContext'
import Modal from '../components/ui/Modal'
import { useStaggerIn, usePageTransition } from '../hooks/useGsap'

export default function Goals({ showToast }) {
  const { goals, addGoal, toggleMilestone, deleteGoal } = useApp()
  const [modal, setModal] = useState(false)
  const [form,  setForm]  = useState({ title: '', desc: '', milestones: '' })

  const pageRef = usePageTransition()
  const listRef = useStaggerIn([goals.length])

  const handleAdd = async () => {
    if (!form.title.trim()) return showToast('Enter goal title')
    const milestones = form.milestones.trim()
      ? form.milestones.split('\n').filter(Boolean).map(t => ({ text: t.trim(), done: false }))
      : []
    await addGoal({ title: form.title, desc: form.desc, milestones })
    setForm({ title: '', desc: '', milestones: '' })
    setModal(false)
    showToast('Goal added! 🎯')
  }

  return (
    <div ref={pageRef} className="p-4 pb-24 w-full max-w-full md:max-w-2xl lg:max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h1 className="font-sans text-xl font-bold text-ink">Goals</h1>
        <button className="btn-gold text-sm" onClick={() => setModal(true)}>
          <FiPlus size={14} /> Add Goal
        </button>
      </div>

      {goals.length === 0 ? (
        <div className="text-center py-20 text-ink-3">
          <div className="text-5xl mb-4 opacity-30">🎯</div>
          <p className="text-sm">No goals yet. Dream big!</p>
        </div>
      ) : (
        <div ref={listRef} className="space-y-3">
          {goals.map(g => {
            const milestones = g.milestones || []
            const done = milestones.filter(m => m.done).length
            const pct  = milestones.length > 0 ? Math.round((done / milestones.length) * 100) : 0
            return (
              <div key={g.id} className="dhyan-card">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <h3 className="font-sans text-base font-semibold text-ink">{g.title}</h3>
                    {g.desc && <p className="text-[11px] text-ink-2 mt-0.5">{g.desc}</p>}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="font-sans text-xl font-bold text-gold">{pct}%</span>
                    <button onClick={() => deleteGoal(g.id)} className="text-ink-3 hover:text-coral transition-colors">
                      <FiTrash2 size={13} />
                    </button>
                  </div>
                </div>
                <div className="prog-bar mb-3">
                  <div className="prog-fill bg-gold" style={{ width: pct + '%' }} />
                </div>
                {milestones.length > 0 && (
                  <div className="space-y-0">
                    {milestones.map((m, i) => (
                      <div key={i}
                        className="flex items-center gap-3 py-2 border-b border-subtle last:border-0 cursor-pointer"
                        onClick={() => toggleMilestone(g.id, i)}>
                        <div className={`w-4 h-4 rounded-full border shrink-0 flex items-center justify-center transition-all duration-200
                          ${m.done ? 'bg-teal border-teal' : 'border-ink-3'}`}>
                          {m.done && <span className="text-bg text-[9px] font-bold">✓</span>}
                        </div>
                        <span className={`text-xs flex-1 ${m.done ? 'line-through text-ink-3' : 'text-ink-2'}`}>
                          {m.text}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      <Modal open={modal} onClose={() => setModal(false)} title="Add Goal">
        <div className="space-y-3 ">
         
          <div>
            <label className="text-[10px] text-ink-2 uppercase tracking-wider mb-1 block">Goal Title</label>
            <input className="dhyan-input" placeholder="e.g. Launch my product"
              value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} />
          </div>
          <div>
            <label className="text-[10px] text-ink-2 uppercase tracking-wider mb-1 block">Description</label>
            <input className="dhyan-input" placeholder="What does success look like?"
              value={form.desc} onChange={e => setForm(p => ({ ...p, desc: e.target.value }))} />
          </div>
          <div>
            <label className="text-[10px] text-ink-2 uppercase tracking-wider mb-1 block">
              Milestones (one per line)
            </label>
            <textarea className="dhyan-input" rows={4}
              placeholder={'Research market\nBuild MVP\nLaunch beta'}
              value={form.milestones} onChange={e => setForm(p => ({ ...p, milestones: e.target.value }))} />
          </div>
           <div className="sticky top-0 bg-bg-1 z-10 pb-3">
            <div className="flex gap-2">
              <button className="btn-gold flex-1" onClick={handleAdd}>Add Goal</button>
              <button className="btn-ghost" onClick={() => setModal(false)}>Cancel</button>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  )
}
