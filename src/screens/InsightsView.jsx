import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAppContext } from '../context/AppContext'
import {
  ROUTINE_BEHAVIOR_TYPES, getBlockType,
  persistence, todayISO, blockDuration, timeToMinutes, lastNDays,
} from '../store'

const TABS = ['Day', 'Week', 'Trend']

// ── Formatting helpers ─────────────────────────────────────────────────────────
function fmtMin(mins) {
  if (!mins || mins < 1) return '0m'
  const h = Math.floor(mins / 60)
  const m = mins % 60
  if (h === 0) return `${m}m`
  if (m === 0) return `${h}h`
  return `${h}h ${m}m`
}

// ── Data computation ───────────────────────────────────────────────────────────
function computeDayStats(blocks) {
  const completed = blocks.filter(b => b.completed)
  const total = completed.reduce((s, b) => s + blockDuration(b.startTime, b.endTime), 0)

  const hourly = Array.from({ length: 24 }, (_, h) => ({
    hour: h, positive: 0, neutral: 0, negative: 0,
  }))

  for (const b of completed) {
    const t = getBlockType(b)
    const s = timeToMinutes(b.startTime)
    const e = timeToMinutes(b.endTime)
    for (let h = 0; h < 24; h++) {
      const hs = h * 60, he = (h + 1) * 60
      const overlap = Math.max(0, Math.min(e, he) - Math.max(s, hs))
      if (overlap > 0) hourly[h][t] += overlap
    }
  }

  const map = {}
  for (const b of completed) {
    const k = b.name
    if (!map[k]) map[k] = { name: b.name, type: getBlockType(b), dur: 0 }
    map[k].dur += blockDuration(b.startTime, b.endTime)
  }
  const topActivities = Object.values(map)
    .sort((a, b) => b.dur - a.dur)
    .slice(0, 5)

  return { total, hourly, topActivities }
}

// ── Hourly bar chart ───────────────────────────────────────────────────────────
function HourlyChart({ hourlyData }) {
  const W = 320, H = 72, baseline = H, maxBarH = 60

  return (
    <div>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full"
        style={{ height: H, overflow: 'visible' }}
        preserveAspectRatio="none"
      >
        {/* Subtle grid lines */}
        {[0.5, 1].map((pct, i) => (
          <line
            key={i}
            x1={0} y1={baseline - pct * maxBarH}
            x2={W} y2={baseline - pct * maxBarH}
            stroke="rgba(255,255,255,0.04)" strokeWidth={1}
          />
        ))}

        {hourlyData.map((d, i) => {
          const slotW  = W / 24
          const barW   = slotW * 0.60
          const x      = i * slotW + (slotW - barW) / 2
          const posNeu = d.positive + d.neutral
          const neg    = d.negative
          const total  = posNeu + neg

          if (total === 0) {
            return (
              <rect
                key={i}
                x={x} y={baseline - 4}
                width={barW} height={4}
                rx={1}
                fill="rgba(255,255,255,0.06)"
              />
            )
          }

          const posNeuH = Math.min(maxBarH, (posNeu / 60) * maxBarH)
          const negH    = Math.min(maxBarH - posNeuH, (neg / 60) * maxBarH)

          return (
            <g key={i}>
              {posNeuH > 0 && (
                <rect
                  x={x} y={baseline - posNeuH - negH}
                  width={barW} height={posNeuH}
                  rx={1.5} fill="#06b6d4" opacity={0.88}
                />
              )}
              {negH > 0 && (
                <rect
                  x={x} y={baseline - negH}
                  width={barW} height={negH}
                  rx={1.5} fill="#a855f7" opacity={0.88}
                />
              )}
            </g>
          )
        })}
      </svg>

      {/* X-axis hour labels */}
      <div className="relative mt-1.5" style={{ height: 12 }}>
        {[0, 6, 12, 18].map(h => (
          <span
            key={h}
            className="absolute text-[8px] font-bold tabular-nums -translate-x-1/2"
            style={{ left: `${(h / 24) * 100}%`, color: 'rgba(255,255,255,0.25)' }}
          >
            {h}
          </span>
        ))}
        <span
          className="absolute text-[8px] font-bold tabular-nums"
          style={{ right: 0, color: 'rgba(255,255,255,0.18)' }}
        >
          23
        </span>
      </div>

      {/* Y-axis labels */}
      <div className="flex items-end justify-between mt-1">
        <span className="text-[7px] text-white/18">0s</span>
        <span className="text-[7px] text-white/18">30m</span>
        <span className="text-[7px] text-white/18">1h</span>
      </div>
    </div>
  )
}

