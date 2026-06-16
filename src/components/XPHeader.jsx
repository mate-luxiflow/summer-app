import { motion } from 'framer-motion'
import { Zap, Flame } from 'lucide-react'
import { getLevelInfo, getRankInfo } from '../store'

/** Formats today's date as "Fri · Jun 13" */
function todayLabel() {
  return new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
}

export default function XPHeader({ totalXp, completedCount, totalCount, streak }) {
  const { level, xpIntoLevel, xpForLevel, pct } = getLevelInfo(totalXp)
  const rank = getRankInfo(level)
  const taskPct = totalCount === 0 ? 0 : Math.round((completedCount / totalCount) * 100)

  return (
    <header className="shrink-0 px-4 pt-safe-top border-b border-white/[0.06] bg-[#0a0a0f]/90 backdrop-blur-xl">
      <div className="pt-10 pb-4">

        {/* ── Top row: title + level badge ── */}
        <div className="flex items-start justify-between mb-5">
          <div>
            <h1 className="text-[28px] font-black tracking-tight leading-none"
              style={{ background: 'linear-gradient(90deg,#f97316,#ec4899 50%,#8b5cf6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Summer Grind
            </h1>
            <p className="text-[11px] font-medium text-white/30 mt-1 tracking-widest uppercase">{todayLabel()}</p>
          </div>

          <div className="flex items-center gap-2">
            {/* Streak badge */}
            {streak > 0 && (
              <div className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-orange-500/30 bg-orange-500/10">
                <Flame size={12} className="text-orange-400" />
                <span className="text-[11px] font-bold text-orange-300">{streak}</span>
              </div>
            )}

            {/* Level badge */}
            <div className="flex flex-col items-center justify-center w-14 h-14 rounded-2xl border border-white/10 bg-white/[0.04]">
              <span className="text-[9px] font-bold text-white/30 uppercase tracking-widest leading-none">LVL</span>
              <span className="text-[24px] font-black leading-tight"
                style={{ background: 'linear-gradient(180deg,#fbbf24,#f97316)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                {level}
              </span>
            </div>
          </div>
        </div>

        {/* ── Rank + XP label ── */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5">
            <Zap size={11} style={{ color: rank.color }} />
            <span className="text-[11px] font-bold uppercase tracking-widest" style={{ color: rank.color }}>
              {rank.label}
            </span>
          </div>
          <span className="text-[11px] text-white/30 font-medium tabular-nums">{totalXp} XP total</span>
        </div>

        {/* ── XP progress bar ── */}
        <div className="h-[5px] w-full rounded-full bg-white/[0.06] overflow-hidden mb-1">
          <motion.div
            className="h-full rounded-full"
            style={{ background: 'linear-gradient(90deg,#f97316,#ec4899,#8b5cf6)' }}
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
          >
            {/* Glow pulse on the tip */}
            {pct > 2 && (
              <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-pink-400 blur-[3px] opacity-80" />
            )}
          </motion.div>
        </div>
        <div className="flex justify-between items-center mb-4">
          <span className="text-[10px] text-white/20 tabular-nums">Lv {level}</span>
          <span className="text-[10px] text-white/25 tabular-nums">{xpIntoLevel} / {xpForLevel} XP</span>
          <span className="text-[10px] text-white/20 tabular-nums">Lv {level + 1}</span>
        </div>

        {/* ── Daily quest progress ── */}
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[10px] font-semibold text-white/30 uppercase tracking-widest">Daily Quests</span>
          <span className="text-[10px] font-bold text-white/40 tabular-nums">{completedCount}/{totalCount} · {taskPct}%</span>
        </div>
        <div className="h-[3px] w-full rounded-full bg-white/[0.06] overflow-hidden">
          <motion.div
            className="h-full rounded-full"
            style={{ background: 'linear-gradient(90deg,#10b981,#06b6d4)' }}
            animate={{ width: `${taskPct}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          />
        </div>

      </div>
    </header>
  )
}
