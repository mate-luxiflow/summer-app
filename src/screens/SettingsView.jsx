import { useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import { useAppContext } from '../context/AppContext'
import { LANGUAGES } from '../i18n'
import { todayISO } from '../store'

// ── Mood & Focus Slider ────────────────────────────────────────────────────────
function MoodSlider({ label, value, onChange, colorFrom, colorTo }) {
  const pct = (value / 10) * 100

  return (
    <div className="mb-5">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[12px] font-semibold" style={{ color: 'rgba(255,255,255,0.60)' }}>
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

      {/* Track + thumb */}
      <div className="relative h-10 flex items-center">
        <div
          className="absolute left-0 right-0 h-[5px] rounded-full"
          style={{ background: 'rgba(255,255,255,0.08)' }}
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
        {/* Custom thumb */}
        <div
          className="absolute w-5 h-5 rounded-full border-2 border-white/20 shadow-lg transition-all duration-100 pointer-events-none"
          style={{
            left: `calc(${pct}% - 10px)`,
            background: `linear-gradient(135deg, ${colorFrom}, ${colorTo})`,
            boxShadow: `0 0 14px ${colorTo}70`,
          }}
        />
      </div>

      {/* Scale ticks */}
      <div className="flex justify-between mt-0.5 px-0.5">
        {[0, 2, 4, 6, 8, 10].map(n => (
          <span key={n} className="text-[8px] font-bold tabular-nums" style={{ color: 'rgba(255,255,255,0.18)' }}>
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
    <p className="text-[9px] font-black uppercase tracking-[0.20em] mb-3 mt-1"
      style={{ color: 'rgba(255,255,255,0.25)' }}>
      {label}
    </p>
  )
}

// ── Settings Card ──────────────────────────────────────────────────────────────
function SettingsCard({ children, className = '' }) {
  return (
    <div
      className={`rounded-2xl p-4 mb-4 ${className}`}
      style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}
    >
      {children}
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
  } = useAppContext()

  const today = todayISO()

  // Mood & focus local state — init from saved data if available
  const [mood,       setMood]       = useState(todayMoodData?.mood  ?? 5)
  const [focus,      setFocus]      = useState(todayMoodData?.focus ?? 5)
  const [justSaved,  setJustSaved]  = useState(false)
  const [dayStart,   setDayStart]   = useState(customDayStart)

  const handleSaveCheckin = useCallback(() => {
    saveMoodCheckin(mood, focus)
    setJustSaved(true)
    setTimeout(() => setJustSaved(false), 2000)
  }, [mood, focus, saveMoodCheckin])

  const handleDayStartChange = useCallback((val) => {
    setDayStart(val)
    setCustomDayStart(val)
  }, [setCustomDayStart])

  const lastSavedTime = todayMoodData?.savedAt
    ? new Date(todayMoodData.savedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : null

  return (
    <div
      className="w-full min-h-screen"
      style={{ background: 'linear-gradient(to bottom, #0b0b12 0%, #020205 100%)' }}
    >
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <header
        className="px-4 border-b border-white/6"
        style={{
          paddingTop:    'calc(env(safe-area-inset-top, 0px) + 14px)',
          paddingBottom: '14px',
        }}
      >
        <div className="flex items-center justify-between">
          <div className="w-10 h-10" />
          <h1 className="text-[17px] font-black text-white tracking-tight">{t('settingsTitle')}</h1>
          <div
            className="w-10 h-10 flex items-center justify-center rounded-xl border border-white/8"
            style={{ color: 'rgba(255,255,255,0.25)' }}
          >
            <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
        </div>
      </header>

      <div className="px-4 pt-5 pb-32">

        {/* ── 1. Language ──────────────────────────────────────────────────── */}
        <SectionHeader label={t('sectionLang')} />
        <SettingsCard>
          <div className="grid grid-cols-2 gap-2">
            {LANGUAGES.map(lang => {
              const isActive = language === lang.code
              return (
                <motion.button
                  key={lang.code}
                  whileTap={{ scale: 0.93 }}
                  onClick={() => setLanguage(lang.code)}
                  className="flex items-center gap-2.5 px-3 py-3 rounded-xl transition-all duration-150"
                  style={{
                    background:  isActive
                      ? 'linear-gradient(135deg, rgba(249,115,22,0.15), rgba(236,72,153,0.15))'
                      : 'rgba(255,255,255,0.03)',
                    border: isActive
                      ? '1px solid rgba(249,115,22,0.45)'
                      : '1px solid rgba(255,255,255,0.07)',
                    touchAction: 'manipulation',
                  }}
                  aria-pressed={isActive}
                  aria-label={lang.native}
                >
                  <span
                    className="text-[14px] font-bold leading-none"
                    style={{
                      color: isActive
                        ? 'rgba(255,255,255,0.92)'
                        : 'rgba(255,255,255,0.42)',
                    }}
                  >
                    {lang.native}
                  </span>
                  {isActive && (
                    <div
                      className="ml-auto w-1.5 h-1.5 rounded-full shrink-0"
                      style={{ background: 'linear-gradient(135deg,#f97316,#ec4899)' }}
                    />
                  )}
                </motion.button>
              )
            })}
          </div>
        </SettingsCard>

        {/* ── 2. Appearance ────────────────────────────────────────────────── */}
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
                    background:  isActive
                      ? mode === 'dark'
                        ? 'rgba(139,92,246,0.15)'
                        : 'rgba(251,191,36,0.15)'
                      : 'rgba(255,255,255,0.03)',
                    border: isActive
                      ? mode === 'dark'
                        ? '1px solid rgba(139,92,246,0.45)'
                        : '1px solid rgba(251,191,36,0.45)'
                      : '1px solid rgba(255,255,255,0.07)',
                    touchAction: 'manipulation',
                  }}
                  aria-pressed={isActive}
                >
                  <span className="text-base leading-none">{icon}</span>
                  <span
                    className="text-[12px] font-bold"
                    style={{
                      color: isActive
                        ? mode === 'dark' ? '#a78bfa' : '#fbbf24'
                        : 'rgba(255,255,255,0.35)',
                    }}
                  >
                    {label}
                  </span>
                </motion.button>
              )
            })}
          </div>
        </SettingsCard>

        {/* ── 3. Day Reset Time ────────────────────────────────────────────── */}
        <SectionHeader label={t('sectionDayReset')} />
        <SettingsCard>
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1">
              <p className="text-[12px] font-semibold mb-1" style={{ color: 'rgba(255,255,255,0.55)' }}>
                {t('dayResetDesc')}
              </p>
            </div>
            <div className="shrink-0">
              <input
                type="time"
                value={dayStart}
                onChange={e => handleDayStartChange(e.target.value)}
                className="rounded-xl px-3 py-2.5 text-[16px] font-black tabular-nums text-center outline-none"
                style={{
                  background:  'rgba(255,255,255,0.06)',
                  border:      '1px solid rgba(255,255,255,0.14)',
                  color:       '#06b6d4',
                  minWidth:    '96px',
                  WebkitAppearance: 'none',
                }}
              />
            </div>
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

        {/* ── 4. Daily Check-in ────────────────────────────────────────────── */}
        <SectionHeader label={t('sectionCheckin')} />
        <SettingsCard>
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
                ? 'linear-gradient(135deg, #22c55e, #16a34a)'
                : 'linear-gradient(135deg, #f97316, #ec4899)',
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

        {/* ── App info ─────────────────────────────────────────────────────── */}
        <div className="text-center mt-6">
          <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.10)' }}>
            Summer Grind · v5.5
          </p>
        </div>
      </div>
    </div>
  )
}
