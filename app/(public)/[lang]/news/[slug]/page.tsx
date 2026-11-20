import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  Download,
  ExternalLink,
  FileAudio,
  FileText,
  FolderDown,
  Images,
  MapPin,
  Maximize2,
  Newspaper,
  Paperclip,
  Play,
  ShieldCheck,
} from "lucide-react";

import { HomeAboutAudioPlayer } from "@/components/HomeAboutAudioPlayer";
import { ShareActions } from "@/components/ShareActions";
import { ImageLightbox } from "@/components/archive/ImageLightbox";
import { EditorialContent } from "@/components/content/EditorialContent";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import {
  getArchiveEntryBySlug,
  getRelatedArchiveEntries,
} from "@/lib/content/archive";
import { editorialPlainText } from "@/lib/editorial/plain-text";
import { isLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionary";
import {
  archiveEntryHref,
  archiveSectionPath,
  isArchiveSlug,
  resolveArchiveEntry,
  subsectionForContentType,
  type ArchiveEntry,
} from "@/lib/types/archive";
import { cn } from "@/lib/utils";

type Props = {
  params: Promise<{ lang: string; slug: string }>;
};

function descriptionFrom(...values: (string | null | undefined)[]) {
  const value = values.find((item) => item?.trim())?.trim();
  if (!value) return undefined;
  return editorialPlainText(value).slice(0, 180);
}

function canPlayAudioInline(url: string) {
  try {
    const pathname = new URL(url).pathname.toLowerCase();
    return /\.(mp3|m4a|aac|ogg|wav)$/.test(pathname);
  } catch {
    return false;
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang, slug } = await params;
  if (!isLocale(lang) || !isArchiveSlug(slug)) {
    return { title: "Not found", robots: { index: false, follow: false } };
  }

  const entry = await getArchiveEntryBySlug(slug);
  if (!entry) {
    return {
      title: lang === "bn" ? "সংবাদ পাওয়া যায়নি" : "News item not found",
      robots: { index: false, follow: false },
    };
  }

  const item = resolveArchiveEntry(lang, entry);
  const description = descriptionFrom(
    item.body,
    item.pressReleaseBody,
    item.noticeBody,
    item.postEventBody,
  );
  // Served at both /news/… and /research/…; the canonical is the entry's own
  // section, so the duplicate URL never competes with it in search.
  const pathname = archiveEntryHref(lang, item);

  return {
    title: item.heading,
    description,
    alternates: {
      canonical: pathname,
      languages: {
        bn: archiveEntryHref("bn", item),
        en: archiveEntryHref("en", item),
      },
    },
    openGraph: {
      type: "article",
      url: pathname,
      locale: lang === "bn" ? "bn_BD" : "en_US",
      title: item.heading,
      description,
      ...(item.cover
        ? { images: [{ url: item.cover, alt: item.heading }] }
        : {}),
    },
    twitter: {
      card: item.cover ? "summary_large_image" : "summary",
      title: item.heading,
      description,
      ...(item.cover ? { images: [item.cover] } : {}),
    },
  };
}

export default async function NewsDetailPage({ params }: Props) {
  const { lang, slug } = await params;
  if (!isLocale(lang) || !isArchiveSlug(slug)) notFound();

  const [entry, t] = await Promise.all([
    getArchiveEntryBySlug(slug),
    getDictionary(lang),
  ]);
  if (!entry) notFound();

  const item = resolveArchiveEntry(lang, entry);
  // The tab the entry is listed under, so the breadcrumb, the listing and
  // the admin's "what kind of post" choice all use the same words.
  const subsectionLabels = {
    news_events: t.archive.subNewsEvents,
    press_release: t.archive.subPressRelease,
    media_coverage: t.archive.subMediaCoverage,
    case_study: t.archive.subCaseStudy,
    report: t.archive.subReport,
  } as const;
  // The recording alone doesn't make a media kit: it already plays at the
  // top of the post. It is still offered for download inside a real kit.
  const hasMediaKit = Boolean(
    item.pressReleaseUrl || item.hdPhotosUrl || item.rawVideoUrl,
  );
  const audioInline = item.audioUrl && canPlayAudioInline(item.audioUrl);
  const coverCaption = item.cover
    ? item.photos.find((photo) => photo.url === item.cover)?.caption
    : undefined;

  return (
    <main data-print-document className="bg-surface">
      <article data-lightbox>
        <ImageLightbox
          locale={lang}
          labels={{
            open: t.archive.viewImage,
            close: t.archive.close,
            previous: t.archive.previousPhoto,
            next: t.archive.nextPhoto,
          }}
        />
        <div
          className="border-b border-ink-200 bg-surface-sunken py-2"
          data-print-hide
        >
          <Container>
            <Link
              href={`/${lang}/${archiveSectionPath(item.section)}`}
              className="inline-flex min-h-11 items-center gap-2 rounded-md text-sm font-semibold text-brand-700 transition-ui hover:text-brand-900"
            >
              <ArrowLeft className="size-4" aria-hidden="true" />
              {item.section === "news_archive"
                ? t.archive.backToResearch
                : t.archive.backToNews}
            </Link>
          </Container>
        </div>

        <Container className="py-8 sm:py-10 lg:py-14">
          {/* Title, cover and text share one column, so all three start and
              end on the same edges; related posts sit beside it. */}
          <div
            data-news-layout
            className="mx-auto grid max-w-5xl gap-12 lg:grid-cols-[minmax(0,44rem)_17rem] lg:justify-between lg:gap-10"
          >
            <div className="min-w-0">
              <header>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge tone="brand" size="sm">
                    {item.section === "press_media"
                      ? t.archive.pressMediaTab
                      : t.archive.newsArchiveTab}
                  </Badge>
                  <Badge tone="neutral" size="sm">
                    {subsectionLabels[subsectionForContentType(item.contentType)]}
                  </Badge>
                  {item.eventStatus && (
                    <Badge
                      tone={item.eventStatus === "upcoming" ? "warning" : "success"}
                      size="sm"
                    >
                      {item.eventStatus === "upcoming"
                        ? t.archive.statusUpcoming
                        : t.archive.statusCompleted}
                    </Badge>
                  )}
                </div>

                {/* Sized for long news headlines: at 2.85rem a typical one
                    ran to five lines. */}
                <h1 className="mt-4 font-display text-[clamp(1.625rem,1.1rem+1.6vw,2.125rem)] leading-[1.25] text-balance text-brand-950">
                  {item.heading}
                </h1>

                {/* The share bar never wraps internally; when it doesn't fit
                    beside the date and place it drops below them as one row.
                    Wrapping inside it stranded "Print" on a line of its own. */}
                <div className="mt-6 flex flex-wrap items-center justify-between gap-x-6 gap-y-1 rounded-2xl border border-ink-200 bg-surface-sunken px-4 py-1.5">
                  <div className="flex flex-wrap gap-x-5 gap-y-1 py-2 text-sm text-ink-600">
                    {item.date && (
                      <span className="inline-flex items-center gap-1.5">
                        <CalendarDays className="size-4" aria-hidden="true" />
                        <time dateTime={item.dateIso ?? undefined}>{item.date}</time>
                      </span>
                    )}
                    {item.location && (
                      <span className="inline-flex items-center gap-1.5">
                        <MapPin className="size-4" aria-hidden="true" />
                        {item.location}
                      </span>
                    )}
                  </div>

                  <ShareActions title={item.heading} locale={lang} className="-mx-2" />
                </div>
              </header>

              {item.cover && (
                <figure className="mt-8" data-print-keep>
                  <ZoomableImage
                    src={item.cover}
                    alt={item.heading}
                    caption={coverCaption}
                    label={t.archive.viewImage}
                    sizes="(min-width: 1024px) 704px, 100vw"
                    preload
                    className="aspect-16/9 rounded-2xl"
                  />
                  {coverCaption && (
                    <figcaption className="mt-2.5 text-sm leading-6 text-ink-500">
                      {coverCaption}
                    </figcaption>
                  )}
                </figure>
              )}

            <div className="mt-10 space-y-12">
              {/* Any post can carry a recording; it plays in the same player
                  as the homepage story rather than the browser's bare one. */}
              {item.audioUrl &&
                (audioInline ? (
                  <div data-print-hide>
                    <HomeAboutAudioPlayer
                      src={item.audioUrl}
                      locale={lang}
                      label={t.archive.audioRecording}
                      title={t.archive.listenToPost}
                      subtitle={item.heading}
                    />
                  </div>
                ) : (
                  <AudioRecording
                    url={item.audioUrl}
                    title={t.archive.audioRecording}
                    openLabel={t.archive.openAudio}
                  />
                ))}

              {item.body && (
                <section aria-label={t.archive.overview} data-zoom-body>
                  <EditorialContent
                    content={item.body}
                    variant="article"
                    locale={lang}
                  />
                </section>
              )}

              {item.noticeBody && (
                <ContentPanel
                  id="event-notice"
                  title={t.archive.upcomingNotice}
                  icon={<CalendarDays className="size-5" aria-hidden="true" />}
                  body={item.noticeBody}
                  locale={lang}
                  tone="brand"
                />
              )}

              {item.postEventBody && (
                <ContentPanel
                  id="post-event-summary"
                  title={t.archive.postEventSummary}
                  icon={<FileText className="size-5" aria-hidden="true" />}
                  body={item.postEventBody}
                  locale={lang}
                />
              )}

              {(item.fileUrl || item.embedUrl) && (
                <section aria-labelledby="video-heading" data-print-keep>
                  <SectionTitle
                    id="video-heading"
                    icon={<Play className="size-5" aria-hidden="true" />}
                  >
                    {t.archive.videoPreview}
                  </SectionTitle>
                  <div className="mt-5 aspect-video overflow-hidden rounded-2xl bg-ink-950">
                    {item.fileUrl ? (
                      <video
                        src={item.fileUrl}
                        controls
                        preload="metadata"
                        playsInline
                        className="size-full object-contain"
                      />
                    ) : (
                      <iframe
                        src={item.embedUrl ?? undefined}
                        title={item.heading}
                        loading="lazy"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        className="size-full border-0"
                      />
                    )}
                  </div>
                </section>
              )}

              {item.externalUrl && !item.fileUrl && !item.embedUrl && (
                <section
                  aria-labelledby="external-video-heading"
                  className="rounded-2xl border border-ink-200 bg-surface-sunken p-5 sm:p-6"
                  data-print-keep
                >
                  <SectionTitle
                    id="external-video-heading"
                    icon={<Play className="size-5" aria-hidden="true" />}
                  >
                    {t.archive.videoPreview}
                  </SectionTitle>
                  <a
                    href={item.externalUrl}
                    target="_blank"
                    rel="noopener noreferrer external"
                    className={buttonVariants({
                      variant: "outline",
                      className: "mt-4",
                    })}
                  >
                    <ExternalLink className="size-4" aria-hidden="true" />
                    {t.archive.watchVideo}
                  </a>
                </section>
              )}

              {item.photos.length > 0 && (
                <section aria-labelledby="gallery-heading">
                  <SectionTitle
                    id="gallery-heading"
                    icon={<Images className="size-5" aria-hidden="true" />}
                  >
                    {item.kind === "photo"
                      ? t.archive.photoGallery
                      : t.archive.supportingImages}
                  </SectionTitle>
                  <ul
                    className={cn(
                      "mt-5 grid gap-x-4 gap-y-6",
                      item.photos.length > 1 && "sm:grid-cols-2"
                    )}
                  >
                    {item.photos.map((photo) => (
                      <li key={photo.id} data-print-keep>
                        <figure>
                          <ZoomableImage
                            src={photo.url}
                            alt={photo.caption || item.heading}
                            caption={photo.caption}
                            label={t.archive.viewImage}
                            sizes={
                              item.photos.length > 1
                                ? "(min-width: 1024px) 344px, (min-width: 640px) 50vw, 100vw"
                                : "(min-width: 1024px) 704px, 100vw"
                            }
                            className="aspect-3/2 rounded-xl"
                          />
                          {photo.caption && (
                            <figcaption className="mt-2 text-sm leading-6 text-ink-600">
                              {photo.caption}
                            </figcaption>
                          )}
                        </figure>
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {item.attachments.length > 0 && (
                <section aria-labelledby="references-heading" data-print-keep>
                  <SectionTitle
                    id="references-heading"
                    icon={<Paperclip className="size-5" aria-hidden="true" />}
                  >
                    {t.archive.referencesTitle}
                  </SectionTitle>
                  <p className="mt-3 text-sm leading-6 text-ink-600">
                    {t.archive.referencesBody}
                  </p>
                  <ul className="mt-5 grid gap-3 sm:grid-cols-2">
                    {item.attachments.map((attachment) => (
                      <li key={attachment.id}>
                        <a
                          href={attachment.url}
                          target="_blank"
                          rel="noopener noreferrer external"
                          download={attachment.kind === "document"}
                          aria-label={`${t.archive.openReference}: ${attachment.label}`}
                          className="group flex min-h-16 items-center gap-3 rounded-xl border border-ink-200 bg-surface px-4 py-3 text-sm font-semibold text-brand-800 transition-ui hover:border-brand-400 hover:bg-brand-50"
                        >
                          <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-700 transition-ui group-hover:bg-surface">
                            {attachment.kind === "document" ? (
                              <Download className="size-4" aria-hidden="true" />
                            ) : (
                              <ExternalLink
                                className="size-4"
                                aria-hidden="true"
                              />
                            )}
                          </span>
                          <span className="min-w-0 flex-1 break-words">
                            {attachment.label}
                          </span>
                        </a>
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {item.pressReleaseBody && (
                <ContentPanel
                  id="press-release"
                  title={t.archive.officialPressRelease}
                  icon={<Newspaper className="size-5" aria-hidden="true" />}
                  body={item.pressReleaseBody}
                  locale={lang}
                />
              )}

              {hasMediaKit && item.section === "press_media" && (
                <section
                  aria-labelledby="media-kit-heading"
                  className="rounded-2xl border border-brand-200 bg-brand-50 p-6 sm:p-8"
                  data-print-keep
                >
                  <div className="flex items-start gap-3">
                    <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-brand-800 text-white">
                      <FolderDown className="size-5" aria-hidden="true" />
                    </span>
                    <div>
                      <h2
                        id="media-kit-heading"
                        className="text-2xl text-brand-900"
                      >
                        {t.archive.mediaKitTitle}
                      </h2>
                      <p className="mt-1.5 text-sm text-ink-600">
                        {t.archive.mediaKitBody}
                      </p>
                    </div>
                  </div>

                  <div className="mt-6 grid gap-3 sm:grid-cols-2">
                    {item.pressReleaseUrl && (
                      <ResourceLink
                        href={item.pressReleaseUrl}
                        icon={
                          <Download className="size-4" aria-hidden="true" />
                        }
                        label={t.archive.downloadPressRelease}
                      />
                    )}
                    {item.hdPhotosUrl && (
                      <ResourceLink
                        href={item.hdPhotosUrl}
                        icon={<Images className="size-4" aria-hidden="true" />}
                        label={t.archive.downloadHdPhotos}
                      />
                    )}
                    {item.rawVideoUrl && (
                      <ResourceLink
                        href={item.rawVideoUrl}
                        icon={<Play className="size-4" aria-hidden="true" />}
                        label={t.archive.downloadRawVideo}
                      />
                    )}
                    {item.audioUrl && (
                      <ResourceLink
                        href={item.audioUrl}
                        icon={
                          <FileAudio className="size-4" aria-hidden="true" />
                        }
                        label={t.archive.downloadAudio}
                      />
                    )}
                  </div>

                  <div className="mt-6 flex gap-3 rounded-xl border border-success-line bg-success-soft p-4">
                    <ShieldCheck
                      className="mt-0.5 size-5 shrink-0 text-success"
                      aria-hidden="true"
                    />
                    <p className="text-sm text-ink-700">
                      {t.archive.mediaUsageNotice}
                      <span
                        className="mt-1 block font-medium text-success-strong"
                        lang="en"
                      >
                        All raw video clips, press photos, and statements below
                        are royalty-free &amp; copyright-free for journalists,
                        media, and publishers to use freely.
                      </span>
                    </p>
                  </div>
                </section>
              )}

              {item.sourceUrl && (
                <section
                  aria-labelledby="source-heading"
                  className="rounded-2xl border border-ink-200 bg-surface-sunken p-5 sm:p-6"
                  data-print-keep
                >
                  <SectionTitle
                    id="source-heading"
                    icon={<Newspaper className="size-5" aria-hidden="true" />}
                  >
                    {t.archive.originalSource}
                  </SectionTitle>
                  <a
                    href={item.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer external"
                    className={buttonVariants({
                      variant: "outline",
                      className: "mt-4",
                    })}
                  >
                    <ExternalLink className="size-4" aria-hidden="true" />
                    {item.sourceName || t.archive.openOriginalSource}
                  </a>
                </section>
              )}
            </div>
            </div>

            <Suspense
              fallback={<RelatedNewsSkeleton title={t.archive.relatedNews} />}
            >
              <RelatedNewsAside
                current={entry}
                lang={lang}
                title={t.archive.relatedNews}
                viewAll={
                  item.section === "news_archive"
                    ? t.archive.viewAllResearch
                    : t.archive.viewAllNews
                }
                viewAllHref={`/${lang}/${archiveSectionPath(item.section)}`}
              />
            </Suspense>
          </div>
        </Container>
      </article>
    </main>
  );
}

/** A recording the browser can't play inline (a Drive or SoundCloud page). */
function AudioRecording({
  url,
  title,
  openLabel,
}: {
  url: string;
  title: string;
  openLabel: string;
}) {
  return (
    <section
      aria-labelledby="audio-heading"
      className="rounded-2xl border border-brand-200 bg-brand-50 p-5 sm:p-6"
      data-print-keep
    >
      <SectionTitle
        id="audio-heading"
        icon={<FileAudio className="size-5" aria-hidden="true" />}
      >
        {title}
      </SectionTitle>
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer external"
        className={buttonVariants({ variant: "outline", className: "mt-4" })}
      >
        <ExternalLink className="size-4" aria-hidden="true" />
        {openLabel}
      </a>
    </section>
  );
}

async function RelatedNewsAside({
  current,
  lang,
  title,
  viewAll,
  viewAllHref,
}: {
  current: ArchiveEntry;
  lang: "bn" | "en";
  title: string;
  viewAll: string;
  viewAllHref: string;
}) {
  const entries = await getRelatedArchiveEntries(current);
  if (entries.length === 0) return null;

  const items = entries.map((entry) => resolveArchiveEntry(lang, entry));

  return (
    <aside
      aria-labelledby="related-news-heading"
      className="min-w-0"
      data-print-hide
    >
      <div className="rounded-2xl border border-ink-200 bg-surface-sunken p-5 lg:sticky lg:top-24">
        <h2
          id="related-news-heading"
          className="text-sm font-bold tracking-[0.08em] text-brand-950 uppercase"
        >
          {title}
        </h2>

        <nav
          aria-label={title}
          className="mt-2 grid gap-x-6 sm:grid-cols-2 lg:grid-cols-1"
        >
          {items.map((related) => (
            <Link
              key={related.id}
              href={archiveEntryHref(lang, related)}
              className="group grid min-w-0 grid-cols-[4.75rem_minmax(0,1fr)] gap-3 border-b border-ink-200 py-3 transition-ui hover:text-brand-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-700"
            >
              <span className="relative aspect-4/3 overflow-hidden rounded-lg bg-brand-50">
                {related.cover ? (
                  <Image
                    src={related.cover}
                    alt=""
                    fill
                    sizes="88px"
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                ) : (
                  <span className="flex size-full items-center justify-center text-brand-600">
                    <Newspaper className="size-5" aria-hidden="true" />
                  </span>
                )}
              </span>
              <span className="min-w-0 self-center">
                {related.date && (
                  <span className="block text-xs text-ink-500">
                    {related.date}
                  </span>
                )}
                <span className="mt-1 line-clamp-3 block font-display text-sm font-semibold leading-snug text-brand-950 group-hover:text-brand-700">
                  {related.heading}
                </span>
              </span>
            </Link>
          ))}
        </nav>

        <Link
          href={viewAllHref}
          className="mt-3 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-brand-700 transition-ui hover:text-brand-900"
        >
          {viewAll}
          <ArrowRight className="size-4" aria-hidden="true" />
        </Link>
      </div>
    </aside>
  );
}

function RelatedNewsSkeleton({ title }: { title: string }) {
  return (
    <aside
      aria-hidden="true"
      className="hidden rounded-2xl border border-ink-200 bg-surface-sunken p-5 lg:block"
      data-print-hide
    >
      <h2 className="text-sm font-bold tracking-[0.08em] text-brand-950 uppercase">
        {title}
      </h2>
      <div className="mt-2 divide-y divide-ink-200">
        {[0, 1, 2].map((item) => (
          <div
            key={item}
            className="h-24 animate-pulse py-3 motion-reduce:animate-none"
          >
            <div className="h-full rounded-lg bg-ink-100" />
          </div>
        ))}
      </div>
    </aside>
  );
}

function ContentPanel({
  id,
  title,
  icon,
  body,
  locale,
  tone = "neutral",
}: {
  id: string;
  title: string;
  icon: React.ReactNode;
  body: string;
  locale: "bn" | "en";
  tone?: "brand" | "neutral";
}) {
  return (
    <section
      aria-labelledby={`${id}-heading`}
      data-zoom-body
      className={cn(
        "rounded-2xl border p-6 sm:p-7",
        tone === "brand"
          ? "border-brand-200 bg-brand-50"
          : "border-ink-200 bg-surface-sunken"
      )}
    >
      <SectionTitle id={`${id}-heading`} icon={icon}>
        {title}
      </SectionTitle>
      <EditorialContent
        content={body}
        className="mt-5"
        variant="article"
        locale={locale}
      />
    </section>
  );
}

function ResourceLink({
  href,
  icon,
  label,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-brand-800 px-4 text-center text-sm font-semibold text-white transition-ui hover:bg-brand-700"
    >
      {icon}
      {label}
    </a>
  );
}

/** Section heading with its icon in a soft tile — one style for every block. */
function SectionTitle({
  id,
  icon,
  children,
}: {
  id: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <h2
      id={id}
      className="flex items-center gap-3 font-display text-xl leading-snug text-brand-950 sm:text-2xl"
    >
      <span
        aria-hidden="true"
        className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-brand-100 text-brand-800"
      >
        {icon}
      </span>
      {children}
    </h2>
  );
}

/**
 * A photo that opens the full-screen preview (`ImageLightbox` listens for
 * `data-zoom-src`). A real button, so it works from the keyboard too.
 */
function ZoomableImage({
  src,
  alt,
  caption,
  label,
  sizes,
  preload = false,
  className,
}: {
  src: string;
  alt: string;
  caption?: string | null;
  label: string;
  sizes: string;
  preload?: boolean;
  className?: string;
}) {
  return (
    <button
      type="button"
      data-zoom-src={src}
      data-zoom-caption={caption ?? ""}
      aria-label={caption ? `${label}: ${caption}` : label}
      aria-haspopup="dialog"
      className={cn(
        "group relative block w-full cursor-zoom-in overflow-hidden bg-brand-50",
        className
      )}
    >
      <Image
        src={src}
        alt={alt}
        fill
        preload={preload}
        sizes={sizes}
        className="object-cover transition-transform duration-500 ease-out-soft group-hover:scale-[1.03]"
      />
      {/* Always shown where there is no hover to reveal it. */}
      <span
        aria-hidden="true"
        className="absolute end-3 bottom-3 flex size-10 items-center justify-center rounded-full bg-brand-950/70 text-white opacity-0 backdrop-blur-sm transition-ui group-hover:opacity-100 group-focus-visible:opacity-100 [@media(hover:none)]:opacity-100"
      >
        <Maximize2 className="size-4" />
      </span>
    </button>
  );
}
