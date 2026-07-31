import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { getTeamMembers } from "@/lib/content/queries";
import { getDictionary } from "@/lib/i18n/dictionary";
import { isLocale, pick } from "@/lib/i18n/config";
import { PageHero } from "@/components/PageHero";
import { Section } from "@/components/ui/section";
import { TeamGrid } from "@/components/TeamGrid";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;
  if (!isLocale(lang)) return {};
  const t = await getDictionary(lang);
  return { title: t.nav.team, description: t.team.description };
}

/**
 * Server component: the member list comes from the database and the locale is
 * resolved here, so the interactive grid only receives display strings.
 */
export default async function TeamPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();

  const [t, members] = await Promise.all([
    getDictionary(lang),
    getTeamMembers(),
  ]);

  const resolved = members.map((m) => ({
    id: m.id,
    name: pick(lang, m.name, m.name_en),
    role: pick(lang, m.role, m.role_en),
    quote: pick(lang, m.quote, m.quote_en),
    statement: pick(lang, m.statement, m.statement_en),
    bio: pick(lang, m.bio, m.bio_en),
    photo_url: m.photo_url,
  }));

  return (
    <main>
      <PageHero
        eyebrow={t.team.eyebrow}
        title={t.team.title}
        description={t.team.description}
      />

      <Section space="lg" containerWidth="wide">
        {resolved.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-ink-300 bg-surface px-6 py-16 text-center">
            <p className="text-base font-medium text-ink-700">{t.team.empty}</p>
          </div>
        ) : (
          <TeamGrid members={resolved} t={t} />
        )}
      </Section>
    </main>
  );
}
