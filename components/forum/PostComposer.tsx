"use client";

import { useRef, useState, useTransition } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ImagePlus, Link2, Loader2, Send, Trash2, X } from "lucide-react";
import { toast } from "sonner";

import { createForumPost, uploadForumMedia } from "@/lib/actions/forum";
import { toEmbedUrl, type MediaKind } from "@/lib/types/forum";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { Dictionary } from "@/lib/i18n/dictionary";

type Attachment = { url: string; kind: MediaKind };

const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif", "image/gif"];
const VIDEO_TYPES = ["video/mp4", "video/webm", "video/quicktime"];
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const MAX_VIDEO_BYTES = 50 * 1024 * 1024;

export function PostComposer({ t }: { t: Dictionary }) {
    const router = useRouter();
    const fileRef = useRef<HTMLInputElement>(null);
    const [pending, startTransition] = useTransition();
    const [uploading, setUploading] = useState(false);

    const [title, setTitle] = useState("");
    const [body, setBody] = useState("");
    const [attachments, setAttachments] = useState<Attachment[]>([]);
    const [embeds, setEmbeds] = useState<string[]>([]);
    const [linkDraft, setLinkDraft] = useState("");
    const [showLink, setShowLink] = useState(false);

    const handleFiles = (files: FileList | null) => {
        if (!files?.length) return;

        // Validated here for immediate feedback; the action re-checks both,
        // since a client check is a convenience and never a guarantee.
        for (const file of Array.from(files)) {
            const isImage = IMAGE_TYPES.includes(file.type);
            const isVideo = VIDEO_TYPES.includes(file.type);

            if (!isImage && !isVideo) {
                toast.error("শুধু ছবি বা ভিডিও দেওয়া যাবে।");
                continue;
            }
            if (file.size > (isVideo ? MAX_VIDEO_BYTES : MAX_IMAGE_BYTES)) {
                toast.error(
                    isVideo
                        ? "ভিডিওর আকার ৫০ মেগাবাইটের কম হতে হবে।"
                        : "ছবির আকার ৫ মেগাবাইটের কম হতে হবে।"
                );
                continue;
            }

            const form = new FormData();
            form.append("file", file);

            setUploading(true);
            startTransition(async () => {
                const result = await uploadForumMedia(form);
                setUploading(false);

                if (!result.ok) {
                    toast.error(result.error);
                    return;
                }
                if (result.data) {
                    setAttachments((prev) => [...prev, result.data as Attachment]);
                }
            });
        }
    };

    const addLink = () => {
        const value = linkDraft.trim();
        if (!value) return;

        if (!toEmbedUrl(value)) {
            toast.error("ইউটিউব বা ফেসবুক ভিডিওর একটি সঠিক লিঙ্ক দিন।");
            return;
        }

        setEmbeds((prev) => [...prev, value]);
        setLinkDraft("");
        setShowLink(false);
    };

    const submit = () => {
        if (!title.trim()) {
            toast.error("শিরোনাম লিখুন।");
            return;
        }

        const form = new FormData();
        form.append("title", title);
        form.append("body", body);
        attachments.forEach((a) => {
            form.append("media_url", a.url);
            form.append("media_kind", a.kind);
        });
        embeds.forEach((e) => form.append("embed_url", e));

        startTransition(async () => {
            const result = await createForumPost(form);

            if (!result.ok) {
                toast.error(result.error);
                return;
            }

            setTitle("");
            setBody("");
            setAttachments([]);
            setEmbeds([]);
            toast.success(t.forum.postCta);
            router.refresh();
        });
    };

    const busy = pending || uploading;

    return (
        <div className="rounded-2xl border border-ink-200 bg-surface p-5 shadow-xs sm:p-6">
            <h2 className="text-base font-semibold text-ink-900">{t.forum.newPost}</h2>

            <div className="mt-4 space-y-3">
                <Input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder={t.forum.postTitle}
                    aria-label={t.forum.postTitle}
                    maxLength={300}
                />

                <Textarea
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    placeholder={t.forum.postBody}
                    aria-label={t.forum.postBody}
                    rows={4}
                    className="resize-y"
                />

                {(attachments.length > 0 || embeds.length > 0) && (
                    <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                        {attachments.map((a, i) => (
                            <li
                                key={`${a.url}-${i}`}
                                className="relative aspect-video overflow-hidden rounded-lg border border-ink-200 bg-ink-100"
                            >
                                {a.kind === "video" ? (
                                    <video
                                        src={a.url}
                                        className="size-full object-cover"
                                        muted
                                        playsInline
                                    />
                                ) : (
                                    <Image
                                        src={a.url}
                                        alt=""
                                        fill
                                        unoptimized
                                        sizes="200px"
                                        className="object-cover"
                                    />
                                )}

                                <button
                                    type="button"
                                    onClick={() =>
                                        setAttachments((prev) => prev.filter((_, j) => j !== i))
                                    }
                                    aria-label={t.forum.remove}
                                    className="absolute right-1.5 top-1.5 flex size-8 items-center justify-center rounded-full bg-ink-950/70 text-white transition-ui hover:bg-ink-950"
                                >
                                    <Trash2 className="size-4" />
                                </button>
                            </li>
                        ))}

                        {embeds.map((url, i) => (
                            <li
                                key={`${url}-${i}`}
                                className="relative flex aspect-video items-center justify-center gap-2 overflow-hidden rounded-lg border border-ink-200 bg-ink-50 px-3 text-center"
                            >
                                <Link2 className="size-4 shrink-0 text-ink-500" aria-hidden="true" />
                                <span className="line-clamp-3 text-xs break-all text-ink-600">
                                    {url}
                                </span>

                                <button
                                    type="button"
                                    onClick={() =>
                                        setEmbeds((prev) => prev.filter((_, j) => j !== i))
                                    }
                                    aria-label={t.forum.remove}
                                    className="absolute right-1.5 top-1.5 flex size-8 items-center justify-center rounded-full bg-ink-950/70 text-white transition-ui hover:bg-ink-950"
                                >
                                    <X className="size-4" />
                                </button>
                            </li>
                        ))}
                    </ul>
                )}

                {showLink && (
                    <div className="flex flex-wrap gap-2">
                        <Input
                            value={linkDraft}
                            onChange={(e) => setLinkDraft(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                    e.preventDefault();
                                    addLink();
                                }
                            }}
                            placeholder={t.forum.linkPlaceholder}
                            aria-label={t.forum.addLink}
                            className="min-w-0 flex-1"
                        />
                        <Button type="button" variant="outline" onClick={addLink}>
                            {t.forum.addLinkCta}
                        </Button>
                    </div>
                )}

                <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                    <div className="flex flex-wrap items-center gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            disabled={busy}
                            onClick={() => fileRef.current?.click()}
                        >
                            <ImagePlus aria-hidden="true" />
                            {t.forum.addPhoto}
                        </Button>

                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => setShowLink((v) => !v)}
                        >
                            <Link2 aria-hidden="true" />
                            {t.forum.addLink}
                        </Button>

                        {uploading && (
                            <span className="flex items-center gap-1.5 text-xs text-ink-500">
                                <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
                                {t.forum.uploading}
                            </span>
                        )}
                    </div>

                    <Button type="button" onClick={submit} disabled={busy}>
                        {pending && !uploading ? (
                            <Loader2 className="animate-spin" aria-hidden="true" />
                        ) : (
                            <Send aria-hidden="true" />
                        )}
                        {pending && !uploading ? t.forum.posting : t.forum.postCta}
                    </Button>
                </div>

                <p className="text-xs text-ink-500">{t.forum.uploadHint}</p>
            </div>

            <input
                ref={fileRef}
                type="file"
                multiple
                accept={[...IMAGE_TYPES, ...VIDEO_TYPES].join(",")}
                className="sr-only"
                aria-label={t.forum.addPhoto}
                onChange={(e) => {
                    handleFiles(e.target.files);
                    e.target.value = "";
                }}
            />
        </div>
    );
}
