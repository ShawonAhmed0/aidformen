import { ExternalLink, Film, FolderOpen, ImageIcon } from "lucide-react";

import type { AdminLocale } from "@/lib/i18n/admin";
import { getAdminLocale } from "@/lib/i18n/admin-server";
import {
  formatMediaBytes,
  mediaAssetFileName,
  type MediaAsset,
} from "@/lib/types/media-library";

const intlLocales = { bn: "bn-BD", en: "en-GB" } as const;

const copy = {
  bn: {
    images: "ছবি",
    videos: "ভিডিও",
    folders: "স্টোরেজ ফোল্ডার",
    emptyTitle: "মিডিয়া ইনভেন্টরি এখন খালি",
    emptyBody:
      "নতুন ছবি বা ভিডিও আপলোড হলে এখানে স্বয়ংক্রিয়ভাবে দেখা যাবে। নতুন মাইগ্রেশন এখনো চালু না হলেও এই পেজ নিরাপদে খালি থাকবে।",
    title: "স্বয়ংক্রিয় মিডিয়া ইনভেন্টরি",
    description:
      "এটি শুধু দেখার জন্য। ফাইলের তথ্য স্টোরেজ আপলোড, পরিবর্তন ও মুছে ফেলার সঙ্গে স্বয়ংক্রিয়ভাবে সমন্বয় হয়।",
    caption: "কেন্দ্রীয় ছবি ও ভিডিও ইনভেন্টরির স্টোরেজ মেটাডাটা",
    file: "ফাইল",
    kind: "ধরন",
    location: "বাকেট / ফোল্ডার",
    size: "আকার",
    updated: "সর্বশেষ পরিবর্তন",
    open: "ফাইল খুলুন",
    openFile: (name: string) => `ফাইল খুলুন: ${name}`,
    kinds: { image: "ছবি", video: "ভিডিও" },
  },
  en: {
    images: "Images",
    videos: "Videos",
    folders: "Storage folders",
    emptyTitle: "The media inventory is empty",
    emptyBody:
      "New images and videos will appear here automatically once they are uploaded. If the new migration has not been run yet, this page simply stays empty.",
    title: "Automatic media inventory",
    description:
      "This is read-only. File details stay in sync automatically as storage files are uploaded, changed or deleted.",
    caption: "Storage metadata for the central image and video inventory",
    file: "File",
    kind: "Type",
    location: "Bucket / folder",
    size: "Size",
    updated: "Last modified",
    open: "Open file",
    openFile: (name: string) => `Open file: ${name}`,
    kinds: { image: "Image", video: "Video" },
  },
};

function formatAdminDate(value: string, locale: AdminLocale): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

  return new Intl.DateTimeFormat(intlLocales[locale], {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Dhaka",
  }).format(date);
}

function Stat({
  label,
  count,
  locale,
  icon,
}: {
  label: string;
  count: number;
  locale: AdminLocale;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-ink-200 bg-surface p-5 shadow-xs">
      <div className="flex items-center gap-3">
        <span className="flex size-10 items-center justify-center rounded-lg bg-brand-50 text-brand-700">
          {icon}
        </span>
        <div>
          <p className="text-sm text-ink-500">{label}</p>
          <p className="mt-0.5 text-2xl font-semibold tabular-nums text-ink-900">
            {count.toLocaleString(intlLocales[locale])}
          </p>
        </div>
      </div>
    </div>
  );
}

export async function MediaLibraryInventory({
  assets,
}: {
  assets: MediaAsset[];
}) {
  const locale = await getAdminLocale();
  const t = copy[locale];
  const imageCount = assets.filter((asset) => asset.kind === "image").length;
  const videoCount = assets.length - imageCount;
  const folderCount = new Set(
    assets.map((asset) => `${asset.bucket_id}/${asset.folder}`)
  ).size;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <Stat
          label={t.images}
          count={imageCount}
          locale={locale}
          icon={<ImageIcon className="size-5" aria-hidden="true" />}
        />
        <Stat
          label={t.videos}
          count={videoCount}
          locale={locale}
          icon={<Film className="size-5" aria-hidden="true" />}
        />
        <Stat
          label={t.folders}
          count={folderCount}
          locale={locale}
          icon={<FolderOpen className="size-5" aria-hidden="true" />}
        />
      </div>

      {assets.length === 0 ? (
        <div className="rounded-xl border border-dashed border-ink-300 bg-surface px-6 py-14 text-center">
          <FolderOpen className="mx-auto size-10 text-ink-400" aria-hidden="true" />
          <h2 className="mt-4 text-lg font-semibold text-ink-800">
            {t.emptyTitle}
          </h2>
          <p className="mx-auto mt-2 max-w-xl text-sm text-ink-500">
            {t.emptyBody}
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-ink-200 bg-surface shadow-xs">
          <div className="border-b border-ink-200 px-5 py-4">
            <h2 className="text-base font-semibold text-ink-900">
              {t.title}
            </h2>
            <p className="mt-1 text-sm text-ink-500">
              {t.description}
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-4xl text-left text-sm">
              <caption className="sr-only">
                {t.caption}
              </caption>
              <thead className="bg-surface-sunken text-xs font-semibold uppercase text-ink-500">
                <tr>
                  <th scope="col" className="px-5 py-3">
                    {t.file}
                  </th>
                  <th scope="col" className="px-5 py-3">
                    {t.kind}
                  </th>
                  <th scope="col" className="px-5 py-3">
                    {t.location}
                  </th>
                  <th scope="col" className="px-5 py-3">
                    {t.size}
                  </th>
                  <th scope="col" className="px-5 py-3">
                    {t.updated}
                  </th>
                  <th scope="col" className="px-5 py-3">
                    <span className="sr-only">{t.open}</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-100">
                {assets.map((asset) => {
                  const fileName = mediaAssetFileName(asset.object_path);
                  const Icon = asset.kind === "image" ? ImageIcon : Film;

                  return (
                    <tr key={asset.object_id} className="align-top">
                      <td className="max-w-sm px-5 py-4">
                        <div className="flex gap-3">
                          <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-700">
                            <Icon className="size-4" aria-hidden="true" />
                          </span>
                          <div className="min-w-0">
                            <p className="truncate font-medium text-ink-800" title={fileName}>
                              {fileName}
                            </p>
                            <p
                              className="mt-1 break-all font-mono text-xs text-ink-500"
                              title={asset.object_path}
                            >
                              {asset.object_path}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <span className="capitalize text-ink-700">
                          {t.kinds[asset.kind] ?? asset.kind}
                        </span>
                        <span className="mt-1 block whitespace-nowrap font-mono text-xs text-ink-500">
                          {asset.mime_type}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-ink-700">
                        <span className="font-medium">{asset.bucket_id}</span>
                        <span className="mt-1 block text-xs text-ink-500">
                          {asset.folder}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-5 py-4 tabular-nums text-ink-600">
                        {formatMediaBytes(asset.byte_size)}
                      </td>
                      <td className="whitespace-nowrap px-5 py-4 text-ink-600">
                        <time dateTime={asset.updated_at}>
                          {formatAdminDate(asset.updated_at, locale)}
                        </time>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <a
                          href={asset.public_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label={t.openFile(fileName)}
                          className="inline-flex size-9 items-center justify-center rounded-lg text-brand-700 transition-ui hover:bg-brand-50 hover:text-brand-900"
                        >
                          <ExternalLink className="size-4" aria-hidden="true" />
                        </a>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