// ── Weekly column chart ────────────────────────────────────────────────────────
function WeeklyChart({ weekData }) {
  const W = 280, H = 88, baseline = H, maxBarH = 72
  const colW = W / 7
  const barW = colW * 0.52
  const maxVal = Math.max(...weekData.map(d => d.positive + d.neutral + d.negative), 60)

  const DAY_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S']

  return (
    <div>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full"
        style={{ height: H }}
        preserveAspectRatio="none"
      >
        {weekData.map((d, i) => {
          const x      = i * colW + (colW - barW) / 2
          const posNeu = d.positive + d.neutral
          const neg    = d.negative
          const total  = posNeu + neg

          if (total === 0 || d.isFuture) {
            return (
              <rect
                key={i}
                x={x} y={baseline - 18}
                width={barW} height={18}
                rx={4} fill="rgba(255,255,255,0.05)"
              />
            )
          }

          const posNeuH = Math.min(maxBarH, (posNeu / maxVal) * maxBarH)
          const negH    = Math.min(maxBarH - posNeuH, (neg / maxVal) * maxBarH)

          return (
            <g key={i}>
              {posNeuH > 0 && (
                <rect
                  x={x} y={baseline - posNeuH - negH}
                  width={barW} height={posNeuH}
                  rx={4} fill="#2563eb" opacity={d.isToday ? 1 : 0.75}
                />
              )}
              {negH > 0 && (
                <rect
                  x={x} y={baseline - negH}
                  width={barW} height={negH}
                  rx={4} fill="#a855f7" opacity={d.isToday ? 1 : 0.75}
                />
              )}
            </g>
          )
        })}
      </svg>

      {/* Day labels */}
      <div className="flex mt-2">
        {DAY_LABELS.map((label, i) => (
          <div
            key={i}
            className="flex-1 text-center text-[9px] font-bold"
            style={{
              color: weekData[i]?.isToday
                ? '#06b6d4'
                : 'rgba(255,255,255,0.25)',
            }}
          >
            {label}
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Trend sparkline chart ──────────────────────────────────────────────────────
function TrendChart({ trendData }) {
  const W = 320, H = 100
  const padL = 4, padR = 4, padT = 10, padB = 10
  const innerW = W - padL - padR
  const innerH = H - padT - padB

  const maxVal = Math.max(...trendData.map(d => d.total), 30)

  const points = trendData.map((d, i) => ({
    x: padL + (i / Math.max(trendData.length - 1, 1)) * innerW,
    y: padT + innerH - (d.total / maxVal) * innerH,
  }))

  // Smooth cubic bezier through points
  function smoothPath(pts) {
    if (pts.length < 2) return ''
    let d = `M ${pts[0].x.toFixed(2)} ${pts[0].y.toFixed(2)}`
    for (let i = 1; i < pts.length; i++) {
      const prev = pts[i - 1]
      const curr = pts[i]
      const cp   = ((prev.x + curr.x) / 2).toFixed(2)
      d += ` C ${cp} ${prev.y.toFixed(2)} ${cp} ${curr.y.toFixed(2)} ${curr.x.toFixed(2)} ${curr.y.toFixed(2)}`
    }
    return d
  }

  const linePath = smoothPath(points)
  const lastPt   = points[points.length - 1]
  const firstPt  = points[0]
  const areaPath = linePath && points.length > 1
    ? `${linePath} L ${lastPt.x.toFixed(2)} ${H - padB} L ${firstPt.x.toFixed(2)} ${H - padB} Z`
    : ''

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="w-full"
      style={{ height: 110 }}
      preserveAspectRatio="none"
    >
      <defs>
        <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#06b6d4" stopOpacity={0.28} />
          <stop offset="100%" stopColor="#06b6d4" stopOpacity={0} />
        </linearGradient>
      </defs>

      {/* Grid */}
      {[0.33, 0.66, 1].map((pct, idx) => (
        <line
          key={idx}
          x1={padL} y1={padT + pct * innerH}
          x2={W - padR} y2={padT + pct * innerH}
          stroke="rgba(255,255,255,0.04)" strokeWidth={1}
        />
      ))}

      {/* Area fill */}
      {areaPath && <path d={areaPath} fill="url(#trendFill)" />}

      {/* Line */}
      {linePath && (
        <path
          d={linePath}
          fill="none"
          stroke="#06b6d4"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )}

      {/* Current-day endpoint dot */}
      {lastPt && (
        <>
          <circle cx={lastPt.x} cy={lastPt.y} r={4} fill="#06b6d4" />
          <circle cx={lastPt.x} cy={lastPt.y} r={8} fill="#06b6d4" opacity={0.18} />
        </>
      )}
    </svg>
  )
}

// ── Day tab ────────────────────────────────────────────────────────────────────
function DayView({ stats }) {
  return (
    <div>
      {/* Primary metric */}
      <div className="text-center py-8">
        <p className="text-[54px] font-black text-white leading-none tracking-tighter">
          {fmtMin(stats.total)}
        </p>
        <p className="text-[10px] font-black uppercase tracking-[0.22em] mt-2"
          style={{ color: 'rgba(255,255,255,0.28)' }}>
          Audited Time
        </p>
      </div>

      {/* Hourly chart card */}
      <div
        className="rounded-2xl p-4 mb-5"
        style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
      >
        <div className="flex items-center justify-between mb-3">
          <p className="text-[9px] font-black uppercase tracking-[0.14em]"
            style={{ color: 'rgba(255,255,255,0.25)' }}>
            Hourly Breakdown
          </p>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full" style={{ background: '#06b6d4' }} />
              <span className="text-[8px] font-bold" style={{ color: 'rgba(255,255,255,0.28)' }}>Pos+Neu</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full" style={{ background: '#a855f7' }} />
              <span className="text-[8px] font-bold" style={{ color: 'rgba(255,255,255,0.28)' }}>Neg</span>
            </div>
          </div>
        </div>
        <HourlyChart hourlyData={stats.hourly} />
      </div>

      {/* Most logged activities */}
      {stats.topActivities.length > 0 && (
        <div>
          <p className="text-[9px] font-black uppercase tracking-[0.14em] mb-3"
            style={{ color: 'rgba(255,255,255,0.25)' }}>
            Most Logged Activities
          </p>
          <div className="flex flex-col gap-2">
            {stats.topActivities.map((act, i) => {
              const bType = ROUTINE_BEHAVIOR_TYPES[act.type]
              return (
                <div
                  key={i}
                  className="flex items-center gap-3 px-4 py-3 rounded-2xl"
                  style={{
                    background:  'rgba(255,255,255,0.03)',
                    border:      '1px solid rgba(255,255,255,0.06)',
                  }}
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-semibold truncate" style={{ color: 'rgba(255,255,255,0.85)' }}>
                      {act.name}
                    </p>
                    <p className="text-[10px] mt-0.5 font-bold" style={{ color: bType.accent }}>
                      • {bType.label}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[14px] font-black tabular-nums" style={{ color: 'rgba(255,255,255,0.65)' }}>
                      {fmtMin(act.dur)}
                    </span>
                    <svg className="w-3.5 h-3.5" style={{ color: 'rgba(255,255,255,0.14)' }}
                      fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {stats.topActivities.length === 0 && (
        <div className="text-center py-8">
          <div className="text-3xl mb-2 opacity-20">📊</div>
          <p className="text-[12px]" style={{ color: 'rgba(255,255,255,0.18)' }}>
            Complete routine blocks to see your stats
          </p>
        </div>
      )}
    </div>
  )
}

// ── Week tab ───────────────────────────────────────────────────────────────────
function WeekView({ weekStats, weekTotal, weekAvg }) {
  return (
    <div>
      <div className="text-center py-8">
        <p className="text-[54px] font-black text-white leading-none tracking-tighter">
          {fmtMin(weekAvg)}
        </p>
        <p className="text-[10px] font-black uppercase tracking-[0.22em] mt-2"
          style={{ color: 'rgba(255,255,255,0.28)' }}>
          Daily Average
        </p>
      </div>

      <div
        className="rounded-2xl p-4 mb-5"
        style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
      >
        <div className="flex items-center justify-between mb-3">
          <p className="text-[9px] font-black uppercase tracking-[0.14em]"
            style={{ color: 'rgba(255,255,255,0.25)' }}>
            This Week
          </p>
          <span className="text-[10px] font-bold tabular-nums" style={{ color: 'rgba(255,255,255,0.28)' }}>
            {fmtMin(weekTotal)} total
          </span>
        </div>
        <WeeklyChart weekData={weekStats} />
      </div>

      {/* Per-day breakdown */}
      <div className="grid grid-cols-7 gap-1">
        {['M','T','W','T','F','S','S'].map((label, i) => {
          const d     = weekStats[i]
          const total = d ? d.positive + d.neutral + d.negative : 0
          return (
            <div
              key={i}
              className="flex flex-col items-center gap-1 py-2 rounded-xl"
              style={{
                background:  d?.isToday ? 'rgba(37,99,235,0.12)' : 'rgba(255,255,255,0.02)',
                border:      `1px solid ${d?.isToday ? 'rgba(37,99,235,0.35)' : 'rgba(255,255,255,0.05)'}`,
              }}
            >
              <span className="text-[8px] font-black"
                style={{ color: d?.isToday ? '#06b6d4' : 'rgba(255,255,255,0.30)' }}>
                {label}
              </span>
              <span className="text-[9px] font-bold tabular-nums"
                style={{ color: total > 0 ? 'rgba(255,255,255,0.65)' : 'rgba(255,255,255,0.18)' }}>
                {total > 0 ? fmtMin(total) : '—'}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Trend tab ──────────────────────────────────────────────────────────────────
function TrendView({ trendStats, trendDelta, trend30Total }) {
  const isPositive = trendDelta >= 0

  return (
    <div>
      <div className="text-center py-8">
        <p
          className="text-[50px] font-black leading-none tracking-tighter"
          style={{ color: isPositive ? '#06b6d4' : '#a855f7' }}
        >
          {isPositive ? '+' : '−'}{fmtMin(Math.abs(trendDelta))}
        </p>
        <p className="text-[10px] font-black uppercase tracking-[0.22em] mt-2"
          style={{ color: 'rgba(255,255,255,0.28)' }}>
          {isPositive ? 'More than prev. 2 weeks' : 'Less than prev. 2 weeks'}
        </p>
      </div>

      <div
        className="rounded-2xl p-4 mb-5"
        style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
      >
        <div className="flex items-center justify-between mb-3">
          <p className="text-[9px] font-black uppercase tracking-[0.14em]"
            style={{ color: 'rgba(255,255,255,0.25)' }}>
            30-Day Trend
          </p>
          <span className="text-[10px] font-bold tabular-nums" style={{ color: 'rgba(255,255,255,0.28)' }}>
            {fmtMin(trend30Total)} total
          </span>
        </div>
        <TrendChart trendData={trendStats} />
      </div>

      {/* Stats summary row */}
      <div className="grid grid-cols-2 gap-3">
        <div
          className="rounded-2xl p-4"
          style={{ background: 'rgba(6,182,212,0.06)', border: '1px solid rgba(6,182,212,0.18)' }}
        >
          <p className="text-[9px] font-black uppercase tracking-widest mb-1"
            style={{ color: 'rgba(6,182,212,0.60)' }}>
            Avg / Day
          </p>
          <p className="text-[22px] font-black text-white/85 leading-none tabular-nums">
            {fmtMin(Math.round(trend30Total / 30))}
          </p>
        </div>
        <div
          className="rounded-2xl p-4"
          style={{ background: 'rgba(168,85,247,0.06)', border: '1px solid rgba(168,85,247,0.18)' }}
        >
          <p className="text-[9px] font-black uppercase tracking-widest mb-1"
            style={{ color: 'rgba(168,85,247,0.60)' }}>
            30-Day Total
          </p>
          <p className="text-[22px] font-black text-white/85 leading-none tabular-nums">
            {fmtMin(trend30Total)}
          </p>
        </div>
      </div>
    </div>
  )
}

// ── Main InsightsView ──────────────────────────────────────────────────────────
export default function InsightsView({ onSettings }) {
  const { blocks } = useAppContext()
  const [activeTab, setActiveTab] = useState('Day')
  const today = todayISO()

  // Day stats (live from context)
  const dayStats = useMemo(() => computeDayStats(blocks), [blocks])

  // Week stats (Mon → Sun of current week)
  const weekStats = useMemo(() => {
    const now       = new Date()
    const dayOfWeek = now.getDay()
    const daysToMon = dayOfWeek === 0 ? 6 : dayOfWeek - 1

    return Array.from({ length: 7 }, (_, i) => {
      const d   = new Date(now)
      d.setDate(now.getDate() - daysToMon + i)
      const iso     = d.toISOString().slice(0, 10)
      const isFuture = iso > today
      const isToday  = iso === today

      const dayBlocks = isToday ? blocks : (persistence.getRoutine(iso) ?? [])
      const completed = dayBlocks.filter(b => b.completed)

      const result = { positive: 0, neutral: 0, negative: 0, isFuture, isToday }
      for (const b of completed) {
        result[getBlockType(b)] += blockDuration(b.startTime, b.endTime)
      }
      return result
    })
  }, [blocks, today])

  const weekTotal = weekStats.reduce((s, d) => s + d.positive + d.neutral + d.negative, 0)
  const weekAvg   = Math.round(weekTotal / 7)

  // Trend stats (last 30 days)
  const trendStats = useMemo(() => {
    return lastNDays(30).map(iso => {
      const isT       = iso === today
      const dayBlocks = isT ? blocks : (persistence.getRoutine(iso) ?? [])
      const completed = dayBlocks.filter(b => b.completed)
      const total     = completed.reduce((s, b) => s + blockDuration(b.startTime, b.endTime), 0)
      return { iso, total }
    })
  }, [blocks, today])

  const trend30Total  = trendStats.reduce((s, d) => s + d.total, 0)
  const trend15Prev   = trendStats.slice(0, 15).reduce((s, d) => s + d.total, 0)
  const trend15Recent = trendStats.slice(15).reduce((s, d) => s + d.total, 0)
  const trendDelta    = trend15Recent - trend15Prev

  return (
    <div
      className="w-full min-h-screen"
      style={{ background: 'linear-gradient(to bottom, #0b0b12 0%, #020205 100%)' }}
    >
      {/* ── Header ────────────────────────────────────────────────────────── */}
      <header
        className="px-4 border-b border-white/6"
        style={{
          paddingTop:    'calc(env(safe-area-inset-top, 0px) + 14px)',
          paddingBottom: '14px',
        }}
      >
        <div className="flex items-center justify-between">
          {/* Settings gear */}
          <motion.button
            whileTap={{ scale: 0.87 }}
            onClick={onSettings}
            className="w-10 h-10 flex items-center justify-center rounded-xl border border-white/8 text-white/32"
            style={{ touchAction: 'manipulation' }}
            aria-label="Settings"
          >
            <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </motion.button>

          {/* Title */}
          <h1 className="text-[17px] font-black text-white tracking-tight">Insights</h1>

          {/* Brand conic dot */}
          <div className="w-10 h-10 flex items-center justify-center">
            <div
              className="w-7 h-7 rounded-full"
              style={{
                background: 'conic-gradient(from 180deg at 50% 50%, #06b6d4 0deg, #8b5cf6 120deg, #f97316 240deg, #06b6d4 360deg)',
                boxShadow:  '0 0 12px rgba(139,92,246,0.35)',
              }}
            />
          </div>
        </div>
      </header>

      {/* ── Tab navigation ────────────────────────────────────────────────── */}
      <div className="px-4 pt-4 pb-3">
        <div
          className="flex rounded-full p-1 gap-0.5"
          style={{
            background: 'rgba(255,255,255,0.04)',
            border:     '1px solid rgba(255,255,255,0.07)',
          }}
        >
          {TABS.map(tab => (
            <motion.button
              key={tab}
              whileTap={{ scale: 0.95 }}
              onClick={() => setActiveTab(tab)}
              className="flex-1 py-2 rounded-full text-[12px] font-bold transition-all duration-200"
              style={{
                background: activeTab === tab ? '#2563eb' : 'transparent',
                color:      activeTab === tab ? '#fff'    : 'rgba(255,255,255,0.35)',
                boxShadow:  activeTab === tab ? '0 2px 14px rgba(37,99,235,0.45)' : 'none',
              }}
            >
              {tab}
            </motion.button>
          ))}
        </div>

        {/* Period label */}
        <div className="flex items-center gap-1.5 mt-3">
          <svg
            className="w-3.5 h-3.5"
            style={{ color: 'rgba(255,255,255,0.25)' }}
            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          <span
            className="text-[10px] font-black uppercase tracking-[0.18em]"
            style={{ color: 'rgba(255,255,255,0.30)' }}
          >
            {activeTab === 'Day'  ? 'Today'
           : activeTab === 'Week' ? 'This Week'
           :                        'Last 30 Days'}
          </span>
        </div>
      </div>

      {/* ── Tab content ───────────────────────────────────────────────────── */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.18, ease: 'easeOut' }}
          className="px-4 pb-32"
        >
          {activeTab === 'Day'   && <DayView   stats={dayStats} />}
          {activeTab === 'Week'  && <WeekView  weekStats={weekStats} weekTotal={weekTotal} weekAvg={weekAvg} />}
          {activeTab === 'Trend' && <TrendView trendStats={trendStats} trendDelta={trendDelta} trend30Total={trend30Total} />}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
