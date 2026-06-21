// ── Constants ─────────────────────────────────────────────────────────────────
export const DAILY_XP_CAP         = 30   // max XP earnable per day from quests
export const FOCUS_CURRENCY_KEY   = 'sg_focus_minutes'
export const STORE_MINUTES_PER_TASK = 10 // focus perc pozitív taskonként

// ── Rank table ────────────────────────────────────────────────────────────────
export const RANKS = [
  { minLevel: 1,  label: 'Novice Cutter',       color: '#94a3b8' },
  { minLevel: 4,  label: 'Focus Disciple',       color: '#f97316' },
  { minLevel: 7,  label: 'Time Alchemist',       color: '#ec4899' },
  { minLevel: 10, label: 'Grandmaster Grinder',  color: '#8b5cf6' },
]

// ── Category registry ─────────────────────────────────────────────────────────
export const CATEGORIES = {
  social:        { label: 'Social',           accent: '#ec4899', icon: '💬' },
  games:         { label: 'Games',            accent: '#06b6d4', icon: '🚀' },
  entertainment: { label: 'Entertainment',    accent: '#ef4444', icon: '🍿' },
  creativity:    { label: 'Creativity',       accent: '#eab308', icon: '🎨' },
  education:     { label: 'Education',        accent: '#22c55e', icon: '🌍' },
  health:        { label: 'Health & Fitness', accent: '#10b981', icon: '🚲' },
  reading:       { label: 'Info & Reading',   accent: '#6366f1', icon: '📚' },
  productivity:  { label: 'Productivity',     accent: '#f59e0b', icon: '💸' },
  grind:         { label: 'Grind',            accent: '#a78bfa', icon: '⚡' },
}

export const PRIORITY = {
  high:   { label: 'S', color: '#f97316' },
  medium: { label: 'A', color: '#a78bfa' },
  low:    { label: 'B', color: '#475569' },
}

// ── Polarity engine ───────────────────────────────────────────────────────────
export const POLARITY = {
  positive: { label: 'Positive', color: '#22c55e', symbol: '+', bg: '#22c55e18' },
  neutral:  { label: 'Neutral',  color: '#64748b', symbol: '○', bg: '#64748b18' },
  negative: { label: 'Negative', color: '#ef4444', symbol: '−', bg: '#ef444418' },
}

// ── Routine Block Behavior Types (3-type system, replaces per-block categories) ─
export const ROUTINE_BEHAVIOR_TYPES = {
  positive: {
    label:      'Positive',
    desc:       'Grind / Build',
    icon:       '⚡',
    accent:     '#06b6d4',
    glow:       'rgba(6,182,212,0.35)',
    bg:         'rgba(6,182,212,0.07)',
    border:     'rgba(6,182,212,0.28)',
    chartColor: '#06b6d4',
  },
  neutral: {
    label:      'Neutral',
    desc:       'Sleep / Routine',
    icon:       '○',
    accent:     '#64748b',
    glow:       'rgba(100,116,139,0.18)',
    bg:         'rgba(100,116,139,0.05)',
    border:     'rgba(100,116,139,0.20)',
    chartColor: '#94a3b8',
  },
  negative: {
    label:      'Negative',
    desc:       'Time waste',
    icon:       '✕',
    accent:     '#a855f7',
    glow:       'rgba(168,85,247,0.35)',
    bg:         'rgba(168,85,247,0.07)',
    border:     'rgba(168,85,247,0.28)',
    chartColor: '#a855f7',
  },
}

/** Resolves block behavior type — checks `type` field first, falls back to `polarity` for legacy blocks */
export function getBlockType(block) {
  if (block?.type && ROUTINE_BEHAVIOR_TYPES[block.type]) return block.type
  if (block?.polarity && ROUTINE_BEHAVIOR_TYPES[block.polarity]) return block.polarity
  return 'neutral'
}

// Kategória → alapértelmezett polaritás leképezés
const NEGATIVE_CATS = new Set(['social', 'games', 'entertainment'])
const POSITIVE_CATS = new Set(['education', 'health', 'reading', 'productivity'])

