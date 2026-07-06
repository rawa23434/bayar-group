'use client'

import { useState } from 'react'
import { type LeaveRequest } from '@/types/database'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { formatDate } from '@/lib/utils'
import { approveLeave, rejectLeave } from '@/app/admin/actions'

interface LeaveRequestCardProps {
  request: LeaveRequest
}

export function LeaveRequestCard({ request }: LeaveRequestCardProps) {
  const [loading, setLoading] = useState<'approve' | 'reject' | null>(null)
  const [localStatus, setLocalStatus] = useState(request.status)

  const isPending = localStatus === 'pending'

  async function handleApprove() {
    setLoading('approve')
    await approveLeave(request.id)
    setLocalStatus('approved')
    setLoading(null)
  }

  async function handleReject() {
    setLoading('reject')
    await rejectLeave(request.id)
    setLocalStatus('rejected')
    setLoading(null)
  }

  const daysCount = Math.ceil(
    (new Date(request.end_date).getTime() - new Date(request.start_date).getTime()) / 86400000
  ) + 1

  return (
    <div className="glass rounded-xl p-5 flex flex-col gap-4 hover:bg-white/[0.07] transition-colors duration-200">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-semibold text-white">{request.profiles?.full_name ?? 'Unknown Employee'}</p>
          <p className="text-xs text-zinc-500 mt-0.5">
            Submitted {formatDate(request.created_at)}
          </p>
        </div>
        <Badge variant={localStatus}>{localStatus.charAt(0).toUpperCase() + localStatus.slice(1)}</Badge>
      </div>

      {/* Date range */}
      <div className="flex items-center gap-2 text-sm">
        <svg className="w-4 h-4 text-zinc-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
        </svg>
        <span className="text-zinc-300">
          {formatDate(request.start_date)}
          {request.start_date !== request.end_date && (
            <> — {formatDate(request.end_date)}</>
          )}
        </span>
        <span className="text-xs text-zinc-500 bg-zinc-800 px-2 py-0.5 rounded-full ml-1">
          {daysCount} day{daysCount !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Reason */}
      <div className="bg-zinc-900/60 rounded-lg p-3">
        <p className="text-xs text-zinc-500 font-medium uppercase tracking-wide mb-1">Reason</p>
        <p className="text-sm text-zinc-300 leading-relaxed">{request.reason}</p>
      </div>

      {/* Actions */}
      {isPending && (
        <div className="flex items-center gap-2 pt-1">
          <Button
            id={`approve-leave-${request.id}`}
            variant="success"
            size="sm"
            loading={loading === 'approve'}
            disabled={loading !== null}
            onClick={handleApprove}
            className="flex-1"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/>
            </svg>
            Approve
          </Button>
          <Button
            id={`reject-leave-${request.id}`}
            variant="danger"
            size="sm"
            loading={loading === 'reject'}
            disabled={loading !== null}
            onClick={handleReject}
            className="flex-1"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
            </svg>
            Reject
          </Button>
        </div>
      )}

      {!isPending && (
        <p className="text-xs text-zinc-500 italic">
          {localStatus === 'approved' ? '✓ Approved' : '✗ Rejected'}
          {request.reviewed_at && ` on ${formatDate(request.reviewed_at)}`}
        </p>
      )}
    </div>
  )
}
