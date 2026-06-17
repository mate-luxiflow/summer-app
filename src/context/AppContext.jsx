import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import {
  persistence, todayISO,
  getDefaultPolarity, getTaskFocusDelta, computeDailyXp,
  getTodayDayName, DEFAULT_WEEKLY_ROUTINES,
  cascadeShift, getEstimatedFinish, timeToMinutes, wouldExceedMidnight,
} from '../store'

const AppContext = createContext(null)

export const TODAY_IDX = new Date().getDay()

let _nextTaskId = Math.max(0, ...persistence.getTasks().map(t => t.id ?? 0)) + 1

// ── Initial routine block calculation ────────────────────────────────────────
function buildInitialBlocks() {
  const iso       = todayISO()
  const saved     = persistence.getRoutine(iso)
  const recurring = persistence.getRecurring()

  const todayRecurring = recurring
    .filter(b => (b.days ?? []).includes(TODAY_IDX))
    .map(rb => ({
      ...rb,
      id:                  `r_${rb.id}`,
      recurring_source_id: rb.id,
      days:                undefined,
      completed:           false,
    }))

  if (saved !== null) {
    const savedIds    = new Set(saved.map(b => b.id))
    const excludedIds = new Set(persistence.getExcludedRecurring(iso))
    const toMerge     = todayRecurring.filter(
      rb => !savedIds.has(rb.id) && !excludedIds.has(rb.id)
    )
    return [...saved, ...toMerge].sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime))
  }

  const isFirstRun = localStorage.getItem('sg_initialized') === null
  if (isFirstRun) {
    localStorage.setItem('sg_initialized', '1')
    const day    = getTodayDayName()
    const def    = DEFAULT_WEEKLY_ROUTINES[day] ?? []
    const defIds = new Set(def.map(b => b.id))
    const toMerge = todayRecurring.filter(rb => !defIds.has(rb.id))
    return [...def, ...toMerge].sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime))
  }

  return todayRecurring.sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime))
}

function buildInitialBaseline() {
  const iso    = todayISO()
  const stored = persistence.getBaselineFinish(iso)
  if (stored) return stored
  const finish = getEstimatedFinish(buildInitialBlocks())
  if (finish) persistence.setBaselineFinish(iso, finish)
  return finish
}

