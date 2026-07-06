'use client'

import { useState } from 'react'
import { deleteEmployee } from './actions'

interface Props {
  employeeId: string
  employeeName: string
}

export function DeleteEmployeeButton({ employeeId, employeeName }: Props) {
  const [confirming, setConfirming] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleDelete() {
    setLoading(true)
    setError(null)
    const result = await deleteEmployee(employeeId)
    if (!result.success) {
      setError(result.error)
      setLoading(false)
      setConfirming(false)
    }
    // On success, the page will revalidate automatically
  }

  if (confirming) {
    return (
      <div className="flex items-center gap-2">
        {error && <span className="text-xs text-red-400">{error}</span>}
        <span className="text-xs text-zinc-400">Delete <strong className="text-white">{employeeName}</strong>?</span>
        <button
          id={`confirm-delete-${employeeId}`}
          onClick={handleDelete}
          disabled={loading}
          className="px-2.5 py-1 bg-red-600 hover:bg-red-500 disabled:opacity-50
                     text-white text-xs font-semibold rounded-lg transition-colors"
        >
          {loading ? '…' : 'Yes, delete'}
        </button>
        <button
          onClick={() => { setConfirming(false); setError(null) }}
          className="px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700
                     text-zinc-300 text-xs font-semibold rounded-lg transition-colors"
        >
          Cancel
        </button>
      </div>
    )
  }

  return (
    <button
      id={`delete-employee-${employeeId}`}
      onClick={() => setConfirming(true)}
      className="p-1.5 rounded-lg text-zinc-600 hover:text-red-400 hover:bg-red-500/10
                 transition-all duration-150"
      title={`Delete ${employeeName}`}
    >
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
      </svg>
    </button>
  )
}
