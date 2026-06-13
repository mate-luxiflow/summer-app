import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Dashboard from './screens/Dashboard'

function ComingSoon({ label }) {
  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center gap-3">
      <div className="text-3xl opacity-20">🚧</div>
      <p className="text-white/20 text-[13px] font-semibold uppercase tracking-widest">{label}</p>
      <p className="text-white/10 text-[11px]">Coming soon</p>
    </div>
  )
}

const TABS = [
  {
    key: 'dashboard',
    label: 'Grind',
    icon: (active) => (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={active ? 2.5 : 1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
  },
  {
    key: 'stats',
    label: 'Stats',
    icon: (active) => (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={active ? 2.5 : 1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
  },
  {
    key: 'store',
    label: 'Store',
    icon: (active) => (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={active ? 2.5 : 1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    key: 'settings',
    label: 'Settings',
    icon: (active) => (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={active ? 2.5 : 1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
]

export default function App() {
  const [activeTab,  setActiveTab]  = useState('dashboard')
  const [navHidden,  setNavHidden]  = useState(false)

  // Hide the fixed nav when the software keyboard is visible.
  // The visual viewport shrinks when the keyboard opens; if the height
  // difference exceeds 150px we treat the keyboard as open.
  useEffect(() => {
    if (!window.visualViewport) return
    const handler = () => {
      setNavHidden(window.innerHeight - window.visualViewport.height > 150)
    }
    window.visualViewport.addEventListener('resize', handler)
    return () => window.visualViewport.removeEventListener('resize', handler)
  }, [])

  return (
    // Outer wrapper grows with content — the fixed nav sits on top.
    // Bottom padding reserves the exact space the nav occupies so the last
    // scrollable element is never hidden behind it.
    <div
      className="relative min-h-screen bg-[#0a0a0f]"
      style={{ paddingBottom: 'calc(60px + env(safe-area-inset-bottom, 0px))' }}
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
          {activeTab === 'stats'     && <ComingSoon label="Analytics" />}
          {activeTab === 'store'     && <ComingSoon label="Store" />}
          {activeTab === 'settings'  && <ComingSoon label="Settings" />}
        </motion.div>
      </AnimatePresence>

      {/* Fixed bottom tab bar — slides away when keyboard is open */}
      <AnimatePresence>
        {!navHidden && (
          <motion.nav
            initial={{ y: 0 }}
            animate={{ y: 0 }}
            exit={{ y: 90 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            className="fixed bottom-0 left-0 right-0 z-50 border-t border-white/[0.06] bg-[#0a0a0f]/90 backdrop-blur-xl"
            aria-label="Main navigation"
          >
            {/* 60 px tab row */}
            <div className="h-[60px] flex items-center justify-around">
              {TABS.map(tab => {
                const isActive = activeTab === tab.key
                return (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className="flex flex-col items-center gap-0.5 px-4 py-1 transition-all duration-150 relative"
                    aria-label={tab.label}
                    aria-current={isActive ? 'page' : undefined}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="tab-indicator"
                        className="absolute -top-px left-1/2 -translate-x-1/2 w-5 h-[2px] rounded-full"
                        style={{ background: 'linear-gradient(90deg,#f97316,#ec4899)' }}
                        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                      />
                    )}
                    <span className={`transition-colors duration-150 ${isActive ? 'text-white' : 'text-white/25'}`}>
                      {tab.icon(isActive)}
                    </span>
                    <span className={`text-[9px] font-bold uppercase tracking-widest transition-colors duration-150 ${isActive ? 'text-white/70' : 'text-white/15'}`}>
                      {tab.label}
                    </span>
                  </button>
                )
              })}
            </div>

            {/* iOS home-indicator safe area */}
            <div style={{ height: 'env(safe-area-inset-bottom, 0px)' }} />
          </motion.nav>
        )}
      </AnimatePresence>
    </div>
  )
}
