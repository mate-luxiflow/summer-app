import { useState, useEffect, useMemo, memo, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import EstimatedFinishBanner  from '../components/EstimatedFinishBanner'
import AddRoutineForm         from '../components/AddRoutineForm'
import RoutineToQuestModal    from '../components/RoutineToQuestModal'
import { useAppContext, TODAY_IDX } from '../context/AppContext'
import {
  CATEGORIES, POLARITY,
  persistence, todayISO,
  getTodayDayName, getWeekdayLabel, getLastOccurrenceISO, getCurrentTimeHHMM,
  DEFAULT_WEEKLY_ROUTINES,
  getEstimatedFinish, blockDuration, timeToMinutes,
} from '../store'

const WEEK_SHORT = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT']
const WEEK_FULL  = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

export default function DailyRoutine() {
  const {
    blocks, recurringBlocks, baselineFinish,
    setBaselineFinish, _setBlocksDirect,
    cascadeBlock, toggleBlock, deleteBlock, deleteRecurring,
    addBlock, addRecurring, updateRoutineBlock,
    addTask,
  } = useAppContext()

  const [editingBlock,       setEditingBlock]       = useState(null)
  const [pendingRoutineName, setPendingRoutineName] = useState(null)

  const iso       = todayISO()
  const todayName = getTodayDayName()

  // Local UI state — not shared, fine to stay here
  const [selectedDayIdx, setSelectedDayIdx] = useState(TODAY_IDX)
  const [currentTime,    setCurrentTime]    = useState(getCurrentTimeHHMM)
  const isToday = selectedDayIdx === TODAY_IDX

  useEffect(() => {
    const id = setInterval(() => setCurrentTime(getCurrentTimeHHMM()), 30_000)
    return () => clearInterval(id)
  }, [])

  // ── Computed view ─────────────────────────────────────────────────────────
  const viewBlocks = useMemo(() => {
    if (isToday) return blocks
    return recurringBlocks
      .filter(b => (b.days ?? []).includes(selectedDayIdx))
      .sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime))
  }, [isToday, blocks, recurringBlocks, selectedDayIdx])

  const estimatedFinish = useMemo(() => getEstimatedFinish(blocks), [blocks])
  const delayMinutes    = useMemo(() => {
    if (!estimatedFinish || !baselineFinish) return 0
    return Math.max(0, timeToMinutes(estimatedFinish) - timeToMinutes(baselineFinish))
  }, [estimatedFinish, baselineFinish])

  // ── Handlers (wrap context ops with local isToday check) ─────────────────
  const handleCascade = useCallback((blockId, deltaMinutes) => {
    if (!isToday) return
    cascadeBlock(blockId, deltaMinutes)
  }, [isToday, cascadeBlock])

  const handleToggle = useCallback((blockId) => {
    if (!isToday) return
    toggleBlock(blockId)
  }, [isToday, toggleBlock])

  const handleDeleteBlock = useCallback((blockId) => {
    if (isToday) {
      deleteBlock(blockId)
    } else {
      deleteRecurring(blockId)
    }
  }, [isToday, deleteBlock, deleteRecurring])

  const handleEditBlock = useCallback((block) => {
    // Look up days from recurring template if this is a materialized recurring block
    let blockWithDays = block
    if (block.recurring_source_id) {
      const source = recurringBlocks.find(rb => rb.id === block.recurring_source_id)
      if (source?.days) blockWithDays = { ...block, days: source.days }
    }
    setEditingBlock(blockWithDays)
  }, [recurringBlocks])

  // ── Time-Machine ─────────────────────────────────────────────────────────
  function loadLastWeekday() {
    const lastISO = getLastOccurrenceISO(todayName)
    if (!lastISO) return
    const lastRoutine = persistence.getRoutine(lastISO)
    if (!lastRoutine?.length) return
    const reset  = lastRoutine.map(b => ({ ...b, completed: false }))
    const finish = getEstimatedFinish(reset)
    _resetBlocks(reset, finish)
  }

  function loadDefault() {
    const def    = DEFAULT_WEEKLY_ROUTINES[todayName] ?? []
    const finish = getEstimatedFinish(def)
    _resetBlocks(def, finish)
  }

  function _resetBlocks(newBlocks, finish) {
    _setBlocksDirect(newBlocks)
    setBaselineFinish(finish)
    if (finish) persistence.setBaselineFinish(iso, finish)
  }

  const hasLastWeekday = !!getLastOccurrenceISO(todayName) &&
    !!persistence.getRoutine(getLastOccurrenceISO(todayName) ?? '')

  return (
    <div className="w-full min-h-screen bg-[#0a0a0f]">

      {/* ── Header ────────────────────────────────────────────────────────── */}
      <header className="px-4 pt-safe-top border-b border-white/6 bg-[#0a0a0f]/90 backdrop-blur-xl">
        <div className="pt-10 pb-3">

          <div className="flex items-start justify-between mb-3">
            <div>
              <h1
                className="text-[36px] font-black tracking-tighter leading-none text-white"
                style={{ textShadow: '0 0 28px rgba(139,92,246,0.55), 0 0 56px rgba(139,92,246,0.22)' }}
              >
                {WEEK_FULL[selectedDayIdx].toUpperCase()}
              </h1>
              <p className="text-[10px] font-semibold text-white/28 mt-1.5 tracking-widest uppercase">
                {isToday ? 'Today' : 'Preview'} · {viewBlocks.length} blocks
                {!isToday && <span className="ml-2 text-amber-500/60">· Read-only</span>}
              </p>
            </div>

            {isToday && estimatedFinish && (
              <div className="text-right">
                <p className="text-[9px] font-bold uppercase tracking-widest text-white/22">Est. Finish</p>
                <p
                  className="text-[22px] font-black tabular-nums leading-tight"
                  style={{
                    background: delayMinutes > 0
                      ? 'linear-gradient(90deg,#f59e0b,#ef4444)'
                      : 'linear-gradient(90deg,#22c55e,#06b6d4)',
                    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                  }}
                >
                  {estimatedFinish}
                </p>
              </div>
            )}
          </div>

          {/* Day selector chips */}
          <div
            className="flex gap-1.5 overflow-x-auto mb-3"
            style={{ scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' }}
            role="tablist"
            aria-label="Select day"
          >
            {WEEK_SHORT.map((label, idx) => {
              const isSelected  = idx === selectedDayIdx
              const isTodayChip = idx === TODAY_IDX
              return (
                <motion.button
                  key={idx}
                  whileTap={{ scale: 0.86 }}
                  onClick={() => setSelectedDayIdx(idx)}
                  role="tab"
                  aria-selected={isSelected}
                  aria-label={WEEK_FULL[idx]}
                  className="shrink-0 relative flex flex-col items-center justify-center gap-0.5 rounded-xl border transition-all duration-150"
                  style={{
                    minWidth:    44,
                    height:      44,
                    borderColor: isSelected
                      ? 'rgba(139,92,246,0.55)'
                      : isTodayChip
                        ? 'rgba(255,255,255,0.14)'
                        : 'rgba(255,255,255,0.06)',
                    background: isSelected
                      ? 'rgba(139,92,246,0.20)'
                      : isTodayChip
                        ? 'rgba(255,255,255,0.05)'
                        : 'rgba(255,255,255,0.02)',
                    color: isSelected
                      ? '#a78bfa'
                      : isTodayChip
                        ? 'rgba(255,255,255,0.60)'
                        : 'rgba(255,255,255,0.22)',
                    boxShadow:   isSelected ? '0 0 14px rgba(139,92,246,0.30)' : 'none',
                    touchAction: 'manipulation',
                  }}
                >
                  <span className="text-[10px] font-black tracking-wider">{label}</span>
                  {isTodayChip && (
                    <div
                      className="w-1 h-1 rounded-full"
                      style={{ background: isSelected ? '#a78bfa' : 'rgba(255,255,255,0.4)' }}
                    />
                  )}
                </motion.button>
              )
            })}
          </div>

          {/* Time-Machine buttons — today only */}
          {isToday && (
            <div className="flex gap-2">
              <motion.button
                whileTap={{ scale: 0.93 }}
                onClick={loadDefault}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-white/10 bg-white/4 text-[11px] font-bold text-white/38"
                style={{ touchAction: 'manipulation' }}
              >
                <span className="text-[12px]">↺</span>
                Reset Default
              </motion.button>

              <motion.button
                whileTap={hasLastWeekday ? { scale: 0.93 } : {}}
                onClick={hasLastWeekday ? loadLastWeekday : undefined}
                disabled={!hasLastWeekday}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-[11px] font-bold transition-all duration-200"
                style={{
                  borderColor: hasLastWeekday ? 'rgba(139,92,246,0.42)' : 'rgba(255,255,255,0.07)',
                  background:  hasLastWeekday ? 'rgba(139,92,246,0.12)' : 'rgba(255,255,255,0.02)',
                  color:       hasLastWeekday ? '#a78bfa'                : 'rgba(255,255,255,0.18)',
                  opacity:     hasLastWeekday ? 1                        : 0.65,
                  cursor:      hasLastWeekday ? 'pointer'                : 'default',
                  touchAction: 'manipulation',
                }}
              >
                <span className="text-[12px]">🕒</span>
                Load Last {getWeekdayLabel(todayName)}
              </motion.button>
            </div>
          )}
        </div>
      </header>

      {/* Preview mode banner */}
      {!isToday && (
        <div
          className="mx-4 mt-3 px-3 py-2 rounded-xl border flex items-center gap-2"
          style={{ background: 'rgba(245,158,11,0.06)', borderColor: 'rgba(245,158,11,0.20)' }}
        >
          <span className="text-[13px]">👁</span>
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-amber-500/70">Preview Mode</p>
            <p className="text-[9px] text-amber-500/40">
              Showing recurring blocks for {WEEK_FULL[selectedDayIdx]} · Editing disabled
            </p>
          </div>
        </div>
      )}

      {isToday && (
        <EstimatedFinishBanner estimatedFinish={estimatedFinish} delayMinutes={delayMinutes} />
      )}

      {isToday && (
        <AddRoutineForm
          onAdd={addBlock}
          onAddRecurring={addRecurring}
          editingBlock={editingBlock}
          onExitEdit={() => setEditingBlock(null)}
          onUpdate={updateRoutineBlock}
          onBlockSaved={setPendingRoutineName}
        />
      )}

      {/* Block timeline */}
      <div className="px-4 pt-3 pb-32">
        {viewBlocks.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="text-4xl mb-3 opacity-30">🕐</div>
            <p className="text-white/20 text-[13px] leading-relaxed">
              {isToday
                ? <>No routine blocks.<br />Add one above, reset to default, or load last {getWeekdayLabel(todayName)}.</>
                : <>No recurring blocks set for {WEEK_FULL[selectedDayIdx]}.<br />Add one in Today's view with 🔁 Recurring.</>
              }
            </p>
          </div>
        )}

        <AnimatePresence mode="popLayout">
          {viewBlocks.map((block, index) => {
            const nowMins   = timeToMinutes(currentTime)
            const startMins = timeToMinutes(block.startTime)
            const endMins   = timeToMinutes(block.endTime)
            const isActive  = isToday && !block.completed && nowMins >= startMins && nowMins < endMins
            const isPast    = isToday && !block.completed && nowMins >= endMins

            return (
              <RoutineBlock
                key={block.id}
                block={block}
                index={index}
                isActive={isActive}
                isPast={isPast}
                isToday={isToday}
                onToggle={() => handleToggle(block.id)}
                onCascade={delta => handleCascade(block.id, delta)}
                onDelete={() => handleDeleteBlock(block.id)}
                onEdit={handleEditBlock}
              />
            )
          })}
        </AnimatePresence>
      </div>

      {/* Routine → Quest intercept modal */}
      <RoutineToQuestModal
        blockName={pendingRoutineName}
        onConfirm={() => {
          if (pendingRoutineName) {
            addTask({
              text:        pendingRoutineName,
              category:    'productivity',
              priority:    'medium',
              polarity:    'positive',
              isEpic:      false,
              createdDate: todayISO(),
            })
          }
          setPendingRoutineName(null)
        }}
        onDismiss={() => setPendingRoutineName(null)}
      />
    </div>
  )
}

