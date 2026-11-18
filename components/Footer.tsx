import Link from "next/link";
import Image from "next/image";
import { Globe, Mail, MapPin, Phone } from "lucide-react";
import { FaFacebookF, FaYoutube } from "react-icons/fa6";

import { Container } from "./ui/container";
import { getMediaLibraryLabels } from "@/components/media-library/labels";
import { pick, pickBrand, type Locale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/dictionary";
import type { SiteSettings } from "@/lib/types/content";

// 44px rows on touch screens; the list tightens up once there's a pointer.
const linkClass =
    "inline-flex min-h-11 items-center rounded-sm text-brand-100/80 transition-ui hover:text-white sm:min-h-9";

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
    const orgName = pickBrand(
        locale,
        settings?.organisation_name,
        settings?.organisation_name_en,
        { bn: "এইড ফর মেন", en: "Aid For Men" }
    );
    const tagline = pickBrand(locale, settings?.tagline, settings?.tagline_en, {
        bn: t.meta.description,
        en: t.meta.description,
    });
    const address = pick(locale, settings?.address, settings?.address_en);
    const phone = settings?.contact_phone?.trim();
    const email = settings?.contact_email?.trim();

    const quickLinks = [
        { label: t.nav.about, href: `/${locale}/about` },
        { label: t.nav.team, href: `/${locale}/team` },
        { label: t.nav.archive, href: `/${locale}/news` },
        { label: getMediaLibraryLabels(locale).title, href: `/${locale}/media-archive` },
    ];

    // The privacy, terms and FAQ links that used to sit here all led to 404s;
    // every link in this column now resolves.
    const communityLinks = [
        { label: t.nav.forum, href: `/${locale}/forum` },
        { label: t.auth.registerTitle, href: `/${locale}/register` },
        { label: t.nav.contact, href: `/${locale}/contact` },
    ];

    return (
        <footer data-site-chrome className="bg-brand-950 text-brand-50">
            <Container>
                <div className="grid gap-10 py-14 sm:grid-cols-2 sm:gap-12 lg:grid-cols-[minmax(0,1.4fr)_repeat(3,minmax(0,1fr))] lg:py-16">
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
                                    target="_blank"
                                    rel="noopener noreferrer external"
                                >
                                    <Globe className="size-[18px]" aria-hidden="true" />
                                </a>
                            )}
                            {settings?.facebook_url && (
                                <a
                                    href={settings.facebook_url}
                                    className={socialClass}
                                    aria-label="Facebook"
                                    target="_blank"
                                    rel="noopener noreferrer external"
                                >
                                    <FaFacebookF className="size-[18px]" aria-hidden="true" />
                                </a>
                            )}
                            {settings?.youtube_url && (
                                <a
                                    href={settings.youtube_url}
                                    className={socialClass}
                                    aria-label="YouTube"
                                    target="_blank"
                                    rel="noopener noreferrer external"
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
                        <ul className="mt-4 flex flex-col text-sm sm:gap-1">
                            {quickLinks.map((link) => (
                                <li key={link.href}>
                                    <Link href={link.href} className={linkClass}>
                                        {link.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </nav>

                    <nav aria-labelledby="footer-community">
                        <h2
                            id="footer-community"
                            className="text-2xs font-semibold uppercase text-brand-300"
                        >
                            {t.footer.community}
                        </h2>
                        <ul className="mt-4 flex flex-col text-sm sm:gap-1">
                            {communityLinks.map((link) => (
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

                        <address className="mt-4 flex flex-col gap-2 text-sm not-italic text-brand-100/80 sm:gap-3">
                            {address && (
                                <span className="flex items-start gap-3 py-2 sm:py-0">
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
                                    className="flex min-h-11 items-center gap-3 rounded-sm break-all transition-ui hover:text-white sm:min-h-0"
                                >
                                    <Phone
                                        className="size-[18px] shrink-0 text-brand-300"
                                        aria-hidden="true"
                                    />
                                    {phone}
                                </a>
                            )}

                            {email && (
                                <a
                                    href={`mailto:${email}`}
                                    className="flex min-h-11 items-center gap-3 rounded-sm break-all transition-ui hover:text-white sm:min-h-0"
                                >
                                    <Mail
                                        className="size-[18px] shrink-0 text-brand-300"
                                        aria-hidden="true"
                                    />
                                    {email}
                                </a>
                            )}
                        </address>
                    </div>
                </div>

                <div className="border-t border-white/10 py-7 text-center text-xs text-brand-100/60">
                    <p>
                        {/* Danda is Bengali punctuation; a full stop in the English line. */}
                        © {new Date().getFullYear()} {orgName}
                        {locale === "en" ? "." : "।"} {t.footer.rights}
                    </p>
                    <a
                        href="https://www.shawonahmed.com"
                        className="mt-1 inline-flex min-h-11 items-center rounded-sm text-brand-100/80 transition-ui hover:text-white hover:underline sm:min-h-0"
                        target="_blank"
                        rel="noopener noreferrer external"
                    >
                        Crafted with ❤️ by Shawon
                    </a>
                </div>
            </Container>
        </footer>
    );
}
