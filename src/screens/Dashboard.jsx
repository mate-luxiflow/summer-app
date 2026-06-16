import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import XPHeader      from '../components/XPHeader'
import QuestRow      from '../components/QuestRow'
import AddQuestBar   from '../components/AddQuestBar'
import EpicQuestCard from '../components/EpicQuestCard'
import { useAppContext } from '../context/AppContext'

export default function Dashboard() {
  const {
    tasks, totalXp, focusMin, activity,
    addTask, toggleTask, overridePolarity, deleteTask,
  } = useAppContext()

  const streak = (() => {
    let count = 0; const d = new Date()
    for (let i = 0; i < 365; i++) {
      const iso = d.toISOString().slice(0, 10)
      if (activity[iso]) { count++; d.setDate(d.getDate() - 1) } else break
    }
    return count
  })()

  const epicPending    = tasks.filter(t =>  t.isEpic && !t.completed)
  const regularPending = tasks.filter(t => !t.isEpic && !t.completed)
  const allCompleted   = tasks.filter(t =>  t.completed)

  // Per-quest XP display value: 30 XP pool ÷ total non-epic quests
  const nonEpicCount = tasks.filter(t => !t.isEpic).length
  const perQuestXp   = nonEpicCount > 0 ? Math.round(30 / nonEpicCount) : 0

  return (
    <div className="w-full bg-[#0a0a0f]">

      <XPHeader
        totalXp={totalXp}
        focusMin={focusMin}
        completedCount={allCompleted.length}
        totalCount={tasks.length}
        streak={streak}
      />

      <AddQuestBar onAdd={addTask} />

      {/* Epic Quests — pinned above daily list */}
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

      {/* Daily Quest list — min-h-[50vh] preserves scroll space above bottom nav */}
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
                xpValue={perQuestXp}
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
            perQuestXp={perQuestXp}
            onToggle={toggleTask}
            onDelete={deleteTask}
            onPolarityChange={overridePolarity}
          />
        )}
      </section>
    </div>
  )
}

function CompletedSection({ tasks, perQuestXp, onToggle, onDelete, onPolarityChange }) {
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
                    xpValue={perQuestXp}
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
