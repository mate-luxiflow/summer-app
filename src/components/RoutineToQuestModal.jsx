import { motion, AnimatePresence } from 'framer-motion'

/**
 * Intercept modal: fires after a routine block is added or saved.
 * Asks whether to also pin it as today's Quest.
 *
 * Props:
 *  blockName  – string | null  (truthy → modal open)
 *  onConfirm  – () => void     (user taps "Yes")
 *  onDismiss  – () => void     (user taps "No" or backdrop)
 */
export default function RoutineToQuestModal({ blockName, onConfirm, onDismiss }) {
  return (
    <AnimatePresence>
      {blockName && (
        <>
          {/* Backdrop */}
          <motion.div
            key="rtq-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22 }}
            className="fixed inset-0 z-[60] bg-black/72 backdrop-blur-[3px]"
            onClick={onDismiss}
            aria-hidden
          />

          {/* Card */}
          <motion.div
            key="rtq-card"
            role="dialog"
            aria-modal="true"
            aria-labelledby="rtq-title"
            initial={{ opacity: 0, scale: 0.86, y: 28 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.90, y: 20 }}
            transition={{ duration: 0.26, ease: [0.16, 1, 0.3, 1] }}
            className="fixed inset-x-5 z-[61] rounded-2xl overflow-hidden"
            style={{
              top: '50%',
              transform: 'translateY(-50%)',
              maxWidth: 380,
              margin: '0 auto',
              background: 'linear-gradient(160deg, #0f0f1c 0%, #09090f 100%)',
              border: '1px solid rgba(139,92,246,0.28)',
              boxShadow: [
                '0 32px 80px rgba(0,0,0,0.85)',
                '0 0 0 1px rgba(139,92,246,0.08)',
                '0 0 48px rgba(139,92,246,0.10)',
              ].join(', '),
            }}
          >
            {/* Top accent stripe */}
            <div
              aria-hidden
              className="h-[2px] w-full"
              style={{ background: 'linear-gradient(90deg, #8b5cf6 0%, #ec4899 50%, #f97316 100%)' }}
            />

            <div className="px-6 pt-6 pb-5">
              {/* Icon badge */}
              <div className="flex justify-center mb-4">
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center"
                  style={{
                    background: 'rgba(139,92,246,0.14)',
                    border: '1px solid rgba(139,92,246,0.32)',
                    boxShadow: '0 0 24px rgba(139,92,246,0.18)',
                  }}
                >
                  <span className="text-[26px] leading-none select-none">⚡</span>
                </div>
              </div>

              {/* Headline */}
              <h2
                id="rtq-title"
                className="text-[18px] font-black text-white text-center leading-snug mb-1"
              >
                Quest kitűzése?
              </h2>
              <p className="text-[12px] text-white/38 text-center leading-relaxed mb-4">
                Szeretnéd ezt a rutintevékenységet<br />aznapi Questként is kitűzni?
              </p>

              {/* Block name pill */}
              <div
                className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl mb-5"
                style={{
                  background: 'rgba(139,92,246,0.09)',
                  border: '1px solid rgba(139,92,246,0.20)',
                }}
              >
                <span className="text-[11px] text-purple-400/55 font-bold uppercase tracking-widest shrink-0">Rutin</span>
                <p
                  className="text-[14px] font-bold truncate"
                  style={{ color: '#c4b5fd' }}
                >
                  {blockName}
                </p>
              </div>

              {/* Action row */}
              <div className="flex gap-2.5">
                <motion.button
                  whileTap={{ scale: 0.94 }}
                  onClick={onDismiss}
                  className="flex-1 h-11 rounded-xl text-[13px] font-semibold transition-colors duration-150"
                  style={{
                    color: 'rgba(255,255,255,0.38)',
                    border: '1px solid rgba(255,255,255,0.09)',
                    background: 'rgba(255,255,255,0.03)',
                    touchAction: 'manipulation',
                  }}
                >
                  Kihagyom
                </motion.button>

                <motion.button
                  whileTap={{ scale: 0.94 }}
                  onClick={onConfirm}
                  className="flex-1 h-11 rounded-xl text-[13px] font-black text-white"
                  style={{
                    background: 'linear-gradient(135deg, #8b5cf6ee 0%, #7c3aedcc 100%)',
                    boxShadow: '0 4px 20px rgba(139,92,246,0.48)',
                    touchAction: 'manipulation',
                  }}
                >
                  ⚡ Igen, hozzáadom
                </motion.button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
