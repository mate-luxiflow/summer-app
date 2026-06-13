import { memo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  CATEGORIES, POLARITY, cyclePolarity,
  getEpicDaysRemaining, getEpicTotalDays, isEpicInDanger,
} from '../store'

const EpicQuestCard = memo(function EpicQuestCard({ task, onToggle, onDelete, onPolarityChange }) {
  const cat = CATEGORIES[task.category] ?? CATEGORIES.grind
  const pol = POLARITY[task.polarity ?? 'neutral']

  const daysRemaining = getEpicDaysRemaining(task.dueDate)
  const totalDays     = getEpicTotalDays(task.createdDate, task.dueDate)
  const danger        = isEpicInDanger(task.dueDate)

  // Eltelt napok aránya: (totalDays - remaining) / totalDays, 0–100% közt clampolva
  const progressPct = totalDays && daysRemaining !== null
    ? Math.min(100, Math.max(0, ((totalDays - daysRemaining) / totalDays) * 100))
    : 0

  function daysLabel() {
    if (daysRemaining === null) return null
    if (daysRemaining < 0)  return `${Math.abs(daysRemaining)}d overdue`
    if (daysRemaining === 0) return 'Due today'
    return `${daysRemaining}d left`
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -10, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: danger ? 1.015 : 1 }}
      exit={{ opacity: 0, y: -8, scale: 0.97, transition: { duration: 0.18 } }}
      transition={{ duration: 0.28, ease: 'easeOut' }}
      className="relative rounded-2xl overflow-hidden mb-3"
      style={{
        background: `linear-gradient(135deg, ${cat.accent}0e 0%, rgba(10,10,15,0.97) 60%)`,
        border:     `1px solid ${danger ? '#f59e0b' : cat.accent}${danger ? '60' : '28'}`,
        boxShadow:  danger ? undefined : `0 4px 24px ${cat.accent}18`,
      }}
    >
      {/* ── Danger pulse overlay ─────────────────────────────────────────────── */}
      {danger && (
        <motion.div
          className="absolute inset-0 rounded-2xl pointer-events-none"
          animate={{
            boxShadow: [
              '0 0 0 1px rgba(245,158,11,0.25), 0 0 16px rgba(245,158,11,0.18)',
              '0 0 0 2px rgba(245,158,11,0.65), 0 0 32px rgba(245,158,11,0.45)',
              '0 0 0 1px rgba(245,158,11,0.25), 0 0 16px rgba(245,158,11,0.18)',
            ],
          }}
          transition={{ repeat: Infinity, duration: 2.2, ease: 'easeInOut' }}
        />
      )}

      {/* ── Bal akcentus sáv ─────────────────────────────────────────────────── */}
      <div
        className="absolute left-0 top-0 bottom-0 w-[3px]"
        style={{
          background: danger
            ? 'linear-gradient(180deg, #f59e0b, #ef4444)'
            : `linear-gradient(180deg, ${cat.accent}, ${cat.accent}66)`,
          boxShadow: danger ? '0 0 10px #f59e0b' : `0 0 8px ${cat.accent}80`,
          opacity: task.completed ? 0.3 : 1,
        }}
      />

      <div className="pl-5 pr-3 py-3.5">
        {/* ── Fejléc sor: Epic badge + kategória + határidő ────────────────── */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span
              className="text-[8px] font-black uppercase tracking-[0.12em] px-2 py-0.5 rounded-full"
              style={{
                background:  danger ? '#f59e0b20' : cat.accent + '20',
                color:       danger ? '#f59e0b'   : cat.accent,
                border:      `1px solid ${danger ? '#f59e0b' : cat.accent}38`,
              }}
            >
              ⚡ EPIC
            </span>
            <span className="text-[11px] font-semibold" style={{ color: cat.accent + 'cc' }}>
              {cat.icon} {cat.label}
            </span>
          </div>

          {daysLabel() && (
            <div className="flex items-center gap-1.5">
              {danger && (
                <motion.span
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{ repeat: Infinity, duration: 1.4 }}
                  className="text-[11px]"
                >⚠️</motion.span>
              )}
              <span
                className="text-[11px] font-bold tabular-nums"
                style={{ color: danger ? '#f59e0b' : 'rgba(255,255,255,0.38)' }}
              >
                {daysLabel()}
              </span>
            </div>
          )}
        </div>

        {/* ── Quest cím ────────────────────────────────────────────────────── */}
        <p className={`text-[17px] font-black leading-tight mb-2.5 transition-all duration-300 ${
          task.completed ? 'line-through text-white/25' : 'text-white/92'
        }`}>
          {task.text}
        </p>

        {/* ── Timeline progress bar ────────────────────────────────────────── */}
        {totalDays && (
          <div className="mb-3">
            <div
              className="h-[3px] rounded-full overflow-hidden"
              style={{ background: 'rgba(255,255,255,0.06)' }}
            >
              <motion.div
                className="h-full rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${progressPct}%` }}
                transition={{ duration: 0.7, ease: 'easeOut', delay: 0.1 }}
                style={{
                  background: danger
                    ? 'linear-gradient(90deg, #f59e0b, #ef4444)'
                    : `linear-gradient(90deg, ${cat.accent}dd, ${cat.accent}77)`,
                  boxShadow: danger
                    ? '0 0 8px #f59e0b70'
                    : `0 0 8px ${cat.accent}60`,
                }}
              />
            </div>
            {/* Idősáv szélső feliratok */}
            <div className="flex justify-between mt-1">
              <span className="text-[9px] text-white/18">Created</span>
              <span className="text-[9px] tabular-nums"
                style={{ color: danger ? '#f59e0b70' : 'rgba(255,255,255,0.18)' }}>
                {Math.round(progressPct)}% · {totalDays}d total
              </span>
            </div>
          </div>
        )}

        {/* ── Alsó action sor ──────────────────────────────────────────────── */}
        <div className="flex items-center justify-between">
          {/* Polarity override */}
          <motion.button
            whileTap={{ scale: 0.82 }}
            onClick={e => { e.stopPropagation(); onPolarityChange(cyclePolarity(task.polarity)) }}
            className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold border transition-all duration-150"
            style={{
              borderColor: pol.color + '38',
              background:  pol.bg,
              color:       pol.color,
            }}
          >
            <span>{pol.symbol}</span>
            <span>{pol.label}</span>
          </motion.button>

          <div className="flex items-center gap-2">
            {/* Complete toggle */}
            <motion.button
              whileTap={{ scale: 0.88 }}
              onClick={e => { e.stopPropagation(); onToggle() }}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-all duration-200"
              style={{
                borderColor: task.completed ? cat.accent + '55' : 'rgba(255,255,255,0.12)',
                background:  task.completed ? cat.accent + '1a' : 'rgba(255,255,255,0.04)',
                color:       task.completed ? cat.accent         : 'rgba(255,255,255,0.45)',
              }}
            >
              <AnimatePresence mode="wait">
                <motion.span
                  key={task.completed ? 'done' : 'todo'}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ duration: 0.12 }}
                >
                  {task.completed ? '✓ Completed' : 'Mark Done'}
                </motion.span>
              </AnimatePresence>
            </motion.button>

            {/* Delete */}
            <motion.button
              whileTap={{ scale: 0.80 }}
              onClick={e => { e.stopPropagation(); onDelete() }}
              className="w-7 h-7 flex items-center justify-center rounded-lg transition-all duration-150"
              style={{
                background: 'rgba(239,68,68,0.07)',
                color:      'rgba(239,68,68,0.45)',
                border:     '1px solid rgba(239,68,68,0.12)',
              }}
              aria-label="Delete epic quest"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </motion.button>
          </div>
        </div>
      </div>
    </motion.div>
  )
})

export default EpicQuestCard
