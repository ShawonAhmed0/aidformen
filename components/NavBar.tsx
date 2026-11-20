"use client";

import Link from "next/link";
import Image from "next/image";
import { Menu, Phone, X } from "lucide-react";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

import { LocaleSwitcher } from "./LocaleSwitcher";
import { Container } from "./ui/container";
import { buttonVariants } from "./ui/button";
import { pickBrand, type Locale } from "@/lib/i18n/config";
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
        { name: t.nav.mediaCenter, href: `/${locale}/news` },
        { name: t.nav.research, href: `/${locale}/research` },
        { name: t.nav.contact, href: `/${locale}/contact` },
        { name: t.nav.team, href: `/${locale}/team` },
    ];

    // A section stays highlighted on its own detail pages; home only on itself.
    const isCurrent = (href: string) =>
        pathname === href || (href !== `/${locale}` && pathname.startsWith(`${href}/`));

    const orgName = pickBrand(
        locale,
        settings?.organisation_name,
        settings?.organisation_name_en,
        { bn: "এইড ফর মেন", en: "Aid For Men" }
    );
    const emergency = settings?.emergency_phone?.trim() || "01404555999";

    return (
        <header
            data-site-chrome
            className="sticky top-0 z-50 border-b border-ink-200 bg-surface/85 backdrop-blur-md"
        >
            {/* 2xl widens past max-w-7xl, where the wordmark and logo return to
                full size. Between xl and 2xl every control is on the row at
                once, so the logo, wordmark, link padding and gaps all step
                down a notch there to keep the name un-truncated. */}
            <Container width="wide" className="2xl:max-w-[88rem]">
                {/* The primary navigation appears on laptop screens. Utilities
                    move into the menu until xl, where there is enough room for
                    every control without squeezing or wrapping Bengali labels.
                    The links never shrink — when they did, they overflowed on
                    top of the locale switcher. The wordmark truncates instead. */}
                <div className="flex h-18 items-center justify-between gap-2 2xl:gap-3">
                    <Link
                        href={`/${locale}`}
                        aria-label={orgName}
                        className="flex min-w-0 items-center gap-2.5 rounded-md transition-ui hover:opacity-85"
                    >
                        <Image
                            src="/logo (1).png"
                            alt=""
                            width={56}
                            height={56}
                            priority
                            className="size-14 shrink-0 object-contain xl:size-13 2xl:size-14"
                        />
                        {/* nowrap: the name is a single label, and letting flex
                            wrap it broke the 72px header row onto two lines. */}
                        <span className="truncate font-display text-xl font-semibold tracking-tight whitespace-nowrap text-brand-800 xl:text-[1.0625rem] 2xl:text-xl">
                            {orgName}
                        </span>
                    </Link>

                    <nav aria-label={t.nav.menu} className="hidden shrink-0 lg:block">
                        <ul className="flex items-center gap-1 xl:gap-0.5 2xl:gap-1">
                            {navLinks.map((link) => {
                                const isActive = isCurrent(link.href);

                                return (
                                    <li key={link.href}>
                                        <Link
                                            href={link.href}
                                            aria-current={isActive ? "page" : undefined}
                                            className={cn(
                                                "relative flex h-11 items-center whitespace-nowrap rounded-md px-2 text-sm font-medium transition-ui 2xl:px-2.5",
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

                    <div className="hidden shrink-0 items-center gap-2 xl:flex">
                        <LocaleSwitcher locale={locale} label={t.nav.switchLanguage} />

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
                        <nav aria-label={t.nav.menu} className="lg:hidden">
                            <ul className="flex flex-col gap-1">
                                {navLinks.map((link) => {
                                    const isActive = isCurrent(link.href);

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

                        <div className="mt-5 flex flex-col gap-3 border-t border-ink-200 pt-5 lg:mt-0 lg:flex-row lg:items-center lg:justify-end lg:border-t-0 lg:pt-0">
                            <LocaleSwitcher
                                locale={locale}
                                label={t.nav.switchLanguage}
                                className="self-start"
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
