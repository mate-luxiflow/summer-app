import { useState, useEffect, useRef } from 'react'

const CARD_COLORS = [
  'from-orange-500 to-pink-500',
  'from-violet-500 to-indigo-500',
  'from-cyan-500 to-blue-500',
  'from-emerald-500 to-teal-500',
  'from-rose-500 to-orange-500',
  'from-fuchsia-500 to-violet-500',
]

const INITIAL_TASKS = [
  { id: 1, text: 'Morning workout', completed: true,  color: CARD_COLORS[0] },
  { id: 2, text: 'Read 30 pages',   completed: false, color: CARD_COLORS[1] },
  { id: 3, text: 'Cold shower',     completed: false, color: CARD_COLORS[2] },
]

const XP_PER_TASK  = 15
const XP_PER_LEVEL = 100

function getRank(level) {
  if (level <= 3)  return 'Summer Novice'
  if (level <= 7)  return 'Consistency King'
  if (level <= 15) return 'Productive Grinder'
  return 'Summer Legend'
}

function getLevelInfo(totalXp) {
  const level      = Math.floor(totalXp / XP_PER_LEVEL) + 1
  const xpIntoLevel = totalXp % XP_PER_LEVEL
  const xpProgress  = Math.round((xpIntoLevel / XP_PER_LEVEL) * 100)
  return { level, xpIntoLevel, xpProgress }
}

