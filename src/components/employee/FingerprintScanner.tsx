'use client'

import { motion, AnimatePresence } from 'framer-motion'

// ─── Fingerprint SVG paths ───────────────────────────────────────────────────
// A set of arched ridge lines that form a fingerprint pattern
const RIDGE_PATHS = [
  // Innermost whorl
  'M 50 50 C 50 42, 58 38, 65 42 C 72 46, 74 54, 68 60 C 62 66, 50 66, 44 60 C 38 54, 38 42, 50 36',
  // Second ring
  'M 50 50 C 50 34, 63 28, 74 35 C 85 42, 87 58, 77 67 C 67 76, 47 76, 37 67 C 27 58, 27 38, 40 31',
  // Third ring
  'M 50 50 C 50 26, 68 18, 82 28 C 96 38, 99 60, 87 72 C 75 84, 50 86, 33 76 C 16 66, 16 38, 30 26',
  // Fourth ring
  'M 50 50 C 50 18, 73 8, 91 21 C 109 34, 111 66, 97 80 C 83 94, 53 96, 31 86 C 9 76, 5 38, 20 21',
  // Fifth ring — outermost
  'M 50 50 C 50 10, 78 -2, 100 14 C 122 30, 123 72, 107 88 C 91 104, 56 106, 29 94 C 2 82, -6 36, 10 16',
]

// Ridge arc lines forming finger creases (left arch style)
const ARCH_PATHS = [
  'M 20 72 C 30 60, 45 52, 50 50 C 55 48, 70 44, 80 38',
  'M 18 62 C 28 50, 42 40, 55 36 C 65 33, 75 34, 84 40',
  'M 22 82 C 33 68, 47 60, 54 56 C 62 52, 74 50, 82 52',
  'M 17 52 C 26 40, 38 30, 52 26 C 63 23, 74 26, 82 32',
  'M 25 90 C 36 76, 50 68, 56 64 C 64 60, 75 58, 82 62',
  'M 14 42 C 22 30, 36 20, 52 16 C 64 13, 76 16, 84 24',
  'M 28 98 C 40 84, 52 76, 57 72 C 65 67, 75 66, 82 71',
]

// ─── Types ────────────────────────────────────────────────────────────────────
export type ScanPhase =
  | 'idle'
  | 'scanning'
  | 'locating'
  | 'submitting'
  | 'success'
  | 'error'

interface FingerprintSVGProps {
  phase: ScanPhase
  progress: number // 0–1 scan progress
}

