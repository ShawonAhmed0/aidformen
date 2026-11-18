import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { getArchiveEntries } from "@/lib/content/archive";
import { resolveArchiveEntry, toArchiveListingItem } from "@/lib/types/archive";
import type { Locale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/dictionary";
import { ArchiveGrid } from "./archive/ArchiveGrid";
import { Section } from "./ui/section";
import { SectionHeading } from "./ui/section-heading";
import { buttonVariants } from "./ui/button";

/** How many entries the homepage shows before sending the reader to /archive. */
const PREVIEW_COUNT = 3;

// Columns follow the number of entries, so two entries never sit in a
// three-column grid with an empty slot beside them. With three, the third
// is dropped on tablets rather than left alone on a half-empty row.
const gridByCount: Record<number, string> = {
    1: "grid max-w-md",
    2: "grid gap-5 sm:grid-cols-2",
    3: "grid gap-5 sm:grid-cols-2 lg:grid-cols-3 sm:max-lg:[&>li:nth-child(3)]:hidden",
};

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
        .map((entry) => toArchiveListingItem(resolveArchiveEntry(locale, entry)));

    return (
        <Section tone="sunken" space="md">
            <SectionHeading
                eyebrow={t.home.archiveEyebrow}
                title={t.home.archiveTitle}
                description={t.home.archiveBody}
                action={
                    <Link
                        href={`/${locale}/news`}
                        className={buttonVariants({ variant: "outline", className: "gap-2" })}
                    >
                        {t.home.viewArchive}
                        <ArrowRight aria-hidden="true" />
                    </Link>
                }
            />

            <ArchiveGrid
                items={items}
                t={t.archive}
                locale={locale}
                className={gridByCount[items.length]}
            />
        </Section>
    );
}
