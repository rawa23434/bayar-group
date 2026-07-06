import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { EmployeeDashboardClient } from '@/components/employee/EmployeeDashboardClient'
import { formatTime, formatDate } from '@/lib/utils'

export const dynamic = 'force-dynamic'

export default async function EmployeeDashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, role, hourly_rate')
    .eq('id', user.id)
    .single()

  if (profile?.role === 'admin') redirect('/admin')

  const today = new Date().toISOString().split('T')[0]

  // Check for open shift today
  const { data: openShift } = await supabase
    .from('attendance')
    .select('id, clock_in')
    .eq('user_id', user.id)
    .eq('date', today)
    .is('clock_out', null)
    .maybeSingle()

  // Recent attendance (last 7 days)
  const { data: recentAttendance } = await supabase
    .from('attendance')
    .select('id, date, clock_in, clock_out')
    .eq('user_id', user.id)
    .order('date', { ascending: false })
    .limit(7)

  // Recent leave requests
  const { data: recentLeaves } = await supabase
    .from('leave_requests')
    .select('id, start_date, end_date, reason, status')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(5)

  return (
    <EmployeeDashboardClient
      profile={{
        full_name: profile?.full_name ?? 'Employee',
        hourly_rate: profile?.hourly_rate ?? 0,
      }}
      hasOpenShift={!!openShift}
      openShiftClockIn={openShift?.clock_in ?? null}
      recentAttendance={(recentAttendance ?? []).map(r => ({
        id: r.id,
        date: formatDate(r.date),
        clockIn: formatTime(r.clock_in),
        clockOut: r.clock_out ? formatTime(r.clock_out) : null,
      }))}
      recentLeaves={recentLeaves ?? []}
    />
  )
}
