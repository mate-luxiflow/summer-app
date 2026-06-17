import { useState, useEffect, useMemo, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAppContext } from '../context/AppContext'
import { CATEGORIES, ROUTINE_BEHAVIOR_TYPES, getBlockType } from '../store'

export default function SearchOverlay({ isOpen, onClose }) {
  const { tasks, blocks, recurringBlocks } = useAppContext()
  const [query, setQuery] = useState('')
  const inputRef = useRef(null)

  useEffect(() => {
    if (isOpen) {
      setQuery('')
      const timer = setTimeout(() => inputRef.current?.focus(), 80)
      return () => clearTimeout(timer)
    }
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) return
    const handler = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [isOpen, onClose])

  // Merge today's blocks + recurring templates, preferring today's version if same name
  const allBlocks = useMemo(() => {
    const seen = new Set()
    const merged = []
    for (const b of [...blocks, ...recurringBlocks]) {
      if (!seen.has(b.id)) {
        seen.add(b.id)
        merged.push(b)
      }
    }
    return merged
  }, [blocks, recurringBlocks])

  const results = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return { tasks: [], blocks: [] }
    return {
      tasks:  tasks.filter(t => t.text.toLowerCase().includes(q)),
      blocks: allBlocks.filter(b => b.name.toLowerCase().includes(q)),
    }
  }, [query, tasks, allBlocks])

  const hasResults  = results.tasks.length + results.blocks.length > 0
  const hasQuery    = query.trim().length > 0

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.16 }}
          className="fixed inset-0 z-[100] flex flex-col"
          style={{ background: 'rgba(2,2,5,0.94)', backdropFilter: 'blur(20px)' }}
        >
          {/* Search bar */}
          <div
            className="flex items-center gap-3 px-4 border-b border-white/8"
            style={{
              paddingTop:    'calc(env(safe-area-inset-top, 0px) + 14px)',
              paddingBottom: '14px',
            }}
          >
            <svg
              className="w-5 h-5 shrink-0"
              style={{ color: 'rgba(255,255,255,0.30)' }}
              fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>

            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search quests & routine blocks..."
              className="flex-1 bg-transparent text-[16px] font-medium text-white placeholder-white/20 outline-none"
              autoComplete="off"
              autoCorrect="off"
              spellCheck={false}
            />

            <motion.button
              whileTap={{ scale: 0.90 }}
              onClick={onClose}
              className="shrink-0 px-3 py-1.5 rounded-xl text-[11px] font-bold border border-white/10 text-white/40"
              style={{ touchAction: 'manipulation' }}
            >
              Cancel
            </motion.button>
          </div>

          {/* Results area */}
          <div className="flex-1 overflow-y-auto px-4 py-4">

            {/* Empty state */}
            {!hasQuery && (
              <div className="flex flex-col items-center justify-center py-24 text-center">
                <div
                  className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
                >
                  <svg className="w-7 h-7" style={{ color: 'rgba(255,255,255,0.18)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <p className="text-[14px] font-semibold text-white/25">Search everything</p>
                <p className="text-[11px] text-white/15 mt-1">Quests, routine blocks, recurring templates</p>
              </div>
            )}

            {/* No results */}
            {hasQuery && !hasResults && (
              <div className="flex flex-col items-center justify-center py-24 text-center">
                <p className="text-[14px] font-semibold text-white/25">No results</p>
                <p className="text-[11px] text-white/15 mt-1">Nothing matched "{query}"</p>
              </div>
            )}

            {/* Quest results */}
            {results.tasks.length > 0 && (
              <section className="mb-6">
                <p className="text-[8px] font-black uppercase tracking-[0.16em] text-white/25 mb-2.5">
                  Quests · {results.tasks.length}
                </p>
                <div className="flex flex-col gap-2">
                  {results.tasks.map(task => {
                    const cat = CATEGORIES[task.category]
                    return (
                      <div
                        key={task.id}
                        className="flex items-center gap-3 px-3.5 py-3 rounded-2xl border"
                        style={{
                          background:  'rgba(255,255,255,0.03)',
                          borderColor: task.completed ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.08)',
                        }}
                      >
                        <span className="text-[20px] shrink-0 leading-none">{cat?.icon ?? '⚡'}</span>
                        <div className="flex-1 min-w-0">
                          <p className={`text-[13px] font-semibold leading-tight truncate ${
                            task.completed ? 'line-through text-white/28' : 'text-white/82'
                          }`}>
                            {task.text}
                          </p>
                          <p className="text-[10px] mt-0.5 font-bold" style={{ color: cat?.accent ?? '#a78bfa' }}>
                            {cat?.label ?? 'Quest'}
                            {task.isEpic && (
                              <span className="ml-2 text-amber-400/65">⚡ Epic</span>
                            )}
                          </p>
                        </div>
                        {task.completed && (
                          <div
                            className="shrink-0 w-5 h-5 rounded-full flex items-center justify-center"
                            style={{ background: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.25)' }}
                          >
                            <svg className="w-3 h-3 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </section>
            )}

            {/* Routine block results */}
            {results.blocks.length > 0 && (
              <section className="mb-6">
                <p className="text-[8px] font-black uppercase tracking-[0.16em] text-white/25 mb-2.5">
                  Routine Blocks · {results.blocks.length}
                </p>
                <div className="flex flex-col gap-2">
                  {results.blocks.map(block => {
                    const bType = ROUTINE_BEHAVIOR_TYPES[getBlockType(block)]
                    return (
                      <div
                        key={block.id}
                        className="flex items-center gap-3 px-3.5 py-3 rounded-2xl border overflow-hidden relative"
                        style={{
                          background:  bType.bg,
                          borderColor: bType.border,
                        }}
                      >
                        {/* Left accent bar */}
                        <div
                          className="absolute left-0 top-0 bottom-0 w-0.5"
                          style={{ background: bType.accent }}
                        />

                        <div className="flex-1 min-w-0 pl-1">
                          <p className="text-[13px] font-semibold text-white/88 leading-tight truncate">
                            {block.name}
                          </p>
                          <div className="flex items-center gap-2.5 mt-0.5 flex-wrap">
                            <span
                              className="text-[10px] font-bold"
                              style={{ color: bType.accent }}
                            >
                              • {bType.label}
                            </span>
                            {block.startTime && block.endTime && (
                              <span className="text-[10px] text-white/28 font-mono tabular-nums">
                                {block.startTime} – {block.endTime}
                              </span>
                            )}
                            {block.days && (
                              <span className="text-[9px] text-indigo-400/55 font-bold">🔁 Recurring</span>
                            )}
                            {block.completed && (
                              <span className="text-[9px] text-green-400/60 font-bold">✓ Done</span>
                            )}
                          </div>
                        </div>

                        <svg
                          className="w-4 h-4 shrink-0"
                          style={{ color: bType.accent, opacity: 0.40 }}
                          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    )
                  })}
                </div>
              </section>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
