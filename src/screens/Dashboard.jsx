import { useState, useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import XPHeader    from '../components/XPHeader'
import QuestRow    from '../components/QuestRow'
import AddQuestBar from '../components/AddQuestBar'
import Heatmap     from '../components/Heatmap'
import {
  persistence, todayISO, XP_PER_TASK, seedActivityIfEmpty,
} from '../store'

seedActivityIfEmpty()

let _nextId = Math.max(0, ...persistence.getTasks().map(t => t.id ?? 0)) + 1

export default function Dashboard() {
  const [tasks,    setTasks]    = useState(persistence.getTasks)
  const [totalXp,  setTotalXp]  = useState(persistence.getXp)
  const [activity, setActivity] = useState(persistence.getActivity)

  useEffect(() => { persistence.setTasks(tasks) },       [tasks])
  useEffect(() => { persistence.setXp(totalXp) },        [totalXp])
  useEffect(() => { persistence.setActivity(activity) }, [activity])

  // Consecutive-day streak
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

  function addTask({ text, category, priority }) {
    const id = _nextId++
    setTasks(prev => [{ id, text, category, priority, completed: false }, ...prev])
  }

  function toggleTask(id) {
    setTasks(prev => prev.map(t => {
      if (t.id !== id) return t
      const nowDone = !t.completed
      setTotalXp(xp => Math.max(0, xp + (nowDone ? XP_PER_TASK : -XP_PER_TASK)))
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

  const completed = tasks.filter(t =>  t.completed)
  const pending   = tasks.filter(t => !t.completed)

  return (
    // Free-flowing container — no height lock, scrolls with the page
    <div className="w-full bg-[#0a0a0f]">

      {/* 1. XP Header */}
      <XPHeader
        totalXp={totalXp}
        completedCount={completed.length}
        totalCount={tasks.length}
        streak={streak}
      />

      {/* 2. Add Quest Bar — immediately below the header, above the list */}
      <AddQuestBar onAdd={addTask} />

      {/* 3. Daily Quests */}
      <section className="px-4 pt-3 pb-2" aria-label="Daily Quests">
        {tasks.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="text-4xl mb-3 opacity-40">⚡</div>
            <p className="text-white/25 text-[13px] leading-relaxed">
              No quests yet.<br />
              Pick a preset above or type a custom one to begin your grind.
            </p>
          </div>
        )}

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

        {completed.length > 0 && (
          <CompletedSection tasks={completed} onToggle={toggleTask} onDelete={deleteTask} />
        )}
      </section>

      {/* 4. Lock-In Activity Heatmap — at the bottom, comfortably scrollable */}
      <div className="border-t border-white/5 mt-2 pb-8">
        <Heatmap activity={activity} />
      </div>
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
                  <QuestRow
                    task={task}
                    index={i}
                    onToggle={() => onToggle(task.id)}
                    onDelete={() => onDelete(task.id)}
                  />
                </div>
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
