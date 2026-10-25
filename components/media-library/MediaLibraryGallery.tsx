"use client";

import Image from "next/image";
import { Download, Film, ImageIcon } from "lucide-react";
import {
  type KeyboardEvent,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";

import { getMediaLibraryLabels } from "@/components/media-library/labels";
import { formatCount, type Locale } from "@/lib/i18n/config";
import {
  isBrowserDisplayableImage,
  isBrowserPlayableVideo,
  mediaAssetFileName,
  type MediaAsset,
  type MediaAssetKind,
} from "@/lib/types/media-library";
import { cn } from "@/lib/utils";

const tabs = ["image", "video"] as const;

function EmptyCollection({
  kind,
  message,
}: {
  kind: MediaAssetKind;
  message: string;
}) {
  const Icon = kind === "image" ? ImageIcon : Film;

  return (
    <div className="rounded-2xl border border-dashed border-ink-300 bg-surface px-6 py-16 text-center">
      <span className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-brand-50 text-brand-700">
        <Icon className="size-7" aria-hidden="true" />
      </span>
      <p className="mx-auto mt-5 max-w-md text-base text-ink-600">{message}</p>
    </div>
  );
}

function ImageCollection({
  assets,
  locale,
}: {
  assets: MediaAsset[];
  locale: Locale;
}) {
  const labels = getMediaLibraryLabels(locale);

  return (
    <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {assets.map((asset) => {
        const fileName = mediaAssetFileName(asset.object_path);
        const previewable = isBrowserDisplayableImage(asset.mime_type);

        return (
          <li key={asset.object_id}>
            <figure className="group overflow-hidden rounded-2xl border border-ink-200 bg-surface shadow-xs">
              <a
                href={asset.public_url}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`${labels.openOriginal}: ${fileName}`}
                className="relative block aspect-4/3 overflow-hidden bg-surface-sunken"
              >
                {previewable ? (
                  <Image
                    src={asset.public_url}
                    alt={`${labels.imageAltPrefix}: ${fileName}`}
                    fill
                    unoptimized
                    sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                    className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                  />
                ) : (
                  <span className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-5 text-center text-ink-600">
                    <ImageIcon className="size-9 text-brand-600" aria-hidden="true" />
                    <span className="text-sm leading-6">
                      {labels.imagePreviewUnavailable}
                    </span>
                  </span>
                )}
              </a>

              <figcaption className="flex items-center gap-3 px-4 py-3">
                <span className="min-w-0 flex-1 truncate text-sm font-medium text-ink-700">
                  {fileName}
                </span>
                <a
                  href={asset.public_url}
                  download={fileName}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`${labels.download}: ${fileName}`}
                  className="flex size-10 shrink-0 items-center justify-center rounded-lg text-brand-700 transition-ui hover:bg-brand-50 hover:text-brand-900"
                >
                  <Download className="size-4" aria-hidden="true" />
                </a>
              </figcaption>
            </figure>
          </li>
        );
      })}
    </ul>
  );
}

function VideoCollection({
  assets,
  locale,
}: {
  assets: MediaAsset[];
  locale: Locale;
}) {
  const labels = getMediaLibraryLabels(locale);

  return (
    <ul className="grid gap-5 md:grid-cols-2">
      {assets.map((asset) => {
        const fileName = mediaAssetFileName(asset.object_path);
        const playable = isBrowserPlayableVideo(asset.mime_type);

        return (
          <li key={asset.object_id}>
            <article className="overflow-hidden rounded-2xl border border-ink-200 bg-surface shadow-xs">
              {playable ? (
                <video
                  controls
                  playsInline
                  preload="none"
                  aria-label={`${labels.videoLabelPrefix}: ${fileName}`}
                  className="aspect-video w-full bg-ink-950 object-contain"
                >
                  <source src={asset.public_url} type={asset.mime_type} />
                  {labels.videoFallback}
                </video>
              ) : (
                <div className="flex aspect-video flex-col items-center justify-center bg-ink-950 px-6 text-center text-white">
                  <Film className="size-10 text-brand-300" aria-hidden="true" />
                  <p className="mt-4 max-w-sm text-sm text-ink-200">
                    {labels.playbackUnavailable}
                  </p>
                </div>
              )}

              <div className="flex items-center gap-3 px-5 py-4">
                <div className="min-w-0 flex-1">
                  <h3 className="truncate text-sm font-semibold text-ink-800">
                    {fileName}
                  </h3>
                  <p className="mt-0.5 truncate text-xs text-ink-500">
                    {asset.mime_type}
                  </p>
                </div>
                <a
                  href={asset.public_url}
                  download={fileName}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-10 shrink-0 items-center gap-2 rounded-lg border border-ink-300 px-3 text-sm font-medium text-ink-700 transition-ui hover:border-brand-400 hover:bg-brand-50 hover:text-brand-800"
                  aria-label={`${labels.download}: ${fileName}`}
                >
                  <Download className="size-4" aria-hidden="true" />
                  <span className="hidden sm:inline">{labels.download}</span>
                </a>
              </div>
            </article>
          </li>
        );
      })}
    </ul>
  );
}