// ── Routine block card ────────────────────────────────────────────────────────
const RoutineBlock = memo(function RoutineBlock({
  block, index, isActive, isPast, isToday, onToggle, onCascade, onDelete, onEdit,
}) {
  const cat = CATEGORIES[block.category] ?? CATEGORIES.grind
  const pol = POLARITY[block.polarity ?? 'neutral']
  const dur = blockDuration(block.startTime, block.endTime)

  const [menuOpen,    setMenuOpen]    = useState(false)
  const pressTimerRef                 = useRef(null)

  useEffect(() => () => clearTimeout(pressTimerRef.current), [])

  function handleTouchStart() {
    if (!isToday) return
    pressTimerRef.current = setTimeout(() => setMenuOpen(true), 500)
  }
  function handleTouchEnd()  { clearTimeout(pressTimerRef.current) }
  function handleTouchMove() { clearTimeout(pressTimerRef.current) }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 12, transition: { duration: 0.18 } }}
      transition={{ delay: index * 0.025, duration: 0.22 }}
      className="relative mb-1"
    >
      {/* Full-screen backdrop closes menu on outside tap */}
      {menuOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setMenuOpen(false)}
        />
      )}

      {/* Context menu — appears above the card */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.90, y: 6 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.88, y: 6 }}
            transition={{ duration: 0.14, ease: 'easeOut' }}
            className="absolute right-2 bottom-full mb-2 z-50 rounded-xl overflow-hidden"
            style={{
              background:  '#0d0d14',
              border:      '1px solid rgba(6,182,212,0.35)',
              boxShadow:   '0 4px 28px rgba(0,0,0,0.70), 0 0 18px rgba(6,182,212,0.12)',
              minWidth:    148,
            }}
          >
            <button
              onClick={() => { setMenuOpen(false); onEdit?.(block) }}
              className="w-full flex items-center gap-2.5 px-3.5 py-3 text-[12px] font-bold text-white/75 transition-colors duration-150"
              style={{ touchAction: 'manipulation' }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(6,182,212,0.08)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <span className="text-[14px]">✏️</span>
              Edit Block
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {index > 0 && (
        <div className="absolute left-4.75 -top-1 w-px h-1 bg-white/10" />
      )}

      <motion.div
        className="relative flex items-center gap-3 rounded-xl transition-colors duration-200 overflow-hidden"
        style={{
          background: isActive
            ? cat.accent + '0e'
            : block.completed
              ? 'rgba(255,255,255,0.01)'
              : 'rgba(255,255,255,0.03)',
          borderWidth: 1,
          borderStyle: 'solid',
          borderColor: isActive
            ? cat.accent + '40'
            : block.completed
              ? 'rgba(255,255,255,0.03)'
              : 'rgba(255,255,255,0.06)',
          opacity:     !isToday ? 0.72 : 1,
          userSelect:  'none',
          WebkitUserSelect: 'none',
        }}
        whileTap={isToday && !menuOpen ? { scale: 0.988 } : {}}
        onClick={isToday && !menuOpen ? onToggle : undefined}
        onContextMenu={e => { e.preventDefault(); e.stopPropagation() }}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onTouchMove={handleTouchMove}
        role={isToday ? 'checkbox' : 'listitem'}
        aria-checked={isToday ? block.completed : undefined}
        tabIndex={isToday ? 0 : -1}
        onKeyDown={isToday ? (e => e.key === ' ' && (e.preventDefault(), onToggle())) : undefined}
      >
        {/* Accent bar */}
        <div className="absolute left-0 top-0 bottom-0 w-0.75"
          style={{
            background: cat.accent,
            opacity:    block.completed ? 0.2 : isActive ? 1 : 0.5,
            boxShadow:  isActive ? `0 0 8px ${cat.accent}` : 'none',
          }}
        />

        {/* Left: polarity + icon + name */}
        <div className="pl-5 pr-2 py-3 flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-0.5">
            <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: pol.color }} aria-hidden />
            <span className="text-[13px] leading-none" aria-hidden>{cat.icon}</span>

            {isActive && (
              <motion.span
                animate={{ opacity: [0.6, 1, 0.6] }}
                transition={{ repeat: Infinity, duration: 1.8 }}
                className="text-[8px] font-black uppercase tracking-widest px-1 py-0.5 rounded"
                style={{ background: cat.accent + '30', color: cat.accent }}
              >
                NOW
              </motion.span>
            )}
            {isPast && !block.completed && (
              <span className="text-[8px] font-bold text-red-400/70 uppercase tracking-widest">Late</span>
            )}
            {block.recurring_source_id && (
              <span className="text-[8px] text-indigo-400/50 font-bold">🔁</span>
            )}
            {!isToday && block.days && (
              <span className="text-[8px] text-amber-500/50 font-bold">preview</span>
            )}
          </div>

          <p className={`text-[14px] font-semibold leading-tight truncate transition-all duration-300 ${
            block.completed ? 'line-through text-white/25' : isPast ? 'text-white/50' : 'text-white/90'
          }`}>
            {block.name}
          </p>
        </div>

        {/* Right: time + cascade + delete — stops touch propagation to prevent long-press */}
        <div
          className="flex items-center gap-1 pr-1 py-3"
          onClick={e => e.stopPropagation()}
          onTouchStart={e => e.stopPropagation()}
        >
          <div className="text-right mr-1">
            <p className="text-[12px] font-mono font-bold tabular-nums whitespace-nowrap"
              style={{ color: isActive ? cat.accent : 'rgba(255,255,255,0.55)' }}
            >
              {block.startTime} – {block.endTime}
            </p>
            <p className="text-[10px] text-white/20 tabular-nums">{dur}m</p>
          </div>

          {isToday && !block.completed && (
            <div className="flex flex-col gap-1">
              <CascadeButton label="+10m" onClick={() => onCascade(10)} />
              <CascadeButton label="+20m" onClick={() => onCascade(20)} />
            </div>
          )}

          {/* WCAG 2.2: 44×44px touch target, always visible on mobile */}
          <button
            onClick={onDelete}
            className="shrink-0 relative flex items-center justify-center rounded-full transition-colors duration-150"
            style={{ width: 44, height: 44, marginRight: -6, touchAction: 'manipulation' }}
            aria-label={`Delete ${block.name}`}
          >
            <svg
              className="w-3.5 h-3.5"
              style={{ color: '#ef4444', opacity: 0.50 }}
              fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {isToday && block.completed && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="w-5 h-5 rounded-full flex items-center justify-center mr-2"
              style={{ background: cat.accent + '30', border: `1.5px solid ${cat.accent}60` }}
            >
              <svg className="w-3 h-3" style={{ color: cat.accent }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </motion.div>
          )}
        </div>
      </motion.div>
    </motion.div>
  )
})

const CascadeButton = memo(function CascadeButton({ label, onClick }) {
  return (
    <motion.button
      whileTap={{ scale: 0.78, y: 1 }}
      whileHover={{ scale: 1.05 }}
      onClick={onClick}
      className="px-1.5 py-0.5 rounded text-[9px] font-black whitespace-nowrap transition-colors duration-150"
      style={{
        background:  'rgba(245,158,11,0.12)',
        border:      '1px solid rgba(245,158,11,0.30)',
        color:       '#fbbf24',
        boxShadow:   '0 1px 6px rgba(245,158,11,0.15)',
        touchAction: 'manipulation',
      }}
      aria-label={`Add ${label} to this block and cascade`}
    >
      {label}
    </motion.button>
  )
})
