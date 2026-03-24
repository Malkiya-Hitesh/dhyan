// pages/Notes.jsx
import { useState } from 'react'
import { FiPlus, FiTrash2, FiBookOpen } from 'react-icons/fi'
import { useApp } from '../store/AppContext'
import Modal from '../components/ui/Modal'
import { useStaggerIn, usePageTransition } from '../hooks/useGsap'

// Golden ratio type scale (base 13px × 1.618)
// 10px — labels / meta
// 13px — body / primary content
// 21px — section headers
// 34px — hero numbers

const TAG_FILTERS = ['all', '#ideas', '#mistakes', '#wins', '#goals', '#reflection']

const TAG_COLORS = {
  '#ideas':      { bg: 'rgba(96,165,250,0.1)',   text: '#60a5fa' },
  '#mistakes':   { bg: 'rgba(255,107,107,0.1)',  text: '#ff6b6b' },
  '#wins':       { bg: 'rgba(78,204,163,0.1)',   text: '#4ecca3' },
  '#goals':      { bg: 'rgba(232,197,71,0.1)',   text: '#e8c547' },
  '#reflection': { bg: 'rgba(167,139,250,0.1)',  text: '#a78bfa' },
}

function extractTags(content = '') {
  return content.match(/#\w+/g) || []
}

function TagPill({ tag }) {
  const c = TAG_COLORS[tag] || { bg: 'rgba(255,255,255,0.06)', text: '#7a7060' }
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full"
      style={{ fontSize: '10px', background: c.bg, color: c.text, fontWeight: 600 }}>
      {tag}
    </span>
  )
}

