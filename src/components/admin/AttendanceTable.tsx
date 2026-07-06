'use client'

import { useState, useMemo } from 'react'
import { type Attendance } from '@/types/database'
import { formatDate, formatTime, computeHours } from '@/lib/utils'
import { Badge } from '@/components/ui/Badge'

interface AttendanceTableProps {
  records: Attendance[]
}

export function AttendanceTable({ records }: AttendanceTableProps) {
  const [search, setSearch] = useState('')
  const [sortField, setSortField] = useState<'date' | 'full_name' | 'hours'>('date')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')

  const filtered = useMemo(() => {
    return records
      .filter(r => {
        const name = r.profiles?.full_name?.toLowerCase() ?? ''
        return name.includes(search.toLowerCase())
      })
      .sort((a, b) => {
        let cmp = 0
        if (sortField === 'date') {
          cmp = new Date(a.date).getTime() - new Date(b.date).getTime()
        } else if (sortField === 'full_name') {
          cmp = (a.profiles?.full_name ?? '').localeCompare(b.profiles?.full_name ?? '')
        } else if (sortField === 'hours') {
          cmp = computeHours(a.clock_in, a.clock_out) - computeHours(b.clock_in, b.clock_out)
        }
        return sortDir === 'asc' ? cmp : -cmp
      })
  }, [records, search, sortField, sortDir])

  function toggleSort(field: typeof sortField) {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortField(field); setSortDir('desc') }
  }

  function SortIcon({ field }: { field: typeof sortField }) {
    if (sortField !== field) return <span className="text-zinc-600 ml-1">↕</span>
    return <span className="text-indigo-400 ml-1">{sortDir === 'asc' ? '↑' : '↓'}</span>
  }

  return (
    <div className="space-y-4">
      {/* Search bar */}
      <div className="relative max-w-xs">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M11 19a8 8 0 100-16 8 8 0 000 16z"/>
        </svg>
        <input
          id="attendance-search"
          type="text"
          placeholder="Search employee…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-sm text-white placeholder-zinc-500
                     focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
        />
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-zinc-800">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-zinc-900/80 border-b border-zinc-800">
              <th
                className="px-4 py-3 text-left text-xs font-semibold text-zinc-400 uppercase tracking-wide cursor-pointer hover:text-white transition-colors select-none"
                onClick={() => toggleSort('full_name')}
              >
                Employee <SortIcon field="full_name" />
              </th>
              <th
                className="px-4 py-3 text-left text-xs font-semibold text-zinc-400 uppercase tracking-wide cursor-pointer hover:text-white transition-colors select-none"
                onClick={() => toggleSort('date')}
              >
                Date <SortIcon field="date" />
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-400 uppercase tracking-wide">
                Clock In
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-400 uppercase tracking-wide">
                Clock Out
              </th>
              <th
                className="px-4 py-3 text-left text-xs font-semibold text-zinc-400 uppercase tracking-wide cursor-pointer hover:text-white transition-colors select-none"
                onClick={() => toggleSort('hours')}
              >
                Hours <SortIcon field="hours" />
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-400 uppercase tracking-wide">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/60">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-zinc-500">
                  No attendance records found
                </td>
              </tr>
            ) : (
              filtered.map((record, i) => {
                const hours = computeHours(record.clock_in, record.clock_out)
                const isOpen = !record.clock_out
                return (
                  <tr
                    key={record.id}
                    className={`transition-colors hover:bg-zinc-800/40 ${i % 2 === 0 ? '' : 'bg-zinc-900/20'}`}
                  >
                    <td className="px-4 py-3 font-medium text-white">
                      {record.profiles?.full_name ?? '—'}
                    </td>
                    <td className="px-4 py-3 text-zinc-300">
                      {formatDate(record.date)}
                    </td>
                    <td className="px-4 py-3 text-zinc-300 font-mono text-xs">
                      {formatTime(record.clock_in)}
                    </td>
                    <td className="px-4 py-3 text-zinc-300 font-mono text-xs">
                      {record.clock_out ? formatTime(record.clock_out) : (
                        <span className="text-green-400 italic">Active</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-zinc-300 font-mono text-xs">
                      {isOpen ? '—' : `${hours}h`}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <Badge variant={isOpen ? 'open' : 'approved'}>
                          {isOpen ? 'In Progress' : 'Completed'}
                        </Badge>
                        {record.location_lat && record.location_lng && (
                          <a 
                            href={`https://www.google.com/maps/search/?api=1&query=${record.location_lat},${record.location_lng}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-zinc-500 hover:text-indigo-400 transition-colors flex items-center shrink-0"
                            title="View GPS Location on Map"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                          </a>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-zinc-500 text-right">
        {filtered.length} of {records.length} records
      </p>
    </div>
  )
}