// ── Provider ──────────────────────────────────────────────────────────────────
export function AppContextProvider({ children }) {
  const iso = todayISO()

  const [tasks,    setTasks]    = useState(persistence.getTasks)
  const [totalXp,  setTotalXp]  = useState(persistence.getXp)
  const [focusMin, setFocusMin] = useState(persistence.getFocusMin)
  const [activity, setActivity] = useState(persistence.getActivity)

  const [blocks,          setBlocks]          = useState(buildInitialBlocks)
  const [recurringBlocks, setRecurringBlocks] = useState(() => persistence.getRecurring())
  const [baselineFinish,  setBaselineFinish]  = useState(buildInitialBaseline)

  const [storeMinutes,  setStoreMinutes]  = useState(persistence.getStoreMinutes)
  const [journalSealed, setJournalSealed] = useState(() => persistence.getJournalClaimed(iso))

  const [toast, setToast] = useState(null)
  const dismissToast = useCallback(() => setToast(null), [])

  // ── One-time migration: seed today's daily XP baseline from existing data ──
  // Prevents double-counting XP on first load after switching to the new system.
  useEffect(() => {
    const MIGRATION_KEY = 'sg_xp_v2_migrated'
    if (localStorage.getItem(MIGRATION_KEY)) return
    const initialDailyXp = computeDailyXp(persistence.getTasks())
    persistence.setDailyXp(iso, initialDailyXp)
    localStorage.setItem(MIGRATION_KEY, '1')
  }, [iso])

  // ── Retroaktív auto-claim (másnap reggeli biztonsági háló) ─────────────────
  useEffect(() => {
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    const prevISO = yesterday.toISOString().slice(0, 10)

    if (persistence.getAutoClaim(prevISO)) return

    const prevBlocks = persistence.getRoutine(prevISO)
    if (!prevBlocks || prevBlocks.length === 0) return
    if (!prevBlocks.every(b => b.completed)) return

    const prevDailyXp = persistence.getDailyXp(prevISO)
    if (prevDailyXp >= 30) return

    const bonus = 30 - prevDailyXp
    persistence.setDailyXp(prevISO, 30)
    persistence.setAutoClaim(prevISO)
    setTotalXp(xp => {
      const n = xp + bonus
      persistence.setXp(n)
      return n
    })
    setToast(`Úgy látjuk, tegnap minden rutint teljesítettél! A ${bonus} XP jóváírva.`)
  }, [])

  useEffect(() => { persistence.setRoutine(iso, blocks) },          [blocks, iso])
  useEffect(() => { persistence.setRecurring(recurringBlocks) },    [recurringBlocks])

  // ── Quest operations ───────────────────────────────────────────────────────
  const addTask = useCallback(({
    text, category, priority, polarity,
    isEpic = false, dueDate = null, createdDate = null,
  }) => {
    const id               = _nextTaskId++
    const resolvedPolarity = polarity ?? getDefaultPolarity(category)
    setTasks(prev => {
      const next = [{
        id, text, category, priority,
        polarity:    resolvedPolarity,
        completed:   false,
        isEpic,
        dueDate:     isEpic ? dueDate     : null,
        createdDate: isEpic ? createdDate : null,
      }, ...prev]
      persistence.setTasks(next)
      // Recalculate daily XP — adding a task changes the denominator
      const newDailyXp  = computeDailyXp(next)
      const prevDailyXp = persistence.getDailyXp(iso)
      if (newDailyXp !== prevDailyXp) {
        persistence.setDailyXp(iso, newDailyXp)
        setTotalXp(xp => { const n = Math.max(0, xp + newDailyXp - prevDailyXp); persistence.setXp(n); return n })
      }
      return next
    })
  }, [iso])

  const toggleTask = useCallback((id) => {
    setTasks(prev => {
      const next = prev.map(t => {
        if (t.id !== id) return t
        const polarity   = t.polarity ?? 'neutral'
        const nowDone    = !t.completed
        const focusDelta = getTaskFocusDelta(polarity)
        if (nowDone) {
          setFocusMin(f  => { const n = Math.max(0, f + focusDelta); persistence.setFocusMin(n); return n })
          const today = todayISO()
          setActivity(act => { const n = { ...act, [today]: (act[today] ?? 0) + 5 }; persistence.setActivity(n); return n })
        } else {
          setFocusMin(f  => { const n = Math.max(0, f - focusDelta); persistence.setFocusMin(n); return n })
        }
        return { ...t, completed: nowDone }
      })
      persistence.setTasks(next)
      // Recalculate daily XP ratio
      const newDailyXp  = computeDailyXp(next)
      const prevDailyXp = persistence.getDailyXp(iso)
      if (newDailyXp !== prevDailyXp) {
        persistence.setDailyXp(iso, newDailyXp)
        setTotalXp(xp => { const n = Math.max(0, xp + newDailyXp - prevDailyXp); persistence.setXp(n); return n })
      }
      return next
    })
  }, [iso])

  const overridePolarity = useCallback((id, newPolarity) => {
    setTasks(prev => {
      const next = prev.map(t => {
        if (t.id !== id) return t
        const oldPolarity = t.polarity ?? 'neutral'
        if (oldPolarity === newPolarity) return t
        // Polarity only affects focus minutes now — XP is ratio-based
        if (t.completed) {
          setFocusMin(f => {
            const n = Math.max(0, f - getTaskFocusDelta(oldPolarity) + getTaskFocusDelta(newPolarity))
            persistence.setFocusMin(n)
            return n
          })
        }
        return { ...t, polarity: newPolarity }
      })
      persistence.setTasks(next)
      return next
    })
  }, [])

  const deleteTask = useCallback((id) => {
    setTasks(prev => {
      const task = prev.find(t => t.id === id)
      if (task?.completed) {
        setFocusMin(f => { const n = Math.max(0, f - getTaskFocusDelta(task.polarity ?? 'neutral')); persistence.setFocusMin(n); return n })
      }
      const next = prev.filter(t => t.id !== id)
      persistence.setTasks(next)
      // Recalculate daily XP — removing a task changes the denominator
      const newDailyXp  = computeDailyXp(next)
      const prevDailyXp = persistence.getDailyXp(iso)
      if (newDailyXp !== prevDailyXp) {
        persistence.setDailyXp(iso, newDailyXp)
        setTotalXp(xp => { const n = Math.max(0, xp + newDailyXp - prevDailyXp); persistence.setXp(n); return n })
      }
      return next
    })
  }, [iso])

  // ── Routine operations ─────────────────────────────────────────────────────
  const cascadeBlock = useCallback((blockId, deltaMinutes) => {
    setBlocks(prev => {
      if (wouldExceedMidnight(prev, blockId, deltaMinutes)) return prev
      const next = cascadeShift(prev, blockId, deltaMinutes)
      persistence.setRoutine(iso, next)
      return next
    })
  }, [iso])

  const toggleBlock = useCallback((blockId) => {
    setBlocks(prev => {
      const next = prev.map(b => b.id === blockId ? { ...b, completed: !b.completed } : b)
      persistence.setRoutine(iso, next)
      return next
    })
  }, [iso])

  const deleteBlock = useCallback((blockId) => {
    setBlocks(prev => {
      const block = prev.find(b => b.id === blockId)
      if (block?.recurring_source_id) {
        const current = persistence.getExcludedRecurring(iso)
        if (!current.includes(blockId)) {
          persistence.setExcludedRecurring(iso, [...current, blockId])
        }
      }
      const next = prev.filter(b => b.id !== blockId)
      persistence.setRoutine(iso, next)
      return next
    })
  }, [iso])

  const deleteRecurring = useCallback((blockId) => {
    setRecurringBlocks(prev => {
      const next = prev.filter(b => b.id !== blockId)
      persistence.setRecurring(next)
      return next
    })
  }, [])

  const saveDailyLog = useCallback((text) => {
    const trimmed = text.trim()
    if (trimmed.length < 5) return
    persistence.setDailyLog(iso, trimmed)
    if (!persistence.getJournalClaimed(iso)) {
      persistence.setJournalClaimed(iso)
      setJournalSealed(true)
      setStoreMinutes(m => {
        const n = m + 10
        persistence.setStoreMinutes(n)
        return n
      })
    }
  }, [iso])

  const addBlock = useCallback((newBlock) => {
    setBlocks(prev => {
      const next = [...prev, newBlock].sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime))
      persistence.setRoutine(iso, next)
      return next
    })
  }, [iso])

  const addRecurring = useCallback((newBlock) => {
    setRecurringBlocks(prev => {
      const next = [...prev, newBlock]
      persistence.setRecurring(next)
      return next
    })
    if ((newBlock.days ?? []).includes(TODAY_IDX)) {
      const materialized = {
        ...newBlock,
        id:                  `r_${newBlock.id}`,
        recurring_source_id: newBlock.id,
        days:                undefined,
        completed:           false,
      }
      setBlocks(prev => {
        if (prev.some(b => b.id === materialized.id)) return prev
        const next = [...prev, materialized].sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime))
        persistence.setRoutine(iso, next)
        return next
      })
    }
  }, [iso])

  const updateRoutineBlock = useCallback((blockId, { name, type, startTime, endTime }) => {
    setBlocks(prev => {
      const next = prev
        .map(b => b.id === blockId
          ? { ...b, name, type, startTime, endTime }
          : b
        )
        .sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime))
      persistence.setRoutine(iso, next)
      return next
    })
  }, [iso])

  const value = {
    // Quest
    tasks, totalXp, focusMin, activity,
    addTask, toggleTask, overridePolarity, deleteTask,
    // Routine
    blocks, recurringBlocks, baselineFinish,
    setBaselineFinish,
    _setBlocksDirect: setBlocks,
    cascadeBlock, toggleBlock, deleteBlock, deleteRecurring,
    addBlock, addRecurring, updateRoutineBlock,
    // Journal & Store Minutes
    storeMinutes, journalSealed, saveDailyLog,
    // Toast
    toast, dismissToast,
  }

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useAppContext() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useAppContext must be used within AppContextProvider')
  return ctx
}
