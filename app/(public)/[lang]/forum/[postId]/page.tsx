import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { getDictionary } from "@/lib/i18n/dictionary";
import { isLocale } from "@/lib/i18n/config";
import { getForumPost, getPostComments, getViewerStatus } from "@/lib/content/forum";
import { Section } from "@/components/ui/section";
import { ForumGate } from "@/components/forum/ForumGate";
import { PostCard } from "@/components/forum/PostCard";
import { CommentThread } from "@/components/forum/CommentThread";

type Params = Promise<{ lang: string; postId: string }>;

export async function generateMetadata({
    params,
}: {
    params: Params;
}): Promise<Metadata> {
    const { lang, postId } = await params;
    if (!isLocale(lang)) return {};

    const post = await getForumPost(postId);
    if (!post) return {};

    return {
        title: post.title,
        // The forum is members-only; keep threads out of search results.
        robots: { index: false, follow: false },
    };
}

export default async function ForumPostPage({ params }: { params: Params }) {
    const { lang, postId } = await params;
    if (!isLocale(lang)) notFound();

    const [t, viewer] = await Promise.all([getDictionary(lang), getViewerStatus()]);

    if (!viewer.canParticipate) {
        return (
            <main>
                <Section space="lg" containerWidth="prose">
                    <ForumGate viewer={viewer} t={t} locale={lang} />
                </Section>
            </main>
        );
    }

    const post = await getForumPost(postId);
    if (!post || post.is_removed) notFound();

    const comments = await getPostComments(postId);

    return (
        <main>
            <Section space="lg" containerWidth="prose">
                <Link
                    href={`/${lang}/forum`}
                    className="inline-flex h-9 items-center gap-1.5 rounded-lg text-sm font-medium text-ink-600 transition-ui hover:text-brand-800"
                >
                    <ArrowLeft className="size-4" aria-hidden="true" />
                    {t.forum.backToForum}
                </Link>

                <div className="mt-4 space-y-5">
                    <PostCard
                        post={post}
                        locale={lang}
                        t={t}
                        canParticipate={viewer.canParticipate}
                        viewerId={viewer.userId}
                        isAdmin={viewer.isAdmin}
                        detail
                    />

                    <CommentThread
                        comments={comments}
                        postId={post.id}
                        t={t}
                        locale={lang}
                        canParticipate={viewer.canParticipate}
                        viewerId={viewer.userId}
                        isAdmin={viewer.isAdmin}
                    />
                </div>
            </Section>
        </main>
    );
}
