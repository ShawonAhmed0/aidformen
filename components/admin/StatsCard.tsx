'use client'

import { motion } from 'framer-motion'
import { TrendingUp, TrendingDown } from 'lucide-react'
import { cn } from '@/lib/utils'

interface StatsCardProps {
    title: string
    value: string | number
    change?: number
    changeLabel?: string
    icon: React.ReactNode
    delay?: number
}

export function StatsCard({
    title,
    value,
    change,
    changeLabel = 'গত মাসের তুলনায়',
    icon,
    delay = 0,
}: StatsCardProps) {
    const isPositive = change !== undefined && change >= 0

    return (
        <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay, ease: [0.4, 0, 0.2, 1] }}
            className={cn(
                'group relative overflow-hidden rounded-xl bg-white p-5',
                'border border-slate-200/80',
                'transition-all duration-200',
                'hover:border-slate-300 hover:shadow-[0_4px_20px_-4px_rgba(0,0,0,0.06)]'
            )}
        >
            <div className="flex items-start justify-between">
                <div className="space-y-3">
                    <p className="text-[13px] font-medium text-slate-500">{title}</p>
                    <p className="text-[28px] font-semibold tracking-tight text-slate-900 leading-none">
                        {value}
                    </p>

                    {change !== undefined && (
                        <div className="flex items-center gap-1.5">
                            <span
                                className={cn(
                                    'inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 text-[11px] font-medium',
                                    isPositive
                                        ? 'bg-emerald-50 text-emerald-700'
                                        : 'bg-rose-50 text-rose-700'
                                )}
                            >
                                {isPositive ? (
                                    <TrendingUp className="h-3 w-3" />
                                ) : (
                                    <TrendingDown className="h-3 w-3" />
                                )}
                                {isPositive ? '+' : ''}
                                {change}%
                            </span>
                            <span className="text-[11px] text-slate-400">{changeLabel}</span>
                        </div>
                    )}
                </div>

                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-50 text-slate-600 ring-1 ring-slate-200/70">
                    {icon}
                </div>
            </div>
        </motion.div>
    )
}