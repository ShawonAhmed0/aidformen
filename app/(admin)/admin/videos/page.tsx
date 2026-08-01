import { getAllVideos } from "@/lib/content/queries";
import { VideosManager } from "@/components/admin/VideosManager";

export default async function AdminVideosPage() {
    const videos = await getAllVideos();

    return (
        <div className="mx-auto max-w-5xl space-y-6">
            <div>
                <h1 className="text-2xl tracking-tight text-ink-900">ভিডিও</h1>
                <p className="mt-1.5 text-sm text-ink-500">
                    হোমপেজের মিডিয়া অংশের ভিডিও যোগ করুন, ক্রম ঠিক করুন এবং
                    প্রয়োজনে সাময়িকভাবে লুকিয়ে রাখুন।
                </p>
            </div>

            <VideosManager videos={videos} />
        </div>
    );
}