export function getDefaultPolarity(categoryKey) {
  if (NEGATIVE_CATS.has(categoryKey)) return 'negative'
  if (POSITIVE_CATS.has(categoryKey)) return 'positive'
  return 'neutral'
}

const POLARITY_CYCLE = ['positive', 'neutral', 'negative']
export function cyclePolarity(current) {
  const idx = POLARITY_CYCLE.indexOf(current ?? 'neutral')
  return POLARITY_CYCLE[(idx + 1) % POLARITY_CYCLE.length]
}

/**
 * Dinamikus napi XP: (teljesített / összes nem-epic) × 30
 * A visszatérési érték egész szám, 0–30 közt.
 */
export function computeDailyXp(tasks) {
  const daily     = tasks.filter(t => !t.isEpic)
  const total     = daily.length
  const completed = daily.filter(t => t.completed).length
  return total === 0 ? 0 : Math.round((completed / total) * DAILY_XP_CAP)
}

/** Focus-perc delta (negatív fizet, pozitív kap, semleges nulla) */
export function getTaskFocusDelta(polarity = 'neutral') {
  if (polarity === 'positive') return STORE_MINUTES_PER_TASK
  if (polarity === 'negative') return -STORE_MINUTES_PER_TASK
  return 0
}

// ── Időmatematika ─────────────────────────────────────────────────────────────
/** "HH:MM" → éjfél óta eltelt percek */
export function timeToMinutes(t) {
  const [h, m] = t.split(':').map(Number)
  return h * 60 + m
}

/** Percek → "HH:MM" (23:59-nél clampolva, ha átlép éjfélen) */
export function minutesToTime(mins) {
  const safe = Math.min(Math.max(mins, 0), 23 * 60 + 59)
  return `${String(Math.floor(safe / 60)).padStart(2, '0')}:${String(safe % 60).padStart(2, '0')}`
}

export function addMinutesToTime(t, delta) {
  return minutesToTime(timeToMinutes(t) + delta)
}

/** Blokk hossza percben */
export function blockDuration(startTime, endTime) {
  return Math.max(0, timeToMinutes(endTime) - timeToMinutes(startTime))
}

/**
 * Idő-Kaszkád Láncreakció:
 * 1. targetId blokk endTime-ját megnöveli deltaMinutes-szal
 * 2. Az összes UTÁNA következő blokk start+end időpontját eltol
 * Tisztán funkcionális — az eredeti tömböt nem módosítja.
 */
export function cascadeShift(blocks, targetId, deltaMinutes) {
  let cascading = false
  return blocks.map(block => {
    if (block.id === targetId) {
      cascading = true
      return { ...block, endTime: addMinutesToTime(block.endTime, deltaMinutes) }
    }
    if (cascading) {
      return {
        ...block,
        startTime: addMinutesToTime(block.startTime, deltaMinutes),
        endTime:   addMinutesToTime(block.endTime,   deltaMinutes),
      }
    }
    return block
  })
}

/** Várható befejezési idő = utolsó blokk endTime */
export function getEstimatedFinish(blocks) {
  return blocks.length ? blocks[blocks.length - 1].endTime : null
}

/** True ha a kaszkád miatt az idő 23:59-et meghaladná */
export function wouldExceedMidnight(blocks, targetId, deltaMinutes) {
  const shifted = cascadeShift(blocks, targetId, deltaMinutes)
  const lastEnd = getEstimatedFinish(shifted)
  if (!lastEnd) return false
  return timeToMinutes(lastEnd) >= 23 * 60 + 59
}

// ── Nap-segédletek ────────────────────────────────────────────────────────────
const DAY_NAMES = ['sunday','monday','tuesday','wednesday','thursday','friday','saturday']

export function getTodayDayName() { return DAY_NAMES[new Date().getDay()] }
export function getWeekdayLabel(day) { return day.charAt(0).toUpperCase() + day.slice(1) }

