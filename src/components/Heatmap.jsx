import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { lastNDays } from '../store'

const VIEW_OPTIONS = [
  { key: '7',   label: '7D',  days: 7   },
  { key: '30',  label: '30D', days: 30  },
  { key: '90',  label: '90D', days: 90  },
  { key: '180', label: '6M',  days: 180 },
]

const DAY_LABELS = ['', 'M', '', 'W', '', 'F', '']

/** Maps focus minutes → visual intensity 0-4 */
function intensity(minutes) {
  if (!minutes || minutes === 0) return 0
  if (minutes < 30)  return 1
  if (minutes < 60)  return 2
  if (minutes < 120) return 3
  return 4
}

const CELL_COLORS = [
  'rgba(255,255,255,0.04)',  // 0 – empty
  '#1e3a2f',                 // 1 – faint
  '#166534',                 // 2 – low
  '#16a34a',                 // 3 – mid
  '#4ade80',                 // 4 – max
]

const GLOW = [
  'none',
  'none',
  'none',
  '0 0 6px rgba(22,163,74,0.4)',
  '0 0 10px rgba(74,222,128,0.6)',
]

export default function Heatmap({ activity }) {
  const [view, setView] = useState('90')
  const [tooltip, setTooltip] = useState(null) // { date, minutes, x, y }

  const days = VIEW_OPTIONS.find(v => v.key === view).days

  const grid = useMemo(() => {
    const dates = lastNDays(days)
    // Pad so we start on Monday
    const firstDate = new Date(dates[0])
    const startDow  = firstDate.getDay() // 0=Sun…6=Sat
    const padBefore = startDow === 0 ? 6 : startDow - 1 // ISO week: Mon=0
    const cells = Array.from({ length: padBefore }, () => null).concat(
      dates.map(d => ({ date: d, minutes: activity[d] ?? 0 }))
    )
    // Split into weeks (columns)
    const weeks = []
    for (let i = 0; i < cells.length; i += 7) {
      weeks.push(cells.slice(i, i + 7))
    }
    return weeks
  }, [days, activity])

  // Month labels for the top axis
  const monthLabels = useMemo(() => {
    const labels = []
    let lastMonth = -1
    grid.forEach((week, wi) => {
      const firstReal = week.find(c => c !== null)
      if (!firstReal) return
      const m = new Date(firstReal.date).getMonth()
      if (m !== lastMonth) {
        labels.push({ wi, label: new Date(firstReal.date).toLocaleDateString('en-US', { month: 'short' }) })
        lastMonth = m
      }
    })
    return labels
  }, [grid])

  const totalMinutes = useMemo(() =>
    Object.values(activity).reduce((s, v) => s + v, 0), [activity])
  const activeDays   = Object.values(activity).filter(v => v > 0).length

  return (
    <div className="px-4 py-4">
      {/* Section header */}
      <div className="flex items-center justify-between mb-3">
        <div>
          <h2 className="text-[12px] font-bold uppercase tracking-widest text-white/40">Lock-in Activity</h2>
          <p className="text-[10px] text-white/20 mt-0.5 tabular-nums">{activeDays} active days · {Math.round(totalMinutes / 60)}h total</p>
        </div>

        {/* View toggle */}
        <div className="flex items-center gap-0.5 bg-white/[0.04] rounded-lg p-0.5 border border-white/[0.06]">
          {VIEW_OPTIONS.map(opt => (
            <button
              key={opt.key}
              onClick={() => setView(opt.key)}
              className={`px-2.5 py-1 rounded-md text-[10px] font-bold transition-all duration-150 ${
                view === opt.key
                  ? 'bg-white/10 text-white'
                  : 'text-white/30 hover:text-white/60'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Month labels */}
      <div className="flex mb-1 ml-5" style={{ gap: '3px' }}>
        {grid.map((_, wi) => {
          const ml = monthLabels.find(m => m.wi === wi)
          return (
            <div key={wi} className="text-[9px] text-white/25 font-medium" style={{ width: 10, minWidth: 10 }}>
              {ml ? ml.label : ''}
            </div>
          )
        })}
      </div>

      {/* Grid */}
      <div className="flex items-start" style={{ gap: '3px' }}>
        {/* Day-of-week labels */}
        <div className="flex flex-col mr-1" style={{ gap: '3px' }}>
          {DAY_LABELS.map((l, i) => (
            <div key={i} className="text-[9px] text-white/20 flex items-center justify-end pr-1" style={{ height: 10, width: 14 }}>
              {l}
            </div>
          ))}
        </div>

        {/* Cells */}
        <div className="flex overflow-x-auto pb-1" style={{ gap: '3px', WebkitOverflowScrolling: 'touch', scrollbarWidth: 'none' }}>
          {grid.map((week, wi) => (
            <div key={wi} className="flex flex-col shrink-0" style={{ gap: '3px' }}>
              {week.map((cell, di) => {
                if (!cell) {
                  return <div key={di} style={{ width: 10, height: 10 }} />
                }
                const lvl = intensity(cell.minutes)
                return (
                  <motion.div
                    key={di}
                    className="rounded-[2px] cursor-pointer"
                    style={{
                      width: 10, height: 10,
                      background: CELL_COLORS[lvl],
                      boxShadow: GLOW[lvl],
                    }}
                    whileHover={{ scale: 1.4 }}
                    transition={{ duration: 0.12 }}
                    onMouseEnter={(e) => setTooltip({ ...cell, el: e.currentTarget })}
                    onMouseLeave={() => setTooltip(null)}
                    role="gridcell"
                    aria-label={`${cell.date}: ${cell.minutes} minutes`}
                  />
                )
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Tooltip */}
      {tooltip && (
        <div className="mt-2 flex items-center gap-2 text-[11px] text-white/50 tabular-nums">
          <div className="w-2 h-2 rounded-[2px]" style={{ background: CELL_COLORS[intensity(tooltip.minutes)] }} />
          <span className="font-mono">{tooltip.date}</span>
          <span className="text-white/30">·</span>
          <span className="text-white/70 font-semibold">{tooltip.minutes} min</span>
        </div>
      )}

      {/* Legend */}
      <div className="flex items-center justify-end gap-1.5 mt-2">
        <span className="text-[9px] text-white/20">Less</span>
        {CELL_COLORS.map((c, i) => (
          <div key={i} className="w-[9px] h-[9px] rounded-[2px]" style={{ background: c }} />
        ))}
        <span className="text-[9px] text-white/20">More</span>
      </div>
    </div>
  )
}
