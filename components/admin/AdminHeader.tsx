'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
    Bell,
    Search,
    LogOut,
    User,
    Settings,
    ChevronDown,
    Menu,
} from 'lucide-react'
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
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

interface AdminHeaderProps {
    user?: {
        full_name?: string | null
        email?: string | null
        avatar_url?: string | null
    }
    onOpenMobile?: () => void
}

export function AdminHeader({ user, onOpenMobile }: AdminHeaderProps) {
    const router = useRouter()
    const [searchQuery, setSearchQuery] = useState('')

    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    const handleLogout = async () => {
        await supabase.auth.signOut()
        router.push('/login')
        router.refresh()
    }

    const displayName = user?.full_name || 'Admin'
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
                    aria-label="Open navigation"
                >
                    <Menu className="size-5" />
                </button>

                <div className="min-w-0">
                    <p className="truncate text-sm font-semibold tracking-tight text-ink-900">
                        Welcome back, {displayName.split(' ')[0]}
                    </p>
                    <p className="mt-0.5 truncate text-xs text-ink-500">
                        Aid For Men Foundation
                    </p>
                </div>
            </div>

            <div className="flex shrink-0 items-center gap-2">
                <div className="relative hidden md:block">
                    <Search
                        className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-400"
                        aria-hidden="true"
                    />
                    <label htmlFor="admin-search" className="sr-only">
                        Search
                    </label>
                    <Input
                        id="admin-search"
                        type="search"
                        placeholder="Search…"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="h-10 w-56 bg-surface-sunken pl-9 text-sm"
                    />
                </div>

                <button
                    type="button"
                    className="relative flex size-10 items-center justify-center rounded-lg text-ink-500 transition-ui hover:bg-ink-100 hover:text-ink-900"
                    aria-label="Notifications"
                >
                    <Bell className="size-[18px]" />
                    <span
                        className="absolute right-2.5 top-2.5 size-1.5 rounded-full bg-brand-600"
                        aria-hidden="true"
                    />
                </button>

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
                                Administrator
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
                            <DropdownMenuItem className="cursor-pointer rounded-lg text-sm">
                                <User className="mr-2 size-4" />
                                Profile
                            </DropdownMenuItem>
                            <DropdownMenuItem className="cursor-pointer rounded-lg text-sm">
                                <Settings className="mr-2 size-4" />
                                Settings
                            </DropdownMenuItem>
                        </DropdownMenuGroup>

                        <DropdownMenuSeparator />

                        <DropdownMenuGroup>
                            <DropdownMenuItem
                                onClick={handleLogout}
                                className="cursor-pointer rounded-lg text-sm text-danger focus:text-danger"
                            >
                                <LogOut className="mr-2 size-4" />
                                Logout
                            </DropdownMenuItem>
                        </DropdownMenuGroup>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </header>
    )
}
