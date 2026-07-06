import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Format a UTC ISO string to local date string */
export function formatDate(iso: string | null | undefined): string {
  if (!iso) return '—'
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
  }).format(new Date(iso))
}

/** Format a UTC ISO string to local time string */
export function formatTime(iso: string | null | undefined): string {
  if (!iso) return '—'
  return new Intl.DateTimeFormat('en-US', {
    hour: '2-digit', minute: '2-digit', hour12: true,
  }).format(new Date(iso))
}

/** Compute hours between two ISO timestamps */
export function computeHours(clockIn: string, clockOut: string | null): number {
  if (!clockOut) return 0
  const ms = new Date(clockOut).getTime() - new Date(clockIn).getTime()
  return Math.round((ms / 1000 / 3600) * 100) / 100
}

/** Format a number as Iraqi Dinar currency */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('ar-IQ', {
    style: 'currency',
    currency: 'IQD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

/** Get the first day of a month from a Date */
export function monthStart(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  return `${year}-${month}-01`
}

/** Format YYYY-MM-01 as "July 2025" */
export function formatMonth(isoDate: string): string {
  const [year, month, day] = isoDate.split('-').map(Number)
  const d = new Date(year, month - 1, day)
  return new Intl.DateTimeFormat('en-US', { year: 'numeric', month: 'long' }).format(d)
}
