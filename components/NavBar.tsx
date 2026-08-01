"use client";

import Link from "next/link";
import Image from "next/image";
import { Menu, Phone, X } from "lucide-react";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

import AuthButton from "./AuthButton";
import { LocaleSwitcher } from "./LocaleSwitcher";
import { Container } from "./ui/container";
import { buttonVariants } from "./ui/button";
import { pick, type Locale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/dictionary";
import type { SiteSettings } from "@/lib/types/content";
import { cn } from "@/lib/utils";

type NavbarProps = {
    locale: Locale;
    t: Dictionary;
    settings: SiteSettings | null;
};

export default function Navbar({ locale, t, settings }: NavbarProps) {
    const [isOpen, setIsOpen] = useState(false);
    const pathname = usePathname();

    // Close on route change so the panel never survives a navigation —
    // including back/forward, which an onClick handler would miss. Adjusting
    // state during render rather than in an effect avoids a second pass.
    const [renderedPath, setRenderedPath] = useState(pathname);
    if (renderedPath !== pathname) {
        setRenderedPath(pathname);
        setIsOpen(false);
    }

    // Escape closes; lock body scroll while the panel covers the page.
    useEffect(() => {
        if (!isOpen) return;

        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape") setIsOpen(false);
        };

        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        window.addEventListener("keydown", onKeyDown);

        return () => {
            document.body.style.overflow = previousOverflow;
            window.removeEventListener("keydown", onKeyDown);
        };
    }, [isOpen]);

    const navLinks = [
        { name: t.nav.home, href: `/${locale}` },
        { name: t.nav.about, href: `/${locale}/about` },
        { name: t.nav.archive, href: `/${locale}/archive` },
        { name: t.nav.contact, href: `/${locale}/contact` },
        { name: t.nav.forum, href: `/${locale}/forum` },
        { name: t.nav.team, href: `/${locale}/team` },
    ];

    const orgName =
        pick(locale, settings?.organisation_name, settings?.organisation_name_en) ||
        "এইড ফর মেন";
    const emergency = settings?.emergency_phone?.trim() || "01404555999";

    return (
        <header className="sticky top-0 z-50 border-b border-ink-200 bg-surface/85 backdrop-blur-md">
            <Container width="wide">
                {/* gap-4 rather than gap-6: at the xl breakpoint the English
                    labels need every pixel, and 24px gaps pushed the row into
                    horizontal overflow. */}
                <div className="flex h-18 items-center justify-between gap-4">
                    <Link
                        href={`/${locale}`}
                        className="flex shrink-0 items-center gap-3 rounded-md transition-ui hover:opacity-85"
                    >
                        <Image
                            src="/logo (1).png"
                            alt=""
                            width={40}
                            height={40}
                            priority
                            className="size-10 object-contain"
                        />
                        {/* nowrap: the name is a single label, and letting flex
                            wrap it broke the 72px header row onto two lines. */}
                        <span className="font-display text-xl font-semibold tracking-tight whitespace-nowrap text-brand-800">
                            {orgName}
                        </span>
                    </Link>

                    <nav aria-label={t.nav.menu} className="hidden xl:block">
                        <ul className="flex items-center gap-1">
                            {navLinks.map((link) => {
                                const isActive = pathname === link.href;

                                return (
                                    <li key={link.href}>
                                        <Link
                                            href={link.href}
                                            aria-current={isActive ? "page" : undefined}
                                            className={cn(
                                                "relative flex h-11 items-center whitespace-nowrap rounded-md px-3 text-base font-medium transition-ui",
                                                isActive
                                                    ? "text-brand-800"
                                                    : "text-ink-600 hover:bg-ink-100 hover:text-brand-800"
                                            )}
                                        >
                                            {link.name}
                                            {isActive && (
                                                <span
                                                    aria-hidden="true"
                                                    className="absolute inset-x-3 -bottom-px h-0.5 rounded-full bg-ochre-600"
                                                />
                                            )}
                                        </Link>
                                    </li>
                                );
                            })}
                        </ul>
                    </nav>

                    <div className="hidden items-center gap-2.5 xl:flex">
                        <LocaleSwitcher locale={locale} label={t.nav.switchLanguage} />

                        <AuthButton locale={locale} t={t} />

                        <a
                            href={`tel:${emergency}`}
                            className={buttonVariants({ variant: "accent" })}
                        >
                            <Phone aria-hidden="true" />
                            {t.nav.emergency}
                        </a>
                    </div>

                    <button
                        type="button"
                        onClick={() => setIsOpen((open) => !open)}
                        className="-mr-2 flex size-11 items-center justify-center rounded-lg text-ink-700 transition-ui hover:bg-ink-100 xl:hidden"
                        aria-label={isOpen ? t.nav.closeMenu : t.nav.openMenu}
                        aria-expanded={isOpen}
                        aria-controls="mobile-menu"
                    >
                        {isOpen ? <X className="size-6" /> : <Menu className="size-6" />}
                    </button>
                </div>
            </Container>

            {isOpen && (
                <div
                    id="mobile-menu"
                    className="border-t border-ink-200 bg-surface xl:hidden"
                >
                    <Container width="wide" className="py-5">
                        <nav aria-label={t.nav.menu}>
                            <ul className="flex flex-col gap-1">
                                {navLinks.map((link) => {
                                    const isActive = pathname === link.href;

                                    return (
                                        <li key={link.href}>
                                            <Link
                                                href={link.href}
                                                aria-current={isActive ? "page" : undefined}
                                                className={cn(
                                                    "flex min-h-12 items-center rounded-lg px-4 text-lg transition-ui",
                                                    isActive
                                                        ? "bg-brand-50 font-semibold text-brand-800"
                                                        : "text-ink-700 hover:bg-ink-100"
                                                )}
                                            >
                                                {link.name}
                                            </Link>
                                        </li>
                                    );
                                })}
                            </ul>
                        </nav>

                        <div className="mt-5 flex flex-col gap-3 border-t border-ink-200 pt-5">
                            <LocaleSwitcher
                                locale={locale}
                                label={t.nav.switchLanguage}
                                className="self-start"
                            />

                            <AuthButton
                                locale={locale}
                                t={t}
                                className="flex-col items-stretch"
                            />

                            <a
                                href={`tel:${emergency}`}
                                className={buttonVariants({ variant: "accent", size: "lg" })}
                            >
                                <Phone aria-hidden="true" />
                                {t.nav.emergency}
                            </a>
                        </div>
                    </Container>
                </div>
            )}
        </header>
    );
}
