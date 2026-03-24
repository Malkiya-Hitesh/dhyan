// pages/Home.jsx
import { useState, useCallback } from 'react'
import { FiPlus, FiTrash2 } from 'react-icons/fi'
import { HiCheckCircle } from 'react-icons/hi'
import { BsFire } from 'react-icons/bs'
import { useApp } from '../store/AppContext'
import { calcScore, habitPct } from '../utils/score'
import { getGreeting } from '../utils/date'
import ScoreRing from '../components/ui/ScoreRing'
import Modal from '../components/ui/Modal'
import FocusTimer from '../components/FocusTimer'
import { useStaggerIn, usePageTransition } from '../hooks/useGsap'

export default function Home({ showToast }) {
  const { habits, tasks, settings, toggleHabit, addHabit, deleteHabit, saveMissReason } = useApp()
  const [habitModal, setHabitModal] = useState(false)
  const [missModal,  setMissModal]  = useState(false)
  const [pendingId,  setPendingId]  = useState(null)
  const [missText,   setMissText]   = useState('')
  const [newHabit,   setNewHabit]   = useState({ name: '', icon: '' })

  const score   = calcScore({ habits, tasks, focusMins: settings.focusMins })
  const hPct    = habitPct(habits)
  const greeting = getGreeting()
  const top3    = tasks.filter(t => t.status !== 'done')
    .sort((a, b) => ({ high: 0, medium: 1, low: 2 }[a.priority] - { high: 0, medium: 1, low: 2 }[b.priority]))
    .slice(0, 3)

  const pageRef    = usePageTransition()
  const habitRef   = useStaggerIn([habits.length])

  const handleToggle = useCallback(async (id) => {
    const h = habits.find(h => h.id === id)
    if (!h) return
    await toggleHabit(id)
    if (h.doneToday) { // was done → now undone → ask reason
      setPendingId(id)
      setMissModal(true)
    }
  }, [habits, toggleHabit])

  const handleSaveMiss = async () => {
    if (pendingId && missText.trim()) await saveMissReason(pendingId, missText.trim())
    setMissText(''); setPendingId(null); setMissModal(false)
    showToast('Stay accountable! 💪')
  }

  const handleAddHabit = async () => {
    if (!newHabit.name.trim()) return showToast('Habit name required')
    await addHabit(newHabit)
    setNewHabit({ name: '', icon: '' }); setHabitModal(false)
    showToast('Habit added! 🌱')
  }

  return (
    <div ref={pageRef} className="p-4 space-y-4 pb-24 w-full max-w-full md:max-w-2xl lg:max-w-4xl mx-auto">

      {/* Greeting */}
      <div>
        <p className="text-[11px] text-ink-2 uppercase tracking-widest">{greeting.time}</p>
        <h1 className="font-sans text-xl font-bold text-ink mt-0.5">Stay disciplined. 🔥</h1>
        <p className="text-[11px] text-ink-2 mt-0.5">
          {new Date().toLocaleDateString('en-IN', { weekday: 'long', month: 'long', day: 'numeric' })}
        </p>
      </div>

      {/* Score ring + quick stats */}
      <div className="dhyan-card">
        <div className="flex items-center justify-between">
          <ScoreRing score={score} size={140} />
          <div className="flex flex-col gap-3 flex-1 ml-4">
            <div className="bg-bg-3 rounded-xl p-3 text-center">
              <div className="font-sans text-xl font-bold text-teal">{hPct}%</div>
              <div className="text-[9px] text-ink-2 uppercase tracking-wider mt-0.5">Habits</div>
            </div>
            <div className="bg-bg-3 rounded-xl p-3 text-center">
              <div className="font-sans text-xl font-bold text-blue-400">
                {tasks.filter(t => t.status === 'done').length}
              </div>
              <div className="text-[9px] text-ink-2 uppercase tracking-wider mt-0.5">Tasks done</div>
            </div>
            <div className="bg-bg-3 rounded-xl p-3 text-center">
              <div className="font-sans text-xl font-bold text-gold">{settings.focusMins}m</div>
              <div className="text-[9px] text-ink-2 uppercase tracking-wider mt-0.5">Focus</div>
            </div>
          </div>
        </div>
      </div>

      {/* Habits */}
      <div className="dhyan-card">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="sec-title">Daily Habits</h2>
            <p className="text-[11px] text-ink-2 mt-0.5">
              {habits.filter(h => h.doneToday).length}/{habits.length} complete · {hPct}%
            </p>
          </div>
          <button className="btn-icon p-2" onClick={() => setHabitModal(true)}>
            <FiPlus size={16} />
          </button>
        </div>
        {/* Progress */}
        <div className="prog-bar mb-3">
          <div className="prog-fill bg-teal" style={{ width: hPct + '%' }} />
        </div>
        {/* List */}
        <div ref={habitRef}>
          {habits.map(h => (
            <div key={h.id} className="flex items-center gap-3 py-2.5 border-b border-subtle last:border-0">
              <button
                onClick={() => handleToggle(h.id)}
                className={`w-5 h-5 rounded-md border shrink-0 flex items-center justify-center transition-all duration-200
                  ${h.doneToday ? 'bg-teal border-teal' : 'border-ink-3'}`}
              >
                {h.doneToday && <span className="text-bg text-[11px] font-bold">✓</span>}
              </button>
              <span className="text-base shrink-0">{h.icon}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-ink">{h.name}</p>
                <p className="text-[10px] text-ink-2">{h.streak} day streak</p>
              </div>
              {h.streak >= 3 && (
                <span className="flex items-center gap-0.5 text-[10px] text-gold bg-gold-dim px-2 py-0.5 rounded-full">
                  <BsFire size={10} />{h.streak}
                </span>
              )}
              <button onClick={() => deleteHabit(h.id)} className="text-ink-3 hover:text-coral transition-colors">
                <FiTrash2 size={13} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Top 3 Focus Tasks */}
      <div className="dhyan-card">
        <h2 className="sec-title mb-3">Top 3 Focus Tasks</h2>
        {top3.length === 0 ? (
          <div className="text-center py-4">
            <HiCheckCircle size={28} className="text-teal mx-auto mb-2 opacity-50" />
            <p className="text-xs text-ink-3">All tasks done! 🎉</p>
          </div>
        ) : (
          top3.map((t, i) => (
            <div key={t.id} className="flex items-center gap-3 bg-bg-2 rounded-xl p-3 mb-2 last:mb-0">
              <span className="font-sans text-xl font-bold text-gold/30 min-w-6">{i + 1}</span>
              <span className="text-sm flex-1">{t.title}</span>
              <span className={`badge-${t.priority}`}>{t.priority}</span>
            </div>
          ))
        )}
      </div>

      {/* Focus Timer */}
      <FocusTimer showToast={showToast} />

      {/* Add Habit Modal */}
      <Modal open={habitModal} onClose={() => setHabitModal(false)} title="Add Habit">
        <div className="space-y-3">
          <div>
            <label className="form-label text-[10px] text-ink-2 uppercase tracking-wider mb-1 block">Habit Name</label>
            <input className="dhyan-input" placeholder="e.g. Morning workout"
              value={newHabit.name} onChange={e => setNewHabit(p => ({ ...p, name: e.target.value }))}
              onKeyDown={e => e.key === 'Enter' && handleAddHabit()} />
          </div>
          <div>
            <label className="form-label text-[10px] text-ink-2 uppercase tracking-wider mb-1 block">Icon (emoji)</label>
            <input className="dhyan-input" placeholder="💪" maxLength={2}
              value={newHabit.icon} onChange={e => setNewHabit(p => ({ ...p, icon: e.target.value }))} />
          </div>
             <div className="sticky top-0 bg-bg-1 z-10 pb-3">
            <div className="flex gap-2">
              <button className="btn-gold flex-1" onClick={handleAddHabit}>Add Habit</button>
              <button className="btn-ghost" onClick={() => setHabitModal(false)}>Cancel</button>
            </div>
          </div>
        </div>
      </Modal>

      {/* Miss Reason Modal */}
      <Modal open={missModal} onClose={() => setMissModal(false)} title="Why did you miss it?">
        <div className="space-y-3">
          <div className="sticky top-0 bg-bg-1 z-10 pb-3">
            <div className="flex gap-2">
              <button className="btn-gold flex-1" onClick={handleSaveMiss}>Save Reason</button>
              <button className="btn-ghost" onClick={() => { setMissModal(false); setMissText('') }}>Skip</button>
            </div>
          </div>
          <textarea className="dhyan-input" rows={3} placeholder="Be honest with yourself..."
            value={missText} onChange={e => setMissText(e.target.value)} />
        </div>
      </Modal>
    </div>
  )
}
