import { useState, useCallback, useMemo } from 'react'
import { motion } from 'framer-motion'
import { useAppContext } from '../context/AppContext'
import { LANGUAGES } from '../i18n'
import { todayISO, lastNDays, persistence } from '../store'

// ── Date formatter ─────────────────────────────────────────────────────────────
function fmtDate(iso) {
  return new Date(iso + 'T12:00:00').toLocaleDateString(undefined, {
    weekday: 'short', month: 'short', day: 'numeric',
  })
}

// ── Mood Slider (theme-aware via CSS vars) ─────────────────────────────────────
function MoodSlider({ label, value, onChange, colorFrom, colorTo }) {
  const pct = (value / 10) * 100

  return (
    <div className="mb-5">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[12px] font-semibold" style={{ color: 'var(--text-secondary)' }}>
          {label}
        </span>
        <span
          className="text-[18px] font-black tabular-nums leading-none"
          style={{
            background: `linear-gradient(90deg, ${colorFrom}, ${colorTo})`,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          {value}
          <span className="text-[11px] font-bold" style={{ opacity: 0.5 }}>/10</span>
        </span>
      </div>

      <div className="relative h-10 flex items-center">
        <div
          className="absolute left-0 right-0 h-[5px] rounded-full"
          style={{ background: 'var(--slider-track)' }}
        />
        <div
          className="absolute left-0 h-[5px] rounded-full transition-all duration-100"
          style={{
            width: `${pct}%`,
            background: `linear-gradient(90deg, ${colorFrom}, ${colorTo})`,
            boxShadow: pct > 0 ? `0 0 10px ${colorTo}60` : 'none',
          }}
        />
        <input
          type="range"
          min={0}
          max={10}
          step={1}
          value={value}
          onChange={e => onChange(Number(e.target.value))}
          className="absolute left-0 right-0 w-full h-10 opacity-0 cursor-pointer"
          style={{ touchAction: 'none' }}
        />
        <div
          className="absolute w-5 h-5 rounded-full shadow-lg transition-all duration-100 pointer-events-none"
          style={{
            left: `calc(${pct}% - 10px)`,
            background: `linear-gradient(135deg, ${colorFrom}, ${colorTo})`,
            boxShadow: `0 0 14px ${colorTo}70`,
            border: '2px solid rgba(255,255,255,0.22)',
          }}
        />
      </div>

      <div className="flex justify-between mt-0.5 px-0.5">
        {[0, 2, 4, 6, 8, 10].map(n => (
          <span key={n} className="text-[8px] font-bold tabular-nums" style={{ color: 'var(--text-dim)' }}>
            {n}
          </span>
        ))}
      </div>
    </div>
  )
}

// ── Section Header ─────────────────────────────────────────────────────────────
function SectionHeader({ label }) {
  return (
    <p
      className="text-[9px] font-black uppercase tracking-[0.20em] mb-3 mt-1"
      style={{ color: 'var(--text-muted)' }}
    >
      {label}
    </p>
  )
}

// ── Settings Card ──────────────────────────────────────────────────────────────
function SettingsCard({ children, className = '' }) {
  return (
    <div
      className={`rounded-2xl p-4 mb-4 ${className}`}
      style={{ background: 'var(--surface-card)', border: '1px solid var(--border-subtle)' }}
    >
      {children}
    </div>
  )
}

// ── Check-in History Row ───────────────────────────────────────────────────────
function HistoryItem({ iso, data, isLast }) {
  const moodPct  = (data.mood  / 10) * 100
  const focusPct = (data.focus / 10) * 100
  const savedTime = data.savedAt
    ? new Date(data.savedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : null

  return (
    <div
      className="py-3.5"
      style={{ borderBottom: isLast ? 'none' : '1px solid var(--border-subtle)' }}
    >
      {/* Date row */}
      <div className="flex items-center gap-2 mb-2">
        <p className="text-[12px] font-bold flex-1" style={{ color: 'var(--text-primary)' }}>
          {fmtDate(iso)}
        </p>
        {savedTime && (
          <span className="text-[9px] font-semibold" style={{ color: 'var(--text-muted)' }}>
            {savedTime}
          </span>
        )}
      </div>

      {/* Mood bar */}
      <div className="flex items-center gap-2 mb-1.5">
        <span className="text-[9px] font-bold uppercase tracking-wider w-9" style={{ color: 'var(--text-muted)' }}>
          Mood
        </span>
        <div className="flex-1 h-1.5 rounded-full" style={{ background: 'var(--slider-track)' }}>
          <div
            className="h-full rounded-full"
            style={{ width: `${moodPct}%`, background: 'linear-gradient(90deg,#f97316,#ec4899)' }}
          />
        </div>
        <span className="text-[10px] font-black tabular-nums w-4 text-right" style={{ color: '#f97316' }}>
          {data.mood}
        </span>
      </div>

      {/* Focus bar */}
      <div className="flex items-center gap-2">
        <span className="text-[9px] font-bold uppercase tracking-wider w-9" style={{ color: 'var(--text-muted)' }}>
          Focus
        </span>
        <div className="flex-1 h-1.5 rounded-full" style={{ background: 'var(--slider-track)' }}>
          <div
            className="h-full rounded-full"
            style={{ width: `${focusPct}%`, background: 'linear-gradient(90deg,#3b82f6,#06b6d4)' }}
          />
        </div>
        <span className="text-[10px] font-black tabular-nums w-4 text-right" style={{ color: '#06b6d4' }}>
          {data.focus}
        </span>
      </div>
    </div>
  )
}

// ── Main SettingsView ──────────────────────────────────────────────────────────
export default function SettingsView() {
  const {
    t,
    language, setLanguage,
    theme,    setTheme,
    customDayStart, setCustomDayStart,
    saveMoodCheckin, todayMoodData,
    checkInTime, setCheckInTime,
  } = useAppContext()

  const today = todayISO()

  const [mood,      setMood]      = useState(todayMoodData?.mood  ?? 5)
  const [focus,     setFocus]     = useState(todayMoodData?.focus ?? 5)
  const [justSaved, setJustSaved] = useState(false)
  const [dayStart,  setDayStart]  = useState(customDayStart)
  const [checkinT,  setCheckinT]  = useState(checkInTime)

  const handleSaveCheckin = useCallback(() => {
    saveMoodCheckin(mood, focus)
    setJustSaved(true)
    setTimeout(() => setJustSaved(false), 2000)
  }, [mood, focus, saveMoodCheckin])

  const handleDayStartChange = useCallback(val => {
    setDayStart(val)
    setCustomDayStart(val)
  }, [setCustomDayStart])

  const handleCheckinTimeChange = useCallback(val => {
    setCheckinT(val)
    setCheckInTime(val)
  }, [setCheckInTime])

  const lastSavedTime = todayMoodData?.savedAt
    ? new Date(todayMoodData.savedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : null

  // Last 90 days that have check-in data, most recent first
  const checkInHistory = useMemo(() => (
    lastNDays(90)
      .map(d => ({ iso: d, data: persistence.getMoodData(d) }))
      .filter(({ data }) => data !== null)
      .reverse()
  ), [today, todayMoodData])

  return (
    <div className="w-full min-h-screen" style={{ background: 'var(--bg-view)' }}>

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <header
        className="px-4 border-b"
        style={{
          borderColor:   'var(--header-border)',
          paddingTop:    'calc(env(safe-area-inset-top, 0px) + 14px)',
          paddingBottom: '14px',
        }}
      >
        <div className="flex items-center justify-between">
          <div className="w-10 h-10" />
          <h1
            className="text-[17px] font-black tracking-tight"
            style={{ color: 'var(--text-primary)' }}
          >
            {t('settingsTitle')}
          </h1>
          <div
            className="w-10 h-10 flex items-center justify-center rounded-xl"
            style={{
              color:  'var(--text-muted)',
              border: '1px solid var(--border-subtle)',
            }}
          >
            <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
        </div>
      </header>

      <div className="px-4 pt-5 pb-32">

        {/* ── 1. Language — Premium Dropdown ───────────────────────────────── */}
        <SectionHeader label={t('sectionLang')} />
        <SettingsCard>
          <div className="relative">
            {/* Custom overlay — shows selected language name + chevron */}
            <div
              className="absolute inset-0 flex items-center px-4 pointer-events-none"
              style={{ zIndex: 1 }}
            >
              <span className="flex-1 text-[14px] font-bold" style={{ color: 'var(--text-primary)' }}>
                {LANGUAGES.find(l => l.code === language)?.native ?? language}
              </span>
              <svg
                className="w-4 h-4 shrink-0"
                style={{ color: 'var(--text-muted)' }}
                fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </div>

            {/* Native select — transparent text so overlay shows through */}
            <select
              value={language}
              onChange={e => setLanguage(e.target.value)}
              className="relative w-full rounded-xl py-4 px-4 outline-none cursor-pointer"
              style={{
                background:      'var(--surface-elevated)',
                border:          '1px solid var(--border-medium)',
                color:           'transparent',
                WebkitAppearance:'none',
                MozAppearance:   'none',
                appearance:      'none',
                touchAction:     'manipulation',
              }}
              aria-label={t('sectionLang')}
            >
              {LANGUAGES.map(lang => (
                <option
                  key={lang.code}
                  value={lang.code}
                  style={{ color: '#0f172a', background: '#fff' }}
                >
                  {lang.native}
                </option>
              ))}
            </select>
          </div>
        </SettingsCard>

        {/* ── 2. Appearance ─────────────────────────────────────────────────── */}
        <SectionHeader label={t('sectionAppear')} />
        <SettingsCard>
          <div className="flex gap-2">
            {(['dark', 'light']).map(mode => {
              const isActive = theme === mode
              const label    = mode === 'dark' ? t('darkMode') : t('lightMode')
              const icon     = mode === 'dark' ? '🌙' : '☀️'
              return (
                <motion.button
                  key={mode}
                  whileTap={{ scale: 0.93 }}
                  onClick={() => setTheme(mode)}
                  className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl transition-all duration-150"
                  style={{
                    background: isActive
                      ? mode === 'dark'
                        ? 'rgba(139,92,246,0.15)'
                        : 'rgba(251,191,36,0.15)'
                      : 'var(--surface-card)',
                    border: isActive
                      ? mode === 'dark'
                        ? '1px solid rgba(139,92,246,0.45)'
                        : '1px solid rgba(251,191,36,0.45)'
                      : '1px solid var(--border-subtle)',
                    touchAction: 'manipulation',
                  }}
                  aria-pressed={isActive}
                >
                  <span className="text-base leading-none">{icon}</span>
                  <span
                    className="text-[12px] font-bold"
                    style={{
                      color: isActive
                        ? mode === 'dark' ? '#a78bfa' : '#f59e0b'
                        : 'var(--text-muted)',
                    }}
                  >
                    {label}
                  </span>
                </motion.button>
              )
            })}
          </div>
        </SettingsCard>

        {/* ── 3. Day Reset Time ─────────────────────────────────────────────── */}
        <SectionHeader label={t('sectionDayReset')} />
        <SettingsCard>
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1">
              <p className="text-[12px] font-semibold mb-1" style={{ color: 'var(--text-secondary)' }}>
                {t('dayResetDesc')}
              </p>
            </div>
            <input
              type="time"
              value={dayStart}
              onChange={e => handleDayStartChange(e.target.value)}
              className="shrink-0 rounded-xl px-3 py-2.5 text-[16px] font-black tabular-nums text-center outline-none"
              style={{
                background:      'var(--input-bg)',
                border:          '1px solid var(--input-border)',
                color:           'var(--accent-time)',
                minWidth:        '96px',
                WebkitAppearance:'none',
              }}
            />
          </div>

          {dayStart !== '00:00' && (
            <div
              className="flex items-center gap-2 mt-3 px-3 py-2.5 rounded-xl"
              style={{ background: 'rgba(6,182,212,0.07)', border: '1px solid rgba(6,182,212,0.20)' }}
            >
              <svg className="w-3.5 h-3.5 shrink-0" style={{ color: '#06b6d4' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-[10px] font-semibold" style={{ color: 'rgba(6,182,212,0.85)' }}>
                Active — new day begins at <strong>{dayStart}</strong>
              </p>
            </div>
          )}
        </SettingsCard>

        {/* ── 4. Daily Check-in ─────────────────────────────────────────────── */}
        <SectionHeader label={t('sectionCheckin')} />
        <SettingsCard>
          {/* Popup trigger time row */}
          <div
            className="flex items-center justify-between gap-4 mb-4 pb-4"
            style={{ borderBottom: '1px solid var(--border-subtle)' }}
          >
            <div className="flex-1">
              <p className="text-[12px] font-bold mb-0.5" style={{ color: 'var(--text-primary)' }}>
                {t('checkinTimeLabel')}
              </p>
              <p className="text-[10px] font-medium" style={{ color: 'var(--text-muted)' }}>
                Auto-popup if no check-in yet
              </p>
            </div>
            <input
              type="time"
              value={checkinT}
              onChange={e => handleCheckinTimeChange(e.target.value)}
              className="shrink-0 rounded-xl px-3 py-2.5 text-[16px] font-black tabular-nums text-center outline-none"
              style={{
                background:      'var(--input-bg)',
                border:          '1px solid var(--input-border)',
                color:           '#f97316',
                minWidth:        '96px',
                WebkitAppearance:'none',
              }}
            />
          </div>

          {/* Today's save status */}
          {lastSavedTime && (
            <div
              className="flex items-center gap-2 px-3 py-2 rounded-xl mb-4"
              style={{ background: 'rgba(34,197,94,0.07)', border: '1px solid rgba(34,197,94,0.20)' }}
            >
              <svg className="w-3 h-3 shrink-0" style={{ color: '#22c55e' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              <p className="text-[10px] font-semibold" style={{ color: 'rgba(34,197,94,0.85)' }}>
                Today's check-in saved at {lastSavedTime}
              </p>
            </div>
          )}

          <MoodSlider
            label={t('moodLabel')}
            value={mood}
            onChange={setMood}
            colorFrom="#f97316"
            colorTo="#ec4899"
          />
          <MoodSlider
            label={t('focusLabel')}
            value={focus}
            onChange={setFocus}
            colorFrom="#3b82f6"
            colorTo="#06b6d4"
          />

          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={handleSaveCheckin}
            className="w-full py-3.5 rounded-2xl font-black text-[14px] text-white transition-all duration-300 mt-1"
            style={{
              background:  justSaved
                ? 'linear-gradient(135deg,#22c55e,#16a34a)'
                : 'linear-gradient(135deg,#f97316,#ec4899)',
              boxShadow:   justSaved
                ? '0 4px 22px rgba(34,197,94,0.32)'
                : '0 4px 22px rgba(249,115,22,0.28)',
              touchAction: 'manipulation',
            }}
            aria-label={t('saveCheckin')}
          >
            {justSaved ? t('checkinSaved') : t('saveCheckin')}
          </motion.button>
        </SettingsCard>

        {/* ── 5. Check-in History ───────────────────────────────────────────── */}
        <SectionHeader label={t('sectionCheckinHistory')} />

        {checkInHistory.length === 0 ? (
          <div
            className="rounded-2xl mb-4 flex flex-col items-center justify-center py-10 gap-2"
            style={{ background: 'var(--surface-card)', border: '1px solid var(--border-subtle)' }}
          >
            <span className="text-2xl" style={{ opacity: 0.20 }}>📊</span>
            <p className="text-[11px] font-semibold" style={{ color: 'var(--text-muted)' }}>
              {t('noCheckinHistory')}
            </p>
          </div>
        ) : (
          <div
            className="rounded-2xl mb-4 overflow-hidden"
            style={{ background: 'var(--surface-card)', border: '1px solid var(--border-subtle)' }}
          >
            <div className="px-4">
              {checkInHistory.map(({ iso, data }, idx) => (
                <HistoryItem
                  key={iso}
                  iso={iso}
                  data={data}
                  isLast={idx === checkInHistory.length - 1}
                />
              ))}
            </div>
          </div>
        )}

        {/* App info */}
        <div className="text-center mt-6">
          <p
            className="text-[10px] font-bold uppercase tracking-widest"
            style={{ color: 'var(--text-dim)' }}
          >
            Summer Grind · v5.6
          </p>
        </div>
      </div>
    </div>
  )
}
