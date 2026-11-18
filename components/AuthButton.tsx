"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { ChevronDown, CircleUserRound, LogIn, LogOut, LayoutDashboard } from "lucide-react";
import type { User } from "@supabase/supabase-js";

import { buttonVariants } from "./ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import type { Locale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/dictionary";
import { cn } from "@/lib/utils";

export default function AuthButton({
    locale,
    t,
    className,
    compact = false,
}: {
    locale: Locale;
    t: Dictionary;
    className?: string;
    /** Signed-in controls collapse into one account menu (desktop header). */
    compact?: boolean;
}) {
    const pathname = usePathname();
    const supabase = useMemo(() => createClient(), []);

    const [user, setUser] = useState<User | null>(null);
    const [role, setRole] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [signingOut, setSigningOut] = useState(false);

    useEffect(() => {
        async function checkUser() {
            const {
                data: { user },
            } = await supabase.auth.getUser();

            setUser(user);

            if (user) {
                const { data } = await supabase
                    .from("profiles")
                    .select("role")
                    .eq("id", user.id)
                    .single();

                setRole(data?.role ?? null);
            }

            setLoading(false);
        }

        checkUser();

        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange(async (_event, session) => {
            const currentUser = session?.user ?? null;
            setUser(currentUser);

            if (currentUser) {
                const { data } = await supabase
                    .from("profiles")
                    .select("role")
                    .eq("id", currentUser.id)
                    .single();

                setRole(data?.role ?? null);
            } else {
                setRole(null);
            }
        });

        return () => {
            subscription.unsubscribe();
        };
    }, [supabase]);

    // Hide on admin pages (after all hooks)
    if (pathname?.startsWith("/admin")) {
        return null;
    }

    // Skeleton matches the real control's 44px height so the header does not
    // reflow when auth resolves.
    if (loading) {
        return (
            <div
                className={cn("flex items-center gap-2.5", className)}
                aria-hidden="true"
            >
                <div className="h-11 w-32 animate-pulse rounded-lg bg-ink-100" />
            </div>
        );
    }

    // Admin lives outside the locale prefix; member routes stay inside it.
    const dashboardLink = role === "admin" ? "/admin" : `/${locale}/dashboard`;
    const dashboardLabel = role === "admin" ? t.nav.adminDashboard : t.nav.dashboard;

    const signOut = async () => {
        setSigningOut(true);
        await supabase.auth.signOut();
        window.location.href = "/";
    };

    // Two labelled buttons cost ~340px, which pushed the nav links into the
    // locale switcher on desktop. One trigger keeps the header's width the
    // same signed in or out.
    if (compact && user) {
        return (
            <DropdownMenu>
                <DropdownMenuTrigger
                    aria-label={t.nav.account}
                    className={cn(buttonVariants({ variant: "outline" }), "gap-1.5 px-3", className)}
                >
                    <CircleUserRound className="size-5 text-brand-700" aria-hidden="true" />
                    <ChevronDown className="size-4 text-ink-500" aria-hidden="true" />
                </DropdownMenuTrigger>

                <DropdownMenuContent align="end" sideOffset={8} className="w-64 rounded-xl p-1.5">
                    <DropdownMenuGroup>
                        <DropdownMenuLabel className="px-2.5 py-2 font-normal">
                            <span className="block text-xs text-ink-500">{t.nav.account}</span>
                            {user.email && (
                                <span className="block truncate text-sm font-medium text-ink-900">
                                    {user.email}
                                </span>
                            )}
                        </DropdownMenuLabel>
                    </DropdownMenuGroup>

                    <DropdownMenuSeparator />

                    <DropdownMenuGroup>
                        <DropdownMenuItem
                            render={<Link href={dashboardLink} />}
                            className="min-h-11 gap-2.5 rounded-lg px-2.5 text-sm"
                        >
                            <LayoutDashboard aria-hidden="true" />
                            {dashboardLabel}
                        </DropdownMenuItem>

                        <DropdownMenuItem
                            variant="destructive"
                            disabled={signingOut}
                            closeOnClick={false}
                            onClick={signOut}
                            className="min-h-11 gap-2.5 rounded-lg px-2.5 text-sm"
                        >
                            <LogOut aria-hidden="true" />
                            {signingOut ? t.nav.loggingOut : t.nav.logout}
                        </DropdownMenuItem>
                    </DropdownMenuGroup>
                </DropdownMenuContent>
            </DropdownMenu>
        );
    }

    return (
        <div className={cn("flex items-center gap-2.5", className)}>
            <Link
                href={user ? dashboardLink : `/${locale}/login`}
                className={buttonVariants({ variant: "outline" })}
            >
                {user ? (
                    <>
                        <LayoutDashboard aria-hidden="true" />
                        {dashboardLabel}
                    </>
                ) : (
                    <>
                        <LogIn aria-hidden="true" />
                        {t.nav.login}
                    </>
                )}
            </Link>

            {user && (
                <button
                    type="button"
                    disabled={signingOut}
                    onClick={signOut}
                    className={cn(
                        buttonVariants({ variant: "ghost" }),
                        "text-danger hover:bg-danger-soft hover:text-danger"
                    )}
                >
                    <LogOut aria-hidden="true" />
                    {signingOut ? t.nav.loggingOut : t.nav.logout}
                </button>
            )}
        </div>
    );
}
