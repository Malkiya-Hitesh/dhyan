// pages/Notes.jsx
import { useState } from 'react'
import { FiPlus, FiTrash2 } from 'react-icons/fi'
import { useApp } from '../store/AppContext'
import Modal from '../components/ui/Modal'
import { useStaggerIn, usePageTransition } from '../hooks/useGsap'

const TAG_FILTERS = ['all', '#ideas', '#mistakes', '#wins', '#goals', '#reflection']

function extractTags(content = '') {
  return content.match(/#\w+/g) || []
}

export default function Notes({ showToast }) {
  const { notes, addNote, deleteNote } = useApp()
  const [tagFilter, setTagFilter] = useState('all')
  const [modal,     setModal]     = useState(false)
  const [form,      setForm]      = useState({ title: '', content: '' })
  const [reflection, setReflection] = useState('')

  const pageRef = usePageTransition()
  const listRef = useStaggerIn([notes.length, tagFilter])

  const filtered = tagFilter === 'all'
    ? notes
    : notes.filter(n => extractTags(n.content).includes(tagFilter))

  const handleAdd = async () => {
    if (!form.title.trim() && !form.content.trim()) return showToast('Write something first')
    await addNote({ title: form.title || 'Untitled', content: form.content })
    setForm({ title: '', content: '' })
    setModal(false)
    showToast('Note saved! 📝')
  }

  const handleReflection = async () => {
    if (!reflection.trim()) return showToast('Write your reflection first')
    await addNote({ title: 'Daily Reflection', content: reflection + ' #reflection' })
    setReflection('')
    showToast('Reflection saved ✓')
  }

  return (
    <div ref={pageRef} className="p-4 pb-24 w-full max-w-full md:max-w-2xl lg:max-w-4xl mx-auto">

      {/* Daily Reflection */}
      <div className="dhyan-card mb-4">
        <h2 className="sec-title mb-3">Daily Reflection</h2>
        <textarea className="dhyan-input" rows={3}
          placeholder="How was today? What did you learn?..."
          value={reflection} onChange={e => setReflection(e.target.value)} />
        <button className="btn-ghost w-full mt-2 justify-center" onClick={handleReflection}>
          Save Reflection ✓
        </button>
      </div>

      {/* Notes header */}
      <div className="flex items-center justify-between mb-3">
        <h1 className="font-sans text-xl font-bold text-ink">Notes</h1>
        <button className="btn-gold text-sm" onClick={() => setModal(true)}>
          <FiPlus size={14} /> Add Note
        </button>
      </div>

      {/* Tag filters */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-4">
        {TAG_FILTERS.map(tag => (
          <button key={tag} onClick={() => setTagFilter(tag)}
            className={`px-3 py-1.5 rounded-full text-[11px] border whitespace-nowrap shrink-0 transition-all duration-200
              ${tagFilter === tag
                ? 'bg-[rgba(167,139,250,0.12)] text-purple-400 border-purple-400/30'
                : 'border-subtle text-ink-2 hover:text-ink'}`}>
            {tag}
          </button>
        ))}
      </div>

      {/* Notes list */}
      {filtered.length === 0 ? (
        <div className="text-center py-12 text-ink-3">
          <div className="text-4xl mb-3 opacity-40">📝</div>
          <p className="text-sm">No notes yet</p>
        </div>
      ) : (
        <div ref={listRef} className="space-y-2">
          {[...filtered].reverse().map(n => {
            const tags    = extractTags(n.content)
            const dateStr = new Date(n.createdAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })
            return (
              <div key={n.id} className="dhyan-card">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3 className="text-sm font-medium text-ink">{n.title}</h3>
                  <button onClick={() => deleteNote(n.id)} className="text-ink-3 hover:text-coral transition-colors shrink-0">
                    <FiTrash2 size={13} />
                  </button>
                </div>
                <p className="text-xs text-ink-2 leading-relaxed mb-2 whitespace-pre-wrap break-words">
                  {n.content}
                </p>
                <div className="flex gap-1.5 flex-wrap items-center">
                  {tags.map(t => (
                    <span key={t} className="text-[10px] text-purple-400 bg-[rgba(167,139,250,0.1)] px-2 py-0.5 rounded-full">
                      {t}
                    </span>
                  ))}
                  <span className="text-[10px] text-ink-3 ml-auto">{dateStr}</span>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Add Note Modal */}
      <Modal open={modal} onClose={() => setModal(false)} title="Add Note">
        <div className="space-y-3">
          <div>
            <label className="text-[10px] text-ink-2 uppercase tracking-wider mb-1 block">Title</label>
            <input className="dhyan-input" placeholder="Note title..."
              value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} />
          </div>
          <div>
            <label className="text-[10px] text-ink-2 uppercase tracking-wider mb-1 block">
              Content (use #tags like #ideas #mistakes)
            </label>
            <textarea className="dhyan-input" rows={5}
              placeholder="Your thoughts... #ideas"
              value={form.content} onChange={e => setForm(p => ({ ...p, content: e.target.value }))} />
          </div>
          <div className="sticky top-0 bg-bg-1 z-10 pb-3">
            <div className="flex gap-2">
              <button className="btn-gold flex-1" onClick={handleAdd}>Save Note</button>
              <button className="btn-ghost" onClick={() => setModal(false)}>Cancel</button>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  )
}
