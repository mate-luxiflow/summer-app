import { useState, useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import XPHeader      from '../components/XPHeader'
import QuestRow      from '../components/QuestRow'
import AddQuestBar   from '../components/AddQuestBar'
import EpicQuestCard from '../components/EpicQuestCard'
import Heatmap       from '../components/Heatmap'
import {
  persistence, todayISO, seedActivityIfEmpty,
  getDefaultPolarity, getTaskXpDelta, getTaskFocusDelta,
} from '../store'

seedActivityIfEmpty()

let _nextId = Math.max(0, ...persistence.getTasks().map(t => t.id ?? 0)) + 1

export default function Dashboard() {
  const [tasks,    setTasks]    = useState(persistence.getTasks)
  const [totalXp,  setTotalXp]  = useState(persistence.getXp)
  const [focusMin, setFocusMin] = useState(persistence.getFocusMin)
  const [activity, setActivity] = useState(persistence.getActivity)

  useEffect(() => { persistence.setTasks(tasks) },    [tasks])
  useEffect(() => { persistence.setXp(totalXp) },     [totalXp])
  useEffect(() => { persistence.setFocusMin(focusMin) }, [focusMin])
  useEffect(() => { persistence.setActivity(activity) }, [activity])

  // Egymást követő napos streak
  const streak = (() => {
    let count = 0; const d = new Date()
    for (let i = 0; i < 365; i++) {
      const iso = d.toISOString().slice(0, 10)
      if (activity[iso]) { count++; d.setDate(d.getDate() - 1) } else break
    }
    return count
  })()

  function addTask({ text, category, priority, polarity, isEpic = false, dueDate = null, createdDate = null }) {
    const id = _nextId++
    const resolvedPolarity = polarity ?? getDefaultPolarity(category)
    setTasks(prev => [{
      id, text, category, priority,
      polarity: resolvedPolarity,
      completed: false,
      isEpic,
      dueDate:     isEpic ? dueDate    : null,
      createdDate: isEpic ? createdDate : null,
    }, ...prev])
  }

  function toggleTask(id) {
    setTasks(prev => prev.map(t => {
      if (t.id !== id) return t
      const polarity = t.polarity ?? 'neutral'
      const nowDone  = !t.completed
      const xpDelta    = getTaskXpDelta(polarity)
      const focusDelta = getTaskFocusDelta(polarity)

      if (nowDone) {
        setTotalXp(xp  => Math.max(0, xp + xpDelta))
        setFocusMin(f  => Math.max(0, f + focusDelta))
        const today = todayISO()
        setActivity(act => ({ ...act, [today]: (act[today] ?? 0) + 5 }))
      } else {
        // Visszavonás: az eredeti XP/focus visszafordul
        setTotalXp(xp  => Math.max(0, xp - xpDelta))
        setFocusMin(f  => Math.max(0, f - focusDelta))
      }
      return { ...t, completed: nowDone }
    }))
  }

  /**
   * Inline polarity override — ha a task már kész, az XP/focus értékeket
   * azonnal újraszámolja (régi polaritás visszafordul, új hozzáadódik).
   */
  function overridePolarity(id, newPolarity) {
    setTasks(prev => prev.map(t => {
      if (t.id !== id) return t
      const oldPolarity = t.polarity ?? 'neutral'
      if (oldPolarity === newPolarity) return t

      if (t.completed) {
        const oldXp    = getTaskXpDelta(oldPolarity)
        const newXp    = getTaskXpDelta(newPolarity)
        setTotalXp(xp  => Math.max(0, xp - oldXp + newXp))

        const oldFocus = getTaskFocusDelta(oldPolarity)
        const newFocus = getTaskFocusDelta(newPolarity)
        setFocusMin(f  => Math.max(0, f - oldFocus + newFocus))
      }
      return { ...t, polarity: newPolarity }
    }))
  }

  function deleteTask(id) {
    setTasks(prev => {
      const task = prev.find(t => t.id === id)
      if (task?.completed) {
        setTotalXp(xp  => Math.max(0, xp - getTaskXpDelta(task.polarity ?? 'neutral')))
        setFocusMin(f  => Math.max(0, f  - getTaskFocusDelta(task.polarity ?? 'neutral')))
      }
      return prev.filter(t => t.id !== id)
    })
  }

  const epicPending    = tasks.filter(t =>  t.isEpic && !t.completed)
  const regularPending = tasks.filter(t => !t.isEpic && !t.completed)
  const allCompleted   = tasks.filter(t =>  t.completed)

  return (
    <div className="w-full bg-[#0a0a0f]">

      {/* 1. XP fejléc */}
      <XPHeader
        totalXp={totalXp}
        focusMin={focusMin}
        completedCount={allCompleted.length}
        totalCount={tasks.length}
        streak={streak}
      />

      {/* 2. Quest hozzáadó sáv — jobbkezes hüvelyk-zónában */}
      <AddQuestBar onAdd={addTask} />

      {/* 3. Epic Quests — pinned, a rendes lista felett ──────────────────── */}
      <AnimatePresence>
        {epicPending.length > 0 && (
          <motion.section
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25 }}
            className="px-4 pt-3 pb-1 overflow-hidden"
            aria-label="Epic Quests"
          >
            {/* Section divider */}
            <div className="flex items-center gap-2 mb-2.5">
              <div className="flex-1 h-px" style={{ background: 'linear-gradient(90deg, #f59e0b40, transparent)' }} />
              <span className="text-[8px] font-black uppercase tracking-[0.15em] text-amber-500/55">
                ⚡ Epic Quests
              </span>
              <div className="flex-1 h-px" style={{ background: 'linear-gradient(270deg, #f59e0b40, transparent)' }} />
            </div>

            <AnimatePresence mode="popLayout">
              {epicPending.map(task => (
                <EpicQuestCard
                  key={task.id}
                  task={task}
                  onToggle={() => toggleTask(task.id)}
                  onDelete={() => deleteTask(task.id)}
                  onPolarityChange={p => overridePolarity(task.id, p)}
                />
              ))}
            </AnimatePresence>
          </motion.section>
        )}
      </AnimatePresence>

      {/* 4. Daily quest lista — min-h-[50vh] garantálja a görgethetőséget ── */}
      <section className="px-4 pt-3 pb-2 min-h-[50vh]" aria-label="Daily Quests">
        {tasks.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="text-4xl mb-3 opacity-40">⚡</div>
            <p className="text-white/25 text-[13px] leading-relaxed">
              No quests yet.<br />
              Pick a preset above or type a custom one to begin your grind.
            </p>
          </div>
        )}

        {regularPending.length === 0 && epicPending.length > 0 && (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <p className="text-white/18 text-[12px]">No daily quests — only epics active.</p>
          </div>
        )}

        <AnimatePresence mode="popLayout">
          {regularPending.map((task, i) => (
            <div key={task.id} className="mb-2">
              <QuestRow
                task={task}
                index={i}
                onToggle={() => toggleTask(task.id)}
                onDelete={() => deleteTask(task.id)}
                onPolarityChange={p => overridePolarity(task.id, p)}
              />
            </div>
          ))}
        </AnimatePresence>

        {allCompleted.length > 0 && (
          <CompletedSection
            tasks={allCompleted}
            onToggle={toggleTask}
            onDelete={deleteTask}
            onPolarityChange={overridePolarity}
          />
        )}
      </section>

      {/* 5. Heatmap — alul, bőséges pb a fixed nav miatt */}
      <div className="border-t border-white/5 mt-2 pb-32">
        <Heatmap activity={activity} />
      </div>
    </div>
  )
}

// ── Teljesített szekció ────────────────────────────────────────────────────────
function CompletedSection({ tasks, onToggle, onDelete, onPolarityChange }) {
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
                    onPolarityChange={p => onPolarityChange(task.id, p)}
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
