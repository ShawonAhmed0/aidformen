'use client'

import { useRouter } from 'next/navigation'
import { LogOut, Settings, ShieldCheck, ChevronDown, Menu } from 'lucide-react'
import { createBrowserClient } from '@supabase/ssr'

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
    DropdownMenuGroup,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { AdminLocaleToggle, useAdminLocale } from './AdminLocale'

const copy = {
    bn: {
        openNav: 'মেনু খুলুন',
        welcome: (name: string) => `স্বাগতম, ${name}`,
        org: 'এইড ফর মেন ফাউন্ডেশন',
        admin: 'অ্যাডমিন',
        administrator: 'অ্যাডমিনিস্ট্রেটর',
        access: 'অ্যাডমিন অ্যাক্সেস',
        settings: 'সেটিংস',
        logout: 'লগআউট',
    },
    en: {
        openNav: 'Open navigation',
        welcome: (name: string) => `Welcome back, ${name}`,
        org: 'Aid For Men Foundation',
        admin: 'Admin',
        administrator: 'Administrator',
        access: 'Admin access',
        settings: 'Settings',
        logout: 'Logout',
    },
}

interface AdminHeaderProps {
    user?: {
        full_name?: string | null
        email?: string | null
        avatar_url?: string | null
    }
    onOpenMobile?: () => void
    canManageAdmins?: boolean
}

export function AdminHeader({ user, onOpenMobile, canManageAdmins = false }: AdminHeaderProps) {
    const router = useRouter()
    const t = copy[useAdminLocale()]

    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    const handleLogout = async () => {
        await supabase.auth.signOut()
        router.push('/login')
        router.refresh()
    }

    const displayName = user?.full_name || t.admin
    const initials = displayName
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)

    return (
        // No margin offset here — the shell wrapper positions this header, so
        // the two can no longer disagree about the sidebar width.
        <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center justify-between gap-4 border-b border-ink-200 bg-surface/85 px-4 backdrop-blur-md sm:px-6">
            <div className="flex min-w-0 items-center gap-3">
                <button
                    type="button"
                    onClick={onOpenMobile}
                    className="-ml-2 flex size-10 shrink-0 items-center justify-center rounded-lg text-ink-600 transition-ui hover:bg-ink-100 hover:text-ink-900 lg:hidden"
                    aria-label={t.openNav}
                >
                    <Menu className="size-5" />
                </button>

                <div className="min-w-0">
                    <p className="truncate text-sm font-semibold tracking-tight text-ink-900">
                        {t.welcome(displayName.split(' ')[0])}
                    </p>
                    <p className="mt-0.5 truncate text-xs text-ink-500">
                        {t.org}
                    </p>
                </div>
            </div>

            <div className="flex shrink-0 items-center gap-2">
                {/* The search box and bell that sat here did nothing; the
                    one header control an editor needs is the language. */}
                <AdminLocaleToggle />

                <DropdownMenu>
                    <DropdownMenuTrigger className="flex h-11 items-center gap-2.5 rounded-lg px-2 transition-ui hover:bg-ink-100 focus:outline-none">
                        <Avatar className="size-8">
                            <AvatarImage
                                src={user?.avatar_url || undefined}
                                alt=""
                            />
                            <AvatarFallback className="bg-brand-800 text-xs font-medium text-white">
                                {initials}
                            </AvatarFallback>
                        </Avatar>

                        <span className="hidden text-left md:block">
                            <span className="block text-sm font-medium leading-none text-ink-900">
                                {displayName}
                            </span>
                            <span className="mt-1 block text-xs text-ink-500">
                                {t.administrator}
                            </span>
                        </span>

                        <ChevronDown
                            className="size-3.5 text-ink-400"
                            aria-hidden="true"
                        />
                    </DropdownMenuTrigger>

                    <DropdownMenuContent align="end" className="w-56 rounded-xl p-1.5">
                        <DropdownMenuGroup>
                            <DropdownMenuLabel className="px-2 py-1.5 font-normal">
                                <div className="flex flex-col space-y-0.5">
                                    <p className="text-sm font-medium">{displayName}</p>
                                    <p className="truncate text-xs text-ink-500">
                                        {user?.email}
                                    </p>
                                </div>
                            </DropdownMenuLabel>
                        </DropdownMenuGroup>

                        <DropdownMenuSeparator />

                        <DropdownMenuGroup>
                            {canManageAdmins && (
                                <DropdownMenuItem
                                    onClick={() => router.push('/admin/access')}
                                    className="cursor-pointer rounded-lg text-sm"
                                >
                                    <ShieldCheck className="mr-2 size-4" />
                                    {t.access}
                                </DropdownMenuItem>
                            )}
                            <DropdownMenuItem
                                onClick={() => router.push('/admin/settings')}
                                className="cursor-pointer rounded-lg text-sm"
                            >
                                <Settings className="mr-2 size-4" />
                                {t.settings}
                            </DropdownMenuItem>
                        </DropdownMenuGroup>

                        <DropdownMenuSeparator />

                        <DropdownMenuGroup>
                            <DropdownMenuItem
                                onClick={handleLogout}
                                className="cursor-pointer rounded-lg text-sm text-danger focus:text-danger"
                            >
                                <LogOut className="mr-2 size-4" />
                                {t.logout}
                            </DropdownMenuItem>
                        </DropdownMenuGroup>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </header>
    )
}
