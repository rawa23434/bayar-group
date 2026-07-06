'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createEmployee } from '../actions'

export default function NewEmployeePage() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const formData = new FormData(e.currentTarget)
    const result = await createEmployee(formData)

    if (!result.success) {
      setError(result.error)
      setLoading(false)
    } else {
      router.push('/admin/employees')
      router.refresh()
    }
  }

  return (
    <div className="max-w-lg mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Link
          href="/admin/employees"
          className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/>
          </svg>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-white">Add Employee</h1>
          <p className="text-zinc-400 text-sm">Create a new team member account</p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="glass rounded-2xl p-6 space-y-5">

        {/* Full Name */}
        <div>
          <label htmlFor="full_name" className="block text-sm font-medium text-zinc-300 mb-1.5">
            Full Name <span className="text-red-400">*</span>
          </label>
          <input
            id="full_name"
            name="full_name"
            type="text"
            required
            placeholder="e.g. Ahmad Karim"
            className="w-full px-4 py-2.5 bg-zinc-900 border border-zinc-700 rounded-lg text-white
                       placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500
                       focus:border-transparent transition-all duration-200"
          />
        </div>

        {/* Email */}
        <div>
          <label htmlFor="emp_email" className="block text-sm font-medium text-zinc-300 mb-1.5">
            Email Address <span className="text-red-400">*</span>
          </label>
          <input
            id="emp_email"
            name="email"
            type="email"
            required
            placeholder="employee@company.com"
            className="w-full px-4 py-2.5 bg-zinc-900 border border-zinc-700 rounded-lg text-white
                       placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500
                       focus:border-transparent transition-all duration-200"
          />
        </div>

        {/* Password */}
        <div>
          <label htmlFor="emp_password" className="block text-sm font-medium text-zinc-300 mb-1.5">
            Password <span className="text-red-400">*</span>
          </label>
          <input
            id="emp_password"
            name="password"
            type="password"
            required
            minLength={6}
            placeholder="Min. 6 characters"
            className="w-full px-4 py-2.5 bg-zinc-900 border border-zinc-700 rounded-lg text-white
                       placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500
                       focus:border-transparent transition-all duration-200"
          />
        </div>

        {/* Hourly Rate */}
        <div>
          <label htmlFor="hourly_rate" className="block text-sm font-medium text-zinc-300 mb-1.5">
            Hourly Rate ($)
          </label>
          <input
            id="hourly_rate"
            name="hourly_rate"
            type="number"
            min="0"
            step="0.01"
            placeholder="0.00"
            defaultValue="0"
            className="w-full px-4 py-2.5 bg-zinc-900 border border-zinc-700 rounded-lg text-white
                       placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500
                       focus:border-transparent transition-all duration-200"
          />
        </div>

        {/* Role */}
        <div>
          <label htmlFor="emp_role" className="block text-sm font-medium text-zinc-300 mb-1.5">
            Role
          </label>
          <select
            id="emp_role"
            name="role"
            className="w-full px-4 py-2.5 bg-zinc-900 border border-zinc-700 rounded-lg text-white
                       focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent
                       transition-all duration-200"
          >
            <option value="employee">Employee</option>
            <option value="admin">Admin</option>
          </select>
        </div>

        {/* Error */}
        {error && (
          <div className="flex items-center gap-2 px-4 py-3 bg-red-500/10 border border-red-500/30
                          rounded-lg text-red-400 text-sm">
            <svg className="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"/>
            </svg>
            {error}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 pt-1">
          <Link
            href="/admin/employees"
            className="flex-1 py-2.5 px-4 bg-zinc-800 hover:bg-zinc-700 text-white text-sm
                       font-semibold rounded-lg transition-all duration-200 text-center"
          >
            Cancel
          </Link>
          <button
            id="create-employee-submit"
            type="submit"
            disabled={loading}
            className="flex-1 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50
                       disabled:cursor-not-allowed text-white text-sm font-semibold rounded-lg
                       transition-all duration-200 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                </svg>
                Creating…
              </>
            ) : (
              'Create Employee'
            )}
          </button>
        </div>
      </form>
    </div>
  )
}
