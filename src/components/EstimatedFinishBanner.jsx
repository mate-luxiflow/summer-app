import { motion, AnimatePresence } from 'framer-motion'

/**
 * Borostyánsárga, pulzáló banner — megjelenik, ha a kaszkád miatt
 * az Estimated Finish eltért az eredeti alaptól.
 * `delayMinutes` > 0 esetén jelenik meg (sticky a Routine tartalom tetején).
 */
export default function EstimatedFinishBanner({ estimatedFinish, delayMinutes }) {
  const isVisible = delayMinutes > 0 && !!estimatedFinish

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: -12, scaleY: 0.9 }}
          animate={{ opacity: 1, y: 0, scaleY: 1 }}
          exit={{ opacity: 0, y: -8, scaleY: 0.95 }}
          transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
          className="sticky top-0 z-30 mx-4 mt-3 mb-1 rounded-xl border overflow-hidden"
          style={{
            borderColor: 'rgba(245,158,11,0.35)',
            background:  'linear-gradient(135deg, rgba(245,158,11,0.12), rgba(234,88,12,0.08))',
            backdropFilter: 'blur(8px)',
          }}
        >
          {/* Pulzáló belső réteg (csak a háttér villog, a szöveg stabil marad) */}
          <motion.div
            className="absolute inset-0 rounded-xl"
            animate={{ opacity: [0, 0.18, 0] }}
            transition={{ repeat: Infinity, duration: 2.6, ease: 'easeInOut' }}
            style={{ background: 'rgba(245,158,11,0.25)' }}
          />

          <div className="relative flex items-center gap-2.5 px-3.5 py-2.5">
            {/* Ikon */}
            <motion.span
              animate={{ rotate: [-3, 3, -3] }}
              transition={{ repeat: Infinity, duration: 1.8, ease: 'easeInOut' }}
              className="text-[16px] shrink-0 leading-none"
              aria-hidden
            >
              ⚠
            </motion.span>

            {/* Szöveg */}
            <div className="flex-1 min-w-0">
              <span className="text-[11px] font-semibold text-amber-300/70 uppercase tracking-widest">
                Estimated Finish
              </span>
              <div className="flex items-baseline gap-2 mt-0.5">
                <span className="text-[18px] font-black text-amber-300 tabular-nums leading-none">
                  {estimatedFinish}
                </span>
                <span
                  className="text-[11px] font-bold px-1.5 py-0.5 rounded-md"
                  style={{ background: 'rgba(239,68,68,0.18)', color: '#f87171' }}
                >
                  +{delayMinutes}m delay
                </span>
              </div>
            </div>

            {/* Jobb oldalon vizuális ritmus-elem */}
            <div className="shrink-0 flex flex-col gap-0.5 opacity-40">
              {[0,1,2].map(i => (
                <motion.div
                  key={i}
                  className="w-0.5 rounded-full bg-amber-400"
                  style={{ height: `${6 + i * 4}px` }}
                  animate={{ scaleY: [1, 1.5, 1] }}
                  transition={{ repeat: Infinity, duration: 1.2, delay: i * 0.15 }}
                />
              ))}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
