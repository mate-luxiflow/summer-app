// Central state – plain JS module with localStorage persistence.
// Keeps all business logic out of React components.

export const XP_PER_TASK = 20
export const XP_PER_LEVEL = 100
export const FOCUS_CURRENCY_KEY = 'sg_focus_minutes'

export const RANKS = [
  { minLevel: 1,  label: 'Summer Novice',      color: '#94a3b8' },
  { minLevel: 4,  label: 'Consistency King',   color: '#f97316' },
  { minLevel: 8,  label: 'Productive Grinder', color: '#ec4899' },
  { minLevel: 16, label: 'Focus Master',       color: '#8b5cf6' },
  { minLevel: 30, label: 'Summer Legend',      color: '#06b6d4' },
]

export const CATEGORIES = {
  health:    { label: 'Health',    accent: '#22d3ee', icon: '🏃' },
  learning:  { label: 'Learning',  accent: '#a78bfa', icon: '📚' },
  deep_work: { label: 'Deep Work', accent: '#f97316', icon: '⚡' },
  mindset:   { label: 'Mindset',   accent: '#34d399', icon: '🧠' },
  other:     { label: 'Other',     accent: '#f472b6', icon: '✦'  },
}

export const PRIORITY = {
  high:   { label: 'S', color: '#f97316' },
  medium: { label: 'A', color: '#a78bfa' },
  low:    { label: 'B', color: '#475569' },
}

export function getRankInfo(level) {
  let rank = RANKS[0]
  for (const r of RANKS) { if (level >= r.minLevel) rank = r }
  return rank
}

export function getLevelInfo(totalXp) {
  const level       = Math.floor(totalXp / XP_PER_LEVEL) + 1
  const xpIntoLevel = totalXp % XP_PER_LEVEL
  const pct         = Math.round((xpIntoLevel / XP_PER_LEVEL) * 100)
  return { level, xpIntoLevel, pct }
}

// ── Persistence helpers ──────────────────────────────────────────────────────

function load(key, fallback) {
  try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback }
  catch { return fallback }
}

export const persistence = {
  getTasks:       () => load('sg_tasks', []),
  setTasks:       (v) => localStorage.setItem('sg_tasks', JSON.stringify(v)),
  getXp:          () => { const n = Number(localStorage.getItem('sg_xp')); return isFinite(n) ? n : 0 },
  setXp:          (v) => localStorage.setItem('sg_xp', String(v)),
  getActivity:    () => load('sg_activity', {}),   // { 'YYYY-MM-DD': focusMinutes }
  setActivity:    (v) => localStorage.setItem('sg_activity', JSON.stringify(v)),
  getFocusMin:    () => { const n = Number(localStorage.getItem(FOCUS_CURRENCY_KEY)); return isFinite(n) ? n : 0 },
  setFocusMin:    (v) => localStorage.setItem(FOCUS_CURRENCY_KEY, String(v)),
}

// ── Date helpers ─────────────────────────────────────────────────────────────

export function todayISO() {
  return new Date().toISOString().slice(0, 10)
}

/** Returns array of ISO date strings for the last N days (oldest → newest). */
export function lastNDays(n) {
  const days = []
  const now  = new Date()
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now)
    d.setDate(now.getDate() - i)
    days.push(d.toISOString().slice(0, 10))
  }
  return days
}

/** Seed realistic fake activity so the heatmap isn't empty on first load. */
export function seedActivityIfEmpty() {
  const existing = persistence.getActivity()
  if (Object.keys(existing).length > 5) return
  const days = lastNDays(180)
  const seeded = {}
  for (const d of days) {
    // ~60 % chance of having activity on any given day
    if (Math.random() > 0.4) {
      seeded[d] = Math.floor(Math.random() * 180) + 10
    }
  }
  persistence.setActivity(seeded)
}
