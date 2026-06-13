import { useState, useEffect, useRef } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import XPHeader    from '../components/XPHeader'
import QuestRow    from '../components/QuestRow'
import AddQuestBar from '../components/AddQuestBar'
import Heatmap     from '../components/Heatmap'
import {
  persistence, todayISO, XP_PER_TASK, CATEGORIES, seedActivityIfEmpty
} from '../store'

// Seed demo heatmap data on first launch
seedActivityIfEmpty()

let _nextId = Math.max(0, ...persistence.getTasks().map(t => t.id ?? 0)) + 1

export default function Dashboard() {
  const [tasks,    setTasks]    = useState(persistence.getTasks)
  const [totalXp,  setTotalXp]  = useState(persistence.getXp)
  const [activity, setActivity] = useState(persistence.getActivity)

  // Persist on every change
  useEffect(() => { persistence.setTasks(tasks) },    [tasks])
  useEffect(() => { persistence.setXp(totalXp) },     [totalXp])
  useEffect(() => { persistence.setActivity(activity) }, [activity])

  // ── Streak calculation ───────────────────────────────────────────────
  const streak = (() => {
    let count = 0
    const d = new Date()
    for (let i = 0; i < 365; i++) {
      const iso = d.toISOString().slice(0, 10)
      if (activity[iso]) { count++; d.setDate(d.getDate() - 1) }
      else break
    }
    return count
  })()

  // ── Quest actions ────────────────────────────────────────────────────
  function addTask({ text, category, priority }) {
    const id = _nextId++
    setTasks(prev => [{ id, text, category, priority, completed: false }, ...prev])
  }

  function toggleTask(id) {
    setTasks(prev => prev.map(t => {
      if (t.id !== id) return t
      const nowDone = !t.completed
      setTotalXp(xp => Math.max(0, xp + (nowDone ? XP_PER_TASK : -XP_PER_TASK)))
      // Log activity minutes proxy: treat each completion as +5 min focus
      if (nowDone) {
        const today = todayISO()
        setActivity(act => ({ ...act, [today]: (act[today] ?? 0) + 5 }))
      }
      return { ...t, completed: nowDone }
    }))
  }

  function deleteTask(id) {
    setTasks(prev => {
      const task = prev.find(t => t.id === id)
      if (task?.completed) setTotalXp(xp => Math.max(0, xp - XP_PER_TASK))
      return prev.filter(t => t.id !== id)
    })
  }

  const completed  = tasks.filter(t => t.completed)
  const pending    = tasks.filter(t => !t.completed)

  return (
    <div className="h-screen w-full flex flex-col overflow-hidden bg-[#0a0a0f]">
      <XPHeader
        totalXp={totalXp}
        completedCount={completed.length}
        totalCount={tasks.length}
        streak={streak}
      />

      {/* ── Scrollable body ── */}
      <main className="flex-1 overflow-y-auto overscroll-contain" style={{ WebkitOverflowScrolling: 'touch' }}>

        {/* Quest list */}
        <section className="px-4 pt-4 pb-2" aria-label="Daily Quests">
          {/* Category filter bar */}
          <CategoryFilter tasks={tasks} />

          {/* Empty state */}
          {tasks.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="text-4xl mb-3 opacity-40">⚡</div>
              <p className="text-white/25 text-[13px] leading-relaxed">
                No quests loaded.<br />Add one below to begin your grind.
              </p>
            </div>
          )}

          {/* Pending quests */}
          <AnimatePresence mode="popLayout">
            {pending.map((task, i) => (
              <div key={task.id} className="mb-2">
                <QuestRow
                  task={task}
                  index={i}
                  onToggle={() => toggleTask(task.id)}
                  onDelete={() => deleteTask(task.id)}
                />
              </div>
            ))}
          </AnimatePresence>

          {/* Completed quests (collapsible) */}
          {completed.length > 0 && (
            <CompletedSection tasks={completed} onToggle={toggleTask} onDelete={deleteTask} />
          )}
        </section>

        {/* Heatmap */}
        <div className="border-t border-white/[0.05] mt-2">
          <Heatmap activity={activity} />
        </div>

        {/* Bottom spacer so last item isn't hidden by input bar */}
        <div className="h-4" />
      </main>

      <AddQuestBar onAdd={addTask} />
    </div>
  )
}

// ── Category filter chip bar ─────────────────────────────────────────────────
function CategoryFilter({ tasks }) {
  const [active, setActive] = useState(null)

  const counts = tasks.reduce((acc, t) => {
    acc[t.category] = (acc[t.category] ?? 0) + 1
    return acc
  }, {})

  const usedCategories = Object.entries(CATEGORIES).filter(([k]) => counts[k])

  if (usedCategories.length < 2) return null

  return (
    <div className="flex gap-1.5 mb-3 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
      <button
        onClick={() => setActive(null)}
        className={`shrink-0 px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-all ${
          active === null
            ? 'border-white/20 bg-white/10 text-white'
            : 'border-white/[0.06] text-white/25 hover:text-white/50'
        }`}
      >
        All · {tasks.length}
      </button>
      {usedCategories.map(([key, cat]) => (
        <button
          key={key}
          onClick={() => setActive(active === key ? null : key)}
          className="shrink-0 flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-all"
          style={{
            borderColor: active === key ? cat.accent : 'rgba(255,255,255,0.06)',
            background:  active === key ? cat.accent + '20' : 'transparent',
            color:       active === key ? cat.accent : 'rgba(255,255,255,0.25)',
          }}
        >
          <span>{cat.icon}</span>
          <span>{cat.label} · {counts[key]}</span>
        </button>
      ))}
    </div>
  )
}

// ── Completed section ────────────────────────────────────────────────────────
function CompletedSection({ tasks, onToggle, onDelete }) {
  const [open, setOpen] = useState(false)

  return (
    <div className="mt-3">
      <button
        onClick={() => setOpen(v => !v)}
        className="flex items-center gap-2 w-full text-left mb-2 group"
        aria-expanded={open}
      >
        <motion.div animate={{ rotate: open ? 90 : 0 }} transition={{ duration: 0.18 }}>
          <svg className="w-3 h-3 text-white/20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </motion.div>
        <span className="text-[10px] font-bold uppercase tracking-widest text-white/20 group-hover:text-white/40 transition-colors">
          Completed · {tasks.length}
        </span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.22 }}
            className="overflow-hidden"
          >
            <AnimatePresence mode="popLayout">
              {tasks.map((task, i) => (
                <div key={task.id} className="mb-2">
                  <QuestRow task={task} index={i} onToggle={() => onToggle(task.id)} onDelete={() => onDelete(task.id)} />
                </div>
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
