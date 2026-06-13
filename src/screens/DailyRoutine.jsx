import { useState, useEffect, useMemo, memo, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import EstimatedFinishBanner from '../components/EstimatedFinishBanner'
import {
  CATEGORIES, POLARITY,
  persistence, todayISO,
  getTodayDayName, getWeekdayLabel, getLastOccurrenceISO, getCurrentTimeHHMM,
  DEFAULT_WEEKLY_ROUTINES,
  cascadeShift, getEstimatedFinish, blockDuration, timeToMinutes, wouldExceedMidnight,
} from '../store'

// ── Napi rutin kezdeti adatok betöltése ───────────────────────────────────────
function getInitialBlocks() {
  const iso = todayISO()
  const saved = persistence.getRoutine(iso)
  if (saved) return saved
  const day = getTodayDayName()
  return DEFAULT_WEEKLY_ROUTINES[day] ?? []
}

function getInitialBaseline() {
  const iso = todayISO()
  const stored = persistence.getBaselineFinish(iso)
  if (stored) return stored
  // Első megnyitáskor: az aktuális rutin utolsó blokkjának vége
  const finish = getEstimatedFinish(getInitialBlocks())
  if (finish) persistence.setBaselineFinish(iso, finish)
  return finish
}

// ── Fő komponens ──────────────────────────────────────────────────────────────
export default function DailyRoutine() {
  const iso        = todayISO()
  const todayName  = getTodayDayName()

  const [blocks,         setBlocks]         = useState(getInitialBlocks)
  const [baselineFinish, setBaselineFinish] = useState(getInitialBaseline)
  // Aktuális idő 30mp-enként frissül — nem minden ms, így nincs felesleges render
  const [currentTime, setCurrentTime] = useState(getCurrentTimeHHMM)

  useEffect(() => {
    const id = setInterval(() => setCurrentTime(getCurrentTimeHHMM()), 30_000)
    return () => clearInterval(id)
  }, [])

  // Lokális perzisztencia
  useEffect(() => { persistence.setRoutine(iso, blocks) }, [blocks, iso])

  const estimatedFinish = useMemo(() => getEstimatedFinish(blocks), [blocks])
  const delayMinutes    = useMemo(() => {
    if (!estimatedFinish || !baselineFinish) return 0
    return Math.max(0, timeToMinutes(estimatedFinish) - timeToMinutes(baselineFinish))
  }, [estimatedFinish, baselineFinish])

  // ── Kaszkád kezelő ──────────────────────────────────────────────────────────
  const handleCascade = useCallback((blockId, deltaMinutes) => {
    // Ha a shift átlépné az éjfélt: figyelmeztető toast helyett blokkolja a műveletet
    if (wouldExceedMidnight(blocks, blockId, deltaMinutes)) {
      // Egyszerű vizuális visszajelzés — prod-ban egy toast kellene ide
      return
    }
    setBlocks(prev => cascadeShift(prev, blockId, deltaMinutes))
  }, [blocks])

  // ── Blokk toggle ───────────────────────────────────────────────────────────
  const handleToggle = useCallback((blockId) => {
    setBlocks(prev => prev.map(b =>
      b.id === blockId ? { ...b, completed: !b.completed } : b
    ))
  }, [])

  // ── Time-Machine: betölt az utolsó azonos hétköznapból ────────────────────
  function loadLastWeekday() {
    const lastISO = getLastOccurrenceISO(todayName)
    if (!lastISO) return
    const lastRoutine = persistence.getRoutine(lastISO)
    if (!lastRoutine || !lastRoutine.length) return
    // Completion-t töröljük — az időstruktúrát megtartjuk
    const reset  = lastRoutine.map(b => ({ ...b, completed: false }))
    const finish = getEstimatedFinish(reset)
    setBlocks(reset)
    setBaselineFinish(finish)
    if (finish) persistence.setBaselineFinish(iso, finish)
  }

  // ── Visszaállítás az alapértelmezett rutinra ───────────────────────────────
  function loadDefault() {
    const def    = DEFAULT_WEEKLY_ROUTINES[todayName] ?? []
    const finish = getEstimatedFinish(def)
    setBlocks(def)
    setBaselineFinish(finish)
    if (finish) persistence.setBaselineFinish(iso, finish)
  }

  const hasLastWeekday = !!getLastOccurrenceISO(todayName) &&
    !!persistence.getRoutine(getLastOccurrenceISO(todayName) ?? '')

  return (
    <div className="w-full min-h-screen bg-[#0a0a0f]">

      {/* ── Fejléc ──────────────────────────────────────────────────────────── */}
      <header className="px-4 pt-safe-top border-b border-white/[0.06] bg-[#0a0a0f]/90 backdrop-blur-xl">
        <div className="pt-10 pb-4">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="text-[24px] font-black tracking-tight leading-none text-white">
                Daily Routine
              </h1>
              <p className="text-[11px] font-medium text-white/30 mt-1 tracking-widest uppercase">
                {getWeekdayLabel(todayName)} · {blocks.length} blocks
              </p>
            </div>

            {/* Befejezési idő összesítő */}
            {estimatedFinish && (
              <div className="text-right">
                <p className="text-[9px] font-bold uppercase tracking-widest text-white/25">Finish</p>
                <p className="text-[20px] font-black tabular-nums leading-tight"
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

          {/* Time-Machine gombok */}
          <div className="flex gap-2">
            {hasLastWeekday && (
              <motion.button
                whileTap={{ scale: 0.93 }}
                onClick={loadLastWeekday}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-violet-500/30 bg-violet-500/10 text-[11px] font-bold text-violet-300"
              >
                <span className="text-[12px]">⏪</span>
                Load Last {getWeekdayLabel(todayName)}
              </motion.button>
            )}
            <motion.button
              whileTap={{ scale: 0.93 }}
              onClick={loadDefault}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-white/10 bg-white/[0.04] text-[11px] font-bold text-white/40"
            >
              <span className="text-[12px]">↺</span>
              Reset Default
            </motion.button>
          </div>
        </div>
      </header>

      {/* ── Estimated Finish Banner ──────────────────────────────────────────── */}
      <EstimatedFinishBanner
        estimatedFinish={estimatedFinish}
        delayMinutes={delayMinutes}
      />

      {/* ── Idővonal blokkok ─────────────────────────────────────────────────── */}
      <div className="px-4 pt-3 pb-8">
        {blocks.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="text-4xl mb-3 opacity-30">🕐</div>
            <p className="text-white/20 text-[13px] leading-relaxed">
              No routine blocks.<br />Reset to the default or load last {getWeekdayLabel(todayName)}.
            </p>
          </div>
        )}

        <AnimatePresence mode="popLayout">
          {blocks.map((block, index) => {
            const nowMins   = timeToMinutes(currentTime)
            const startMins = timeToMinutes(block.startTime)
            const endMins   = timeToMinutes(block.endTime)
            const isActive  = !block.completed && nowMins >= startMins && nowMins < endMins
            const isPast    = !block.completed && nowMins >= endMins

            return (
              <RoutineBlock
                key={block.id}
                block={block}
                index={index}
                isActive={isActive}
                isPast={isPast}
                onToggle={() => handleToggle(block.id)}
                onCascade={delta => handleCascade(block.id, delta)}
              />
            )
          })}
        </AnimatePresence>
      </div>
    </div>
  )
}

// ── Routine blokk komponens ──────────────────────────────────────────────────

const RoutineBlock = memo(function RoutineBlock({ block, index, isActive, isPast, onToggle, onCascade }) {
  const cat = CATEGORIES[block.category] ?? CATEGORIES.grind
  const pol = POLARITY[block.polarity ?? 'neutral']
  const dur = blockDuration(block.startTime, block.endTime)

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 12, transition: { duration: 0.18 } }}
      transition={{ delay: index * 0.025, duration: 0.22 }}
      className="relative mb-1"
    >
      {/* Idősor összekötő vonal (az első blokk előtt nem jelenik meg) */}
      {index > 0 && (
        <div className="absolute left-[19px] -top-1 w-px h-1 bg-white/10" />
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
        }}
        whileTap={{ scale: 0.988 }}
        onClick={onToggle}
        role="checkbox"
        aria-checked={block.completed}
        tabIndex={0}
        onKeyDown={e => e.key === ' ' && (e.preventDefault(), onToggle())}
      >
        {/* Bal oldali akcentus sáv — aktív blokknál ragyog */}
        <div className="absolute left-0 top-0 bottom-0 w-[3px]"
          style={{
            background: cat.accent,
            opacity: block.completed ? 0.2 : isActive ? 1 : 0.5,
            boxShadow: isActive ? `0 0 8px ${cat.accent}` : 'none',
          }}
        />

        {/* Bal oldal: polarity dot + ikon + név */}
        <div className="pl-5 pr-2 py-3 flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-0.5">
            {/* Polarity dot */}
            <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: pol.color }} aria-hidden />
            {/* Kategória ikon */}
            <span className="text-[13px] leading-none" aria-hidden>{cat.icon}</span>
            {/* "Most" badge aktív blokkhoz */}
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
            {/* Lejárt jelzés */}
            {isPast && !block.completed && (
              <span className="text-[8px] font-bold text-red-400/70 uppercase tracking-widest">Late</span>
            )}
          </div>

          <p className={`text-[14px] font-semibold leading-tight truncate transition-all duration-300 ${
            block.completed ? 'line-through text-white/25' : isPast ? 'text-white/50' : 'text-white/90'
          }`}>
            {block.name}
          </p>
        </div>

        {/* Jobb oldal: időintervallum + gyors gombok */}
        <div
          className="flex items-center gap-2 pr-3 py-3"
          onClick={e => e.stopPropagation()} // megakadályozza a toggle-t a gomb tapintásakor
        >
          {/* Időintervallum */}
          <div className="text-right">
            <p className="text-[12px] font-mono font-bold tabular-nums whitespace-nowrap"
              style={{ color: isActive ? cat.accent : 'rgba(255,255,255,0.55)' }}
            >
              {block.startTime} – {block.endTime}
            </p>
            <p className="text-[10px] text-white/20 tabular-nums">{dur}m</p>
          </div>

          {/* +10m / +20m gyors kaszkád gombok — csak ha nincs kész */}
          {!block.completed && (
            <div className="flex flex-col gap-1">
              <CascadeButton label="+10m" onClick={() => onCascade(10)} />
              <CascadeButton label="+20m" onClick={() => onCascade(20)} />
            </div>
          )}

          {/* Kész checkmark */}
          {block.completed && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="w-5 h-5 rounded-full flex items-center justify-center"
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

// ── Kaszkád gomb ─────────────────────────────────────────────────────────────
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
      }}
      aria-label={`Add ${label} to this block and cascade`}
    >
      {label}
    </motion.button>
  )
})
