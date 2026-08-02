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

    return { title: post.title };
}

export default async function ForumPostPage({ params }: { params: Params }) {
    const { lang, postId } = await params;
    if (!isLocale(lang)) notFound();

    const [t, viewer, post] = await Promise.all([
        getDictionary(lang),
        getViewerStatus(),
        getForumPost(postId),
    ]);

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
                        viewer={viewer}
                        detail
                    />

                    <CommentThread
                        comments={comments}
                        postId={post.id}
                        t={t}
                        locale={lang}
                        viewer={viewer}
                        // Sits where the comment box would be, so the reason
                        // lands next to the thing it explains.
                        prompt={<ForumGate viewer={viewer} t={t} locale={lang} />}
                    />
                </div>
            </Section>
        </main>
    );
}
