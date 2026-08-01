"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

import { AdminSidebar } from "./AdminSidebar";
import { AdminHeader } from "./AdminHeader";

type AdminShellProps = {
    user: {
        full_name?: string | null;
        email?: string | null;
        avatar_url?: string | null;
    };
    /** Organisation name from site_settings, shown as the sidebar brand. */
    orgName: string;
    children: React.ReactNode;
};

/**
 * Owns the sidebar's collapsed / mobile-open state and publishes the resulting
 * width as `--admin-sidebar-w`.
 *
 * Previously the layout and the header each hardcoded `ml-[260px]`, so
 * collapsing the sidebar to 72px left a 188px gap, and on phones the fixed
 * 260px rail pushed all content off-screen with no way to reach it.
 */
export function AdminShell({ user, orgName, children }: AdminShellProps) {
    const [collapsed, setCollapsed] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);
    const pathname = usePathname();

    // Navigating closes the mobile drawer. Adjusted during render rather than
    // in an effect so it does not trigger a second render pass.
    const [renderedPath, setRenderedPath] = useState(pathname);
    if (renderedPath !== pathname) {
        setRenderedPath(pathname);
        setMobileOpen(false);
    }

    useEffect(() => {
        if (!mobileOpen) return;

        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape") setMobileOpen(false);
        };

        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        window.addEventListener("keydown", onKeyDown);

        return () => {
            document.body.style.overflow = previousOverflow;
            window.removeEventListener("keydown", onKeyDown);
        };
    }, [mobileOpen]);

    return (
        <div
            className="min-h-dvh bg-surface-sunken"
            style={
                {
                    "--admin-sidebar-w": collapsed ? "4.5rem" : "16rem",
                } as React.CSSProperties
            }
        >
            <AdminSidebar
                orgName={orgName}
                collapsed={collapsed}
                onToggleCollapse={() => setCollapsed((v) => !v)}
                mobileOpen={mobileOpen}
                onCloseMobile={() => setMobileOpen(false)}
            />

            {/* Scrim behind the mobile drawer. */}
            {mobileOpen && (
                <div
                    className="fixed inset-0 z-40 bg-ink-950/50 lg:hidden"
                    onClick={() => setMobileOpen(false)}
                    aria-hidden="true"
                />
            )}

            {/* The offset is driven by the same variable the sidebar sizes from,
                and only applies from lg up where the rail is actually docked. */}
            <div className="flex min-h-dvh flex-col transition-[padding] duration-250 ease-standard lg:pl-(--admin-sidebar-w)">
                <AdminHeader user={user} onOpenMobile={() => setMobileOpen(true)} />

                <main className="flex-1 p-5 sm:p-6 lg:p-8">{children}</main>
            </div>
        </div>
    );
}
