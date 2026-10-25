import { MediaLibraryInventory } from "@/components/media-library/MediaLibraryInventory";
import { getAllMediaAssets } from "@/lib/content/media-library";

export default async function AdminMediaLibraryPage() {
  const assets = await getAllMediaAssets();

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div>
        <p className="text-2xs font-semibold uppercase text-ochre-700">
          Storage inventory
        </p>
        <h1 className="mt-2 text-2xl tracking-tight text-ink-900">
          কেন্দ্রীয় মিডিয়া লাইব্রেরি
        </h1>
        <p className="mt-1.5 max-w-3xl text-sm text-ink-500">
          সাইটের এডিটোরিয়াল অংশে আপলোড করা ছবি ও ভিডিওর স্বয়ংক্রিয়, শুধু-পঠন
          তালিকা। সিগনেচার, ডকুমেন্ট, অডিও, ফোরাম মিডিয়া ও প্রোফাইল ছবি এখানে
          অন্তর্ভুক্ত হয় না।
        </p>
      </div>

      <MediaLibraryInventory assets={assets} />
    </div>
  );
}
