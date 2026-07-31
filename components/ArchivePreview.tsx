import { getActivities } from "@/lib/content/queries";
import { pick, type Locale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/dictionary";
import { Section } from "./ui/section";
import { SectionHeading } from "./ui/section-heading";
import { ArchiveFilterGrid } from "./ArchiveFilterGrid";

export default async function ArchivePreview({
    locale,
    t,
}: {
    locale: Locale;
    t: Dictionary;
}) {
    const items = await getActivities("archive");

    if (items.length === 0) return null;

    // Resolve the locale on the server so the client filter component only
    // deals with plain display strings.
    const resolved = items.map((item) => ({
        id: item.id,
        title: pick(locale, item.title, item.title_en),
        category: pick(locale, item.category, item.category_en),
        action: pick(locale, item.action_label, item.action_label_en),
        image: item.image_url,
        href: item.href || `/${locale}/archive`,
    }));

    const categories = [
        t.home.allActivities,
        ...Array.from(new Set(resolved.map((i) => i.category).filter(Boolean))),
    ];

    return (
        <Section tone="sunken" space="lg">
            <SectionHeading
                align="center"
                eyebrow={t.home.archiveEyebrow}
                title={t.home.archiveTitle}
                description={t.home.archiveBody}
            />

            <ArchiveFilterGrid
                items={resolved}
                categories={categories}
                allLabel={t.home.allActivities}
                filterLabel={t.home.filterLabel}
                emptyLabel={t.home.noItems}
            />
        </Section>
    );
}
