import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Dashboard    from './screens/Dashboard'
import DailyRoutine from './screens/DailyRoutine'
import { useAppContext } from './context/AppContext'

function ComingSoon({ label }) {
  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center gap-3">
      <div className="text-3xl opacity-20">🚧</div>
      <p className="text-white/20 text-[13px] font-semibold uppercase tracking-widest">{label}</p>
      <p className="text-white/10 text-[11px]">Coming soon</p>
    </div>
  )
}

// ── Tab konfiguráció ───────────────────────────────────────────────────────────
const TABS = [
  {
    key: 'dashboard',
    label: 'Grind',
    icon: active => (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={active ? 2.5 : 1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
  },
  {
    key: 'routine',
    label: 'Routine',
    icon: active => (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={active ? 2.5 : 1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    key: 'stats',
    label: 'Stats',
    icon: active => (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={active ? 2.5 : 1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
  },
  {
    key: 'store',
    label: 'Store',
    icon: active => (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={active ? 2.5 : 1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    key: 'settings',
    label: 'Settings',
    icon: active => (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={active ? 2.5 : 1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
]

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard')
  const [navHidden, setNavHidden] = useState(false)
  const { toast, dismissToast } = useAppContext()

  // Auto-dismiss toast after 5 s
  useEffect(() => {
    if (!toast) return
    const id = setTimeout(dismissToast, 5000)
    return () => clearTimeout(id)
  }, [toast, dismissToast])

  // Szoftveres billentyűzet detektálása — fixált nav eltüntetése gépeléskor
  useEffect(() => {
    if (!window.visualViewport) return
    const handler = () => {
      setNavHidden(window.innerHeight - window.visualViewport.height > 150)
    }
    window.visualViewport.addEventListener('resize', handler)
    return () => window.visualViewport.removeEventListener('resize', handler)
  }, [])

  return (
    <div
      className="relative min-h-screen bg-[#0a0a0f]"
      style={{ paddingBottom: 'calc(64px + env(safe-area-inset-bottom, 0px))' }}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
        >
          {activeTab === 'dashboard' && <Dashboard />}
          {activeTab === 'routine'   && <DailyRoutine />}
          {activeTab === 'stats'     && <ComingSoon label="Analytics" />}
          {activeTab === 'store'     && <ComingSoon label="Store" />}
          {activeTab === 'settings'  && <ComingSoon label="Settings" />}
        </motion.div>
      </AnimatePresence>

      {/* Fixált bottom navigation */}
      <AnimatePresence>
        {!navHidden && (
          <motion.nav
            initial={{ y: 0 }}
            animate={{ y: 0 }}
            exit={{ y: 90 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            className="fixed bottom-0 left-0 right-0 z-50 border-t border-white/6 bg-[#0a0a0f]/90 backdrop-blur-xl"
            aria-label="Main navigation"
          >
            <div className="h-16 flex items-center justify-around px-1">
              {TABS.map(tab => {
                const isActive = activeTab === tab.key
                return (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className="flex flex-col items-center gap-0.5 px-3 py-1 transition-all duration-150 relative"
                    aria-label={tab.label}
                    aria-current={isActive ? 'page' : undefined}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="tab-indicator"
                        className="absolute -top-px left-1/2 -translate-x-1/2 w-5 h-0.5 rounded-full"
                        style={{ background: 'linear-gradient(90deg,#f97316,#ec4899)' }}
                        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                      />
                    )}
                    <span className={`transition-colors duration-150 ${isActive ? 'text-white' : 'text-white/25'}`}>
                      {tab.icon(isActive)}
                    </span>
                    <span className={`text-[8px] font-bold uppercase tracking-widest transition-colors duration-150 ${
                      isActive ? 'text-white/70' : 'text-white/15'
                    }`}>
                      {tab.label}
                    </span>
                  </button>
                )
              })}
            </div>

            {/* iOS home indicator safe area */}
            <div style={{ height: 'env(safe-area-inset-bottom, 0px)' }} />
          </motion.nav>
        )}
      </AnimatePresence>

      {/* Auto-claim toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            key="autoclaim-toast"
            initial={{ opacity: 0, y: -20, scale: 0.94 }}
            animate={{ opacity: 1, y: 0,   scale: 1    }}
            exit={{ opacity: 0,    y: -14, scale: 0.96 }}
            transition={{ duration: 0.30, ease: [0.16, 1, 0.3, 1] }}
            onClick={dismissToast}
            className="fixed inset-x-4 z-90 flex items-center gap-3 rounded-2xl px-4 py-3 cursor-pointer"
            style={{
              top: 'calc(env(safe-area-inset-top, 0px) + 10px)',
              maxWidth: 400,
              margin: '0 auto',
              background: 'linear-gradient(135deg, #0c1f0e 0%, #080f09 100%)',
              border: '1px solid rgba(34,197,94,0.35)',
              boxShadow: '0 8px 36px rgba(0,0,0,0.72), 0 0 24px rgba(34,197,94,0.10)',
            }}
            role="alert"
            aria-live="polite"
          >
            <div
              className="shrink-0 w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.30)' }}
            >
              <span className="text-base leading-none select-none">✅</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[9px] font-black uppercase tracking-[0.14em] text-green-400/65 mb-0.5">Auto-Claim</p>
              <p className="text-[12px] font-semibold text-white/78 leading-snug">{toast}</p>
            </div>
            <button
              onClick={e => { e.stopPropagation(); dismissToast() }}
              className="shrink-0 flex items-center justify-center w-7 h-7 rounded-full"
              style={{ color: 'rgba(255,255,255,0.22)' }}
              aria-label="Dismiss notification"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