function TaskCard({ task, onToggle }) {
  return (
    <div
      className="flex items-center gap-4 rounded-2xl border border-gray-800 bg-gray-800/60 backdrop-blur-sm p-4 active:scale-[0.98] transition-transform cursor-pointer select-none"
      onClick={onToggle}
    >
      <div
        className={`shrink-0 w-14 h-14 rounded-full border-2 flex items-center justify-center transition-all duration-300
          ${task.completed
            ? `bg-gradient-to-br ${task.color} border-transparent shadow-lg`
            : 'border-gray-600 bg-gray-900'
          }`}
      >
        {task.completed && (
          <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <p className={`font-semibold text-base leading-tight truncate transition-colors duration-300 ${task.completed ? 'line-through text-gray-500' : 'text-white'}`}>
          {task.text}
        </p>
        <p className="text-gray-500 text-xs mt-0.5">{task.completed ? 'Quest complete!' : 'Tap to complete'}</p>
      </div>

      <div className={`shrink-0 px-2.5 py-1 rounded-full text-xs font-bold bg-gradient-to-r ${task.color} text-white shadow transition-opacity duration-300 ${task.completed ? 'opacity-40' : 'opacity-100'}`}>
        +{XP_PER_TASK} XP
      </div>
    </div>
  )
}

function loadTasks() {
  try {
    const saved = localStorage.getItem('sg_tasks')
    return saved ? JSON.parse(saved) : []
  } catch {
    return []
  }
}

function loadXp() {
  const saved = localStorage.getItem('sg_xp')
  const parsed = Number(saved)
  return Number.isFinite(parsed) ? parsed : 0
}

let nextId = Math.max(0, ...loadTasks().map(t => t.id)) + 1

export default function App() {
  const [tasks, setTasks] = useState(loadTasks)
  const [totalXp, setTotalXp] = useState(loadXp)
  const [input, setInput]  = useState('')
  const inputRef           = useRef(null)

  useEffect(() => { localStorage.setItem('sg_tasks', JSON.stringify(tasks)) }, [tasks])
  useEffect(() => { localStorage.setItem('sg_xp',    String(totalXp))       }, [totalXp])

  const { level, xpIntoLevel, xpProgress } = getLevelInfo(totalXp)
  const rank = getRank(level)

  const completedCount = tasks.filter(t => t.completed).length
  const taskProgress   = tasks.length === 0 ? 0 : Math.round((completedCount / tasks.length) * 100)

  function addTask() {
    const text = input.trim()
    if (!text) return
    const color = CARD_COLORS[nextId % CARD_COLORS.length]
    setTasks(prev => [{ id: nextId++, text, completed: false, color }, ...prev])
    setInput('')
    inputRef.current?.focus()
  }

  function toggleTask(id) {
    setTasks(prev => prev.map(t => {
      if (t.id !== id) return t
      const nowDone = !t.completed
      setTotalXp(xp => Math.max(0, xp + (nowDone ? XP_PER_TASK : -XP_PER_TASK)))
      return { ...t, completed: nowDone }
    }))
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter') addTask()
  }

  return (
    <div className="h-screen w-full overflow-hidden flex flex-col bg-gray-900 text-white">

      {/* ── HEADER ── */}
      <header className="shrink-0 px-5 pt-12 pb-5 border-b border-gray-800 bg-gray-900/80 backdrop-blur-md">
        {/* Title row */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-orange-400 via-pink-400 to-violet-400 bg-clip-text text-transparent">
              Summer Grind
            </h1>
            <p className="text-gray-400 text-sm mt-0.5">Today · Jun 11</p>
          </div>
          {/* Level badge */}
          <div className="flex flex-col items-center justify-center w-14 h-14 rounded-2xl border border-gray-700 bg-gray-800 shadow-lg">
            <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider leading-none">LVL</span>
            <span className="text-2xl font-extrabold bg-linear-to-b from-orange-300 to-pink-400 bg-clip-text text-transparent leading-tight">
              {level}
            </span>
          </div>
        </div>

        {/* Rank label + total XP */}
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs font-bold text-pink-400 uppercase tracking-widest">{rank}</span>
          <span className="text-xs font-semibold text-gray-400">{totalXp} XP total</span>
        </div>

        {/* XP-to-next-level bar */}
        <div className="h-2.5 w-full rounded-full bg-gray-800 overflow-hidden mb-1">
          <div
            className="h-full rounded-full bg-gradient-to-r from-orange-400 via-pink-400 to-violet-500 transition-all duration-500"
            style={{
              width: `${xpProgress}%`,
              boxShadow: xpProgress > 0 ? '0 0 12px 2px rgba(251,146,60,0.7), 0 0 4px 1px rgba(236,72,153,0.5)' : 'none',
            }}
          />
        </div>
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-gray-600">Level {level}</span>
          <span className="text-[10px] text-gray-500">{xpIntoLevel} / {XP_PER_LEVEL} XP</span>
          <span className="text-[10px] text-gray-600">Level {level + 1}</span>
        </div>

        {/* Divider */}
        <div className="mt-4 mb-0 border-t border-gray-800" />

        {/* Daily task progress bar */}
        <div className="mt-3">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-widest">Daily Quests</span>
            <span className="text-xs font-semibold text-gray-400">{completedCount} / {tasks.length} done</span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-gray-800 overflow-hidden">
            <div
              className="h-full rounded-full bg-linear-to-r from-emerald-400 to-cyan-400 transition-all duration-500"
              style={{ width: `${taskProgress}%` }}
            />
          </div>
        </div>
      </header>

      {/* ── TASK LIST ── */}
      <main className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {tasks.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <p className="text-4xl mb-3">🌞</p>
            <p className="text-gray-400 text-sm">No quests yet.<br />Add one below to start your grind.</p>
          </div>
        )}

        {tasks.map(task => (
          <TaskCard key={task.id} task={task} onToggle={() => toggleTask(task.id)} />
        ))}

        <div className="h-2" />
      </main>

      {/* ── BOTTOM BAR ── */}
      <div className="shrink-0 px-4 pb-8 pt-3 border-t border-gray-800 bg-gray-900/90 backdrop-blur-md">
        <div className="flex gap-3 items-center">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Add a new quest…"
            className="flex-1 rounded-2xl border border-gray-700 bg-gray-800 px-4 py-3 text-sm text-white placeholder-gray-500 outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500/40 transition"
          />
          <button
            onClick={addTask}
            disabled={!input.trim()}
            className="shrink-0 rounded-2xl px-5 py-3 text-sm font-bold text-white shadow-lg active:scale-95 transition-transform disabled:opacity-40"
            style={{
              background: 'linear-gradient(135deg, #f97316 0%, #ec4899 50%, #8b5cf6 100%)',
              boxShadow: input.trim() ? '0 4px 20px rgba(236,72,153,0.4)' : 'none',
            }}
          >
            Add
          </button>
        </div>
      </div>

    </div>
  )
}
