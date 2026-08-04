import Link from "next/link";

import { getArchiveEntries } from "@/lib/content/archive";
import { resolveArchiveEntry } from "@/lib/types/archive";
import type { Locale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/dictionary";
import { ArchiveGrid } from "./archive/ArchiveGrid";
import { Section } from "./ui/section";
import { SectionHeading } from "./ui/section-heading";
import { buttonVariants } from "./ui/button";

/** How many entries the homepage shows before sending the reader to /archive. */
const PREVIEW_COUNT = 3;

export default async function ArchivePreview({
    locale,
    t,
}: {
    locale: Locale;
    t: Dictionary;
}) {
    const entries = await getArchiveEntries();

    if (entries.length === 0) return null;

    // The first few in the admin's own order rather than by date: which entries
    // deserve the homepage is an editorial decision, and reordering them in
    // /admin/archive is how it gets made.
    const items = entries
        .slice(0, PREVIEW_COUNT)
        .map((entry) => resolveArchiveEntry(locale, entry));

    return (
        <Section tone="sunken" space="lg">
            <SectionHeading
                eyebrow={t.home.archiveEyebrow}
                title={t.home.archiveTitle}
                description={t.home.archiveBody}
                action={
                    <Link
                        href={`/${locale}/archive`}
                        className={buttonVariants({ variant: "outline" })}
                    >
                        {t.home.viewArchive}
                    </Link>
                }
            />

            <ArchiveGrid items={items} t={t.archive} locale={locale} />
        </Section>
    );
}
