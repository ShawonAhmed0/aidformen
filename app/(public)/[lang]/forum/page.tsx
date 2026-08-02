import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { getDictionary } from "@/lib/i18n/dictionary";
import { isLocale } from "@/lib/i18n/config";
import { getForumFeed, getViewerStatus } from "@/lib/content/forum";
import { PageHero } from "@/components/PageHero";
import { Section } from "@/components/ui/section";
import { ForumGate } from "@/components/forum/ForumGate";
import { PostComposer } from "@/components/forum/PostComposer";
import { PostCard } from "@/components/forum/PostCard";

export async function generateMetadata({
    params,
}: {
    params: Promise<{ lang: string }>;
}): Promise<Metadata> {
    const { lang } = await params;
    if (!isLocale(lang)) return {};
    const t = await getDictionary(lang);
    return { title: t.nav.forum, description: t.forum.description };
}

export default async function ForumPage({
    params,
}: {
    params: Promise<{ lang: string }>;
}) {
    const { lang } = await params;
    if (!isLocale(lang)) notFound();

    const [t, viewer, posts] = await Promise.all([
        getDictionary(lang),
        getViewerStatus(),
        getForumFeed(),
    ]);

    return (
        <main>
            <PageHero
                eyebrow={t.empty.community}
                title={t.forum.title}
                description={t.forum.description}
            />

            <Section space="lg" containerWidth="prose">
                <div className="space-y-5">
                    {/* Anyone may read the feed below; only an approved member
                        gets the composer, and the gate says why. */}
                    {viewer.canParticipate ? (
                        <PostComposer t={t} />
                    ) : (
                        <ForumGate viewer={viewer} t={t} locale={lang} />
                    )}

                    {posts.length === 0 ? (
                        <p className="rounded-2xl border border-dashed border-ink-300 bg-surface px-6 py-14 text-center text-base text-ink-600">
                            {t.forum.empty}
                        </p>
                    ) : (
                        posts.map((post) => (
                            <PostCard
                                key={post.id}
                                post={post}
                                locale={lang}
                                t={t}
                                viewer={viewer}
                            />
                        ))
                    )}
                </div>
            </Section>
        </main>
    );
}
