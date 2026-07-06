import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { DeleteEmployeeButton } from './DeleteEmployeeButton'

export const dynamic = 'force-dynamic'

export default async function EmployeesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') redirect('/dashboard')

  const { data: employees } = await supabase
    .from('profiles')
    .select('id, full_name, role, hourly_rate, created_at')
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Employees</h1>
          <p className="text-zinc-400 text-sm mt-1">
            Manage your team members ({employees?.length ?? 0} total)
          </p>
        </div>
        <Link
          href="/admin/employees/new"
          id="add-employee-btn"
          className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500
                     text-white text-sm font-semibold rounded-lg transition-all duration-200
                     shadow-lg shadow-indigo-500/20"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/>
          </svg>
          Add Employee
        </Link>
      </div>

      {/* Table */}
      <div className="glass rounded-xl overflow-hidden">
        {(!employees || employees.length === 0) ? (
          <div className="py-16 text-center text-zinc-500">
            <svg className="w-12 h-12 mx-auto mb-4 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/>
            </svg>
            <p className="text-sm">No employees yet</p>
            <Link href="/admin/employees/new"
              className="mt-3 inline-block text-indigo-400 hover:text-indigo-300 text-sm underline">
              Add your first employee
            </Link>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-800 text-left">
                <th className="px-5 py-3.5 text-xs font-semibold text-zinc-500 uppercase tracking-wide">Name</th>
                <th className="px-5 py-3.5 text-xs font-semibold text-zinc-500 uppercase tracking-wide">Role</th>
                <th className="px-5 py-3.5 text-xs font-semibold text-zinc-500 uppercase tracking-wide">Hourly Rate</th>
                <th className="px-5 py-3.5 text-xs font-semibold text-zinc-500 uppercase tracking-wide">Joined</th>
                <th className="px-5 py-3.5 text-xs font-semibold text-zinc-500 uppercase tracking-wide w-12"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60">
              {employees.map((emp) => (
                <tr key={emp.id} className="hover:bg-white/[0.02] transition-colors group">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-indigo-500/20 border border-indigo-500/30
                                      flex items-center justify-center text-xs font-bold text-indigo-300 uppercase">
                        {emp.full_name.charAt(0)}
                      </div>
                      <span className="font-medium text-white">{emp.full_name}</span>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                      emp.role === 'admin'
                        ? 'bg-violet-500/15 text-violet-300 border border-violet-500/25'
                        : 'bg-zinc-700/60 text-zinc-300 border border-zinc-700'
                    }`}>
                      {emp.role}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-zinc-300">
                    {new Intl.NumberFormat('ar-IQ', { style: 'currency', currency: 'IQD', minimumFractionDigits: 0 }).format(Number(emp.hourly_rate))}/hr
                  </td>
                  <td className="px-5 py-4 text-zinc-500">
                    {new Date(emp.created_at).toLocaleDateString('en-US', {
                      year: 'numeric', month: 'short', day: 'numeric'
                    })}
                  </td>
                  <td className="px-4 py-4">
                    {/* Don't allow deleting yourself */}
                    {emp.id !== user.id && (
                      <DeleteEmployeeButton
                        employeeId={emp.id}
                        employeeName={emp.full_name}
                      />
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
