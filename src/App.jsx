// App.jsx
import { useState, useEffect, useRef } from 'react'
import { AppProvider, useApp } from './store/AppContext'
import TopNav       from './components/TopNav'
import BottomNav    from './components/BottomNav'
import Toast        from './components/ui/Toast'
import Home         from './pages/Home'
import Tasks        from './pages/Tasks'
import Dashboard    from './pages/Dashboard'
import Goals        from './pages/Goals'
import Notes        from './pages/Notes'
import InfinityTimer from './pages/InfinityTimer'
import { useToast } from './hooks/useToast'

function AppInner() {
  const { loading } = useApp()
  const [page, setPage] = useState('home')
  const [installReady, setInstallReady] = useState(false)
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const { toast, showToast } = useToast()
  const deferredPromptRef = useRef(null)

  useEffect(() => {
    const onBeforeInstallPrompt = (e) => {
      e.preventDefault()
      deferredPromptRef.current = e
      setInstallReady(true)
    }
    const onAppInstalled = () => { setInstallReady(false); showToast('Dhyan installed!') }
    const onOnline  = () => setIsOnline(true)
    const onOffline = () => setIsOnline(false)

    window.addEventListener('beforeinstallprompt', onBeforeInstallPrompt)
    window.addEventListener('appinstalled', onAppInstalled)
    window.addEventListener('online',  onOnline)
    window.addEventListener('offline', onOffline)

    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstallPrompt)
      window.removeEventListener('appinstalled', onAppInstalled)
      window.removeEventListener('online',  onOnline)
      window.removeEventListener('offline', onOffline)
    }
  }, [showToast])

  const handleInstall = async () => {
    const promptEvent = deferredPromptRef.current
    if (!promptEvent) return
    promptEvent.prompt()
    const { outcome } = await promptEvent.userChoice
    if (outcome === 'accepted') showToast('App installed!')
    deferredPromptRef.current = null
    setInstallReady(false)
  }

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center bg-bg">
        <div className="text-center">
          <div className="font-sans text-3xl font-bold text-gold mb-2">Dhyan</div>
          <div className="text-xs text-ink-2 animate-pulse">Loading...</div>
        </div>
      </div>
    )
  }

  const pages = {
    home: Home, tasks: Tasks, dashboard: Dashboard,
    goals: Goals, notes: Notes, infinity: InfinityTimer,
  }
  const ActivePage = pages[page] || Home

  return (
    <div className="h-full flex flex-col overflow-hidden bg-bg text-ink">
      <TopNav isOnline={isOnline} />
      {installReady && (
        <div className="bg-gold-dim border-b border-gold/20 px-4 py-2 flex items-center justify-between">
          <p className="text-xs text-ink">
            <span className="text-gold font-medium">Install Dhyan</span> for offline access
          </p>
          <button onClick={handleInstall}
            className="text-[11px] bg-gold text-bg font-semibold px-3 py-1 rounded-full">
            Install
          </button>
        </div>
      )}
      <main className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden scrolling-touch relative z-10">
        <ActivePage showToast={showToast} />
      </main>
      <BottomNav active={page} onChange={setPage} />
      <Toast msg={toast.msg} show={toast.show} />
    </div>
  )
}

export default function App() {
  return (
    <AppProvider>
      <AppInner />
    </AppProvider>
  )
}