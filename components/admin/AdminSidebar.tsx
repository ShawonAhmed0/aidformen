'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
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
    PanelsTopLeft,
    X,
} from 'lucide-react'
import { cn } from '@/lib/utils'

// Grouped so the screens that actually exist are not buried among placeholders.
const navGroups = [
    {
        label: 'Overview',
        items: [{ title: 'Dashboard', href: '/admin', icon: LayoutDashboard }],
    },
    {
        label: 'Content',
        items: [
            { title: 'Hero & Carousel', href: '/admin/hero', icon: PanelsTopLeft },
            { title: 'Our Team', href: '/admin/team', icon: Users },
            { title: 'Activities', href: '/admin/activities', icon: FileText },
            { title: 'Videos', href: '/admin/videos', icon: Video },
        ],
    },
    {
        label: 'Configuration',
        items: [{ title: 'Site Settings', href: '/admin/settings', icon: Settings }],
    },
    {
        label: 'Coming soon',
        items: [
            { title: 'Members', href: '/admin/users', icon: HeartHandshake },
            { title: 'Forum', href: '/admin/forum', icon: MessagesSquare },
            { title: 'Media Library', href: '/admin/media', icon: ImageIcon },
        ],
    },
]

type AdminSidebarProps = {
    collapsed: boolean
    onToggleCollapse: () => void
    mobileOpen: boolean
    onCloseMobile: () => void
}

/**
 * Fully controlled by AdminShell.
 *
 * Width animates via a CSS transition rather than a Motion `animate` prop, so
 * it costs no JS on every frame and automatically respects the global
 * reduced-motion rule.
 */
export function AdminSidebar({
    collapsed,
    onToggleCollapse,
    mobileOpen,
    onCloseMobile,
}: AdminSidebarProps) {
    const pathname = usePathname()

    return (
        <aside
            className={cn(
                'fixed inset-y-0 left-0 z-50 flex flex-col bg-sidebar text-sidebar-foreground',
                'border-r border-sidebar-border',
                'w-64 transition-transform duration-250 ease-standard',
                // Off-canvas below lg, docked and width-driven from lg up.
                mobileOpen ? 'translate-x-0' : '-translate-x-full',
                'lg:w-(--admin-sidebar-w) lg:translate-x-0 lg:transition-[width]'
            )}
        >
            {/* Brand */}
            <div className="flex h-16 shrink-0 items-center gap-3 border-b border-sidebar-border px-4">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-brand-400/15">
                    <Building2 className="size-5 text-brand-300" aria-hidden="true" />
                </span>

                {!collapsed && (
                    <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold tracking-tight">
                            NGO Admin
                        </p>
                        <p className="truncate text-xs text-sidebar-foreground/50">
                            Management Platform
                        </p>
                    </div>
                )}

                {/* Mobile close */}
                <button
                    type="button"
                    onClick={onCloseMobile}
                    className="flex size-9 shrink-0 items-center justify-center rounded-lg text-sidebar-foreground/60 transition-ui hover:bg-white/10 hover:text-white lg:hidden"
                    aria-label="Close navigation"
                >
                    <X className="size-5" />
                </button>
            </div>

            {/* Navigation */}
            <nav aria-label="Admin" className="flex-1 overflow-y-auto px-3 py-5">
                {navGroups.map((group) => (
                    <div key={group.label} className="mb-5 last:mb-0">
                        <p
                            className={cn(
                                'mb-1.5 px-3 text-2xs font-semibold uppercase text-sidebar-foreground/35',
                                collapsed && 'lg:sr-only'
                            )}
                        >
                            {group.label}
                        </p>

                        <div className="space-y-0.5">
                            {group.items.map((item) => {
                                const isActive =
                                    item.href === '/admin'
                                        ? pathname === '/admin'
                                        : pathname.startsWith(item.href)

                                return (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        aria-current={isActive ? 'page' : undefined}
                                        title={collapsed ? item.title : undefined}
                                        className={cn(
                                            'group relative flex h-11 items-center gap-3 rounded-lg px-3 text-sm font-medium transition-ui',
                                            collapsed && 'lg:justify-center lg:px-0',
                                            isActive
                                                ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                                                : 'text-sidebar-foreground/60 hover:bg-white/5 hover:text-white'
                                        )}
                                    >
                                        {isActive && (
                                            <span
                                                aria-hidden="true"
                                                className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-r-full bg-sidebar-primary"
                                            />
                                        )}

                                        <item.icon
                                            aria-hidden="true"
                                            className={cn(
                                                'size-[18px] shrink-0',
                                                isActive
                                                    ? 'text-sidebar-primary'
                                                    : 'text-sidebar-foreground/50 group-hover:text-white/80'
                                            )}
                                        />

                                        <span
                                            className={cn(
                                                'truncate',
                                                collapsed && 'lg:sr-only'
                                            )}
                                        >
                                            {item.title}
                                        </span>
                                    </Link>
                                )
                            })}
                        </div>
                    </div>
                ))}
            </nav>

            {/* Collapse — desktop only; on mobile the drawer closes instead. */}
            <div className="hidden border-t border-sidebar-border p-3 lg:block">
                <button
                    type="button"
                    onClick={onToggleCollapse}
                    aria-expanded={!collapsed}
                    className="flex h-10 w-full items-center justify-center gap-2 rounded-lg text-sm text-sidebar-foreground/50 transition-ui hover:bg-white/5 hover:text-white"
                >
                    {collapsed ? (
                        <>
                            <ChevronRight className="size-4" aria-hidden="true" />
                            <span className="sr-only">Expand sidebar</span>
                        </>
                    ) : (
                        <>
                            <ChevronLeft className="size-4" aria-hidden="true" />
                            <span>Collapse</span>
                        </>
                    )}
                </button>
            </div>
        </aside>
    )
}
