import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CATEGORIES, getDefaultPolarity, timeToMinutes } from '../store'

const CAT_ENTRIES = Object.entries(CATEGORIES)

const DAY_PRESETS = [
  { key: 'everyday', label: 'Everyday', days: [0, 1, 2, 3, 4, 5, 6] },
  { key: 'weekdays', label: 'Weekdays', days: [1, 2, 3, 4, 5] },
  { key: 'custom',   label: 'Custom',   days: null },
]
const DAY_CHIP_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S']

export default function AddRoutineForm({
  onAdd, onAddRecurring,
  editingBlock, onExitEdit, onUpdate,
}) {
  const [name,        setName]       = useState('')
  const [category,    setCategory]   = useState('productivity')
  const [startTime,   setStart]      = useState('')
  const [endTime,     setEnd]        = useState('')
  const [error,       setError]      = useState('')
  const [isRecurring, setIsRecurring] = useState(false)
  const [dayPreset,   setDayPreset]  = useState('everyday')
  const [selectedDays, setSelectedDays] = useState([0, 1, 2, 3, 4, 5, 6])

  const isEditMode  = !!editingBlock
  const selectedCat = CATEGORIES[category]

  // Pre-populate all fields when editingBlock changes
  useEffect(() => {
    if (!editingBlock) {
      setName('')
      setCategory('productivity')
      setStart('')
      setEnd('')
      setError('')
      setIsRecurring(false)
      setDayPreset('everyday')
      setSelectedDays([0, 1, 2, 3, 4, 5, 6])
      return
    }
    setName(editingBlock.name ?? '')
    setCategory(editingBlock.category ?? 'productivity')
    setStart(editingBlock.startTime ?? '')
    setEnd(editingBlock.endTime ?? '')
    setError('')
    if (editingBlock.days?.length > 0) {
      setIsRecurring(true)
      setSelectedDays(editingBlock.days)
      setDayPreset('custom')
    } else {
      setIsRecurring(false)
      setDayPreset('everyday')
      setSelectedDays([0, 1, 2, 3, 4, 5, 6])
    }
  }, [editingBlock])

  function handleDayPreset(preset) {
    setDayPreset(preset.key)
    if (preset.days !== null) setSelectedDays(preset.days)
  }

  function toggleDay(idx) {
    setDayPreset('custom')
    setSelectedDays(prev =>
      prev.includes(idx) ? prev.filter(d => d !== idx) : [...prev, idx].sort((a, b) => a - b)
    )
  }

  function handleRecurringToggle() {
    if (isEditMode) return  // recurring nature is fixed during edit
    setIsRecurring(v => !v)
    if (isRecurring) {
      setDayPreset('everyday')
      setSelectedDays([0, 1, 2, 3, 4, 5, 6])
    }
  }

  function handleSubmit() {
    if (!startTime || !endTime) { setError('Set start & end time'); return }
    if (timeToMinutes(endTime) <= timeToMinutes(startTime)) { setError('End must be after start'); return }
    if (!isEditMode && isRecurring && selectedDays.length === 0) { setError('Select at least one day'); return }
    setError('')

    if (isEditMode) {
      onUpdate?.(editingBlock.id, {
        name:      name.trim() || selectedCat?.label || 'New Block',
        category,
        startTime,
        endTime,
      })
      onExitEdit?.()
      return
    }

    const blockBase = {
      id:        `${isRecurring ? 'rec' : 'custom'}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      name:      name.trim() || selectedCat?.label || 'New Block',
      category,
      polarity:  getDefaultPolarity(category),
      startTime,
      endTime,
      completed: false,
    }

    if (isRecurring) {
      onAddRecurring?.({ ...blockBase, days: selectedDays })
    } else {
      onAdd(blockBase)
    }

    setName('')
    setStart('')
    setEnd('')
  }

  return (
    <div
      className="relative px-4 py-3 border-b border-white/6"
      style={{
        background:  isEditMode ? 'rgba(6,182,212,0.04)' : 'rgba(255,255,255,0.015)',
        borderColor: isEditMode ? 'rgba(6,182,212,0.18)' : undefined,
      }}
    >
      {/* Edit mode accent strip */}
      {isEditMode && (
        <div
          className="absolute top-0 left-0 right-0 h-0.5"
          style={{
            background: 'linear-gradient(90deg, #06b6d4, #f97316 50%, #06b6d4)',
            boxShadow:  '0 0 10px rgba(6,182,212,0.45)',
          }}
        />
      )}

      {/* Header row */}
      <div className="flex items-center justify-between mb-2">
        <p className="text-[8px] font-black uppercase tracking-[0.15em]"
          style={{ color: isEditMode ? 'rgba(6,182,212,0.65)' : 'rgba(255,255,255,0.22)' }}
        >
          {isEditMode ? '✏️ Edit Routine Block' : '+ Add Routine Block'}
        </p>
        {isEditMode && (
          <motion.button
            whileTap={{ scale: 0.88 }}
            onClick={onExitEdit}
            className="text-[10px] font-bold text-white/28 hover:text-white/55 transition-colors duration-150 flex items-center gap-1"
            style={{ touchAction: 'manipulation' }}
            aria-label="Cancel editing"
          >
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
            Cancel
          </motion.button>
        )}
      </div>

      {/* Category selector */}
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

      {/* Recurring toggle + day selector */}
      <div className="mb-2.5">
        <motion.button
          whileTap={!isEditMode ? { scale: 0.92 } : {}}
          onClick={handleRecurringToggle}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl border text-[10px] font-black uppercase tracking-wider transition-all duration-200 mb-2"
          style={{
            borderColor: isRecurring ? 'rgba(99,102,241,0.55)' : 'rgba(255,255,255,0.08)',
            background:  isRecurring ? 'rgba(99,102,241,0.14)' : 'rgba(255,255,255,0.03)',
            color:       isRecurring ? '#818cf8'                : 'rgba(255,255,255,0.25)',
            boxShadow:   isRecurring ? '0 0 12px rgba(99,102,241,0.25)' : 'none',
            opacity:     isEditMode  ? 0.6 : 1,
            cursor:      isEditMode  ? 'default' : 'pointer',
          }}
          aria-pressed={isRecurring}
          aria-disabled={isEditMode}
        >
          <span className="text-[11px]">🔁</span>
          <span>Recurring</span>
          <div
            className="relative w-6 h-3 rounded-full transition-all duration-200 ml-0.5"
            style={{ background: isRecurring ? '#6366f1' : 'rgba(255,255,255,0.12)' }}
          >
            <motion.div
              animate={{ x: isRecurring ? 12 : 1 }}
              transition={{ type: 'spring', stiffness: 420, damping: 28 }}
              className="absolute top-0.5 w-2 h-2 rounded-full bg-white"
            />
          </div>
        </motion.button>

        <AnimatePresence>
          {isRecurring && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.18, ease: 'easeOut' }}
              className="overflow-hidden"
            >
              {/* Preset chips — hidden in edit mode (days already pre-populated as custom) */}
              {!isEditMode && (
                <div className="flex gap-1.5 mb-2">
                  {DAY_PRESETS.map(preset => {
                    const active = dayPreset === preset.key
                    return (
                      <motion.button
                        key={preset.key}
                        whileTap={{ scale: 0.88 }}
                        onClick={() => handleDayPreset(preset)}
                        className="px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-all duration-150"
                        style={{
                          borderColor: active ? 'rgba(99,102,241,0.55)' : 'rgba(255,255,255,0.08)',
                          background:  active ? 'rgba(99,102,241,0.18)' : 'rgba(255,255,255,0.03)',
                          color:       active ? '#818cf8'                : 'rgba(255,255,255,0.32)',
                        }}
                        aria-pressed={active}
                      >
                        {preset.label}
                      </motion.button>
                    )
                  })}
                </div>
              )}

              {/* Day chips — always shown when recurring, interactive only in custom mode or edit mode */}
              <AnimatePresence>
                {(dayPreset === 'custom' || isEditMode) && (
                  <motion.div
                    key="custom-days"
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.15 }}
                    className="flex gap-1.5"
                  >
                    {DAY_CHIP_LABELS.map((label, idx) => {
                      const active = selectedDays.includes(idx)
                      return (
                        <motion.button
                          key={idx}
                          whileTap={isEditMode ? {} : { scale: 0.82 }}
                          onClick={() => !isEditMode && toggleDay(idx)}
                          className="flex items-center justify-center rounded-xl text-[11px] font-black border transition-all duration-150"
                          style={{
                            width:       44,
                            height:      44,
                            borderColor: active ? 'rgba(99,102,241,0.60)' : 'rgba(255,255,255,0.08)',
                            background:  active ? 'rgba(99,102,241,0.22)' : 'rgba(255,255,255,0.03)',
                            color:       active ? '#818cf8'                : 'rgba(255,255,255,0.28)',
                            boxShadow:   active ? '0 0 8px rgba(99,102,241,0.22)' : 'none',
                            touchAction: 'manipulation',
                            cursor:      isEditMode ? 'default' : 'pointer',
                            opacity:     isEditMode ? 0.7 : 1,
                          }}
                          aria-pressed={active}
                          aria-label={['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'][idx]}
                        >
                          {label}
                        </motion.button>
                      )
                    })}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Name + time inputs + submit button */}
      <div className="flex items-center gap-2">
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
            borderColor: isEditMode ? 'rgba(6,182,212,0.22)' : 'rgba(255,255,255,0.08)',
          }}
        />

        <input
          type="time"
          value={startTime}
          onChange={e => { setStart(e.target.value); setError('') }}
          className="h-9 rounded-xl px-2 text-[12px] font-mono font-semibold text-white/75 outline-none border transition-colors duration-150"
          style={{
            width:       '76px',
            background:  'rgba(255,255,255,0.04)',
            borderColor: startTime ? (selectedCat?.accent ?? '#fff') + '40' : 'rgba(255,255,255,0.08)',
            colorScheme: 'dark',
          }}
          aria-label="Start time"
        />

        <span className="text-white/22 text-[12px] font-bold shrink-0">–</span>

        <input
          type="time"
          value={endTime}
          onChange={e => { setEnd(e.target.value); setError('') }}
          className="h-9 rounded-xl px-2 text-[12px] font-mono font-semibold text-white/75 outline-none border transition-colors duration-150"
          style={{
            width:       '76px',
            background:  'rgba(255,255,255,0.04)',
            borderColor: endTime ? (selectedCat?.accent ?? '#fff') + '40' : 'rgba(255,255,255,0.08)',
            colorScheme: 'dark',
          }}
          aria-label="End time"
        />

        <motion.button
          whileTap={{ scale: 0.87 }}
          onClick={handleSubmit}
          className="shrink-0 h-9 px-3 rounded-xl flex items-center gap-1.5 font-bold text-[12px] text-white"
          style={{
            background: isEditMode
              ? 'linear-gradient(135deg, #06b6d4dd, #f97316cc)'
              : isRecurring
                ? 'linear-gradient(135deg, #6366f1ee, #4f46e5aa)'
                : selectedCat
                  ? `linear-gradient(135deg, ${selectedCat.accent}ee, ${selectedCat.accent}88)`
                  : 'linear-gradient(135deg, #a78bfa, #7c3aed)',
            boxShadow: isEditMode
              ? '0 2px 16px rgba(6,182,212,0.40)'
              : isRecurring
                ? '0 2px 14px rgba(99,102,241,0.35)'
                : `0 2px 14px ${selectedCat?.accent ?? '#a78bfa'}38`,
            touchAction: 'manipulation',
          }}
          aria-label={isEditMode ? 'Save changes' : 'Add routine block'}
        >
          {isEditMode ? (
            <>
              <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              <span className="whitespace-nowrap">Save</span>
            </>
          ) : (
            <>
              <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              <span className="whitespace-nowrap">Add</span>
            </>
          )}
        </motion.button>
      </div>

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
