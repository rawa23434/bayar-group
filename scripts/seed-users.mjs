import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://dlwheyufgiqlyvojehqa.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRsd2hleXVmZ2lxbHl2b2plaHFhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODMxNzE0MDUsImV4cCI6MjA5ODc0NzQwNX0.BBbA3efOxIk119ecYNKLLlu8XRlrRixUuDN0j265hQs'

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

const TEST_USERS = [
  { email: 'admin@attendpay.com',    password: 'Admin@123456',    role: 'admin',    full_name: 'Admin User'   },
  { email: 'employee@attendpay.com', password: 'Employee@123456', role: 'employee', full_name: 'Test Employee' },
]

async function upsertProfile(userId, role, full_name, email) {
  const { error } = await supabase
    .from('profiles')
    .upsert({ id: userId, role, full_name, email }, { onConflict: 'id' })

  if (error) {
    console.error(`   ❌  Profile upsert failed:`, error.message)
  } else {
    console.log(`   ✔  Profile saved (role: ${role})`)
  }
}

async function seedUser({ email, password, role, full_name }) {
  console.log(`\n⏳  Processing: ${email} (${role})...`)

  // Try sign up first
  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({ email, password })

  if (signUpError) {
    console.log(`   ⚠️  Sign up error: ${signUpError.message} | status: ${signUpError.status}`)
    // Maybe already registered — try sign in
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({ email, password })
    if (signInError) {
      console.error(`   ❌  Sign in also failed: ${signInError.message}`)
      return
    }
    console.log(`   ✔  Signed in as existing user`)
    await upsertProfile(signInData.user.id, role, full_name, email)
    await supabase.auth.signOut()
    return
  }

  if (!signUpData.user) {
    console.error(`   ❌  No user returned — "Confirm email" may still be ON in Supabase Dashboard`)
    console.log(`   👉  Go to: Authentication → Sign In / Providers → turn OFF "Confirm email" → Save changes`)
    return
  }

  console.log(`   ✔  User created: ${signUpData.user.id}`)
  await upsertProfile(signUpData.user.id, role, full_name, email)
  await supabase.auth.signOut()
  console.log(`✅  Done: ${email}`)
}

async function main() {
  console.log('🌱  Seeding Supabase users...')

  for (const user of TEST_USERS) {
    await seedUser(user)
  }

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('🎉  Seed done! Test credentials:')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  for (const u of TEST_USERS) {
    console.log(`  [${u.role.toUpperCase().padEnd(8)}]  ${u.email}  /  ${u.password}`)
  }
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
}

main()
