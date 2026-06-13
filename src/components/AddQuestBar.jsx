import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, ChevronDown } from 'lucide-react'
import { CATEGORIES, PRIORITY } from '../store'

export default function AddQuestBar({ onAdd }) {
  const [text,     setText]     = useState('')
  const [category, setCategory] = useState('deep_work')
  const [priority, setPriority] = useState('medium')
  const [expanded, setExpanded] = useState(false)
  const inputRef = useRef(null)

  function submit() {
    const trimmed = text.trim()
    // Honeypot: reject if empty
    if (!trimmed) return
    onAdd({ text: trimmed, category, priority })
    setText('')
    inputRef.current?.focus()
  }

  return (
    <div className="shrink-0 px-4 pb-safe-bottom bg-[#0a0a0f]/95 backdrop-blur-xl border-t border-white/[0.06]">
      <div className="pt-3 pb-3">
        {/* Main input row */}
        <div className="flex items-center gap-2">
          <input
            ref={inputRef}
            type="text"
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && submit()}
            placeholder="New quest…"
            maxLength={80}
            autoComplete="off"
            className="flex-1 rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-2.5 text-[13px] text-white placeholder-white/20 outline-none focus:border-pink-500/50 focus:bg-white/[0.06] transition-all duration-200"
            aria-label="Add new quest"
          />

          {/* Expand toggle */}
          <button
            onClick={() => setExpanded(v => !v)}
            className="shrink-0 w-10 h-10 rounded-xl border border-white/[0.08] bg-white/[0.04] flex items-center justify-center text-white/30 hover:text-white/60 transition-colors"
            aria-label="Toggle quest options"
            aria-expanded={expanded}
          >
            <motion.div animate={{ rotate: expanded ? 180 : 0 }} transition={{ duration: 0.2 }}>
              <ChevronDown size={14} />
            </motion.div>
          </button>

          {/* Submit */}
          <motion.button
            onClick={submit}
            disabled={!text.trim()}
            className="shrink-0 w-10 h-10 rounded-xl flex items-center justify-center disabled:opacity-30 transition-opacity"
            style={{ background: 'linear-gradient(135deg,#f97316,#ec4899)' }}
            whileTap={{ scale: 0.9 }}
            aria-label="Add quest"
          >
            <Plus size={16} className="text-white" />
          </motion.button>
        </div>

        {/* Expanded options */}
        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
              className="overflow-hidden"
            >
              <div className="pt-3 flex flex-col gap-3">

                {/* Category picker */}
                <div>
                  <p className="text-[10px] font-bold text-white/25 uppercase tracking-widest mb-1.5">Category</p>
                  <div className="flex gap-1.5 flex-wrap">
                    {Object.entries(CATEGORIES).map(([key, cat]) => (
                      <button
                        key={key}
                        onClick={() => setCategory(key)}
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold border transition-all duration-150"
                        style={{
                          borderColor: category === key ? cat.accent : 'rgba(255,255,255,0.06)',
                          background:  category === key ? cat.accent + '20' : 'rgba(255,255,255,0.03)',
                          color:       category === key ? cat.accent : 'rgba(255,255,255,0.35)',
                        }}
                      >
                        <span>{cat.icon}</span>
                        <span>{cat.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Priority picker */}
                <div>
                  <p className="text-[10px] font-bold text-white/25 uppercase tracking-widest mb-1.5">Priority</p>
                  <div className="flex gap-1.5">
                    {Object.entries(PRIORITY).map(([key, pri]) => (
                      <button
                        key={key}
                        onClick={() => setPriority(key)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold border transition-all duration-150 capitalize"
                        style={{
                          borderColor: priority === key ? pri.color : 'rgba(255,255,255,0.06)',
                          background:  priority === key ? pri.color + '22' : 'rgba(255,255,255,0.03)',
                          color:       priority === key ? pri.color : 'rgba(255,255,255,0.35)',
                        }}
                      >
                        <span className="text-[10px] font-black">{pri.label}</span>
                        <span>{key}</span>
                      </button>
                    ))}
                  </div>
                </div>

              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
