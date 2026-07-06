'use client'

import { useState, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FingerprintScanner, type ScanPhase } from '@/components/employee/FingerprintScanner'
import { clockIn, clockOut } from '@/app/dashboard/actions'

interface ClockButtonProps {
  /** Whether the employee currently has an open shift (clocked in) */
  hasOpenShift: boolean
  onSuccess?: (action: 'clocked_in' | 'clocked_out') => void
}

const SCAN_DURATION_MS = 2000   // 2 s fingerprint scan
const FPS = 60
const FRAME_MS = 1000 / FPS

export function ClockButton({ hasOpenShift, onSuccess }: ClockButtonProps) {
  const [phase, setPhase] = useState<ScanPhase>('idle')
  const [progress, setProgress] = useState(0)           // 0–1
  const [errorMessage, setErrorMessage] = useState('')
  const [isClockingOut, setIsClockingOut] = useState(hasOpenShift)
  const rafRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const resetAfterDelay = useCallback((delay: number) => {
    setTimeout(() => {
      setPhase('idle')
      setProgress(0)
      setErrorMessage('')
    }, delay)
  }, [])

  const getGPS = (): Promise<{ lat: number | null; lng: number | null }> =>
    new Promise(resolve => {
      if (!navigator.geolocation) return resolve({ lat: null, lng: null })
      navigator.geolocation.getCurrentPosition(
        pos => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => resolve({ lat: null, lng: null }),
        { 
          enableHighAccuracy: true, 
          timeout: 10000, 
          maximumAge: 0 
        }
      )
    })

  const handleClick = useCallback(async () => {
    if (phase !== 'idle') return

    setPhase('scanning')
    setProgress(0)
    setErrorMessage('')

    // ── Phase 1: Animated scan (2 s) ─────────────────────────
    await new Promise<void>(resolve => {
      const startTime = Date.now()
      function tick() {
        const elapsed = Date.now() - startTime
        const p = Math.min(elapsed / SCAN_DURATION_MS, 1)
        setProgress(p)
        if (p < 1) {
          rafRef.current = setTimeout(tick, FRAME_MS)
        } else {
          resolve()
        }
      }
      tick()
    })

    // ── Phase 2: GPS capture ──────────────────────────────────
    setPhase('locating')
    const { lat, lng } = await getGPS()

    // ── Phase 3: Submit attendance ────────────────────────────
    setPhase('submitting')
    const result = isClockingOut
      ? await clockOut(lat, lng)
      : await clockIn(lat, lng)

    if (result.success) {
      setPhase('success')
      setIsClockingOut(!isClockingOut)
      onSuccess?.(result.action)
      resetAfterDelay(2200)
    } else {
      setPhase('error')
      setErrorMessage(result.error)
      resetAfterDelay(3000)
    }
  }, [phase, isClockingOut, onSuccess, resetAfterDelay])

  const isBusy = phase !== 'idle'

  return (
    <div className="flex flex-col items-center gap-6">
      <AnimatePresence mode="wait">
        {isBusy ? (
          /* ── Scanner open ────────────────────────────────────── */
          <motion.div
            key="scanner"
            initial={{ opacity: 0, scale: 0.8, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.85, y: 10 }}
            transition={{ type: 'spring', stiffness: 340, damping: 26 }}
          >
            <FingerprintScanner
              phase={phase}
              progress={progress}
              errorMessage={errorMessage}
            />
          </motion.div>
        ) : (
          /* ── Idle button ─────────────────────────────────────── */
          <motion.div
            key="button"
            initial={{ opacity: 0, scale: 0.85, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.85, y: 10 }}
            transition={{ type: 'spring', stiffness: 340, damping: 26 }}
          >
            <motion.button
              id={isClockingOut ? 'clock-out-btn' : 'clock-in-btn'}
              onClick={handleClick}
              disabled={isBusy}
              className="relative group flex flex-col items-center gap-3 outline-none"
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              transition={{ type: 'spring', stiffness: 400, damping: 20 }}
            >
              {/* Button disc */}
              <div
                className={`
                  relative w-36 h-36 rounded-full flex items-center justify-center
                  transition-all duration-300 cursor-pointer
                  ${isClockingOut
                    ? 'bg-gradient-to-br from-rose-600 to-red-700 shadow-[0_0_32px_rgba(239,68,68,0.35)]'
                    : 'bg-gradient-to-br from-indigo-600 to-violet-700 shadow-[0_0_32px_rgba(99,102,241,0.35)]'}
                  group-hover:shadow-[0_0_48px_rgba(99,102,241,0.5)]
                `}
              >
                {/* Outer ring */}
                <div className={`
                  absolute inset-0 rounded-full border-2 opacity-30 group-hover:opacity-60
                  transition-opacity duration-300
                  ${isClockingOut ? 'border-red-400' : 'border-indigo-300'}
                `} />

                {/* Hover pulse */}
                <motion.div
                  className={`absolute inset-0 rounded-full ${isClockingOut ? 'bg-red-500' : 'bg-indigo-500'}`}
                  initial={{ scale: 1, opacity: 0 }}
                  whileHover={{ scale: 1.15, opacity: 0.15 }}
                  transition={{ duration: 0.35 }}
                />

                {/* Fingerprint icon (idle state) */}
                <FingerprintIdleIcon isClockedIn={isClockingOut} />
              </div>

              {/* Label */}
              <div className="text-center">
                <p className={`text-lg font-bold tracking-wide ${isClockingOut ? 'text-red-300' : 'text-indigo-300'}`}>
                  {isClockingOut ? 'Clock Out' : 'Clock In'}
                </p>
                <p className="text-xs text-zinc-500 mt-0.5">
                  Touch to scan fingerprint
                </p>
              </div>
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ─── Idle fingerprint icon inside the button ──────────────────────────────────
function FingerprintIdleIcon({ isClockedIn }: { isClockedIn: boolean }) {
  const color = isClockedIn ? '#fca5a5' : '#a5b4fc'
  return (
    <svg viewBox="0 0 100 100" width="64" height="64" style={{ opacity: 0.9 }}>
      {/* Same ridge shapes, simplified for the idle icon */}
      {[
        'M 50 50 C 50 42, 58 38, 65 42 C 72 46, 74 54, 68 60 C 62 66, 50 66, 44 60 C 38 54, 38 42, 50 36',
        'M 50 50 C 50 34, 63 28, 74 35 C 85 42, 87 58, 77 67 C 67 76, 47 76, 37 67 C 27 58, 27 38, 40 31',
        'M 50 50 C 50 26, 68 18, 82 28 C 96 38, 99 60, 87 72 C 75 84, 50 86, 33 76 C 16 66, 16 38, 30 26',
        'M 50 50 C 50 18, 73 8, 91 21 C 109 34, 111 66, 97 80 C 83 94, 53 96, 31 86 C 9 76, 5 38, 20 21',
      ].map((d, i) => (
        <path key={i} d={d} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" opacity={0.7 + i * 0.07} />
      ))}
    </svg>
  )
}
