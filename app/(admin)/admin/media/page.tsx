import { MediaLibraryInventory } from "@/components/media-library/MediaLibraryInventory";
import { getAllMediaAssets } from "@/lib/content/media-library";
import { getAdminLocale } from "@/lib/i18n/admin-server";

const copy = {
  bn: {
    eyebrow: "স্টোরেজ ইনভেন্টরি",
    heading: "কেন্দ্রীয় মিডিয়া লাইব্রেরি",
    intro:
      "সাইটের এডিটোরিয়াল অংশে আপলোড করা ছবি ও ভিডিওর স্বয়ংক্রিয়, শুধু-পঠন তালিকা। সিগনেচার, ডকুমেন্ট, অডিও, ফোরাম মিডিয়া ও প্রোফাইল ছবি এখানে অন্তর্ভুক্ত হয় না।",
  },
  en: {
    eyebrow: "Storage inventory",
    heading: "Central media library",
    intro:
      "An automatic, read-only list of the images and videos uploaded to the site's editorial sections. Signatures, documents, audio, forum media and profile pictures are not included.",
  },
};

export default async function AdminMediaLibraryPage() {
  const [assets, locale] = await Promise.all([
    getAllMediaAssets(),
    getAdminLocale(),
  ]);
  const t = copy[locale];

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div>
        <p className="text-2xs font-semibold uppercase text-ochre-700">
          {t.eyebrow}
        </p>
        <h1 className="mt-2 text-2xl tracking-tight text-ink-900">
          {t.heading}
        </h1>
        <p className="mt-1.5 max-w-3xl text-sm text-ink-500">
          {t.intro}
        </p>
      </div>

      <MediaLibraryInventory assets={assets} />
    </div>
  );
}
