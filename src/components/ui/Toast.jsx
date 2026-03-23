// components/ui/Toast.jsx
export default function Toast({ msg, show }) {
  return (
    <div className={`fixed bottom-20 left-1/2 -translate-x-1/2 bg-bg-3 border border-medium
      rounded-full px-5 py-2.5 text-xs text-ink z-[300] whitespace-nowrap
      transition-all duration-300 pointer-events-none
      ${show ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'}`}>
      {msg}
    </div>
  )
}