/** Legutóbbi dayName nevű nap ISO dátuma (ma kivételével) */
export function getLastOccurrenceISO(dayName) {
  const target = DAY_NAMES.indexOf(dayName)
  const d = new Date()
  d.setDate(d.getDate() - 1) // tegnaptól visszafelé keresünk
  for (let i = 0; i < 7; i++) {
    if (d.getDay() === target) return d.toISOString().slice(0, 10)
    d.setDate(d.getDate() - 1)
  }
  return null
}

/** Aktuális idő "HH:MM" formátumban */
export function getCurrentTimeHHMM() {
  const d = new Date()
  return `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`
}

// ── Alapértelmezett heti rutinok ──────────────────────────────────────────────
function mb(id, name, category, start, end) {
  return { id, name, category, polarity: getDefaultPolarity(category), startTime: start, endTime: end, completed: false }
}

export const DEFAULT_WEEKLY_ROUTINES = {
  monday: [
    mb('m1', 'Morning Workout',   'health',       '06:30', '07:30'),
    mb('m2', 'Deep Work Block',   'productivity', '08:00', '10:00'),
    mb('m3', 'Read & Study',      'education',    '10:30', '12:00'),
    mb('m4', 'Lunch Break',       'grind',        '12:00', '13:00'),
    mb('m5', 'Coding Session',    'productivity', '13:30', '16:30'),
    mb('m6', 'Evening Review',    'reading',      '20:00', '21:00'),
  ],
  tuesday: [
    mb('t1', 'Morning Run',       'health',       '07:00', '08:00'),
    mb('t2', 'Study Session',     'education',    '08:30', '11:00'),
    mb('t3', 'Creative Block',    'creativity',   '11:30', '13:00'),
    mb('t4', 'Lunch & Rest',      'grind',        '13:00', '14:00'),
    mb('t5', 'Project Work',      'productivity', '14:30', '17:00'),
    mb('t6', 'Evening Reading',   'reading',      '20:00', '21:30'),
  ],
  wednesday: [
    mb('w1', 'Workout',           'health',       '06:30', '07:30'),
    mb('w2', 'Deep Focus',        'productivity', '08:00', '10:30'),
    mb('w3', 'Learning Block',    'education',    '11:00', '13:00'),
    mb('w4', 'Lunch',             'grind',        '13:00', '14:00'),
    mb('w5', 'Skill Building',    'creativity',   '14:30', '17:00'),
    mb('w6', 'Night Study',       'reading',      '20:00', '21:00'),
  ],
  thursday: [
    mb('th1', 'Morning Run',      'health',       '07:00', '08:00'),
    mb('th2', 'Deep Work',        'productivity', '08:30', '11:00'),
    mb('th3', 'Reading Block',    'reading',      '11:30', '13:00'),
    mb('th4', 'Lunch',            'grind',        '13:00', '14:00'),
    mb('th5', 'Project Time',     'productivity', '14:30', '17:30'),
    mb('th6', 'Gaming Wind-Down', 'games',        '21:00', '22:00'),
  ],
  friday: [
    mb('f1', 'Workout',           'health',       '07:00', '08:00'),
    mb('f2', 'Morning Focus',     'productivity', '09:00', '11:00'),
    mb('f3', 'Learning',          'education',    '11:30', '13:00'),
    mb('f4', 'Lunch',             'grind',        '13:00', '14:00'),
    mb('f5', 'Creative Work',     'creativity',   '14:30', '16:30'),
    mb('f6', 'Social Night',      'social',       '19:00', '21:00'),
  ],
  saturday: [
    mb('s1', 'Long Run',          'health',       '08:00', '09:30'),
    mb('s2', 'Deep Learning',     'education',    '10:00', '12:00'),
    mb('s3', 'Lunch & Break',     'grind',        '12:00', '13:30'),
    mb('s4', 'Creative Session',  'creativity',   '14:00', '17:00'),
    mb('s5', 'Gaming Block',      'games',        '20:00', '22:00'),
  ],
  sunday: [
    mb('su1', 'Morning Walk',     'health',       '09:00', '10:00'),
    mb('su2', 'Reading',          'reading',      '10:30', '12:30'),
    mb('su3', 'Lunch',            'grind',        '12:30', '13:30'),
    mb('su4', 'Week Planning',    'productivity', '15:00', '16:30'),
    mb('su5', 'Entertainment',    'entertainment','20:00', '22:00'),
  ],
}

