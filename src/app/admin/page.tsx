import { Suspense } from 'react'
import { createAdminClient } from '@/lib/supabase/server'
import { AttendanceTable } from '@/components/admin/AttendanceTable'
import { LeaveRequestCard } from '@/components/admin/LeaveRequestCard'
import { PayrollSection } from '@/components/admin/PayrollSection'
import { Card, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { LoadingScreen } from '@/components/ui/Spinner'
import { formatCurrency, monthStart } from '@/lib/utils'
import { computeHours } from '@/lib/utils'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function AdminDashboardPage() {
  const supabase = await createAdminClient()

  // ── Fetch all data in parallel ──────────────────────────────
  const [
    { data: attendance },
    { data: leaveRequests },
    { data: profiles },
  ] = await Promise.all([
    supabase
      .from('attendance')
      .select('*, profiles(full_name, hourly_rate)')
      .order('date', { ascending: false })
      .limit(200),

    supabase
      .from('leave_requests')
      .select('*, profiles!leave_requests_user_id_fkey(full_name)')
      .order('created_at', { ascending: false }),

    supabase
      .from('profiles')
      .select('id, full_name, role, hourly_rate')
      .order('full_name'),
  ])


  // ── Stat cards ───────────────────────────────────────────────
  const totalEmployees = profiles?.filter(p => p.role === 'employee').length ?? 0
  const pendingLeaves  = leaveRequests?.filter(l => l.status === 'pending').length ?? 0
  const todayAttendance = attendance?.filter(
    a => a.date === new Date().toISOString().split('T')[0]
  ).length ?? 0

  // Current month total payroll (sum hours × rate for this month)
  const thisMonthStart = monthStart(new Date())
  const thisMonthRecords = attendance?.filter(a => a.date >= thisMonthStart) ?? []
  const estimatedPayroll = thisMonthRecords.reduce((sum, r) => {
    const profile = Array.isArray(r.profiles) ? r.profiles[0] : r.profiles
    const hours = computeHours(r.clock_in, r.clock_out)
    return sum + hours * Number(profile?.hourly_rate ?? 0)
  }, 0)

  const stats = [
    {
      id: 'stat-employees',
      label: 'Total Employees',
      value: totalEmployees,
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
            d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/>
        </svg>
      ),
      color: 'text-indigo-400',
      bg: 'bg-indigo-500/10',
    },
    {
      id: 'stat-attendance',
      label: "Today's Check-ins",
      value: todayAttendance,
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
        </svg>
      ),
      color: 'text-emerald-400',
      bg: 'bg-emerald-500/10',
    },
    {
      id: 'stat-leaves',
      label: 'Pending Leaves',
      value: pendingLeaves,
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
        </svg>
      ),
      color: 'text-amber-400',
      bg: 'bg-amber-500/10',
    },
    {
      id: 'stat-payroll',
      label: 'Estimated Payroll',
      value: formatCurrency(estimatedPayroll),
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
            d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
        </svg>
      ),
      color: 'text-violet-400',
      bg: 'bg-violet-500/10',
    },
  ]

  return (
    <div className="space-y-8">
      {/* ── Page header ────────────────────────────── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Admin Dashboard</h1>
          <p className="text-zinc-400 text-sm mt-1">
            Overview of attendance, leave requests, and payroll
          </p>
        </div>
        <Link
          href="/admin/employees/new"
          id="dashboard-add-employee-btn"
          className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500
                     text-white text-sm font-semibold rounded-lg transition-all duration-200
                     shadow-lg shadow-indigo-500/20 shrink-0"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"/>
          </svg>
          Add Employee
        </Link>
      </div>

      {/* ── Stat cards ─────────────────────────────── */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {stats.map(stat => (
          <div key={stat.id} id={stat.id} className="glass rounded-xl px-5 py-4 flex items-center gap-4">
            <div className={`w-10 h-10 rounded-xl ${stat.bg} flex items-center justify-center ${stat.color} shrink-0`}>
              {stat.icon}
            </div>
            <div>
              <p className="text-xs text-zinc-500 font-medium">{stat.label}</p>
              <p className="text-xl font-bold text-white mt-0.5">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Attendance Logs ─────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle>Attendance Logs</CardTitle>
          <span className="text-xs text-zinc-500 bg-zinc-800 px-2.5 py-1 rounded-full border border-zinc-700">
            {attendance?.length ?? 0} records
          </span>
        </CardHeader>
        <Suspense fallback={<LoadingScreen />}>
          <AttendanceTable records={attendance ?? []} />
        </Suspense>
      </Card>

      {/* ── Leave Requests ──────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle>Leave Requests</CardTitle>
          <div className="flex items-center gap-2">
            {pendingLeaves > 0 && (
              <Badge variant="pending">{pendingLeaves} pending</Badge>
            )}
          </div>
        </CardHeader>
        {(!leaveRequests || leaveRequests.length === 0) ? (
          <div className="py-12 text-center text-zinc-500">
            <svg className="w-10 h-10 mx-auto mb-3 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
            </svg>
            <p className="text-sm">No leave requests</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {/* Show pending first, then others */}
            {[
              ...(leaveRequests?.filter(r => r.status === 'pending') ?? []),
              ...(leaveRequests?.filter(r => r.status !== 'pending') ?? []),
            ].map(req => (
              <LeaveRequestCard key={req.id} request={req} />
            ))}
          </div>
        )}
      </Card>

      {/* ── Payroll ─────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle>Payroll Calculator</CardTitle>
        </CardHeader>
        <Suspense fallback={<LoadingScreen />}>
          <PayrollSection employees={profiles?.filter(p => p.role === 'employee') || []} />
        </Suspense>
      </Card>
    </div>
  )
}
