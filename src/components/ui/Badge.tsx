import { type LeaveStatus, type PaidStatus } from '@/types/database'
import { cn } from '@/lib/utils'

type BadgeVariant = LeaveStatus | PaidStatus | 'admin' | 'employee' | 'open'

const variantStyles: Record<BadgeVariant, string> = {
  pending:  'bg-amber-500/15 text-amber-400 border-amber-500/30',
  approved: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  rejected: 'bg-red-500/15 text-red-400 border-red-500/30',
  paid:     'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  unpaid:   'bg-zinc-500/15 text-zinc-400 border-zinc-500/30',
  partial:  'bg-blue-500/15 text-blue-400 border-blue-500/30',
  admin:    'bg-indigo-500/15 text-indigo-400 border-indigo-500/30',
  employee: 'bg-zinc-500/15 text-zinc-400 border-zinc-500/30',
  open:     'bg-green-500/15 text-green-400 border-green-500/30',
}

interface BadgeProps {
  variant: BadgeVariant
  children: React.ReactNode
  className?: string
}

export function Badge({ variant, children, className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border',
        variantStyles[variant],
        className
      )}
    >
      {children}
    </span>
  )
}
