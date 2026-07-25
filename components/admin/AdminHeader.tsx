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
import { cn } from '@/lib/utils'

interface AdminHeaderProps {
    user?: {
        full_name?: string | null
        email?: string | null
        avatar_url?: string | null
    }
}

export function AdminHeader({ user }: AdminHeaderProps) {
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
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-4 border-b border-slate-200/70 bg-white/80 backdrop-blur-md px-6 ml-[260px]">
            {/* Left */}
            <div>
                <h1 className="text-[15px] font-semibold tracking-tight text-slate-900">
                    Welcome back, {displayName.split(' ')[0]}
                </h1>
                <p className="text-[12px] text-slate-500 mt-0.5">
                    Aid For Men Foundation
                </p>
            </div>

            {/* Right */}
            <div className="flex items-center gap-2.5">
                <div className="relative hidden md:block">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <Input
                        type="search"
                        placeholder="Search..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="h-9 w-56 rounded-lg border-slate-200 bg-slate-50/70 pl-9 text-[13px] focus-visible:ring-teal-500/40"
                    />
                </div>

                <button className="relative flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800">
                    <Bell className="h-4.5 w-4.5" />
                    <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-teal-500" />
                </button>

                <DropdownMenu>
                    <DropdownMenuTrigger className="flex items-center gap-2.5 rounded-lg px-2 py-1.5 transition-colors hover:bg-slate-100 focus:outline-none">
                        <Avatar className="h-8 w-8">
                            <AvatarImage src={user?.avatar_url || undefined} alt={displayName} />
                            <AvatarFallback className="bg-slate-800 text-[11px] font-medium text-white">
                                {initials}
                            </AvatarFallback>
                        </Avatar>
                        <div className="hidden text-left md:block">
                            <p className="text-[13px] font-medium text-slate-900 leading-none">
                                {displayName}
                            </p>
                            <p className="text-[11px] text-slate-500 mt-1">Administrator</p>
                        </div>
                        <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
                    </DropdownMenuTrigger>

                    <DropdownMenuContent align="end" className="w-52 rounded-xl p-1.5">
                        <DropdownMenuGroup>
                            <DropdownMenuLabel className="font-normal px-2 py-1.5">
                                <div className="flex flex-col space-y-0.5">
                                    <p className="text-[13px] font-medium">{displayName}</p>
                                    <p className="text-[11px] text-slate-500">{user?.email}</p>
                                </div>
                            </DropdownMenuLabel>
                        </DropdownMenuGroup>
                        <DropdownMenuSeparator />
                        <DropdownMenuGroup>
                            <DropdownMenuItem className="cursor-pointer rounded-lg text-[13px]">
                                <User className="mr-2 h-4 w-4" />
                                Profile
                            </DropdownMenuItem>
                            <DropdownMenuItem className="cursor-pointer rounded-lg text-[13px]">
                                <Settings className="mr-2 h-4 w-4" />
                                Settings
                            </DropdownMenuItem>
                        </DropdownMenuGroup>
                        <DropdownMenuSeparator />
                        <DropdownMenuGroup>
                            <DropdownMenuItem
                                onClick={handleLogout}
                                className="cursor-pointer rounded-lg text-[13px] text-red-600 focus:text-red-600"
                            >
                                <LogOut className="mr-2 h-4 w-4" />
                                Logout
                            </DropdownMenuItem>
                        </DropdownMenuGroup>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </header>
    )
}