// ── Rang & szint ──────────────────────────────────────────────────────────────
export function getRankInfo(level) {
  let rank = RANKS[0]
  for (const r of RANKS) { if (level >= r.minLevel) rank = r }
  return rank
}

/**
 * Szintgörbe nerf:
 *   L < 10 → küszöb = 100 + (L-1)×10  (110, 120 … 190)
 *   L ≥ 10 → küszöb = 200 (plató)
 */
export function xpThreshold(level) {
  return level < 10 ? 100 + (level - 1) * 10 : 200
}

export function getLevelInfo(totalXp) {
  let level     = 1
  let remaining = totalXp
  while (true) {
    const threshold = xpThreshold(level)
    if (remaining < threshold) {
      return {
        level,
        xpIntoLevel: remaining,
        xpForLevel:  threshold,
        pct: Math.round((remaining / threshold) * 100),
      }
    }
    remaining -= threshold
    level++
  }
}

// ── Perzisztencia ─────────────────────────────────────────────────────────────
function load(key, fallback) {
  try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback }
  catch { return fallback }
}

export const persistence = {
  getTasks:          () => load('sg_tasks', []),
  setTasks:          v  => localStorage.setItem('sg_tasks', JSON.stringify(v)),
  getXp:             () => { const n = Number(localStorage.getItem('sg_xp')); return isFinite(n) ? n : 0 },
  setXp:             v  => localStorage.setItem('sg_xp', String(v)),
  getActivity:       () => load('sg_activity', {}),
  setActivity:       v  => localStorage.setItem('sg_activity', JSON.stringify(v)),
  // Focus percek soha nem mehetnek 0 alá — a setFocusMin gondoskodik róla
  getFocusMin:       () => { const n = Number(localStorage.getItem(FOCUS_CURRENCY_KEY)); return isFinite(n) ? n : 0 },
  setFocusMin:       v  => localStorage.setItem(FOCUS_CURRENCY_KEY, String(Math.max(0, Math.round(v)))),
  // Napi rutin blokkok
  getRoutine:        iso => load(`sg_routine_${iso}`, null),
  setRoutine:        (iso, v) => localStorage.setItem(`sg_routine_${iso}`, JSON.stringify(v)),
  // Alap-befejezési idő per nap (a kaszkád-delay számításhoz)
  getBaselineFinish: iso => localStorage.getItem(`sg_baseline_${iso}`) ?? null,
  setBaselineFinish: (iso, t) => t && localStorage.setItem(`sg_baseline_${iso}`, t),
  // Ismétlődő blokk sablonok: { id, name, category, polarity, startTime, endTime, days: number[] }[]
  // days: 0=Vasárnap, 1=Hétfő, 2=Kedd, 3=Szerda, 4=Csütörtök, 5=Péntek, 6=Szombat
  getRecurring:      () => load('sg_recurring', []),
  setRecurring:      v  => localStorage.setItem('sg_recurring', JSON.stringify(v)),
  // Per-day tombstones: materialized recurring IDs (r_xxx) the user explicitly deleted from today.
  // Prevents buildInitialBlocks from re-injecting them on every subsequent app load.
  getExcludedRecurring: iso => load(`sg_excl_rec_${iso}`, []),
  setExcludedRecurring: (iso, ids) => localStorage.setItem(`sg_excl_rec_${iso}`, JSON.stringify(ids)),
  // Per-nap szerzett XP (0–30), a dinamikus arány-alapú rendszerhez
  getDailyXp:  iso => { const n = Number(localStorage.getItem(`sg_daily_xp_${iso}`)); return isFinite(n) ? n : 0 },
  setDailyXp:  (iso, v) => localStorage.setItem(`sg_daily_xp_${iso}`, String(Math.max(0, Math.min(DAILY_XP_CAP, Math.round(v))))),
  // Retroaktív auto-claim tombstone (megakadályozza a kétszeres jóváírást)
  getAutoClaim: iso => localStorage.getItem(`sg_autoclaim_${iso}`) === '1',
  setAutoClaim: iso => localStorage.setItem(`sg_autoclaim_${iso}`, '1'),
  // Napi napló (Daily Journal) — szöveg per nap
  getDailyLog: iso => load(`sg_journal_${iso}`, ''),
  setDailyLog: (iso, text) => localStorage.setItem(`sg_journal_${iso}`, JSON.stringify(text)),
  getJournalClaimed: iso => localStorage.getItem(`sg_journal_claimed_${iso}`) === '1',
  setJournalClaimed: iso => localStorage.setItem(`sg_journal_claimed_${iso}`, '1'),
  // Store Minutes egyenleg
  getStoreMinutes: () => { const n = Number(localStorage.getItem('sg_store_min')); return isFinite(n) ? n : 0 },
  setStoreMinutes: v  => localStorage.setItem('sg_store_min', String(Math.max(0, Math.round(v)))),
  // Éjféli Rollover: utolsó ellenőrzési dátum (YYYY-MM-DD)
  getLastCheckedDate: ()    => localStorage.getItem('sg_last_checked_date') ?? null,
  setLastCheckedDate: iso   => localStorage.setItem('sg_last_checked_date', iso),
  // Language / Theme / Custom day start
  getLanguage:        ()    => localStorage.getItem('sg_language') ?? 'en',
  setLanguage:        v     => localStorage.setItem('sg_language', v),
  getTheme:           ()    => localStorage.getItem('sg_theme') ?? 'dark',
  setTheme:           v     => localStorage.setItem('sg_theme', v),
  getCustomDayStart:  ()    => localStorage.getItem('sg_day_start') ?? '00:00',
  setCustomDayStart:  v     => localStorage.setItem('sg_day_start', v),
  // Daily check-in popup trigger time
  getCheckInTime:     ()    => localStorage.getItem('sg_checkin_time') ?? '20:00',
  setCheckInTime:     v     => localStorage.setItem('sg_checkin_time', v),
  // Daily mood/focus check-in per day
  getMoodData:        iso   => load(`sg_mood_${iso}`, null),
  setMoodData:        (iso, data) => localStorage.setItem(`sg_mood_${iso}`, JSON.stringify(data)),
}

