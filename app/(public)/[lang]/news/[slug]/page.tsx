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
  Newspaper,
  Play,
  ShieldCheck,
} from "lucide-react";

import { ShareActions } from "@/components/ShareActions";
import {
  EditorialContent,
  editorialPlainText,
} from "@/components/content/EditorialContent";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import {
  getArchiveEntryBySlug,
  getRelatedArchiveEntries,
} from "@/lib/content/archive";
import { isLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionary";
import {
  isArchiveSlug,
  resolveArchiveEntry,
  type ArchiveEntry,
} from "@/lib/types/archive";

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
  const pathname = `/${lang}/news/${slug}`;

  return {
    title: item.heading,
    description,
    alternates: {
      canonical: pathname,
      languages: {
        bn: `/bn/news/${slug}`,
        en: `/en/news/${slug}`,
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
  const typeLabels = {
    event: t.archive.typeEvent,
    press_release: t.archive.typePressRelease,
    media_coverage: t.archive.typeMediaCoverage,
    mens_rights_news: t.archive.typeMensRightsNews,
    case_study: t.archive.typeCaseStudy,
    report: t.archive.typeReport,
  } as const;
  const hasMediaKit = Boolean(
    item.pressReleaseUrl ||
    item.hdPhotosUrl ||
    item.rawVideoUrl ||
    item.audioUrl,
  );
  const audioInline = item.audioUrl && canPlayAudioInline(item.audioUrl);
  const coverCaption = item.cover
    ? item.photos.find((photo) => photo.url === item.cover)?.caption
    : undefined;

  return (
    <main data-print-document className="bg-surface">
      <article>
        <div
          className="border-b border-ink-200 bg-surface-sunken py-2"
          data-print-hide
        >
          <Container>
            <Link
              href={`/${lang}/news`}
              className="inline-flex min-h-11 items-center gap-2 rounded-md text-sm font-semibold text-brand-700 transition-ui hover:text-brand-900"
            >
              <ArrowLeft className="size-4" aria-hidden="true" />
              {t.archive.backToNews}
            </Link>
          </Container>
        </div>

        <Container className="py-8 sm:py-10 lg:py-12">
          <header className="mx-auto max-w-5xl">
            <div className="max-w-3xl lg:pl-12">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-2 text-xs font-semibold tracking-[0.08em] text-ink-600 uppercase">
                <span className="text-brand-700">
                  {item.section === "press_media"
                    ? t.archive.pressMediaTab
                    : t.archive.newsArchiveTab}
                </span>
                <span aria-hidden="true" className="text-ink-300">
                  /
                </span>
                <span>{typeLabels[item.contentType]}</span>
                {item.eventStatus && (
                  <Badge
                    tone={
                      item.eventStatus === "upcoming" ? "warning" : "success"
                    }
                    size="sm"
                    className="ms-1 normal-case tracking-normal"
                  >
                    {item.eventStatus === "upcoming"
                      ? t.archive.statusUpcoming
                      : t.archive.statusCompleted}
                  </Badge>
                )}
              </div>

              <h1 className="mt-4 font-display text-[clamp(2rem,5.5vw,2.85rem)] leading-[1.16] text-balance text-brand-950">
                {item.heading}
              </h1>

              <div className="mt-6 border-y border-ink-300 py-3 sm:flex sm:min-h-16 sm:items-center sm:justify-between sm:gap-6">
                <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-ink-600">
                  {item.date && (
                    <span className="inline-flex items-center gap-1.5">
                      <CalendarDays className="size-4" aria-hidden="true" />
                      <time dateTime={item.dateIso ?? undefined}>
                        {item.date}
                      </time>
                    </span>
                  )}
                  {item.location && (
                    <span className="inline-flex items-center gap-1.5">
                      <MapPin className="size-4" aria-hidden="true" />
                      {item.location}
                    </span>
                  )}
                </div>

                <ShareActions
                  title={item.heading}
                  locale={lang}
                  className="-mx-2 mt-2 sm:mx-0 sm:mt-0 sm:justify-end"
                />
              </div>
            </div>
          </header>

          {item.cover && (
            <figure className="mx-auto mt-8 max-w-5xl sm:mt-10" data-print-keep>
              <div className="relative aspect-16/9 overflow-hidden rounded-sm bg-brand-50">
                <Image
                  src={item.cover}
                  alt={item.heading}
                  fill
                  priority
                  sizes="(min-width: 1024px) 1024px, 100vw"
                  className="object-cover"
                />
              </div>
              {coverCaption && (
                <figcaption className="mt-2 max-w-3xl text-sm leading-6 text-ink-500 lg:pl-12">
                  {coverCaption}
                </figcaption>
              )}
            </figure>
          )}

          <div
            data-news-layout
            className="mx-auto mt-8 grid max-w-5xl gap-10 sm:mt-10 lg:grid-cols-[minmax(0,42rem)_16.5rem] lg:items-start lg:gap-10 lg:pl-12"
          >
            <div className="min-w-0 space-y-8">
              {item.audioUrl && (
                <AudioRecording
                  url={item.audioUrl}
                  inline={Boolean(audioInline)}
                  title={t.archive.audioRecording}
                  openLabel={t.archive.openAudio}
                />
              )}

              {item.body && (
                <section aria-label={t.archive.overview}>
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
                  <h2
                    id="video-heading"
                    className="border-t-4 border-brand-800 pt-3 text-2xl text-brand-950"
                  >
                    {t.archive.videoPreview}
                  </h2>
                  <div className="mt-4 aspect-video overflow-hidden rounded-sm bg-ink-950">
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
                  className="border-y border-ink-300 py-5"
                  data-print-keep
                >
                  <h2
                    id="external-video-heading"
                    className="text-xl text-brand-900"
                  >
                    {t.archive.videoPreview}
                  </h2>
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
                  <h2
                    id="gallery-heading"
                    className="border-t-4 border-brand-800 pt-3 text-2xl text-brand-950"
                  >
                    {t.archive.photoGallery}
                  </h2>
                  <ul className="mt-5 grid gap-4 sm:grid-cols-2">
                    {item.photos.map((photo) => (
                      <li key={photo.id} data-print-keep>
                        <figure className="overflow-hidden border-b border-ink-300 bg-surface">
                          <div className="relative aspect-3/2 bg-brand-50">
                            <Image
                              src={photo.url}
                              alt={photo.caption || item.heading}
                              fill
                              sizes="(min-width: 640px) 50vw, 100vw"
                              className="object-cover"
                            />
                          </div>
                          {photo.caption && (
                            <figcaption className="px-4 py-3 text-sm text-ink-600">
                              {photo.caption}
                            </figcaption>
                          )}
                        </figure>
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
                  className="rounded-sm border border-brand-200 bg-brand-50 p-6 sm:p-8"
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
                  className="border-y border-ink-300 py-5"
                  data-print-keep
                >
                  <h2 id="source-heading" className="text-xl text-brand-900">
                    {t.archive.originalSource}
                  </h2>
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

            <Suspense
              fallback={<RelatedNewsSkeleton title={t.archive.relatedNews} />}
            >
              <RelatedNewsAside
                current={entry}
                lang={lang}
                title={t.archive.relatedNews}
                viewAll={t.archive.viewAllNews}
              />
            </Suspense>
          </div>
        </Container>
      </article>
    </main>
  );
}

function AudioRecording({
  url,
  inline,
  title,
  openLabel,
}: {
  url: string;
  inline: boolean;
  title: string;
  openLabel: string;
}) {
  return (
    <section
      aria-labelledby="audio-heading"
      className="border-y border-brand-200 bg-brand-50/70 px-4 py-4"
      data-print-keep
    >
      <h2
        id="audio-heading"
        className="flex items-center gap-2 text-lg text-brand-950"
      >
        <FileAudio className="size-5" aria-hidden="true" />
        {title}
      </h2>
      {inline ? (
        <audio controls preload="metadata" className="mt-3 w-full" src={url}>
          <a href={url}>{openLabel}</a>
        </audio>
      ) : (
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer external"
          className={buttonVariants({ variant: "outline", className: "mt-4" })}
        >
          <ExternalLink className="size-4" aria-hidden="true" />
          {openLabel}
        </a>
      )}
    </section>
  );
}

async function RelatedNewsAside({
  current,
  lang,
  title,
  viewAll,
}: {
  current: ArchiveEntry;
  lang: "bn" | "en";
  title: string;
  viewAll: string;
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
      <div className="lg:sticky lg:top-24">
        <div className="border-t-4 border-brand-800 pt-3">
          <h2
            id="related-news-heading"
            className="text-sm font-bold tracking-[0.08em] text-brand-950 uppercase"
          >
            {title}
          </h2>
        </div>

        <nav
          aria-label={title}
          className="mt-2 grid gap-x-6 sm:grid-cols-2 lg:grid-cols-1"
        >
          {items.map((related) => (
            <Link
              key={related.id}
              href={`/${lang}/news/${related.slug}`}
              className="group grid min-w-0 grid-cols-[4.75rem_minmax(0,1fr)] gap-3 border-b border-ink-300 py-3 transition-ui hover:text-brand-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-700"
            >
              <span className="relative aspect-4/3 overflow-hidden bg-brand-50">
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
          href={`/${lang}/news`}
          className="mt-5 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-brand-700 transition-ui hover:text-brand-900"
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
    <aside aria-hidden="true" className="hidden lg:block" data-print-hide>
      <h2 className="border-t-4 border-brand-800 pt-3 text-sm font-bold tracking-[0.08em] text-brand-950 uppercase">
        {title}
      </h2>
      <div className="mt-2 divide-y divide-ink-300">
        {[0, 1, 2].map((item) => (
          <div
            key={item}
            className="h-24 animate-pulse py-3 motion-reduce:animate-none"
          >
            <div className="h-full bg-ink-100" />
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
      className={
        tone === "brand"
          ? "border-s-4 border-brand-700 bg-brand-50 px-5 py-6 sm:px-7"
          : "border-y border-ink-300 py-6"
      }
    >
      <h2
        id={`${id}-heading`}
        className="flex items-center gap-2 text-2xl text-brand-900"
      >
        {icon}
        {title}
      </h2>
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