export function MediaLibraryGallery({
  assets,
  locale,
}: {
  assets: MediaAsset[];
  locale: Locale;
}) {
  const labels = getMediaLibraryLabels(locale);
  const collections = useMemo(
    () => ({
      image: assets.filter((asset) => asset.kind === "image"),
      video: assets.filter((asset) => asset.kind === "video"),
    }),
    [assets]
  );
  const [activeKind, setActiveKind] = useState<MediaAssetKind>(() =>
    collections.image.length > 0 || collections.video.length === 0
      ? "image"
      : "video"
  );
  const id = useId();
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);

  function selectTabFromKeyboard(
    event: KeyboardEvent<HTMLButtonElement>,
    currentIndex: number
  ) {
    let targetIndex: number | null = null;

    if (event.key === "ArrowRight") targetIndex = (currentIndex + 1) % tabs.length;
    if (event.key === "ArrowLeft") {
      targetIndex = (currentIndex - 1 + tabs.length) % tabs.length;
    }
    if (event.key === "Home") targetIndex = 0;
    if (event.key === "End") targetIndex = tabs.length - 1;

    if (targetIndex === null) return;
    event.preventDefault();
    setActiveKind(tabs[targetIndex]);
    tabRefs.current[targetIndex]?.focus();
  }

  return (
    <div>
      <div
        role="tablist"
        aria-label={labels.title}
        className="mx-auto mb-8 grid max-w-xl grid-cols-2 gap-2 rounded-2xl bg-surface-sunken p-2"
      >
        {tabs.map((kind, index) => {
          const selected = activeKind === kind;
          const Icon = kind === "image" ? ImageIcon : Film;
          const label = kind === "image" ? labels.imageTab : labels.videoTab;
          const count = formatCount(locale, collections[kind].length);

          return (
            <button
              key={kind}
              ref={(node) => {
                tabRefs.current[index] = node;
              }}
              id={`${id}-${kind}-tab`}
              type="button"
              role="tab"
              aria-label={`${label}, ${labels.itemCount(count)}`}
              aria-selected={selected}
              aria-controls={`${id}-${kind}-panel`}
              tabIndex={selected ? 0 : -1}
              onClick={() => setActiveKind(kind)}
              onKeyDown={(event) => selectTabFromKeyboard(event, index)}
              className={cn(
                "flex min-h-14 items-center justify-center gap-2 rounded-xl border px-4 text-sm font-semibold transition-ui",
                selected
                  ? "border-brand-700 bg-surface text-brand-900 shadow-sm"
                  : "border-transparent text-ink-600 hover:border-ink-200 hover:bg-surface"
              )}
            >
              <Icon className="size-5" aria-hidden="true" />
              <span>{label}</span>
              <span
                className={cn(
                  "rounded-full px-2 py-0.5 text-xs",
                  selected
                    ? "bg-brand-100 text-brand-800"
                    : "bg-ink-100 text-ink-600"
                )}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {tabs.map((kind) => {
        const selected = activeKind === kind;
        const collection = collections[kind];
        const heading =
          kind === "image" ? labels.imageCollection : labels.videoCollection;

        return (
          <section
            key={kind}
            id={`${id}-${kind}-panel`}
            role="tabpanel"
            aria-labelledby={`${id}-${kind}-tab`}
            tabIndex={0}
            hidden={!selected}
          >
            <h2 className="sr-only">{heading}</h2>
            {selected && collection.length === 0 ? (
              <EmptyCollection
                kind={kind}
                message={kind === "image" ? labels.emptyImages : labels.emptyVideos}
              />
            ) : selected && kind === "image" ? (
              <ImageCollection assets={collection} locale={locale} />
            ) : selected ? (
              <VideoCollection assets={collection} locale={locale} />
            ) : null}
          </section>
        );
      })}
    </div>
  );
}
