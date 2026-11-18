import { ExternalLink } from "lucide-react";
import { FaYoutube } from "react-icons/fa6";

import { getAllVideos } from "@/lib/content/queries";
import { youtubeChannel } from "@/lib/content/youtube";
import { VideosManager } from "@/components/admin/VideosManager";

export default async function AdminVideosPage() {
    const videos = await getAllVideos();

    return (
        <div className="mx-auto max-w-5xl space-y-6">
            <div>
                <h1 className="text-2xl tracking-tight text-ink-900">ভিডিও</h1>
                <p className="mt-1.5 text-sm text-ink-500">
                    হোমপেজের মিডিয়া অংশের বিকল্প ভিডিও তালিকা।
                </p>
            </div>

            {/* This list used to drive the homepage section; it is now only the
                fallback, and an editor needs to know that before editing it. */}
            <div className="flex flex-wrap items-start gap-4 rounded-xl border border-brand-200 bg-brand-50 p-5">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-brand-800 text-white">
                    <FaYoutube className="size-5" aria-hidden="true" />
                </span>
                <div className="min-w-0 flex-1 text-sm text-ink-700">
                    <p className="font-semibold text-ink-900">
                        হোমপেজ এখন সরাসরি ইউটিউব চ্যানেল থেকে ভিডিও দেখায়
                    </p>
                    <p className="mt-1">
                        চ্যানেলে নতুন ভিডিও আপলোড করলে এক ঘণ্টার মধ্যে হোমপেজে নিজে থেকেই চলে আসে —
                        এখানে কিছু করতে হবে না। নিচের তালিকাটি শুধু তখনই দেখা যায়, যখন কোনো কারণে
                        ইউটিউবের সঙ্গে যোগাযোগ করা যায় না।
                    </p>
                    <a
                        href={youtubeChannel.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-2 inline-flex items-center gap-1.5 font-medium text-brand-700 underline underline-offset-2"
                    >
                        {youtubeChannel.handle}
                        <ExternalLink className="size-3.5" aria-hidden="true" />
                    </a>
                </div>
            </div>

            <VideosManager videos={videos} />
        </div>
    );
}
