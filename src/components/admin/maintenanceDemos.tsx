import { motion } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faCheck,
  faBug,
  faShieldHalved,
  faServer,
  faDatabase,
  faGaugeHigh,
  faFloppyDisk,
  faHeartPulse,
  faArrowsUpDownLeftRight,
  faLock,
  faGlobe,
  faHeadset,
  faTriangleExclamation,
  faClipboardCheck,
  faRotate,
} from '@fortawesome/free-solid-svg-icons';

// Animation keys for the maintenance features. One small animated mini-mock each,
// in the same visual language as FeatureAnimation (rose accent, soft Stage).
export type MaintAnim =
  | 'bug-fix'
  | 'security'
  | 'advanced-security'
  | 'database'
  | 'performance'
  | 'backups'
  | 'multi-server'
  | 'renewal'
  | 'monitoring'
  | 'scaling'
  | 'ssl'
  | 'cdn'
  | 'support'
  | 'emergency'
  | 'health-report';

const loop = (duration: number, delay = 0) => ({
  duration,
  delay,
  repeat: Infinity,
  repeatType: 'reverse' as const,
  ease: 'easeInOut' as const,
});

function Stage({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-[120px] items-center justify-center rounded-2xl bg-gradient-to-b from-zinc-50 to-white p-4 ring-1 ring-black/5 dark:from-zinc-800 dark:to-zinc-900">
      {children}
    </div>
  );
}