// ─── Fingerprint SVG ─────────────────────────────────────────────────────────
function FingerprintSVG({ phase, progress }: FingerprintSVGProps) {
  const isSuccess = phase === 'success'
  const isError = phase === 'error'
  const isActive = ['scanning', 'locating', 'submitting'].includes(phase)

  const strokeColor = isSuccess
    ? '#10b981'
    : isError
    ? '#ef4444'
    : isActive
    ? '#818cf8'
    : '#6366f1'

  const glowColor = isSuccess
    ? 'rgba(16,185,129,0.35)'
    : isError
    ? 'rgba(239,68,68,0.35)'
    : 'rgba(99,102,241,0.35)'

  return (
    <svg
      viewBox="0 0 100 100"
      className="w-full h-full"
      style={{ filter: isActive || isSuccess ? `drop-shadow(0 0 8px ${glowColor})` : 'none' }}
    >
      <defs>
        {/* Reveal clip: a rectangle that slides up as scan progresses */}
        <clipPath id="fp-reveal-clip">
          <rect
            x="0"
            y={100 - progress * 110}
            width="100"
            height="110"
          />
        </clipPath>
        <clipPath id="fp-full-clip">
          <rect x="0" y="0" width="100" height="100" />
        </clipPath>
      </defs>

      {/* Dim base ridges (always visible) */}
      <g clipPath="url(#fp-full-clip)" opacity={0.18}>
        {RIDGE_PATHS.map((d, i) => (
          <path key={`base-whorl-${i}`} d={d} fill="none" stroke={strokeColor} strokeWidth="1.6" strokeLinecap="round" />
        ))}
        {ARCH_PATHS.map((d, i) => (
          <path key={`base-arch-${i}`} d={d} fill="none" stroke={strokeColor} strokeWidth="1.4" strokeLinecap="round" />
        ))}
      </g>

      {/* Bright revealed ridges (clipped to scan progress) */}
      <g clipPath="url(#fp-reveal-clip)">
        {RIDGE_PATHS.map((d, i) => (
          <motion.path
            key={`whorl-${i}`}
            d={d}
            fill="none"
            stroke={strokeColor}
            strokeWidth="1.8"
            strokeLinecap="round"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={
              phase !== 'idle'
                ? { pathLength: 1, opacity: 1 }
                : { pathLength: 0, opacity: 0 }
            }
            transition={{ duration: 0.6, delay: i * 0.12, ease: 'easeOut' }}
          />
        ))}
        {ARCH_PATHS.map((d, i) => (
          <motion.path
            key={`arch-${i}`}
            d={d}
            fill="none"
            stroke={strokeColor}
            strokeWidth="1.5"
            strokeLinecap="round"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={
              phase !== 'idle'
                ? { pathLength: 1, opacity: 0.85 }
                : { pathLength: 0, opacity: 0 }
            }
            transition={{ duration: 0.5, delay: 0.05 + i * 0.08, ease: 'easeOut' }}
          />
        ))}
      </g>

      {/* Success checkmark overlay */}
      <AnimatePresence>
        {isSuccess && (
          <motion.path
            d="M 28 52 L 44 68 L 72 36"
            fill="none"
            stroke="#10b981"
            strokeWidth="5"
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.45, ease: 'easeOut' }}
          />
        )}
      </AnimatePresence>

      {/* Error X overlay */}
      <AnimatePresence>
        {isError && (
          <>
            <motion.path
              d="M 32 32 L 68 68"
              fill="none" stroke="#ef4444" strokeWidth="5" strokeLinecap="round"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{ duration: 0.3 }}
            />
            <motion.path
              d="M 68 32 L 32 68"
              fill="none" stroke="#ef4444" strokeWidth="5" strokeLinecap="round"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{ duration: 0.3, delay: 0.15 }}
            />
          </>
        )}
      </AnimatePresence>
    </svg>
  )
}

// ─── Scan Beam ────────────────────────────────────────────────────────────────
function ScanBeam({ phase, progress }: { phase: ScanPhase; progress: number }) {
  if (!['scanning', 'locating', 'submitting'].includes(phase)) return null
  const top = `${(1 - progress) * 100}%`

  return (
    <motion.div
      className="absolute left-0 right-0 pointer-events-none"
      style={{ top, height: '12px', marginTop: '-6px' }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Main beam */}
      <div
        className="w-full h-0.5 rounded-full"
        style={{
          background: 'linear-gradient(90deg, transparent, #818cf8, #c4b5fd, #818cf8, transparent)',
          boxShadow: '0 0 12px 3px rgba(129,140,248,0.6)',
        }}
      />
      {/* Glow halo below beam */}
      <div
        className="w-full absolute top-0"
        style={{
          height: '10px',
          background: 'linear-gradient(180deg, rgba(129,140,248,0.15), transparent)',
        }}
      />
    </motion.div>
  )
}

// ─── Corner brackets ─────────────────────────────────────────────────────────
function CornerBrackets({ phase }: { phase: ScanPhase }) {
  const isSuccess = phase === 'success'
  const isError = phase === 'error'
  const color = isSuccess ? '#10b981' : isError ? '#ef4444' : '#6366f1'
  const opacity = phase === 'idle' ? 0.4 : 1

  const bracketStyle: React.CSSProperties = {
    width: 18, height: 18,
    borderColor: color,
    opacity,
    transition: 'border-color 0.4s, opacity 0.4s',
  }

  return (
    <>
      <div style={{ ...bracketStyle, position: 'absolute', top: 0, left: 0, borderTopWidth: 2, borderLeftWidth: 2, borderRadius: '4px 0 0 0' }} />
      <div style={{ ...bracketStyle, position: 'absolute', top: 0, right: 0, borderTopWidth: 2, borderRightWidth: 2, borderRadius: '0 4px 0 0' }} />
      <div style={{ ...bracketStyle, position: 'absolute', bottom: 0, left: 0, borderBottomWidth: 2, borderLeftWidth: 2, borderRadius: '0 0 0 4px' }} />
      <div style={{ ...bracketStyle, position: 'absolute', bottom: 0, right: 0, borderBottomWidth: 2, borderRightWidth: 2, borderRadius: '0 0 4px 0' }} />
    </>
  )
}

