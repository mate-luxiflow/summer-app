import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAppContext } from '../context/AppContext'

// ── Internal slider — always dark (modal has fixed dark bg) ───────────────────
function Slider({ label, value, onChange, colorFrom, colorTo }) {
  const pct = (value / 10) * 100

  return (
    <div className="mb-5">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[12px] font-semibold" style={{ color: 'rgba(255,255,255,0.58)' }}>
          {label}
        </span>
        <span
          className="text-[18px] font-black tabular-nums leading-none"
          style={{
            background: `linear-gradient(90deg, ${colorFrom}, ${colorTo})`,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          {value}
          <span className="text-[11px] font-bold" style={{ opacity: 0.5 }}>/10</span>
        </span>
      </div>

      <div className="relative h-10 flex items-center">
        <div
          className="absolute left-0 right-0 h-[5px] rounded-full"
          style={{ background: 'rgba(255,255,255,0.10)' }}
        />
        <div
          className="absolute left-0 h-[5px] rounded-full transition-all duration-100"
          style={{
            width: `${pct}%`,
            background: `linear-gradient(90deg, ${colorFrom}, ${colorTo})`,
            boxShadow: pct > 0 ? `0 0 10px ${colorTo}60` : 'none',
          }}
        />
        <input
          type="range"
          min={0}
          max={10}
          step={1}
          value={value}
          onChange={e => onChange(Number(e.target.value))}
          className="absolute left-0 right-0 w-full h-10 opacity-0 cursor-pointer"
          style={{ touchAction: 'none' }}
        />
        <div
          className="absolute w-5 h-5 rounded-full shadow-lg transition-all duration-100 pointer-events-none"
          style={{
            left: `calc(${pct}% - 10px)`,
            background: `linear-gradient(135deg, ${colorFrom}, ${colorTo})`,
            boxShadow: `0 0 14px ${colorTo}70`,
            border: '2px solid rgba(255,255,255,0.22)',
          }}
        />
      </div>

      <div className="flex justify-between mt-0.5 px-0.5">
        {[0, 2, 4, 6, 8, 10].map(n => (
          <span key={n} className="text-[8px] font-bold tabular-nums" style={{ color: 'rgba(255,255,255,0.20)' }}>
            {n}
          </span>
        ))}
      </div>
    </div>
  )
}

// ── CheckInModal ──────────────────────────────────────────────────────────────
export default function CheckInModal({ visible, onDismiss }) {
  const { saveMoodCheckin, t } = useAppContext()
  const [mood,  setMood]  = useState(5)
  const [focus, setFocus] = useState(5)

  const handleSubmit = useCallback(() => {
    saveMoodCheckin(mood, focus)
    // saveMoodCheckin closes the modal via context (setShowCheckInModal(false))
  }, [mood, focus, saveMoodCheckin])

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.22 }}
          className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center"
          style={{ background: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(6px)' }}
          onClick={onDismiss}
        >
          <motion.div
            initial={{ y: 88, opacity: 0 }}
            animate={{ y: 0,  opacity: 1 }}
            exit={{ y: 72,   opacity: 0 }}
            transition={{ type: 'spring', stiffness: 340, damping: 28, mass: 0.8 }}
            className="w-full max-w-sm mx-4 rounded-3xl p-6"
            style={{
              marginBottom: 'calc(env(safe-area-inset-bottom, 0px) + 20px)',
              background:   'linear-gradient(145deg, #0e0e1a 0%, #08080f 100%)',
              border:       '1px solid rgba(255,255,255,0.10)',
              boxShadow:    '0 28px 80px rgba(0,0,0,0.88), 0 0 0 1px rgba(255,255,255,0.04)',
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-start justify-between mb-6">
              <div>
                <p
                  className="text-[9px] font-black uppercase tracking-[0.22em] mb-1"
                  style={{
                    background: 'linear-gradient(90deg, #f97316, #ec4899)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                  }}
                >
                  Daily Check-in
                </p>
                <h2 className="text-[20px] font-black text-white leading-tight">
                  {t('sectionCheckin')}
                </h2>
              </div>

              <button
                onClick={onDismiss}
                className="mt-0.5 w-8 h-8 flex items-center justify-center rounded-full transition-opacity"
                style={{ background: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.42)' }}
                aria-label="Dismiss"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <Slider
              label={t('moodLabel')}
              value={mood}
              onChange={setMood}
              colorFrom="#f97316"
              colorTo="#ec4899"
            />
            <Slider
              label={t('focusLabel')}
              value={focus}
              onChange={setFocus}
              colorFrom="#3b82f6"
              colorTo="#06b6d4"
            />

            <motion.button
              whileTap={{ scale: 0.96 }}
              onClick={handleSubmit}
              className="w-full py-4 rounded-2xl font-black text-[14px] text-white mt-2"
              style={{
                background:  'linear-gradient(135deg, #f97316, #ec4899)',
                boxShadow:   '0 4px 24px rgba(249,115,22,0.36)',
                touchAction: 'manipulation',
              }}
            >
              {t('saveCheckin')}
            </motion.button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
