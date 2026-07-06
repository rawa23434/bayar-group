'use client'

import { useState } from 'react'
import { type PayrollRow } from '@/types/database'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { formatCurrency, formatMonth } from '@/lib/utils'
import { markSalaryPaid } from '@/app/admin/actions'

interface PayrollTableProps {
  rows: PayrollRow[]
  month: string
}

export function PayrollTable({ rows, month }: PayrollTableProps) {
  const [payingId, setPayingId] = useState<string | null>(null)
  const [localRows, setLocalRows] = useState<PayrollRow[]>(rows)

  const totalPayroll = localRows.reduce((sum, r) => sum + r.total_salary, 0)
  const paidCount = localRows.filter(r => r.paid_status === 'paid').length

  async function handleMarkPaid(row: PayrollRow) {
    if (!row.salary_record_id) return
    setPayingId(row.user_id)
    await markSalaryPaid(row.salary_record_id)
    setLocalRows(prev =>
      prev.map(r => r.user_id === row.user_id ? { ...r, paid_status: 'paid' } : r)
    )
    setPayingId(null)
  }

  return (
    <div className="space-y-5">
      {/* Summary strip */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-zinc-900 rounded-xl px-4 py-3 border border-zinc-800">
          <p className="text-xs text-zinc-500 uppercase tracking-wide mb-1">Period</p>
          <p className="text-white font-semibold">{formatMonth(month)}</p>
        </div>
        <div className="bg-zinc-900 rounded-xl px-4 py-3 border border-zinc-800">
          <p className="text-xs text-zinc-500 uppercase tracking-wide mb-1">Total Payroll</p>
          <p className="text-white font-semibold font-mono">{formatCurrency(totalPayroll)}</p>
        </div>
        <div className="bg-zinc-900 rounded-xl px-4 py-3 border border-zinc-800">
          <p className="text-xs text-zinc-500 uppercase tracking-wide mb-1">Paid / Total</p>
          <p className="text-white font-semibold">{paidCount} / {localRows.length}</p>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-zinc-800">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-zinc-900/80 border-b border-zinc-800">
              <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-400 uppercase tracking-wide">Employee</th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-zinc-400 uppercase tracking-wide">Hours Worked</th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-zinc-400 uppercase tracking-wide">Hourly Rate</th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-zinc-400 uppercase tracking-wide">Total Salary</th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-zinc-400 uppercase tracking-wide">Status</th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-zinc-400 uppercase tracking-wide">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/60">
            {localRows.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-zinc-500">
                  No payroll data for this period
                </td>
              </tr>
            ) : (
              localRows.map((row, i) => (
                <tr
                  key={row.user_id}
                  className={`transition-colors hover:bg-zinc-800/40 ${i % 2 === 0 ? '' : 'bg-zinc-900/20'}`}
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-indigo-600/30 border border-indigo-600/50 flex items-center justify-center text-indigo-300 text-xs font-bold uppercase">
                        {row.full_name.charAt(0)}
                      </div>
                      <span className="font-medium text-white">{row.full_name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-zinc-300 text-xs">
                    {row.total_hours.toFixed(2)}h
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-zinc-300 text-xs">
                    {formatCurrency(row.hourly_rate)}/hr
                  </td>
                  <td className="px-4 py-3 text-right font-mono font-semibold text-white">
                    {formatCurrency(row.total_salary)}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <Badge variant={row.paid_status}>{row.paid_status}</Badge>
                  </td>
                  <td className="px-4 py-3 text-center">
                    {row.paid_status !== 'paid' && row.salary_record_id ? (
                      <Button
                        id={`mark-paid-${row.user_id}`}
                        variant="success"
                        size="sm"
                        loading={payingId === row.user_id}
                        onClick={() => handleMarkPaid(row)}
                      >
                        Mark Paid
                      </Button>
                    ) : (
                      <span className="text-xs text-zinc-600 italic">—</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
          {localRows.length > 0 && (
            <tfoot className="border-t border-zinc-700">
              <tr className="bg-zinc-900/60">
                <td className="px-4 py-3 font-semibold text-zinc-300" colSpan={3}>
                  Total
                </td>
                <td className="px-4 py-3 text-right font-bold font-mono text-white text-base">
                  {formatCurrency(totalPayroll)}
                </td>
                <td colSpan={2} />
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  )
}
