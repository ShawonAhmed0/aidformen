"use client";

import { createContext, useContext, useState } from "react";
import { useRouter } from "next/navigation";
import { Languages } from "lucide-react";

import {
    ADMIN_LOCALE_COOKIE,
    adminLocales,
    defaultAdminLocale,
    type AdminLocale,
} from "@/lib/i18n/admin";
import { cn } from "@/lib/utils";

const AdminLocaleContext = createContext<{
    locale: AdminLocale;
    setLocale: (locale: AdminLocale) => void;
}>({ locale: defaultAdminLocale, setLocale: () => {} });

/**
 * Holds the admin interface language for every client editor under it.
 *
 * Seeded from the cookie the server read, so the first paint is already in
 * the right language. Switching updates this state at once (client editors
 * re-render immediately), writes the cookie, and refreshes the route so the
 * server-rendered page headings follow.
 */
export function AdminLocaleProvider({
    locale: initial,
    children,
}: {
    locale: AdminLocale;
    children: React.ReactNode;
}) {
    const router = useRouter();
    const [locale, setLocaleState] = useState(initial);

    const setLocale = (next: AdminLocale) => {
        if (next === locale) return;
        setLocaleState(next);
        document.cookie = `${ADMIN_LOCALE_COOKIE}=${next}; path=/; max-age=31536000; samesite=lax`;
        document.documentElement.lang = next;
        router.refresh();
    };

    return (
        <AdminLocaleContext.Provider value={{ locale, setLocale }}>
            {children}
        </AdminLocaleContext.Provider>
    );
}

/** The admin interface language. Use as `const t = copy[useAdminLocale()]`. */
export function useAdminLocale(): AdminLocale {
    return useContext(AdminLocaleContext).locale;
}

const names: Record<AdminLocale, string> = { bn: "বাংলা", en: "EN" };

/** Segmented বাংলা / EN switch for the admin header. */
export function AdminLocaleToggle({ className }: { className?: string }) {
    const { locale, setLocale } = useContext(AdminLocaleContext);

    return (
        <div
            role="group"
            aria-label={locale === "bn" ? "ইন্টারফেসের ভাষা" : "Interface language"}
            className={cn(
                "flex items-center gap-0.5 rounded-lg border border-ink-200 bg-surface-sunken p-0.5",
                className
            )}
        >
            <Languages className="mx-1.5 size-4 text-ink-500" aria-hidden="true" />
            {adminLocales.map((option) => (
                <button
                    key={option}
                    type="button"
                    aria-pressed={locale === option}
                    onClick={() => setLocale(option)}
                    className={cn(
                        "h-9 rounded-md px-2.5 text-sm font-medium transition-ui",
                        locale === option
                            ? "bg-surface text-brand-800 shadow-xs"
                            : "text-ink-600 hover:text-ink-900"
                    )}
                >
                    {names[option]}
                </button>
            ))}
        </div>
    );
}
