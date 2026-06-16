import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import {
  persistence, todayISO,
  getDefaultPolarity, getTaskXpDelta, getTaskFocusDelta,
  getTodayDayName, DEFAULT_WEEKLY_ROUTINES,
  cascadeShift, getEstimatedFinish, timeToMinutes, wouldExceedMidnight,
} from '../store'

const AppContext = createContext(null)

// Constant for the session — JS day index (0=Sun … 6=Sat)
export const TODAY_IDX = new Date().getDay()

// Module-level id counter so it survives tab switches
let _nextTaskId = Math.max(0, ...persistence.getTasks().map(t => t.id ?? 0)) + 1

// ── Initial routine block calculation (called once at context mount) ──────────
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

  // saved !== null means the key exists — even [] is a valid "empty day" state
  if (saved !== null) {
    const savedIds = new Set(saved.map(b => b.id))
    const toMerge  = todayRecurring.filter(
      rb => !savedIds.has(rb.id) && !savedIds.has(`r_${rb.recurring_source_id}`)
    )
    return [...saved, ...toMerge].sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime))
  }

  // First-ever run: inject default weekly templates exactly once
  const isFirstRun = localStorage.getItem('sg_initialized') === null
  if (isFirstRun) {
    localStorage.setItem('sg_initialized', '1')
    const day    = getTodayDayName()
    const def    = DEFAULT_WEEKLY_ROUTINES[day] ?? []
    const defIds = new Set(def.map(b => b.id))
    const toMerge = todayRecurring.filter(rb => !defIds.has(rb.id))
    return [...def, ...toMerge].sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime))
  }

  // Returning user, new day — only recurring blocks
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

  // Quest state
  const [tasks,    setTasks]    = useState(persistence.getTasks)
  const [totalXp,  setTotalXp]  = useState(persistence.getXp)
  const [focusMin, setFocusMin] = useState(persistence.getFocusMin)
  const [activity, setActivity] = useState(persistence.getActivity)

  // Routine state
  const [blocks,          setBlocks]          = useState(buildInitialBlocks)
  const [recurringBlocks, setRecurringBlocks] = useState(() => persistence.getRecurring())
  const [baselineFinish,  setBaselineFinish]  = useState(buildInitialBaseline)

  // ── Sync to localStorage (provider never unmounts → no race condition) ────
  useEffect(() => { persistence.setTasks(tasks) },           [tasks])
  useEffect(() => { persistence.setXp(totalXp) },            [totalXp])
  useEffect(() => { persistence.setFocusMin(focusMin) },     [focusMin])
  useEffect(() => { persistence.setActivity(activity) },     [activity])
  useEffect(() => { persistence.setRoutine(iso, blocks) },   [blocks, iso])
  useEffect(() => { persistence.setRecurring(recurringBlocks) }, [recurringBlocks])

  // ── Quest operations ──────────────────────────────────────────────────────
  const addTask = useCallback(({
    text, category, priority, polarity,
    isEpic = false, dueDate = null, createdDate = null,
  }) => {
    const id               = _nextTaskId++
    const resolvedPolarity = polarity ?? getDefaultPolarity(category)
    setTasks(prev => [{
      id, text, category, priority,
      polarity:    resolvedPolarity,
      completed:   false,
      isEpic,
      dueDate:     isEpic ? dueDate     : null,
      createdDate: isEpic ? createdDate : null,
    }, ...prev])
  }, [])

  const toggleTask = useCallback((id) => {
    setTasks(prev => prev.map(t => {
      if (t.id !== id) return t
      const polarity   = t.polarity ?? 'neutral'
      const nowDone    = !t.completed
      const xpDelta    = getTaskXpDelta(polarity)
      const focusDelta = getTaskFocusDelta(polarity)

      if (nowDone) {
        setTotalXp(xp => Math.max(0, xp + xpDelta))
        setFocusMin(f  => Math.max(0, f  + focusDelta))
        const today = todayISO()
        setActivity(act => ({ ...act, [today]: (act[today] ?? 0) + 5 }))
      } else {
        setTotalXp(xp => Math.max(0, xp - xpDelta))
        setFocusMin(f  => Math.max(0, f  - focusDelta))
      }
      return { ...t, completed: nowDone }
    }))
  }, [])

  const overridePolarity = useCallback((id, newPolarity) => {
    setTasks(prev => prev.map(t => {
      if (t.id !== id) return t
      const oldPolarity = t.polarity ?? 'neutral'
      if (oldPolarity === newPolarity) return t

      if (t.completed) {
        setTotalXp(xp => Math.max(0, xp - getTaskXpDelta(oldPolarity) + getTaskXpDelta(newPolarity)))
        setFocusMin(f  => Math.max(0, f  - getTaskFocusDelta(oldPolarity) + getTaskFocusDelta(newPolarity)))
      }
      return { ...t, polarity: newPolarity }
    }))
  }, [])

  const deleteTask = useCallback((id) => {
    setTasks(prev => {
      const task = prev.find(t => t.id === id)
      if (task?.completed) {
        setTotalXp(xp => Math.max(0, xp - getTaskXpDelta(task.polarity ?? 'neutral')))
        setFocusMin(f  => Math.max(0, f  - getTaskFocusDelta(task.polarity ?? 'neutral')))
      }
      return prev.filter(t => t.id !== id)
    })
  }, [])

  // ── Routine operations ────────────────────────────────────────────────────
  const cascadeBlock = useCallback((blockId, deltaMinutes) => {
    setBlocks(prev => {
      if (wouldExceedMidnight(prev, blockId, deltaMinutes)) return prev
      return cascadeShift(prev, blockId, deltaMinutes)
    })
  }, [])

  const toggleBlock = useCallback((blockId) => {
    setBlocks(prev => prev.map(b =>
      b.id === blockId ? { ...b, completed: !b.completed } : b
    ))
  }, [])

  const deleteBlock = useCallback((blockId) => {
    setBlocks(prev => prev.filter(b => b.id !== blockId))
  }, [])

  const deleteRecurring = useCallback((blockId) => {
    setRecurringBlocks(prev => prev.filter(b => b.id !== blockId))
  }, [])

  const addBlock = useCallback((newBlock) => {
    setBlocks(prev =>
      [...prev, newBlock].sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime))
    )
  }, [])

  const addRecurring = useCallback((newBlock) => {
    setRecurringBlocks(prev => [...prev, newBlock])
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
        return [...prev, materialized].sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime))
      })
    }
  }, [])

  const value = {
    // Quest
    tasks, totalXp, focusMin, activity,
    addTask, toggleTask, overridePolarity, deleteTask,
    // Routine
    blocks, recurringBlocks, baselineFinish,
    setBaselineFinish,
    // Exposed for bulk-replace (Reset Default / Load Last Weekday)
    _setBlocksDirect: setBlocks,
    cascadeBlock, toggleBlock, deleteBlock, deleteRecurring,
    addBlock, addRecurring,
  }

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useAppContext() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useAppContext must be used within AppContextProvider')
  return ctx
}
