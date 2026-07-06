'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export type ClockResult =
  | { success: true; action: 'clocked_in' | 'clocked_out'; recordId: string }
  | { success: false; error: string }

export async function clockIn(
  locationLat: number | null,
  locationLng: number | null
): Promise<ClockResult> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Not authenticated' }

  const today = new Date().toISOString().split('T')[0]

  // Check for an already open shift today
  const { data: openShift } = await supabase
    .from('attendance')
    .select('id')
    .eq('user_id', user.id)
    .eq('date', today)
    .is('clock_out', null)
    .single()

  if (openShift) return { success: false, error: 'You already have an open shift today.' }

  const { data, error } = await supabase
    .from('attendance')
    .insert({
      user_id: user.id,
      clock_in: new Date().toISOString(),
      date: today,
      location_lat: locationLat,
      location_lng: locationLng,
    })
    .select('id')
    .single()

  if (error) return { success: false, error: error.message }

  revalidatePath('/dashboard')
  return { success: true, action: 'clocked_in', recordId: data.id }
}

export async function clockOut(
  locationLat: number | null,
  locationLng: number | null
): Promise<ClockResult> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Not authenticated' }

  const today = new Date().toISOString().split('T')[0]

  const { data: openShift } = await supabase
    .from('attendance')
    .select('id')
    .eq('user_id', user.id)
    .eq('date', today)
    .is('clock_out', null)
    .single()

  if (!openShift) return { success: false, error: 'No open shift found for today.' }

  const { error } = await supabase
    .from('attendance')
    .update({
      clock_out: new Date().toISOString(),
      location_lat: locationLat,
      location_lng: locationLng,
    })
    .eq('id', openShift.id)

  if (error) return { success: false, error: error.message }

  revalidatePath('/dashboard')
  return { success: true, action: 'clocked_out', recordId: openShift.id }
}

export async function getOpenShift(): Promise<{ hasOpenShift: boolean }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { hasOpenShift: false }

  const today = new Date().toISOString().split('T')[0]
  const { data } = await supabase
    .from('attendance')
    .select('id')
    .eq('user_id', user.id)
    .eq('date', today)
    .is('clock_out', null)
    .maybeSingle()

  return { hasOpenShift: !!data }
}

export async function requestLeave(startDate: string, endDate: string, reason: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Not authenticated' }

  const { error } = await supabase
    .from('leave_requests')
    .insert({
      user_id: user.id,
      start_date: startDate,
      end_date: endDate,
      reason,
      status: 'pending'
    })

  if (error) return { success: false, error: error.message }
  
  revalidatePath('/dashboard')
  return { success: true }
}
