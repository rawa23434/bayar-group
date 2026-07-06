'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/server'
import { computeHours } from '@/lib/utils'
import { type PayrollRow } from '@/types/database'

// ─── Leave actions ───────────────────────────

export async function approveLeave(leaveId: string) {
  const supabase = await createAdminClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  await supabase
    .from('leave_requests')
    .update({
      status: 'approved',
      reviewed_by: user.id,
      reviewed_at: new Date().toISOString(),
    })
    .eq('id', leaveId)

  revalidatePath('/admin')
}

export async function rejectLeave(leaveId: string) {
  const supabase = await createAdminClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  await supabase
    .from('leave_requests')
    .update({
      status: 'rejected',
      reviewed_by: user.id,
      reviewed_at: new Date().toISOString(),
    })
    .eq('id', leaveId)

  revalidatePath('/admin')
}

// ─── Payroll calculation ─────────────────────

/**
 * Calculates monthly payroll:
 * For each employee, sum all completed attendance hours in the month,
 * multiply by their hourly_rate, upsert into salary_records,
 * and return the computed rows.
 */
export async function calculatePayroll(month: string): Promise<PayrollRow[]> {
  const supabase = await createAdminClient()

  // month is "YYYY-MM-01" — compute range
  const [year, monthNum] = month.split('-').map(Number)
  const startDate = month
  const lastDay = new Date(year, monthNum, 0).getDate()
  const endDate = `${year}-${String(monthNum).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`

  // Fetch all attendance records for the month (with profiles)
  const { data: attendance, error: attErr } = await supabase
    .from('attendance')
    .select('user_id, clock_in, clock_out, profiles(full_name, hourly_rate)')
    .gte('date', startDate)
    .lte('date', endDate)
    .not('clock_out', 'is', null) // only completed shifts

  if (attErr) throw attErr

  // Aggregate hours per employee
  const employeeMap = new Map<string, {
    full_name: string
    hourly_rate: number
    total_hours: number
  }>()

  for (const record of (attendance ?? [])) {
    const profile = Array.isArray(record.profiles) ? record.profiles[0] : record.profiles
    if (!profile) continue

    const hours = computeHours(record.clock_in, record.clock_out as string)
    const existing = employeeMap.get(record.user_id)
    if (existing) {
      existing.total_hours += hours
    } else {
      employeeMap.set(record.user_id, {
        full_name: profile.full_name,
        hourly_rate: Number(profile.hourly_rate),
        total_hours: hours,
      })
    }
  }

  // Fetch existing salary records for the month (to get paid status)
  const { data: existing } = await supabase
    .from('salary_records')
    .select('id, user_id, paid_status')
    .eq('month', month)

  const salaryMap = new Map(existing?.map(s => [s.user_id, s]) ?? [])

  // Build result rows + upsert salary_records
  const rows: PayrollRow[] = []

  for (const [userId, data] of employeeMap.entries()) {
    const totalSalary = Math.round(data.total_hours * data.hourly_rate * 100) / 100
    const existingRecord = salaryMap.get(userId)

    // Upsert salary record
    const { data: upserted } = await supabase
      .from('salary_records')
      .upsert(
        {
          ...(existingRecord?.id ? { id: existingRecord.id } : {}),
          user_id: userId,
          month,
          total_amount: totalSalary,
          paid_status: existingRecord?.paid_status ?? 'unpaid',
        },
        { onConflict: 'user_id,month' }
      )
      .select('id, paid_status')
      .single()

    rows.push({
      user_id: userId,
      full_name: data.full_name,
      hourly_rate: data.hourly_rate,
      total_hours: Math.round(data.total_hours * 100) / 100,
      total_salary: totalSalary,
      paid_status: upserted?.paid_status ?? 'unpaid',
      salary_record_id: upserted?.id ?? existingRecord?.id ?? null,
    })
  }

  revalidatePath('/admin')
  return rows.sort((a, b) => a.full_name.localeCompare(b.full_name))
}

export async function markSalaryPaid(salaryRecordId: string) {
  const supabase = await createAdminClient()
  await supabase
    .from('salary_records')
    .update({ paid_status: 'paid', paid_at: new Date().toISOString() })
    .eq('id', salaryRecordId)

  revalidatePath('/admin')
}
