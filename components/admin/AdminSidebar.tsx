'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
    Bot,
    LayoutDashboard,
    Users,
    Video,
    Image as ImageIcon,
    Newspaper,
    Mail,
    BookOpen,
    Settings,
    ShieldCheck,
    ChevronLeft,
    ChevronRight,
    Building2,
    Inbox,
    PanelsTopLeft,
    X,
    type LucideIcon,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAdminLocale } from './AdminLocale'

const copy = {
    bn: {
        panel: 'অ্যাডমিন প্যানেল',
        closeNav: 'মেনু বন্ধ করুন',
        navLabel: 'অ্যাডমিন',
        expand: 'সাইডবার বড় করুন',
        collapse: 'ছোট করুন',
        groups: {
            overview: 'সারসংক্ষেপ',
            content: 'কনটেন্ট',
            configuration: 'কনফিগারেশন',
        },
        items: {
            dashboard: 'ড্যাশবোর্ড',
            cases: 'সমস্যার তালিকা',
            hero: 'হিরো ও ক্যারোসেল',
            team: 'আমাদের দল',
            archive: 'মিডিয়া সেন্টার',
            research: 'গবেষণা ও কেস স্টাডি',
            media: 'মিডিয়া লাইব্রেরি',
            videos: 'ভিডিও (বিকল্প)',
            newsletter: 'নিউজলেটার',
            settings: 'সাইট সেটিংস',
            chatbot: 'চ্যাটবট',
            access: 'অ্যাডমিন অ্যাক্সেস',
        },
    },
    en: {
        panel: 'Admin panel',
        closeNav: 'Close navigation',
        navLabel: 'Admin',
        expand: 'Expand sidebar',
        collapse: 'Collapse',
        groups: {
            overview: 'Overview',
            content: 'Content',
            configuration: 'Configuration',
        },
        items: {
            dashboard: 'Dashboard',
            cases: 'Problem feed',
            hero: 'Hero & Carousel',
            team: 'Our Team',
            archive: 'Media Center',
            research: 'Research & Case Studies',
            media: 'Media Library',
            videos: 'Videos (fallback)',
            newsletter: 'Newsletter',
            settings: 'Site Settings',
            chatbot: 'Chatbot',
            access: 'Admin access',
        },
    },
}

type NavItem = {
    id: keyof (typeof copy)['en']['items']
    href: string
    icon: LucideIcon
}

type NavGroup = {
    id: keyof (typeof copy)['en']['groups']
    items: NavItem[]
}

// Grouped so the screens that actually exist are not buried among placeholders.
const navGroups: NavGroup[] = [
    {
        id: 'overview',
        items: [
            { id: 'dashboard', href: '/admin', icon: LayoutDashboard },
            { id: 'cases', href: '/admin/cases', icon: Inbox },
        ],
    },
    {
        id: 'content',
        items: [
            { id: 'hero', href: '/admin/hero', icon: PanelsTopLeft },
            { id: 'team', href: '/admin/team', icon: Users },
            { id: 'archive', href: '/admin/archive', icon: Newspaper },
            { id: 'research', href: '/admin/research', icon: BookOpen },
            { id: 'media', href: '/admin/media', icon: ImageIcon },
            { id: 'videos', href: '/admin/videos', icon: Video },
            { id: 'newsletter', href: '/admin/newsletter', icon: Mail },
        ],
    },
    {
        id: 'configuration',
        items: [
            { id: 'settings', href: '/admin/settings', icon: Settings },
            { id: 'chatbot', href: '/admin/chatbot', icon: Bot },
        ],
    },
]

const accessItem: NavItem = { id: 'access', href: '/admin/access', icon: ShieldCheck }

type AdminSidebarProps = {
    orgName: string
    collapsed: boolean
    onToggleCollapse: () => void
    mobileOpen: boolean
    onCloseMobile: () => void
    canManageAdmins: boolean
}

/**
 * Fully controlled by AdminShell.
 *
 * Width animates via a CSS transition rather than a Motion `animate` prop, so
 * it costs no JS on every frame and automatically respects the global
 * reduced-motion rule.
 */
export function AdminSidebar({
    orgName,
    collapsed,
    onToggleCollapse,
    mobileOpen,
    onCloseMobile,
    canManageAdmins,
}: AdminSidebarProps) {
    const pathname = usePathname()
    const t = copy[useAdminLocale()]

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
                            {orgName}
                        </p>
                        <p className="truncate text-xs text-sidebar-foreground/50">
                            {t.panel}
                        </p>
                    </div>
                )}

                {/* Mobile close */}
                <button
                    type="button"
                    onClick={onCloseMobile}
                    className="flex size-9 shrink-0 items-center justify-center rounded-lg text-sidebar-foreground/60 transition-ui hover:bg-white/10 hover:text-white lg:hidden"
                    aria-label={t.closeNav}
                >
                    <X className="size-5" />
                </button>
            </div>

            {/* Navigation */}
            <nav aria-label={t.navLabel} className="flex-1 overflow-y-auto px-3 py-5">
                {navGroups.map((group) => (
                    <div key={group.id} className="mb-5 last:mb-0">
                        <p
                            className={cn(
                                'mb-1.5 px-3 text-2xs font-semibold uppercase text-sidebar-foreground/35',
                                collapsed && 'lg:sr-only'
                            )}
                        >
                            {t.groups[group.id]}
                        </p>

                        <div className="space-y-0.5">
                            {[
                                ...group.items,
                                ...(group.id === 'configuration' && canManageAdmins
                                    ? [accessItem]
                                    : []),
                            ].map((item) => {
                                const title = t.items[item.id]
                                const isActive =
                                    item.href === '/admin'
                                        ? pathname === '/admin'
                                        : pathname.startsWith(item.href)

                                return (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        aria-current={isActive ? 'page' : undefined}
                                        title={collapsed ? title : undefined}
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
                                            {title}
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
                            <span className="sr-only">{t.expand}</span>
                        </>
                    ) : (
                        <>
                            <ChevronLeft className="size-4" aria-hidden="true" />
                            <span>{t.collapse}</span>
                        </>
                    )}
                </button>
            </div>
        </aside>
    )
}