// ─── Phase label ─────────────────────────────────────────────────────────────
const PHASE_LABELS: Record<ScanPhase, string> = {
  idle:       '',
  scanning:   'Scanning…',
  locating:   'Getting location…',
  submitting: 'Submitting…',
  success:    'Done!',
  error:      'Failed',
}

// ─── Main exported component ─────────────────────────────────────────────────
interface FingerprintScannerProps {
  phase: ScanPhase
  progress: number
  errorMessage?: string
}

export function FingerprintScanner({ phase, progress, errorMessage }: FingerprintScannerProps) {
  return (
    <div className="flex flex-col items-center gap-5">
      {/* Scanner frame */}
      <motion.div
        className="relative"
        style={{ width: 160, height: 160 }}
        animate={
          phase === 'scanning'
            ? { scale: [1, 1.02, 1], transition: { duration: 1.5, repeat: Infinity, ease: 'easeInOut' } }
            : { scale: 1 }
        }
      >
        {/* Outer glow ring */}
        <AnimatePresence>
          {['scanning', 'locating', 'submitting'].includes(phase) && (
            <motion.div
              className="absolute inset-0 rounded-3xl"
              style={{
                background: 'radial-gradient(ellipse at center, rgba(99,102,241,0.12) 0%, transparent 70%)',
                border: '1px solid rgba(99,102,241,0.2)',
              }}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.35 }}
            />
          )}
        </AnimatePresence>

        {/* Success ring */}
        <AnimatePresence>
          {phase === 'success' && (
            <motion.div
              className="absolute inset-0 rounded-3xl"
              style={{ border: '2px solid rgba(16,185,129,0.5)', boxShadow: '0 0 24px rgba(16,185,129,0.2)' }}
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            />
          )}
        </AnimatePresence>

        {/* Error ring */}
        <AnimatePresence>
          {phase === 'error' && (
            <motion.div
              className="absolute inset-0 rounded-3xl"
              style={{ border: '2px solid rgba(239,68,68,0.5)', boxShadow: '0 0 24px rgba(239,68,68,0.15)' }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1, x: [0, -4, 4, -4, 4, 0] }}
              transition={{ duration: 0.5 }}
              exit={{ opacity: 0 }}
            />
          )}
        </AnimatePresence>

        {/* Fingerprint canvas */}
        <div
          className="absolute inset-4 overflow-hidden rounded-2xl"
          style={{ background: 'rgba(99,102,241,0.04)' }}
        >
          <FingerprintSVG phase={phase} progress={progress} />
          <ScanBeam phase={phase} progress={progress} />
        </div>

        {/* Corner brackets */}
        <CornerBrackets phase={phase} />

        {/* Pulse rings for scanning */}
        <AnimatePresence>
          {phase === 'scanning' && (
            <>
              {[0, 1].map(i => (
                <motion.div
                  key={i}
                  className="absolute inset-0 rounded-3xl border border-indigo-500/30"
                  initial={{ scale: 1, opacity: 0.6 }}
                  animate={{ scale: 1.18 + i * 0.1, opacity: 0 }}
                  transition={{
                    duration: 1.6,
                    repeat: Infinity,
                    delay: i * 0.5,
                    ease: 'easeOut',
                  }}
                />
              ))}
            </>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Phase label */}
      <AnimatePresence mode="wait">
        {phase !== 'idle' && (
          <motion.div
            key={phase}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.25 }}
            className="text-center"
          >
            <p className={`text-sm font-semibold ${
              phase === 'success' ? 'text-emerald-400' :
              phase === 'error'   ? 'text-red-400' :
              'text-indigo-300'
            }`}>
              {PHASE_LABELS[phase]}
            </p>
            {phase === 'error' && errorMessage && (
              <p className="text-xs text-red-400/70 mt-1 max-w-[200px] text-center">
                {errorMessage}
              </p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
