export const XP_PER_TASK   = 20
export const XP_PER_LEVEL  = 100
export const FOCUS_CURRENCY_KEY = 'sg_focus_minutes'

export const RANKS = [
  { minLevel: 1,  label: 'Summer Novice',      color: '#94a3b8' },
  { minLevel: 4,  label: 'Consistency King',   color: '#f97316' },
  { minLevel: 8,  label: 'Productive Grinder', color: '#ec4899' },
  { minLevel: 16, label: 'Focus Master',       color: '#8b5cf6' },
  { minLevel: 30, label: 'Summer Legend',      color: '#06b6d4' },
]

// 8 premium presets + 'grind' as the custom/fallback category
export const CATEGORIES = {
  social:        { label: 'Social',                accent: '#ec4899', icon: '💬' },
  games:         { label: 'Games',                 accent: '#06b6d4', icon: '🚀' },
  entertainment: { label: 'Entertainment',         accent: '#ef4444', icon: '🍿' },
  creativity:    { label: 'Creativity',            accent: '#eab308', icon: '🎨' },
  education:     { label: 'Education',             accent: '#22c55e', icon: '🌍' },
  health:        { label: 'Health & Fitness',      accent: '#10b981', icon: '🚲' },
  reading:       { label: 'Info & Reading',        accent: '#6366f1', icon: '📚' },
  productivity:  { label: 'Productivity',          accent: '#f59e0b', icon: '💸' },
  grind:         { label: 'Grind',                 accent: '#a78bfa', icon: '⚡' },
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
  getTasks:    () => load('sg_tasks', []),
  setTasks:    (v) => localStorage.setItem('sg_tasks', JSON.stringify(v)),
  getXp:       () => { const n = Number(localStorage.getItem('sg_xp')); return isFinite(n) ? n : 0 },
  setXp:       (v) => localStorage.setItem('sg_xp', String(v)),
  getActivity: () => load('sg_activity', {}),
  setActivity: (v) => localStorage.setItem('sg_activity', JSON.stringify(v)),
  getFocusMin: () => { const n = Number(localStorage.getItem(FOCUS_CURRENCY_KEY)); return isFinite(n) ? n : 0 },
  setFocusMin: (v) => localStorage.setItem(FOCUS_CURRENCY_KEY, String(v)),
}

// ── Date helpers ─────────────────────────────────────────────────────────────

export function todayISO() {
  return new Date().toISOString().slice(0, 10)
}

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

export function seedActivityIfEmpty() {
  const existing = persistence.getActivity()
  if (Object.keys(existing).length > 5) return
  const days   = lastNDays(180)
  const seeded = {}
  for (const d of days) {
    if (Math.random() > 0.4) seeded[d] = Math.floor(Math.random() * 180) + 10
  }
  persistence.setActivity(seeded)
}
