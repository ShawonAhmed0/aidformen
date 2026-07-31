import Link from "next/link";
import Image from "next/image";
import { Globe, Mail, MapPin, Phone } from "lucide-react";
import { FaFacebookF, FaYoutube } from "react-icons/fa6";

import { Container } from "./ui/container";
import { pick, type Locale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/dictionary";
import type { SiteSettings } from "@/lib/types/content";

const linkClass =
    "inline-flex rounded-sm text-brand-100/80 transition-ui hover:text-white";

const socialClass =
    "flex size-10 items-center justify-center rounded-lg bg-white/8 text-brand-100 transition-ui hover:bg-white/15 hover:text-white";

export default function Footer({
    locale,
    t,
    settings,
}: {
    locale: Locale;
    t: Dictionary;
    settings: SiteSettings | null;
}) {
    const orgName =
        pick(locale, settings?.organisation_name, settings?.organisation_name_en) ||
        "এইড ফর মেন";
    const tagline = pick(locale, settings?.tagline, settings?.tagline_en);
    const address = pick(locale, settings?.address, settings?.address_en);
    const phone = settings?.contact_phone?.trim();
    const email = settings?.contact_email?.trim();

    const quickLinks = [
        { label: t.nav.about, href: `/${locale}/about` },
        { label: t.nav.team, href: `/${locale}/team` },
        { label: t.nav.archive, href: `/${locale}/archive` },
        { label: t.nav.forum, href: `/${locale}/forum` },
    ];

    const legalLinks = [
        { label: t.footer.privacy, href: `/${locale}/privacy` },
        { label: t.footer.terms, href: `/${locale}/terms` },
        { label: t.footer.faq, href: `/${locale}/faq` },
        { label: t.nav.contact, href: `/${locale}/contact` },
    ];

    return (
        <footer className="bg-brand-950 text-brand-50">
            <Container>
                <div className="grid gap-12 py-16 sm:grid-cols-2 lg:grid-cols-4 lg:py-20">
                    {/* Brand */}
                    <div className="sm:col-span-2 lg:col-span-1">
                        <div className="flex items-center gap-3">
                            <Image
                                src="/logo (1).png"
                                alt=""
                                width={36}
                                height={36}
                                className="size-9 object-contain"
                            />
                            <span className="font-display text-lg font-semibold">
                                {orgName}
                            </span>
                        </div>

                        {tagline && (
                            <p className="mt-5 max-w-sm text-sm leading-relaxed text-brand-100/75">
                                {tagline}
                            </p>
                        )}

                        <div className="mt-6 flex gap-2">
                            {settings?.website_url && (
                                <a
                                    href={settings.website_url}
                                    className={socialClass}
                                    aria-label={t.footer.website}
                                >
                                    <Globe className="size-[18px]" aria-hidden="true" />
                                </a>
                            )}
                            {settings?.facebook_url && (
                                <a
                                    href={settings.facebook_url}
                                    className={socialClass}
                                    aria-label="Facebook"
                                >
                                    <FaFacebookF className="size-[18px]" aria-hidden="true" />
                                </a>
                            )}
                            {settings?.youtube_url && (
                                <a
                                    href={settings.youtube_url}
                                    className={socialClass}
                                    aria-label="YouTube"
                                >
                                    <FaYoutube className="size-[18px]" aria-hidden="true" />
                                </a>
                            )}
                            {email && (
                                <a
                                    href={`mailto:${email}`}
                                    className={socialClass}
                                    aria-label={t.footer.email}
                                >
                                    <Mail className="size-[18px]" aria-hidden="true" />
                                </a>
                            )}
                        </div>
                    </div>

                    <nav aria-labelledby="footer-quick">
                        <h2
                            id="footer-quick"
                            className="text-2xs font-semibold uppercase text-brand-300"
                        >
                            {t.footer.quickLinks}
                        </h2>
                        <ul className="mt-5 flex flex-col gap-3 text-sm">
                            {quickLinks.map((link) => (
                                <li key={link.href}>
                                    <Link href={link.href} className={linkClass}>
                                        {link.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </nav>

                    <nav aria-labelledby="footer-legal">
                        <h2
                            id="footer-legal"
                            className="text-2xs font-semibold uppercase text-brand-300"
                        >
                            {t.footer.legal}
                        </h2>
                        <ul className="mt-5 flex flex-col gap-3 text-sm">
                            {legalLinks.map((link) => (
                                <li key={link.href}>
                                    <Link href={link.href} className={linkClass}>
                                        {link.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </nav>

                    <div>
                        <h2 className="text-2xs font-semibold uppercase text-brand-300">
                            {t.footer.contact}
                        </h2>

                        <address className="mt-5 flex flex-col gap-4 text-sm not-italic text-brand-100/80">
                            {address && (
                                <span className="flex items-start gap-3">
                                    <MapPin
                                        className="mt-0.5 size-[18px] shrink-0 text-brand-300"
                                        aria-hidden="true"
                                    />
                                    {address}
                                </span>
                            )}

                            {phone && (
                                <a
                                    href={`tel:${phone}`}
                                    className="flex items-start gap-3 rounded-sm transition-ui hover:text-white"
                                >
                                    <Phone
                                        className="mt-0.5 size-[18px] shrink-0 text-brand-300"
                                        aria-hidden="true"
                                    />
                                    {phone}
                                </a>
                            )}

                            {email && (
                                <a
                                    href={`mailto:${email}`}
                                    className="flex items-start gap-3 rounded-sm transition-ui hover:text-white"
                                >
                                    <Mail
                                        className="mt-0.5 size-[18px] shrink-0 text-brand-300"
                                        aria-hidden="true"
                                    />
                                    {email}
                                </a>
                            )}
                        </address>
                    </div>
                </div>

                <div className="border-t border-white/10 py-7 text-center text-xs text-brand-100/60">
                    © {new Date().getFullYear()} {orgName}। {t.footer.rights}
                </div>
            </Container>
        </footer>
    );
}
