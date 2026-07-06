'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ClockButton } from '@/components/employee/ClockButton'
import { LeaveRequestModal } from '@/components/employee/LeaveRequestModal'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

interface RecentRecord {
  id: string
  date: string
  clockIn: string
  clockOut: string | null
}

interface RecentLeave {
  id: string
  start_date: string
  end_date: string
  reason: string
  status: 'pending' | 'approved' | 'rejected'
}

interface Props {
  profile: { full_name: string; hourly_rate: number }
  hasOpenShift: boolean
  openShiftClockIn: string | null
  recentAttendance: RecentRecord[]
  recentLeaves?: RecentLeave[]
}

const GREETINGS = ['Good morning', 'Good afternoon', 'Good evening']
function getGreeting() {
  const h = new Date().getHours()
  return h < 12 ? GREETINGS[0] : h < 18 ? GREETINGS[1] : GREETINGS[2]
}

export function EmployeeDashboardClient({
  profile,
  hasOpenShift,
  openShiftClockIn,
  recentAttendance,
  recentLeaves = [],
}: Props) {
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null)
  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  function showToast(msg: string, type: 'success' | 'error') {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3500)
  }

  function handleSuccess(action: 'clocked_in' | 'clocked_out') {
    const msg = action === 'clocked_in'
      ? '✅ Clock-in recorded successfully!'
      : '✅ Clock-out recorded successfully!'
    showToast(msg, 'success')
    // Soft refresh to update server data
    setTimeout(() => router.refresh(), 500)
  }

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <div className="min-h-screen bg-zinc-950 relative overflow-hidden">
      <LeaveRequestModal 
        isOpen={isLeaveModalOpen} 
        onClose={() => setIsLeaveModalOpen(false)} 
        onSuccess={() => showToast('✅ Leave request submitted!', 'success')} 
      />
      {/* Background ambient */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-60 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-indigo-600/8 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-80 h-80 bg-violet-700/8 rounded-full blur-3xl" />
      </div>

      {/* Navbar */}
      <header className="relative z-10 flex items-center justify-between px-6 py-4 border-b border-zinc-800/60 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white font-bold text-xs shadow-lg">
            AP
          </div>
          <span className="text-sm font-semibold text-white">AttendPay</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-xs font-bold text-indigo-300 uppercase">
            {profile.full_name.charAt(0)}
          </div>
          <span className="text-sm text-zinc-300 hidden sm:block">{profile.full_name}</span>
          <button
            id="employee-sign-out"
            onClick={handleSignOut}
            className="text-xs text-zinc-500 hover:text-red-400 transition-colors px-2 py-1 rounded"
          >
            Sign out
          </button>
        </div>
      </header>

      <main className="relative z-10 max-w-2xl mx-auto px-4 py-10 space-y-8">
        {/* Greeting */}
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <p className="text-zinc-500 text-sm">{getGreeting()},</p>
          <h1 className="text-2xl font-bold text-white">{profile.full_name}</h1>
          <p className="text-zinc-500 text-xs mt-1">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </motion.div>

        {/* Open shift status banner */}
        <AnimatePresence>
          {hasOpenShift && openShiftClockIn && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-emerald-500/10 border border-emerald-500/25">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
                </span>
                <p className="text-sm text-emerald-300 font-medium">
                  Shift started · Clocked in at <strong>{openShiftClockIn}</strong>
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Clock In / Out card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="glass rounded-2xl p-8 flex flex-col items-center gap-6"
        >
          <div className="text-center">
            <p className="text-zinc-400 text-sm">
              {hasOpenShift
                ? 'Ready to end your shift? Scan to clock out.'
                : 'Starting your shift? Scan to clock in.'}
            </p>
          </div>

          <ClockButton
            hasOpenShift={hasOpenShift}
            onSuccess={handleSuccess}
          />

          <p className="text-xs text-zinc-600 text-center max-w-xs">
            Your GPS location will be captured automatically after scanning for verification purposes.
          </p>
          
          <button
            onClick={() => setIsLeaveModalOpen(true)}
            className="mt-2 text-sm text-indigo-400 hover:text-indigo-300 font-medium px-4 py-2 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 transition-colors"
          >
            Need a day off? Request Leave
          </button>
        </motion.div>

        {/* Recent Leaves */}
        {recentLeaves.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.15 }}
            className="glass rounded-2xl p-6"
          >
            <h2 className="text-sm font-semibold text-zinc-300 mb-4">My Leave Requests</h2>
            <div className="space-y-3">
              {recentLeaves.map((leave, i) => (
                <motion.div
                  key={leave.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 + i * 0.06 }}
                  className="flex flex-col gap-2 p-3 rounded-lg bg-white/5 border border-zinc-800"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-zinc-200">
                      {leave.start_date} {leave.start_date !== leave.end_date ? `to ${leave.end_date}` : ''}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      leave.status === 'approved' ? 'bg-emerald-500/10 text-emerald-400' :
                      leave.status === 'rejected' ? 'bg-red-500/10 text-red-400' :
                      'bg-amber-500/10 text-amber-400'
                    }`}>
                      {leave.status.charAt(0).toUpperCase() + leave.status.slice(1)}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-400 line-clamp-2">{leave.reason}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Recent attendance */}
        {recentAttendance.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="glass rounded-2xl p-6"
          >
            <h2 className="text-sm font-semibold text-zinc-300 mb-4">Recent Attendance</h2>
            <div className="space-y-2">
              {recentAttendance.map((record, i) => (
                <motion.div
                  key={record.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.25 + i * 0.06 }}
                  className="flex items-center justify-between py-2.5 px-3 rounded-lg hover:bg-white/5 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-1.5 h-1.5 rounded-full ${record.clockOut ? 'bg-zinc-500' : 'bg-emerald-400 animate-pulse'}`} />
                    <span className="text-sm text-zinc-300">{record.date}</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs font-mono">
                    <span className="text-zinc-400">{record.clockIn}</span>
                    <span className="text-zinc-700">→</span>
                    <span className={record.clockOut ? 'text-zinc-400' : 'text-emerald-400'}>
                      {record.clockOut ?? 'Active'}
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </main>

      {/* Toast notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 40, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: 20, x: '-50%' }}
            className={`fixed bottom-6 left-1/2 z-50 px-5 py-3 rounded-xl shadow-2xl text-sm font-medium
              ${toast.type === 'success'
                ? 'bg-emerald-900/90 text-emerald-200 border border-emerald-700/50'
                : 'bg-red-900/90 text-red-200 border border-red-700/50'}
              backdrop-blur-md`}
          >
            {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