// ── Dátum-segédletek ──────────────────────────────────────────────────────────
export function todayISO() { return new Date().toISOString().slice(0, 10) }

export function lastNDays(n) {
  const days = []; const now = new Date()
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now); d.setDate(now.getDate() - i)
    days.push(d.toISOString().slice(0, 10))
  }
  return days
}

// ── Epic Quest segédletek ─────────────────────────────────────────────────────
/** Hátralévő napok az Epic Quest határidejéig (negatív = lejárt) */
export function getEpicDaysRemaining(dueDate) {
  if (!dueDate) return null
  const today = new Date(); today.setHours(0, 0, 0, 0)
  const due   = new Date(dueDate + 'T00:00:00')
  return Math.ceil((due - today) / 86_400_000)
}

/** Teljes napok száma a létrehozástól a határidőig (minimum 1) */
export function getEpicTotalDays(createdDate, dueDate) {
  if (!createdDate || !dueDate) return null
  const created = new Date(createdDate + 'T00:00:00')
  const due     = new Date(dueDate     + 'T00:00:00')
  return Math.max(1, Math.ceil((due - created) / 86_400_000))
}

/** True ha ≤ 3 nap van hátra a határidőig (dilation trigger) */
export function isEpicInDanger(dueDate) {
  const rem = getEpicDaysRemaining(dueDate)
  return rem !== null && rem >= 0 && rem <= 3
}
