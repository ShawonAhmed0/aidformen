'use client'

// `motion/react` is the declared dependency; `framer-motion` only resolved
// transitively and would break on a clean install with a stricter resolver.
import { motion } from 'motion/react'
import { TrendingUp, TrendingDown } from 'lucide-react'
import { cn } from '@/lib/utils'

interface StatsCardProps {
  title: string
  value: string | number
  change?: number
  icon: React.ReactNode
  delay?: number
}

export function StatsCard({ title, value, change, icon, delay = 0 }: StatsCardProps) {
  const isPositive = change !== undefined && change >= 0

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay, ease: [0.2, 0, 0, 1] }}
      className="group rounded-xl border border-ink-200 bg-surface p-5 shadow-xs transition-ui hover:border-ink-300 hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 space-y-3">
          <p className="text-sm font-medium text-ink-500">{title}</p>

          <p
            data-numeric
            className="text-3xl font-semibold leading-none tracking-tight text-ink-900"
          >
            {value}
          </p>

          {change !== undefined && (
            <div className="flex items-center gap-1.5">
              <span
                className={cn(
                  'inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 text-2xs font-medium',
                  isPositive
                    ? 'bg-success-soft text-success'
                    : 'bg-danger-soft text-danger'
                )}
              >
                {isPositive ? (
                  <TrendingUp className="size-3" aria-hidden="true" />
                ) : (
                  <TrendingDown className="size-3" aria-hidden="true" />
                )}
                {isPositive ? '+' : ''}
                {change}%
              </span>
              <span className="text-2xs text-ink-400">vs last month</span>
            </div>
          )}
        </div>

        <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-700">
          {icon}
        </span>
      </div>
    </motion.div>
  )
}