function NoteCard({ n, onDelete }) {
  const tags    = extractTags(n.content)
  const dateStr = new Date(n.createdAt).toLocaleDateString('en-IN', {
    month: 'short', day: 'numeric'
  })
  // Strip tags from display content for cleaner reading
  const cleanContent = n.content.replace(/#\w+/g, '').trim()

  return (
    <div className="group bg-bg-1 border border-subtle rounded-2xl p-4 mb-2.5
      transition-all duration-200 hover:border-medium">

      {/* Title + delete */}
      <div className="flex items-start justify-between gap-3 mb-2">
        <h3 className="font-sans font-semibold text-ink leading-snug"
          style={{ fontSize: '14px' }}>
          {n.title}
        </h3>
        <button onClick={() => onDelete(n.id)}
          className="shrink-0 text-ink-3 opacity-0 group-hover:opacity-100
            hover:text-coral transition-all duration-150 mt-0.5">
          <FiTrash2 size={13} />
        </button>
      </div>

      {/* Content — 13px, golden ratio line-height */}
      {cleanContent && (
        <p className="text-ink-2 leading-relaxed mb-3 whitespace-pre-wrap break-words"
          style={{ fontSize: '13px', lineHeight: '1.618' }}>
          {cleanContent}
        </p>
      )}

      {/* Footer: tags + date */}
      <div className="flex items-center gap-1.5 flex-wrap">
        {tags.map(t => <TagPill key={t} tag={t} />)}
        <span className="text-ink-3 ml-auto" style={{ fontSize: '10px' }}>{dateStr}</span>
      </div>
    </div>
  )
}

export default function Notes({ showToast }) {
  const { notes, addNote, deleteNote } = useApp()
  const [tagFilter,   setTagFilter]   = useState('all')
  const [modal,       setModal]       = useState(false)
  const [form,        setForm]        = useState({ title: '', content: '' })
  const [reflection,  setReflection]  = useState('')

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
    showToast('Note saved 📝')
  }

  const handleReflection = async () => {
    if (!reflection.trim()) return showToast('Write your reflection first')
    await addNote({ title: 'Daily Reflection', content: reflection + ' #reflection' })
    setReflection('')
    showToast('Reflection saved ✓')
  }

  return (
    <div ref={pageRef} className="p-4 pb-28 w-full max-w-lg mx-auto">

      {/* Header */}
      <div className="flex items-end justify-between mb-5">
        <div>
          <h1 className="font-sans font-bold text-ink leading-none"
            style={{ fontSize: '21px' }}>Notes</h1>
          <p className="text-ink-2 mt-1 uppercase tracking-widest"
            style={{ fontSize: '10px' }}>
            {notes.length} {notes.length === 1 ? 'NOTE' : 'NOTES'}
          </p>
        </div>
        <button
          onClick={() => setModal(true)}
          className="flex items-center gap-1.5 bg-gold text-bg font-sans font-semibold
            px-4 py-2 rounded-xl hover:brightness-110 active:scale-95 transition-all duration-150"
          style={{ fontSize: '12px' }}>
          <FiPlus size={13} /> New Note
        </button>
      </div>

      {/* Daily Reflection — compact, focused */}
      <div className="bg-bg-1 border border-subtle rounded-2xl p-4 mb-5">
        <p className="font-sans font-semibold text-ink mb-3"
          style={{ fontSize: '13px', letterSpacing: '0.01em' }}>
          Today's Reflection
        </p>
        <textarea
          className="w-full bg-bg-3 border border-subtle rounded-xl px-3 py-2.5
            text-ink outline-none focus:border-gold/40 placeholder:text-ink-3
            transition-colors duration-200 resize-none"
          style={{ fontSize: '13px', lineHeight: '1.618' }}
          rows={3}
          placeholder="How was today? What did you learn? What will you do differently?"
          value={reflection}
          onChange={e => setReflection(e.target.value)}
        />
        <button
          onClick={handleReflection}
          className="mt-2.5 w-full flex items-center justify-center gap-2
            bg-bg-3 border border-subtle text-ink-2 rounded-xl py-2
            hover:text-ink hover:border-medium transition-all duration-150"
          style={{ fontSize: '12px' }}>
          Save reflection ✓
        </button>
      </div>

      {/* Tag filter pills */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 mb-4 scrollbar-hide">
        {TAG_FILTERS.map(tag => {
          const c    = TAG_COLORS[tag]
          const isOn = tagFilter === tag
          return (
            <button key={tag} onClick={() => setTagFilter(tag)}
              className="px-3 py-1.5 rounded-full border whitespace-nowrap shrink-0 font-medium
                transition-all duration-200"
              style={{
                fontSize: '11px',
                background: isOn && c ? c.bg : 'transparent',
                color:      isOn ? (c ? c.text : '#e8c547') : '#7a7060',
                borderColor: isOn ? (c ? c.text + '44' : 'rgba(232,197,71,0.3)') : 'rgba(255,255,255,0.07)',
              }}>
              {tag}
            </button>
          )
        })}
      </div>

      {/* Notes list */}
      {filtered.length === 0 ? (
        <div className="text-center py-16">
          <FiBookOpen size={36} className="mx-auto text-ink-3 opacity-20 mb-4" />
          <p className="text-ink-3" style={{ fontSize: '13px' }}>
            {tagFilter === 'all' ? 'No notes yet.' : `No notes tagged ${tagFilter}`}
          </p>
          {tagFilter === 'all' && (
            <button onClick={() => setModal(true)}
              className="mt-3 text-gold underline underline-offset-4"
              style={{ fontSize: '13px' }}>
              Write your first note →
            </button>
          )}
        </div>
      ) : (
        <div ref={listRef}>
          {[...filtered].reverse().map(n => (
            <NoteCard key={n.id} n={n} onDelete={deleteNote} />
          ))}
        </div>
      )}

      {/* Add Note Modal */}
      <Modal open={modal} onClose={() => setModal(false)} title="New Note">
        <div className="space-y-4">
          <div>
            <label className="block text-ink-2 mb-1.5 uppercase tracking-widest"
              style={{ fontSize: '10px' }}>Title</label>
            <input className="dhyan-input" placeholder="Note title..."
              style={{ fontSize: '13px' }}
              value={form.title}
              onChange={e => setForm(p => ({ ...p, title: e.target.value }))} />
          </div>

          <div>
            <label className="block text-ink-2 mb-1.5 uppercase tracking-widest"
              style={{ fontSize: '10px' }}>Content — use #tags to organize</label>
            <textarea className="dhyan-input" rows={6}
              style={{ fontSize: '13px', lineHeight: '1.618' }}
              placeholder="Your thoughts... #ideas"
              value={form.content}
              onChange={e => setForm(p => ({ ...p, content: e.target.value }))} />
            {/* Live tag preview */}
            {extractTags(form.content).length > 0 && (
              <div className="flex gap-1.5 flex-wrap mt-2">
                {extractTags(form.content).map(t => <TagPill key={t} tag={t} />)}
              </div>
            )}
          </div>

          <div className="flex gap-2 pt-1">
            <button className="btn-gold flex-1" style={{ fontSize: '13px' }} onClick={handleAdd}>
              Save Note
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