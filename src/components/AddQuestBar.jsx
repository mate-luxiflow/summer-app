import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CATEGORIES } from '../store'

// All 8 preset categories in display order (exclude 'grind' — that's the custom fallback)
const PRESETS = Object.entries(CATEGORIES).filter(([k]) => k !== 'grind')

export default function AddQuestBar({ onAdd }) {
  const [text,     setText]     = useState('')
  const [category, setCategory] = useState(null) // null = no preset selected → falls back to 'grind'
  const inputRef = useRef(null)

  function handleChipTap(key) {
    // Toggle: second tap on the same chip deselects it
    setCategory(prev => (prev === key ? null : key))
    inputRef.current?.focus()
  }

  function submit() {
    const trimmed = text.trim()
    if (!trimmed && !category) return

    const cat  = category ?? 'grind'
    // If user selected a preset but left the name blank, use the category label as the task name
    const name = trimmed || CATEGORIES[cat].label

    onAdd({ text: name, category: cat, priority: 'medium' })
    setText('')
    setCategory(null)
    inputRef.current?.focus()
  }

  const selectedCat = category ? CATEGORIES[category] : null
  const canSubmit   = !!(text.trim() || category)

  return (
    <div className="px-4 pt-3 pb-3 border-b border-white/5">

      {/* ── Row 1: fake-input + right-thumb Add button ───────────────────── */}
      <div className="flex items-center gap-2.5 mb-2.5">

        {/* Fake input container — flex row so the badge and <input> share the same
            visual box. Border color shifts to the active preset's accent. */}
        <div
          className="flex-1 flex items-center gap-2 h-11 rounded-xl border px-3 transition-all duration-200"
          style={{
            borderColor: selectedCat
              ? selectedCat.accent + '55'
              : 'rgba(255,255,255,0.08)',
            background: selectedCat
              ? selectedCat.accent + '0a'
              : 'rgba(255,255,255,0.04)',
          }}
        >
          {/* Category badge — animates in/out when a preset is toggled */}
          <AnimatePresence mode="wait">
            {selectedCat && (
              <motion.div
                key={category}
                initial={{ opacity: 0, scale: 0.75 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.75 }}
                transition={{ duration: 0.15, ease: 'easeOut' }}
                className="shrink-0 flex items-center gap-1 px-1.5 py-0.5 rounded-md"
                style={{
                  background: selectedCat.accent + '22',
                  color:      selectedCat.accent,
                }}
              >
                <span className="text-[12px] leading-none">{selectedCat.icon}</span>
                <span className="text-[10px] font-bold whitespace-nowrap">{selectedCat.label}</span>
              </motion.div>
            )}
          </AnimatePresence>

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

        {/* Right-thumb premium Add button ─────────────────────────────────
            Positioned on the far right for one-handed reachability.
            Color: preset accent gradient when category selected,
                   brand orange-pink when custom text only,
                   dim ghost when nothing entered. */}
        <motion.button
          onClick={submit}
          disabled={!canSubmit}
          whileTap={{ scale: 0.88 }}
          className="shrink-0 h-11 px-4 rounded-xl flex items-center gap-1.5 font-bold text-[13px] text-white transition-all duration-200 disabled:opacity-20"
          style={{
            minWidth: '80px',
            background: canSubmit
              ? selectedCat
                ? `linear-gradient(135deg, ${selectedCat.accent}ee, ${selectedCat.accent}88)`
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

      {/* ── Row 2: Preset category chips (horizontal scroll) ─────────────── */}
      <div
        className="flex gap-1.5 overflow-x-auto"
        style={{ WebkitOverflowScrolling: 'touch', scrollbarWidth: 'none' }}
        role="group"
        aria-label="Category presets"
      >
        {PRESETS.map(([key, cat]) => {
          const isSelected = category === key
          return (
            <motion.button
              key={key}
              onClick={() => handleChipTap(key)}
              whileTap={{ scale: 0.90 }}
              className="shrink-0 flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[11px] font-semibold border transition-all duration-150"
              style={{
                borderColor: isSelected ? cat.accent          : 'rgba(255,255,255,0.07)',
                background:  isSelected ? cat.accent + '22'   : 'rgba(255,255,255,0.03)',
                color:       isSelected ? cat.accent          : 'rgba(255,255,255,0.38)',
                boxShadow:   isSelected ? `0 0 12px ${cat.accent}38` : 'none',
              }}
              aria-pressed={isSelected}
            >
              <span className="text-[13px] leading-none">{cat.icon}</span>
              <span className="whitespace-nowrap">{cat.label}</span>
            </motion.button>
          )
        })}
      </div>
    </div>
  )
}
