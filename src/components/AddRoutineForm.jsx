import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CATEGORIES, getDefaultPolarity, timeToMinutes } from '../store'

const CAT_ENTRIES = Object.entries(CATEGORIES)

export default function AddRoutineForm({ onAdd }) {
  const [name,      setName]     = useState('')
  const [category,  setCategory] = useState('productivity')
  const [startTime, setStart]    = useState('')
  const [endTime,   setEnd]      = useState('')
  const [error,     setError]    = useState('')

  const selectedCat = CATEGORIES[category]

  function handleSubmit() {
    if (!startTime || !endTime) {
      setError('Set start & end time')
      return
    }
    if (timeToMinutes(endTime) <= timeToMinutes(startTime)) {
      setError('End must be after start')
      return
    }

    setError('')
    onAdd({
      id:        `custom_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      name:      name.trim() || selectedCat?.label || 'New Block',
      category,
      polarity:  getDefaultPolarity(category),
      startTime,
      endTime,
      completed: false,
    })
    setName('')
    setStart('')
    setEnd('')
  }

  return (
    <div
      className="px-4 py-3 border-b border-white/[0.06]"
      style={{ background: 'rgba(255,255,255,0.015)' }}
    >
      {/* Section label */}
      <p className="text-[8px] font-black uppercase tracking-[0.15em] text-white/22 mb-2">
        + Add Routine Block
      </p>

      {/* ── Kategória selector — vízszintes chips ─────────────────────────── */}
      <div
        className="flex gap-1.5 overflow-x-auto mb-2.5"
        style={{ WebkitOverflowScrolling: 'touch', scrollbarWidth: 'none' }}
      >
        {CAT_ENTRIES.map(([key, cat]) => {
          const selected = category === key
          return (
            <motion.button
              key={key}
              whileTap={{ scale: 0.90 }}
              onClick={() => setCategory(key)}
              className="shrink-0 flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-semibold border transition-all duration-150"
              style={{
                borderColor: selected ? cat.accent + '60' : 'rgba(255,255,255,0.07)',
                background:  selected ? cat.accent + '18' : 'rgba(255,255,255,0.02)',
                color:       selected ? cat.accent         : 'rgba(255,255,255,0.28)',
                boxShadow:   selected ? `0 0 10px ${cat.accent}28` : 'none',
              }}
              aria-pressed={selected}
            >
              <span className="text-[11px]">{cat.icon}</span>
              <span className="whitespace-nowrap">{cat.label}</span>
            </motion.button>
          )
        })}
      </div>

      {/* ── Név + idő inputok + Add gomb ─────────────────────────────────── */}
      <div className="flex items-center gap-2">
        {/* Block neve */}
        <input
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSubmit()}
          placeholder={selectedCat?.label ?? 'Block name...'}
          maxLength={50}
          className="flex-1 min-w-0 h-9 rounded-xl px-3 text-[12px] text-white placeholder-white/22 outline-none border transition-colors duration-150 focus:border-white/22"
          style={{
            background:  'rgba(255,255,255,0.04)',
            borderColor: 'rgba(255,255,255,0.08)',
          }}
        />

        {/* Kezdő időpont */}
        <input
          type="time"
          value={startTime}
          onChange={e => { setStart(e.target.value); setError('') }}
          className="h-9 rounded-xl px-2 text-[12px] font-mono font-semibold text-white/75 outline-none border transition-colors duration-150 focus:border-white/22"
          style={{
            width:        '76px',
            background:   'rgba(255,255,255,0.04)',
            borderColor:  startTime ? (selectedCat?.accent ?? '#fff') + '40' : 'rgba(255,255,255,0.08)',
            colorScheme:  'dark',
          }}
          aria-label="Start time"
        />

        <span className="text-white/22 text-[12px] font-bold shrink-0">–</span>

        {/* Végpont */}
        <input
          type="time"
          value={endTime}
          onChange={e => { setEnd(e.target.value); setError('') }}
          className="h-9 rounded-xl px-2 text-[12px] font-mono font-semibold text-white/75 outline-none border transition-colors duration-150 focus:border-white/22"
          style={{
            width:       '76px',
            background:  'rgba(255,255,255,0.04)',
            borderColor: endTime ? (selectedCat?.accent ?? '#fff') + '40' : 'rgba(255,255,255,0.08)',
            colorScheme: 'dark',
          }}
          aria-label="End time"
        />

        {/* + Add Block gomb */}
        <motion.button
          whileTap={{ scale: 0.87 }}
          onClick={handleSubmit}
          className="shrink-0 h-9 px-3 rounded-xl flex items-center gap-1.5 font-bold text-[12px] text-white"
          style={{
            background: selectedCat
              ? `linear-gradient(135deg, ${selectedCat.accent}ee, ${selectedCat.accent}88)`
              : 'linear-gradient(135deg, #a78bfa, #7c3aed)',
            boxShadow: `0 2px 14px ${selectedCat?.accent ?? '#a78bfa'}38`,
          }}
          aria-label="Add routine block"
        >
          <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          <span className="whitespace-nowrap">Add</span>
        </motion.button>
      </div>

      {/* Validációs hiba */}
      <AnimatePresence>
        {error && (
          <motion.p
            initial={{ opacity: 0, height: 0, y: -4 }}
            animate={{ opacity: 1, height: 'auto', y: 0 }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.15 }}
            className="text-[10px] text-red-400/70 mt-1.5 overflow-hidden"
          >
            ⚠ {error}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  )
}
