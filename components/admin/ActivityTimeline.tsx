'use client'

import { motion } from 'framer-motion'
import { UserPlus, ImagePlus, FileEdit, MessageSquare } from 'lucide-react'
import { cn } from '@/lib/utils'

const activities = [
    {
        id: 1,
        type: 'member',
        title: 'New member registered',
        description: 'Rahim Ahmed joined the foundation',
        time: '2 hours ago',
        icon: UserPlus,
        color: 'bg-emerald-500',
    },
    {
        id: 2,
        type: 'hero',
        title: 'Hero section updated',
        description: 'Title and description were modified',
        time: '5 hours ago',
        icon: FileEdit,
        color: 'bg-[#0EA5E9]',
    },
    {
        id: 3,
        type: 'carousel',
        title: 'New carousel image uploaded',
        description: 'Slide “Community Outreach” added',
        time: '1 day ago',
        icon: ImagePlus,
        color: 'bg-violet-500',
    },
    {
        id: 4,
        type: 'forum',
        title: 'New forum discussion',
        description: '“Mental Health Awareness” started by Admin',
        time: '2 days ago',
        icon: MessageSquare,
        color: 'bg-amber-500',
    },
]

export function ActivityTimeline() {
    return (
        <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
            <div className="mb-6 flex items-center justify-between">
                <h2 className="text-lg font-semibold tracking-tight text-slate-900">
                    Recent Activity
                </h2>
                <button className="text-sm font-medium text-[#0EA5E9] hover:underline">
                    View all
                </button>
            </div>

            <div className="space-y-6">
                {activities.map((activity, index) => (
                    <motion.div
                        key={activity.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.08 }}
                        className="relative flex gap-4"
                    >
                        {/* Timeline line */}
                        {index !== activities.length - 1 && (
                            <div className="absolute left-5 top-10 h-full w-px bg-slate-200" />
                        )}

                        {/* Icon */}
                        <div
                            className={cn(
                                'relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full',
                                activity.color,
                                'shadow-sm'
                            )}
                        >
                            <activity.icon className="h-4 w-4 text-white" />
                        </div>

                        {/* Content */}
                        <div className="flex-1 pt-0.5">
                            <p className="text-sm font-medium text-slate-900">
                                {activity.title}
                            </p>
                            <p className="mt-0.5 text-sm text-slate-500">
                                {activity.description}
                            </p>
                            <p className="mt-1 text-xs text-slate-400">{activity.time}</p>
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    )
}