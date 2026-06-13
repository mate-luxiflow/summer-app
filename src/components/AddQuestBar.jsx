import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CATEGORIES, POLARITY, getDefaultPolarity, cyclePolarity, todayISO } from '../store'

const PRESETS = Object.entries(CATEGORIES).filter(([k]) => k !== 'grind')

export default function AddQuestBar({ onAdd }) {
  const [text,     setText]     = useState('')
  // null = nincs preset kiválasztva → 'grind' fallback
  const [category, setCategory] = useState(null)
  // polarity auto-set a kategória alapján, manuálisan felülbírálható
  const [polarity, setPolarity] = useState('neutral')
  // Epic Quest toggle + due date
  const [isEpic,   setIsEpic]   = useState(false)
  const [dueDate,  setDueDate]  = useState('')
  const inputRef = useRef(null)

  function handleChipTap(key) {
    if (category === key) {
      // másodszori tapintás: deselect
      setCategory(null)
      setPolarity('neutral')
    } else {
      setCategory(key)
      setPolarity(getDefaultPolarity(key)) // auto-polarity
    }
    inputRef.current?.focus()
  }

  function handlePolarityCycle(e) {
    e.stopPropagation()
    setPolarity(prev => cyclePolarity(prev))
  }

  function handleEpicToggle() {
    setIsEpic(v => {
      if (v) setDueDate('') // reset dueDate when turning off
      return !v
    })
  }

  function submit() {
    const trimmed = text.trim()
    if (!trimmed && !category) return

    const cat  = category ?? 'grind'
    const name = trimmed || CATEGORIES[cat].label

    onAdd({
      text: name,
      category: cat,
      priority: 'medium',
      polarity,
      isEpic,
      dueDate:     isEpic ? (dueDate || null) : null,
      createdDate: todayISO(),
    })
    setText('')
    setCategory(null)
    setPolarity('neutral')
    setIsEpic(false)
    setDueDate('')
    inputRef.current?.focus()
  }

  const selectedCat = category ? CATEGORIES[category] : null
  const canSubmit   = !!(text.trim() || category)
  const pol         = POLARITY[polarity]

  return (
    <div className="px-4 pt-3 pb-3 border-b border-white/5">

      {/* ── Sor 1: input mező + Add gomb (jobb hüvelyk zóna) ─────────────── */}
      <div className="flex items-center gap-2.5 mb-2.5">

        {/* Input konténer — kategória badge + polarity dot + szöveges mező */}
        <div
          className="flex-1 flex items-center gap-2 h-11 rounded-xl border px-3 transition-all duration-200"
          style={{
            borderColor: selectedCat
              ? selectedCat.accent + '55'
              : pol.color + '33',
            background: selectedCat
              ? selectedCat.accent + '0a'
              : 'rgba(255,255,255,0.04)',
          }}
        >
          {/* Kategória badge — animált megjelenés */}
          <AnimatePresence mode="wait">
            {selectedCat && (
              <motion.div
                key={category}
                initial={{ opacity: 0, scale: 0.75 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.75 }}
                transition={{ duration: 0.15, ease: 'easeOut' }}
                className="shrink-0 flex items-center gap-1 px-1.5 py-0.5 rounded-md"
                style={{ background: selectedCat.accent + '22', color: selectedCat.accent }}
              >
                <span className="text-[12px] leading-none">{selectedCat.icon}</span>
                <span className="text-[10px] font-bold whitespace-nowrap">{selectedCat.label}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Polarity indikátor — mindig látható, kattintható */}
          <motion.button
            onClick={handlePolarityCycle}
            whileTap={{ scale: 0.8 }}
            className="shrink-0 flex items-center justify-center w-5 h-5 rounded-full border transition-all duration-150"
            style={{ borderColor: pol.color + '60', background: pol.bg }}
            aria-label={`Polarity: ${pol.label}. Tap to cycle.`}
            title={pol.label}
          >
            <AnimatePresence mode="wait">
              <motion.span
                key={polarity}
                initial={{ scale: 1.6, opacity: 0 }}
                animate={{ scale: 1,   opacity: 1 }}
                exit={{ scale: 0.4,    opacity: 0 }}
                transition={{ duration: 0.13 }}
                className="text-[10px] font-black leading-none select-none"
                style={{ color: pol.color }}
              >
                {pol.symbol}
              </motion.span>
            </AnimatePresence>
          </motion.button>

          <input
            ref={inputRef}
            type="text"
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && submit()}
            placeholder={
              selectedCat
                ? `Name your ${selectedCat.label} quest…`
                : 'Add a custom quest…'
            }
            maxLength={80}
            autoComplete="off"
            className="flex-1 min-w-0 bg-transparent text-[13px] text-white placeholder-white/20 outline-none"
            aria-label="Add new quest"
          />
        </div>

        {/* Jobb hüvelyk Add gomb */}
        <motion.button
          onClick={submit}
          disabled={!canSubmit}
          whileTap={{ scale: 0.88 }}
          className="shrink-0 h-11 px-4 rounded-xl flex items-center gap-1.5 font-bold text-[13px] text-white transition-all duration-200 disabled:opacity-20"
          style={{
            minWidth: '76px',
            background: canSubmit
              ? selectedCat
                ? `linear-gradient(135deg, ${selectedCat.accent}ee, ${selectedCat.accent}88)`
                : polarity === 'positive'
                  ? 'linear-gradient(135deg, #22c55e, #16a34a)'
                  : polarity === 'negative'
                    ? 'linear-gradient(135deg, #ef4444, #dc2626)'
                    : 'linear-gradient(135deg, #f97316, #ec4899)'
              : 'rgba(255,255,255,0.07)',
            boxShadow: canSubmit
              ? selectedCat
                ? `0 2px 14px ${selectedCat.accent}45`
                : '0 2px 14px rgba(249,115,22,0.35)'
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

      {/* ── Sor 1.5: Epic Quest toggle + dueDate (feltételes sor) ────────── */}
      <div className="flex items-center gap-2 mb-2.5">
        {/* Epic toggle pill */}
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
          {/* Toggle pill indicator */}
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

        {/* Due Date input — csak Epic módban látható */}
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
                    background:   '#f59e0b10',
                    borderColor:  '#f59e0b40',
                    colorScheme:  'dark',
                    minWidth:     '130px',
                  }}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Sor 2: Kategória chipek (vízszintes scroll) ────────────────────── */}
      <div
        className="flex gap-1.5 overflow-x-auto"
        style={{ WebkitOverflowScrolling: 'touch', scrollbarWidth: 'none' }}
        role="group"
        aria-label="Category presets"
      >
        {PRESETS.map(([key, cat]) => {
          const isSelected = category === key
          const autoPol = getDefaultPolarity(key)
          return (
            <motion.button
              key={key}
              onClick={() => handleChipTap(key)}
              whileTap={{ scale: 0.90 }}
              className="shrink-0 flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[11px] font-semibold border transition-all duration-150"
              style={{
                borderColor: isSelected ? cat.accent            : 'rgba(255,255,255,0.07)',
                background:  isSelected ? cat.accent + '22'     : 'rgba(255,255,255,0.03)',
                color:       isSelected ? cat.accent            : 'rgba(255,255,255,0.38)',
                boxShadow:   isSelected ? `0 0 12px ${cat.accent}38` : 'none',
              }}
              aria-pressed={isSelected}
            >
              <span className="text-[13px] leading-none">{cat.icon}</span>
              <span className="whitespace-nowrap">{cat.label}</span>
              {/* Auto-polarity kis mutató */}
              <span
                className="w-1.5 h-1.5 rounded-full shrink-0"
                style={{ background: POLARITY[autoPol].color, opacity: isSelected ? 1 : 0.4 }}
                aria-hidden
              />
            </motion.button>
          )
        })}
      </div>
    </div>
  )
}
