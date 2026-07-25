"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { LogIn, LogOut, LayoutDashboard } from "lucide-react";

export default function AuthButton() {
    const pathname = usePathname();
    const supabase = createClient();

    const [user, setUser] = useState<any>(null);
    const [role, setRole] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

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
    }, []);

    // Hide on admin pages (after all hooks)
    if (pathname?.startsWith("/admin")) {
        return null;
    }

    if (loading) {
        return (
            <div className="h-10 w-32 animate-pulse rounded-lg bg-slate-200" />
        );
    }

    const dashboardLink = role === "admin" ? "/admin" : "/dashboard";

    return (
        <div className="flex items-center gap-2.5">
            <Link
                href={user ? dashboardLink : "/login"}
                className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-[13.5px] font-medium text-slate-700 transition-all hover:border-slate-400 hover:bg-slate-50"
            >
                {user ? (
                    <>
                        <LayoutDashboard className="h-4 w-4" />
                        {role === "admin" ? "অ্যাডমিন ড্যাশবোর্ড" : "ড্যাশবোর্ড"}
                    </>
                ) : (
                    <>
                        <LogIn className="h-4 w-4" />
                        লগইন
                    </>
                )}
            </Link>

            {user && (
                <button
                    onClick={async () => {
                        await supabase.auth.signOut();
                        window.location.href = "/";
                    }}
                    className="inline-flex items-center gap-2 rounded-lg border border-red-200 bg-white px-4 py-2 text-[13.5px] font-medium text-red-600 transition-all hover:border-red-300 hover:bg-red-50"
                >
                    <LogOut className="h-4 w-4" />
                    লগআউট
                </button>
            )}
        </div>
    );
}