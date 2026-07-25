'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
    LayoutDashboard,
    Users,
    HeartHandshake,
    FileText,
    Video,
    MessagesSquare,
    Image as ImageIcon,
    Settings,
    ChevronLeft,
    ChevronRight,
    Building2,
    PanelsTopLeft, // good icon for Hero
} from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
    { title: 'Dashboard', href: '/admin', icon: LayoutDashboard },
    { title: 'Hero Section', href: '/admin/hero', icon: PanelsTopLeft },
    { title: 'Users', href: '/admin/users', icon: Users },
    { title: 'Donations', href: '/admin/donations', icon: HeartHandshake },
    { title: 'Blog Articles', href: '/admin/blog', icon: FileText },
    { title: 'Videos', href: '/admin/videos', icon: Video },
    { title: 'Forum', href: '/admin/forum', icon: MessagesSquare },
    { title: 'Media Library', href: '/admin/media', icon: ImageIcon },
    { title: 'Settings', href: '/admin/settings', icon: Settings },
]

export function AdminSidebar() {
    const pathname = usePathname()
    const [collapsed, setCollapsed] = useState(false)

    return (
        <motion.aside
            initial={false}
            animate={{ width: collapsed ? 72 : 260 }}
            transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
            className={cn(
                'fixed left-0 top-0 z-40 h-screen flex flex-col',
                'bg-[#0F172A] text-white border-r border-white/5'
            )}
        >
            {/* Logo */}
            <div className="flex h-16 items-center gap-3 px-4 border-b border-white/5">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-teal-500/15">
                    <Building2 className="h-5 w-5 text-teal-400" />
                </div>
                <AnimatePresence mode="wait">
                    {!collapsed && (
                        <motion.div
                            initial={{ opacity: 0, x: -8 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -8 }}
                            className="min-w-0"
                        >
                            <p className="truncate text-[14px] font-semibold tracking-tight">
                                NGO Admin
                            </p>
                            <p className="truncate text-[11px] text-white/45">Management Platform</p>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Navigation */}
            <nav className="flex-1 overflow-y-auto px-3 py-5 space-y-0.5">
                {navItems.map((item) => {
                    const isActive =
                        item.href === '/admin'
                            ? pathname === '/admin'
                            : pathname.startsWith(item.href)

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                'group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-[13.5px] font-medium transition-all duration-150',
                                isActive
                                    ? 'bg-white/10 text-white'
                                    : 'text-white/55 hover:bg-white/5 hover:text-white'
                            )}
                        >
                            {isActive && (
                                <span className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-[3px] rounded-r-full bg-teal-400" />
                            )}
                            <item.icon
                                className={cn(
                                    'h-[18px] w-[18px] shrink-0',
                                    isActive ? 'text-teal-400' : 'text-white/45 group-hover:text-white/80'
                                )}
                            />
                            <AnimatePresence mode="wait">
                                {!collapsed && (
                                    <motion.span
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        className="truncate"
                                    >
                                        {item.title}
                                    </motion.span>
                                )}
                            </AnimatePresence>
                        </Link>
                    )
                })}
            </nav>

            {/* Collapse */}
            <div className="border-t border-white/5 p-3">
                <button
                    onClick={() => setCollapsed(!collapsed)}
                    className="flex w-full items-center justify-center gap-2 rounded-lg px-3 py-2 text-[13px] text-white/45 transition-colors hover:bg-white/5 hover:text-white"
                >
                    {collapsed ? (
                        <ChevronRight className="h-4 w-4" />
                    ) : (
                        <>
                            <ChevronLeft className="h-4 w-4" />
                            <span>Collapse</span>
                        </>
                    )}
                </button>
            </div>
        </motion.aside>
    )
}