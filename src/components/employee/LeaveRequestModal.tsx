'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/Button'
import { requestLeave } from '@/app/dashboard/actions'

export function LeaveRequestModal({ isOpen, onClose, onSuccess }: { isOpen: boolean, onClose: () => void, onSuccess: () => void }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    
    const formData = new FormData(e.currentTarget)
    const startDate = formData.get('start_date') as string
    const endDate = formData.get('end_date') as string
    const reason = formData.get('reason') as string

    if (!startDate || !endDate || !reason) {
      setError('Please fill in all fields')
      setLoading(false)
      return
    }

    if (new Date(startDate) > new Date(endDate)) {
      setError('Start date cannot be after end date')
      setLoading(false)
      return
    }

    const res = await requestLeave(startDate, endDate, reason)
    if (!res.success) {
      setError(res.error || 'Something went wrong')
    } else {
      onSuccess()
      onClose()
    }
    setLoading(false)
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md z-50 p-6 glass rounded-2xl border border-zinc-800 shadow-2xl"
          >
            <h2 className="text-xl font-bold text-white mb-2">Request Leave</h2>
            <p className="text-sm text-zinc-400 mb-6">Submit a request for time off or sick leave.</p>

            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-sm text-red-400">
                  {error}
                </div>
              )}
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1.5">Start Date</label>
                  <input
                    type="date"
                    name="start_date"
                    required
                    className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-sm text-white focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1.5">End Date</label>
                  <input
                    type="date"
                    name="end_date"
                    required
                    className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-sm text-white focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1.5">Reason / Message</label>
                <textarea
                  name="reason"
                  required
                  rows={4}
                  placeholder="E.g., Feeling sick, taking a vacation..."
                  className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-sm text-white focus:ring-2 focus:ring-indigo-500 resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-sm font-medium text-zinc-400 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <Button type="submit" variant="primary" loading={loading}>
                  Submit Request
                </Button>
              </div>
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
