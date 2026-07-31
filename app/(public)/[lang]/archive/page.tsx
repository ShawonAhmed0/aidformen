import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Archive } from "lucide-react";

import { getDictionary } from "@/lib/i18n/dictionary";
import { isLocale } from "@/lib/i18n/config";
import { PageHero } from "@/components/PageHero";
import { Section } from "@/components/ui/section";
import { buttonVariants } from "@/components/ui/button";

export async function generateMetadata({
    params,
}: {
    params: Promise<{ lang: string }>;
}): Promise<Metadata> {
    const { lang } = await params;
    if (!isLocale(lang)) return {};
    const t = await getDictionary(lang);
    return { title: t.nav.archive, description: t.empty.archiveDescription };
}

export default async function ArchivePage({
    params,
}: {
    params: Promise<{ lang: string }>;
}) {
    const { lang } = await params;
    if (!isLocale(lang)) notFound();

    const t = await getDictionary(lang);

    return (
        <main>
            <PageHero
                eyebrow={t.empty.archiveEyebrow}
                title={t.nav.archive}
                description={t.empty.archiveDescription}
            />

            <Section space="lg" containerWidth="prose">
                <div className="rounded-2xl border border-dashed border-ink-300 bg-surface px-6 py-16 text-center">
                    <span className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-brand-50 text-brand-700">
                        <Archive className="size-7" aria-hidden="true" />
                    </span>

                    <h2 className="mt-6 text-2xl text-brand-800">
                        {t.empty.archiveTitle}
                    </h2>

                    <p className="mx-auto mt-3 max-w-md text-base text-ink-600">
                        {t.empty.archiveBody}
                    </p>

                    <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
                        <Link href={`/${lang}`} className={buttonVariants()}>
                            {t.empty.viewRecent}
                        </Link>
                        <Link
                            href={`/${lang}/contact`}
                            className={buttonVariants({ variant: "outline" })}
                        >
                            {t.nav.contact}
                        </Link>
                    </div>
                </div>
            </Section>
        </main>
    );
}
