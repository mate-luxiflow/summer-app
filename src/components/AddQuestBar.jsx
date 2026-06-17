import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { todayISO } from '../store'

const POLARITY_OPTIONS = [
  { key: 'positive', label: 'Positive', color: '#22c55e', glow: 'rgba(34,197,94,0.25)',    bg: 'rgba(34,197,94,0.12)',    border: 'rgba(34,197,94,0.45)' },
  { key: 'neutral',  label: 'Neutral',  color: '#64748b', glow: 'rgba(100,116,139,0.18)', bg: 'rgba(100,116,139,0.10)', border: 'rgba(100,116,139,0.35)' },
  { key: 'negative', label: 'Negative', color: '#a855f7', glow: 'rgba(168,85,247,0.25)',   bg: 'rgba(168,85,247,0.12)',   border: 'rgba(168,85,247,0.45)' },
]

export default function AddQuestBar({ onAdd }) {
  const [text,     setText]     = useState('')
  const [polarity, setPolarity] = useState('neutral')
  const [isEpic,   setIsEpic]   = useState(false)
  const [dueDate,  setDueDate]  = useState('')
  const inputRef = useRef(null)

  const activePol = POLARITY_OPTIONS.find(p => p.key === polarity)

  function handleEpicToggle() {
    setIsEpic(v => {
      if (v) setDueDate('')
      return !v
    })
  }

  function submit() {
    const trimmed = text.trim()
    if (!trimmed) return

    onAdd({
      text:        trimmed,
      category:    'grind',
      priority:    'medium',
      polarity,
      isEpic,
      dueDate:     isEpic ? (dueDate || null) : null,
      createdDate: todayISO(),
    })
    setText('')
    setPolarity('neutral')
    setIsEpic(false)
    setDueDate('')
    inputRef.current?.focus()
  }

  const canSubmit = !!text.trim()

  return (
    <div className="px-4 pt-3 pb-3 border-b border-white/5">

      {/* ── Sor 1: input mező + Add gomb ─────────────────────────────────────── */}
      <div className="flex items-center gap-2.5 mb-2.5">
        <div
          className="flex-1 flex items-center gap-2 h-11 rounded-xl border px-3 transition-all duration-200"
          style={{
            borderColor: activePol ? activePol.color + '33' : 'rgba(255,255,255,0.10)',
            background:  'rgba(255,255,255,0.04)',
          }}
        >
          <input
            ref={inputRef}
            type="text"
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && submit()}
            placeholder="Add a custom quest…"
            maxLength={80}
            autoComplete="off"
            className="flex-1 min-w-0 bg-transparent text-[13px] text-white placeholder-white/20 outline-none"
            aria-label="Add new quest"
          />
        </div>

        <motion.button
          onClick={submit}
          disabled={!canSubmit}
          whileTap={{ scale: 0.88 }}
          className="shrink-0 h-11 px-4 rounded-xl flex items-center gap-1.5 font-bold text-[13px] text-white transition-all duration-200 disabled:opacity-20"
          style={{
            minWidth: '76px',
            background: canSubmit
              ? polarity === 'positive'
                ? 'linear-gradient(135deg, #22c55e, #16a34a)'
                : polarity === 'negative'
                  ? 'linear-gradient(135deg, #a855f7, #7c3aed)'
                  : 'linear-gradient(135deg, #64748b, #475569)'
              : 'rgba(255,255,255,0.07)',
            boxShadow: canSubmit
              ? polarity === 'positive'
                ? '0 2px 14px rgba(34,197,94,0.35)'
                : polarity === 'negative'
                  ? '0 2px 14px rgba(168,85,247,0.35)'
                  : '0 2px 14px rgba(100,116,139,0.25)'
              : 'none',
          }}
          aria-label="Add quest"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          <span>Add</span>
        </motion.button>
      </div>

      {/* ── Sor 1.5: Polarity Segmented Control ──────────────────────────────── */}
      <div className="flex gap-1.5 mb-2.5">
        {POLARITY_OPTIONS.map(({ key, label, color, glow, bg, border }) => {
          const isActive = polarity === key
          return (
            <motion.button
              key={key}
              onClick={() => setPolarity(key)}
              whileTap={{ scale: 0.93 }}
              className="flex-1 flex items-center justify-center gap-1.5 h-8 rounded-xl border text-[11px] font-black uppercase tracking-wider transition-all duration-150"
              style={{
                borderColor: isActive ? border : 'rgba(255,255,255,0.07)',
                background:  isActive ? bg     : 'rgba(255,255,255,0.02)',
                color:       isActive ? color  : 'rgba(255,255,255,0.25)',
                boxShadow:   isActive ? `0 0 12px ${glow}` : 'none',
                touchAction: 'manipulation',
              }}
              aria-pressed={isActive}
            >
              <span
                className="w-1.5 h-1.5 rounded-full shrink-0"
                style={{ background: color, opacity: isActive ? 1 : 0.35 }}
                aria-hidden
              />
              {label}
            </motion.button>
          )
        })}
      </div>

      {/* ── Sor 2: Epic Quest toggle + dueDate ───────────────────────────────── */}
      <div className="flex items-center gap-2">
        <motion.button
          onClick={handleEpicToggle}
          whileTap={{ scale: 0.91 }}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl border text-[10px] font-black uppercase tracking-wider transition-all duration-200"
          style={{
            borderColor: isEpic ? '#f59e0b88' : 'rgba(255,255,255,0.08)',
            background:  isEpic ? '#f59e0b18'  : 'rgba(255,255,255,0.03)',
            color:       isEpic ? '#f59e0b'    : 'rgba(255,255,255,0.25)',
            boxShadow:   isEpic ? '0 0 12px #f59e0b30' : 'none',
          }}
        >
          <span className="text-[11px]">⚡</span>
          <span>Epic Quest</span>
          <div
            className="relative w-6 h-3 rounded-full transition-all duration-200 ml-0.5"
            style={{ background: isEpic ? '#f59e0b' : 'rgba(255,255,255,0.12)' }}
          >
            <motion.div
              animate={{ x: isEpic ? 12 : 1 }}
              transition={{ type: 'spring', stiffness: 400, damping: 28 }}
              className="absolute top-0.5 w-2 h-2 rounded-full bg-white"
            />
          </div>
        </motion.button>

        <AnimatePresence>
          {isEpic && (
            <motion.div
              initial={{ opacity: 0, width: 0, x: -8 }}
              animate={{ opacity: 1, width: 'auto', x: 0 }}
              exit={{ opacity: 0, width: 0, x: -8 }}
              transition={{ duration: 0.18, ease: 'easeOut' }}
              className="overflow-hidden"
            >
              <div className="flex items-center gap-1.5 pl-1">
                <span className="text-[9px] font-bold text-white/25 uppercase tracking-wider whitespace-nowrap">Due</span>
                <input
                  type="date"
                  value={dueDate}
                  min={todayISO()}
                  onChange={e => setDueDate(e.target.value)}
                  className="h-7 rounded-lg px-2 text-[11px] font-semibold text-amber-300 outline-none border"
                  style={{
                    background:  '#f59e0b10',
                    borderColor: '#f59e0b40',
                    colorScheme: 'dark',
                    minWidth:    '130px',
                  }}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
