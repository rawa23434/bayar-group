'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export type CreateEmployeeResult =
  | { success: true }
  | { success: false; error: string }

async function checkAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { supabase: null, error: 'Not authenticated' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') return { supabase: null, error: 'Unauthorized' }
  return { supabase, error: null }
}

export async function createEmployee(formData: FormData): Promise<CreateEmployeeResult> {
  const { supabase, error: authError } = await checkAdmin()
  if (!supabase) return { success: false, error: authError! }

  const full_name   = (formData.get('full_name')   as string).trim()
  const email       = (formData.get('email')        as string).trim()
  const password    = (formData.get('password')     as string)
  const hourly_rate = parseFloat(formData.get('hourly_rate') as string) || 0
  const role        = (formData.get('role') as string) || 'employee'

  if (!full_name || !email || !password) {
    return { success: false, error: 'Name, email and password are required' }
  }
  if (password.length < 6) {
    return { success: false, error: 'Password must be at least 6 characters' }
  }

  // Use the official Supabase Admin API to create the user safely
  const { createClient: createSupabaseClient } = await import('@supabase/supabase-js')
  const adminAuthClient = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!, // We must use this key!
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  const { data, error } = await adminAuthClient.auth.admin.createUser({
    email: email,
    password: password,
    email_confirm: true,
    user_metadata: {
      full_name: full_name,
      role: role
    }
  })

  if (error) {
    return { success: false, error: error.message }
  }

  // The trigger handles inserting into profiles. Now update the hourly rate.
  if (data?.user?.id) {
    await adminAuthClient.from('profiles').update({ hourly_rate }).eq('id', data.user.id)
  }

  revalidatePath('/admin/employees')
  revalidatePath('/admin')
  return { success: true }
}

export async function deleteEmployee(userId: string): Promise<CreateEmployeeResult> {
  const { supabase, error: authError } = await checkAdmin()
  if (!supabase) return { success: false, error: authError! }

  const { data: { user } } = await supabase.auth.getUser()
  if (userId === user?.id) return { success: false, error: 'Cannot delete yourself' }

  // Use SQL function to delete from auth.users (cascades to profiles)
  const { error } = await supabase.rpc('delete_employee', { p_user_id: userId })

  if (error) return { success: false, error: error.message }

  revalidatePath('/admin/employees')
  revalidatePath('/admin')
  return { success: true }
}
