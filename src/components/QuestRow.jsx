import { motion, AnimatePresence } from 'framer-motion'
import { CATEGORIES, PRIORITY, XP_PER_TASK } from '../store'

/** Particle burst when a quest is completed */
function CompletionBurst() {
  const particles = Array.from({ length: 8 }, (_, i) => ({
    angle: (i / 8) * 360,
    dist: 18 + Math.random() * 14,
  }))

  return (
    <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
      {particles.map((p, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 rounded-full"
          style={{ background: '#ec4899' }}
          initial={{ opacity: 1, x: 0, y: 0, scale: 1 }}
          animate={{
            opacity: 0,
            x: Math.cos((p.angle * Math.PI) / 180) * p.dist,
            y: Math.sin((p.angle * Math.PI) / 180) * p.dist,
            scale: 0,
          }}
          transition={{ duration: 0.55, ease: 'easeOut' }}
        />
      ))}
    </div>
  )
}

export default function QuestRow({ task, onToggle, onDelete, index }) {
  const cat = CATEGORIES[task.category] ?? CATEGORIES.other
  const pri = PRIORITY[task.priority]  ?? PRIORITY.medium

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -24, transition: { duration: 0.2 } }}
      transition={{ delay: index * 0.03, duration: 0.25 }}
      className="group relative flex items-center gap-3 px-3 py-2.5 rounded-xl border transition-colors duration-200 select-none cursor-pointer active:scale-[0.985]"
      style={{
        borderColor: task.completed ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.07)',
        background: task.completed ? 'rgba(255,255,255,0.015)' : 'rgba(255,255,255,0.03)',
      }}
      onClick={onToggle}
      role="checkbox"
      aria-checked={task.completed}
      tabIndex={0}
      onKeyDown={(e) => e.key === ' ' && (e.preventDefault(), onToggle())}
    >
      {/* Left accent bar */}
      <div
        className="absolute left-0 top-2 bottom-2 w-[2px] rounded-full transition-opacity duration-300"
        style={{ background: cat.accent, opacity: task.completed ? 0.2 : 0.7 }}
      />

      {/* Check circle */}
      <div className="relative shrink-0">
        <motion.div
          className="w-[22px] h-[22px] rounded-full border-2 flex items-center justify-center transition-all duration-200"
          style={{
            borderColor: task.completed ? cat.accent : 'rgba(255,255,255,0.18)',
            background:   task.completed ? cat.accent : 'transparent',
          }}
          whileTap={{ scale: 0.85 }}
        >
          <AnimatePresence>
            {task.completed && (
              <motion.svg
                key="check"
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                transition={{ duration: 0.18, ease: 'backOut' }}
                className="w-3 h-3 text-black"
                fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3.5}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </motion.svg>
            )}
          </AnimatePresence>
        </motion.div>
        <AnimatePresence>{task.completed && <CompletionBurst />}</AnimatePresence>
      </div>

      {/* Category icon */}
      <span className="shrink-0 text-[14px] leading-none" aria-hidden>{cat.icon}</span>

      {/* Task text */}
      <div className="flex-1 min-w-0">
        <p className={`text-[13px] font-semibold leading-tight truncate transition-all duration-300 ${task.completed ? 'text-white/25 line-through' : 'text-white/90'}`}>
          {task.text}
        </p>
      </div>

      {/* Priority badge */}
      <div
        className="shrink-0 w-[18px] h-[18px] rounded flex items-center justify-center text-[9px] font-black"
        style={{ background: pri.color + '22', color: pri.color, border: `1px solid ${pri.color}40` }}
        aria-label={`Priority ${task.priority}`}
      >
        {pri.label}
      </div>

      {/* XP pill */}
      <div className={`shrink-0 px-2 py-0.5 rounded-md text-[10px] font-bold border transition-opacity duration-300 ${task.completed ? 'opacity-25' : 'opacity-90'}`}
        style={{ color: cat.accent, borderColor: cat.accent + '40', background: cat.accent + '12' }}>
        +{XP_PER_TASK}
      </div>

      {/* Delete button – visible on hover/focus */}
      <button
        onClick={(e) => { e.stopPropagation(); onDelete() }}
        className="shrink-0 w-5 h-5 rounded flex items-center justify-center text-white/15 hover:text-red-400 hover:bg-red-400/10 transition-all duration-150 opacity-0 group-hover:opacity-100 focus:opacity-100"
        aria-label="Delete quest"
        tabIndex={-1}
      >
        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </motion.div>
  )
}
