'use client'

import { motion } from 'motion/react'
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
        color: 'bg-success',
    },
    {
        id: 2,
        type: 'hero',
        title: 'Hero section updated',
        description: 'Title and description were modified',
        time: '5 hours ago',
        icon: FileEdit,
        color: 'bg-brand-600',
    },
    {
        id: 3,
        type: 'carousel',
        title: 'New carousel image uploaded',
        description: 'Slide “Community Outreach” added',
        time: '1 day ago',
        icon: ImagePlus,
        color: 'bg-ochre-600',
    },
    {
        id: 4,
        type: 'forum',
        title: 'New forum discussion',
        description: '“Mental Health Awareness” started by Admin',
        time: '2 days ago',
        icon: MessageSquare,
        color: 'bg-ink-500',
    },
]

export function ActivityTimeline() {
    return (
        <div className="rounded-xl border border-ink-200 bg-surface p-6 shadow-xs">
            <div className="mb-6 flex items-center justify-between gap-4">
                <h2 className="text-base font-semibold tracking-tight text-ink-900">
                    Recent Activity
                </h2>
                <button
                    type="button"
                    className="rounded-sm text-sm font-medium text-brand-700 transition-ui hover:text-brand-800 hover:underline"
                >
                    View all
                </button>
            </div>

            <ol className="space-y-6">
                {activities.map((activity, index) => (
                    <motion.li
                        key={activity.id}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.25, delay: index * 0.05, ease: [0.2, 0, 0, 1] }}
                        className="relative flex gap-4"
                    >
                        {index !== activities.length - 1 && (
                            <span
                                aria-hidden="true"
                                className="absolute left-5 top-11 h-full w-px bg-ink-200"
                            />
                        )}

                        <span
                            className={cn(
                                'relative z-10 flex size-10 shrink-0 items-center justify-center rounded-full shadow-xs',
                                activity.color
                            )}
                        >
                            <activity.icon
                                className="size-4 text-white"
                                aria-hidden="true"
                            />
                        </span>

                        <div className="min-w-0 flex-1 pt-0.5">
                            <p className="text-sm font-medium text-ink-900">
                                {activity.title}
                            </p>
                            <p className="mt-0.5 text-sm text-ink-500">
                                {activity.description}
                            </p>
                            <p className="mt-1 text-xs text-ink-400">{activity.time}</p>
                        </div>
                    </motion.li>
                ))}
            </ol>
        </div>
    )
}
