// ─────────────────────────────────────────────
//  Database types — mirrors Supabase SQL schema
// ─────────────────────────────────────────────

export type UserRole = 'admin' | 'employee'
export type LeaveStatus = 'pending' | 'approved' | 'rejected'
export type PaidStatus = 'paid' | 'unpaid' | 'partial'

export interface Profile {
  id: string
  full_name: string
  role: UserRole
  hourly_rate: number
  created_at: string
  updated_at: string
}

export interface Attendance {
  id: string
  user_id: string
  clock_in: string
  clock_out: string | null
  location_lat: number | null
  location_lng: number | null
  date: string
  created_at: string
  updated_at: string
  // joined
  profiles?: Pick<Profile, 'full_name' | 'hourly_rate'>
}

export interface LeaveRequest {
  id: string
  user_id: string
  start_date: string
  end_date: string
  reason: string
  status: LeaveStatus
  reviewed_by: string | null
  reviewed_at: string | null
  created_at: string
  updated_at: string
  // joined
  profiles?: Pick<Profile, 'full_name'>
}

export interface SalaryRecord {
  id: string
  user_id: string
  month: string
  total_amount: number
  paid_status: PaidStatus
  paid_at: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

// ─── Computed / View Types ───────────────────

export interface PayrollRow {
  user_id: string
  full_name: string
  hourly_rate: number
  total_hours: number
  total_salary: number
  paid_status: PaidStatus
  salary_record_id: string | null
}
