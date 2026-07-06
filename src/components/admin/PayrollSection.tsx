'use client'

import { useState, useMemo } from 'react'
import { PayrollTable } from '@/components/admin/PayrollTable'
import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'
import { monthStart, formatMonth } from '@/lib/utils'
import { calculatePayroll } from '@/app/admin/actions'
import { type PayrollRow } from '@/types/database'

interface PayrollSectionProps {
  employees: { id: string; full_name: string }[]
}

export function PayrollSection({ employees }: PayrollSectionProps) {
  const now = new Date()
  const [selectedMonth, setSelectedMonth] = useState(monthStart(now))
  const [selectedEmployee, setSelectedEmployee] = useState<string>('all')
  const [rows, setRows] = useState<PayrollRow[] | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleCalculate() {
    setLoading(true)
    try {
      const result = await calculatePayroll(selectedMonth)
      setRows(result)
    } finally {
      setLoading(false)
    }
  }

  // Build list of last 12 months for the picker
  const monthOptions = Array.from({ length: 12 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    return { value: monthStart(d), label: formatMonth(monthStart(d)) }
  })

  // Filter rows based on selected employee
  const displayedRows = useMemo(() => {
    if (!rows) return null
    if (selectedEmployee === 'all') return rows
    return rows.filter(r => r.user_id === selectedEmployee)
  }, [rows, selectedEmployee])

  return (
    <div className="space-y-5">
      {/* Controls */}
      <div className="flex items-center gap-3 flex-wrap">
        <div>
          <label htmlFor="month-picker" className="block text-xs text-zinc-500 font-medium mb-1.5">
            Select Period
          </label>
          <select
            id="month-picker"
            value={selectedMonth}
            onChange={e => { setSelectedMonth(e.target.value); setRows(null) }}
            className="px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-sm text-white
                       focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
          >
            {monthOptions.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="employee-picker" className="block text-xs text-zinc-500 font-medium mb-1.5">
            Select Employee
          </label>
          <select
            id="employee-picker"
            value={selectedEmployee}
            onChange={e => setSelectedEmployee(e.target.value)}
            className="px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-sm text-white
                       focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
          >
            <option value="all">All Employees</option>
            {employees.map(emp => (
              <option key={emp.id} value={emp.id}>{emp.full_name}</option>
            ))}
          </select>
        </div>

        <div className="flex items-end">
          <Button
            id="calculate-payroll-btn"
            variant="primary"
            size="md"
            loading={loading}
            onClick={handleCalculate}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 11h.01M12 11h.01M15 11h.01M4 19h16a2 2 0 002-2V7a2 2 0 00-2-2H4a2 2 0 00-2 2v10a2 2 0 002 2z"/>
            </svg>
            Calculate Payroll
          </Button>
        </div>
      </div>

      {/* Result */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <Spinner className="w-8 h-8 mx-auto mb-2" />
            <p className="text-sm text-zinc-500">Calculating payroll…</p>
          </div>
        </div>
      )}

      {!loading && displayedRows === null && (
        <div className="py-12 text-center border border-dashed border-zinc-800 rounded-xl">
          <svg className="w-10 h-10 mx-auto mb-3 text-zinc-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 11h.01M12 11h.01M15 11h.01M4 19h16a2 2 0 002-2V7a2 2 0 00-2-2H4a2 2 0 00-2 2v10a2 2 0 002 2z"/>
          </svg>
          <p className="text-zinc-500 text-sm">Select a period and click <strong className="text-zinc-300">Calculate Payroll</strong></p>
          <p className="text-zinc-600 text-xs mt-1">Results will also be saved to salary_records</p>
        </div>
      )}

      {!loading && displayedRows !== null && (
        <PayrollTable rows={displayedRows} month={selectedMonth} />
      )}
    </div>
  )
}
