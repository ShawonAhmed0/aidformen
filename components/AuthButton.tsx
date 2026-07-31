"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { LogIn, LogOut, LayoutDashboard } from "lucide-react";
import type { User } from "@supabase/supabase-js";

import { buttonVariants } from "./ui/button";
import type { Locale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/dictionary";
import { cn } from "@/lib/utils";

export default function AuthButton({
    locale,
    t,
    className,
}: {
    locale: Locale;
    t: Dictionary;
    className?: string;
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

    return (
        <div className={cn("flex items-center gap-2.5", className)}>
            <Link
                href={user ? dashboardLink : `/${locale}/login`}
                className={buttonVariants({ variant: "outline" })}
            >
                {user ? (
                    <>
                        <LayoutDashboard aria-hidden="true" />
                        {role === "admin" ? t.nav.adminDashboard : t.nav.dashboard}
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
                    onClick={async () => {
                        setSigningOut(true);
                        await supabase.auth.signOut();
                        window.location.href = "/";
                    }}
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