/** Small animated visual per maintenance feature. */
export function MaintenanceDemo({ anim }: { anim: MaintAnim }) {
  switch (anim) {
    case 'bug-fix':
      return (
        <Stage>
          <div className="flex items-center gap-3">
            <motion.div
              className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-100 text-red-500"
              animate={{ scale: [1, 1.1, 1], opacity: [1, 1, 0] }}
              transition={{ duration: 2.4, repeat: Infinity, times: [0, 0.4, 0.55] }}
            >
              <FontAwesomeIcon icon={faBug} className="h-5 w-5" />
            </motion.div>
            <motion.span animate={{ x: [0, 6, 0] }} transition={loop(1)} className="font-bold text-rose-500">→</motion.span>
            <motion.div
              className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600"
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{ scale: [0.6, 1, 1], opacity: [0, 1, 1] }}
              transition={{ duration: 2.4, repeat: Infinity, times: [0.5, 0.7, 1] }}
            >
              <FontAwesomeIcon icon={faCheck} className="h-5 w-5" />
            </motion.div>
          </div>
        </Stage>
      );

    case 'security':
    case 'advanced-security':
      return (
        <Stage>
          <div className="relative">
            <motion.div
              className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-tr from-rose-500 to-red-600 text-white shadow-lg"
              animate={{ scale: [1, 1.06, 1] }}
              transition={loop(1.6)}
            >
              <FontAwesomeIcon icon={faShieldHalved} className="h-7 w-7" />
            </motion.div>
            {/* scanning sweep */}
            <motion.div
              className="absolute inset-x-0 h-0.5 bg-emerald-400/80"
              animate={{ top: ['8%', '92%', '8%'] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            />
          </div>
        </Stage>
      );

    case 'database':
      return (
        <Stage>
          <div className="flex flex-col items-center gap-2">
            <FontAwesomeIcon icon={faDatabase} className="h-8 w-8 text-rose-500" />
            <div className="flex gap-1">
              {[0, 1, 2, 3].map((i) => (
                <motion.span
                  key={i}
                  className="h-6 w-2 rounded-sm bg-rose-300"
                  animate={{ scaleY: [1, 0.4, 1], opacity: [0.5, 1, 0.5] }}
                  transition={loop(1.2, i * 0.2)}
                  style={{ originY: 1 }}
                />
              ))}
            </div>
            <span className="text-[10px] font-semibold text-emerald-600">optimised</span>
          </div>
        </Stage>
      );

    case 'performance':
      return (
        <Stage>
          <div className="flex flex-col items-center gap-2">
            <FontAwesomeIcon icon={faGaugeHigh} className="h-8 w-8 text-rose-500" />
            <div className="h-1.5 w-40 overflow-hidden rounded-full bg-zinc-200">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-amber-400 to-emerald-500"
                animate={{ width: ['20%', '95%'] }}
                transition={{ duration: 1.6, repeat: Infinity, repeatType: 'reverse', ease: 'easeInOut' }}
              />
            </div>
            <span className="text-[10px] font-semibold text-zinc-500">load time ↓</span>
          </div>
        </Stage>
      );

    case 'backups':
      return (
        <Stage>
          <div className="flex items-center gap-2">
            {[0, 1, 2, 3, 4].map((i) => (
              <motion.div
                key={i}
                className="flex h-9 w-9 items-center justify-center rounded-lg bg-white text-emerald-500 shadow ring-1 ring-black/5"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: [0, 1, 1], y: [6, 0, 0] }}
                transition={{ duration: 0.4, delay: i * 0.35, repeat: Infinity, repeatDelay: 2 }}
              >
                <FontAwesomeIcon icon={faFloppyDisk} className="h-4 w-4" />
              </motion.div>
            ))}
          </div>
        </Stage>
      );

    case 'multi-server':
    case 'scaling':
      return (
        <Stage>
          <div className="flex items-end gap-3">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="flex h-14 w-10 flex-col items-center justify-center gap-1 rounded-lg bg-gradient-to-b from-rose-500 to-red-600 text-white shadow-lg"
                animate={{ y: [0, -6, 0], scale: anim === 'scaling' && i === 2 ? [0.9, 1.05, 0.9] : 1 }}
                transition={loop(1.4, i * 0.25)}
              >
                <FontAwesomeIcon icon={faServer} className="h-4 w-4" />
                <span className="h-1 w-5 rounded bg-white/60" />
              </motion.div>
            ))}
          </div>
        </Stage>
      );

    case 'renewal':
    case 'ssl':
      return (
        <Stage>
          <div className="flex items-center gap-3">
            <motion.div
              className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600"
              animate={{ rotate: [0, 360] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
            >
              <FontAwesomeIcon icon={anim === 'ssl' ? faLock : faRotate} className="h-6 w-6" />
            </motion.div>
            <motion.span
              className="rounded-md bg-emerald-50 px-2 py-1 text-[10px] font-bold text-emerald-700"
              animate={{ opacity: [0.4, 1, 0.4] }}
              transition={loop(1.4)}
            >
              {anim === 'ssl' ? 'HTTPS valid' : 'auto-renewed'}
            </motion.span>
          </div>
        </Stage>
      );

    case 'monitoring':
      return (
        <Stage>
          <div className="flex flex-col items-center gap-2">
            <FontAwesomeIcon icon={faHeartPulse} className="h-7 w-7 text-rose-500" />
            <svg viewBox="0 0 120 28" className="h-7 w-40">
              <motion.path
                d="M0 14 H30 L38 4 L46 24 L54 14 H120"
                fill="none"
                stroke="#10b981"
                strokeWidth="2"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: [0, 1] }}
                transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
              />
            </svg>
            <span className="text-[10px] font-semibold text-emerald-600">100% uptime</span>
          </div>
        </Stage>
      );

    case 'cdn':
      return (
        <Stage>
          <div className="relative flex items-center justify-center">
            <FontAwesomeIcon icon={faGlobe} className="h-10 w-10 text-rose-500" />
            {[0, 1, 2].map((i) => (
              <motion.span
                key={i}
                className="absolute h-2 w-2 rounded-full bg-emerald-500"
                animate={{
                  x: [0, [22, -22, 18][i]],
                  y: [0, [-16, -8, 16][i]],
                  opacity: [1, 0],
                }}
                transition={{ duration: 1.4, delay: i * 0.3, repeat: Infinity }}
              />
            ))}
          </div>
        </Stage>
      );

    case 'support':
      return (
        <Stage>
          <div className="flex flex-col items-center gap-2">
            <FontAwesomeIcon icon={faHeadset} className="h-8 w-8 text-rose-500" />
            <div className="space-y-1">
              <motion.div
                className="ml-auto w-24 rounded-lg bg-violet-500 px-2 py-1 text-[9px] text-white"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: [0, 1, 1], y: [6, 0, 0] }}
                transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 2 }}
              >
                Need help?
              </motion.div>
              <motion.div
                className="w-24 rounded-lg bg-white px-2 py-1 text-[9px] text-zinc-700 ring-1 ring-black/5"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: [0, 1, 1], y: [6, 0, 0] }}
                transition={{ duration: 0.5, delay: 0.7, repeat: Infinity, repeatDelay: 1.8 }}
              >
                On it ⚡
              </motion.div>
            </div>
          </div>
        </Stage>
      );

    case 'emergency':
      return (
        <Stage>
          <motion.div
            className="flex h-16 w-16 items-center justify-center rounded-2xl bg-red-500 text-white shadow-lg"
            animate={{ scale: [1, 1.12, 1], boxShadow: ['0 0 0 0 rgba(239,68,68,0.5)', '0 0 0 14px rgba(239,68,68,0)', '0 0 0 0 rgba(239,68,68,0)'] }}
            transition={{ duration: 1.6, repeat: Infinity }}
          >
            <FontAwesomeIcon icon={faTriangleExclamation} className="h-7 w-7" />
          </motion.div>
        </Stage>
      );

    case 'health-report':
      return (
        <Stage>
          <motion.div
            className="w-44 rounded-xl bg-white p-3 shadow-md ring-1 ring-black/5"
            animate={{ y: [0, -5, 0] }}
            transition={loop(2)}
          >
            <div className="mb-2 flex items-center gap-2 text-rose-500">
              <FontAwesomeIcon icon={faClipboardCheck} className="h-4 w-4" />
              <span className="text-[10px] font-bold text-zinc-700">Health Report</span>
            </div>
            {['Uptime', 'Speed', 'Security'].map((label, i) => (
              <div key={label} className="mb-1.5">
                <div className="mb-0.5 flex justify-between text-[8px] text-zinc-500">
                  <span>{label}</span>
                </div>
                <div className="h-1 w-full rounded bg-zinc-100">
                  <motion.div
                    className="h-full rounded bg-emerald-500"
                    animate={{ width: ['10%', ['96%', '90%', '99%'][i]] }}
                    transition={{ duration: 1, delay: i * 0.3, repeat: Infinity, repeatType: 'reverse' }}
                  />
                </div>
              </div>
            ))}
          </motion.div>
        </Stage>
      );

    default:
      return (
        <Stage>
          <FontAwesomeIcon icon={faArrowsUpDownLeftRight} className="h-8 w-8 text-rose-400" />
        </Stage>
      );
  }
}
