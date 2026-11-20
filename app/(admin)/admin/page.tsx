import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  CircleAlert,
  Image as ImageIcon,
  LayoutPanelTop,
  Newspaper,
  Settings2,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import type { AdminLocale } from "@/lib/i18n/admin";
import { getAdminLocale } from "@/lib/i18n/admin-server";
import { StatsCard } from "@/components/admin/StatsCard";
import { buttonVariants } from "@/components/ui/button";

const intlLocales = { bn: "bn-BD", en: "en-GB" } as const;

const copy = {
  bn: {
    eyebrow: "অ্যাডমিনিস্ট্রেশন",
    heading: "আপনার সংগঠনকে সঠিক পথে রাখুন",
    intro:
      "এক জায়গা থেকেই সাইটের কনটেন্ট দেখে নিন এবং সবচেয়ে জরুরি কাজগুলো সেরে ফেলুন।",
    editHero: "হোমপেজের হিরো সম্পাদনা করুন",
    glance: "এক নজরে",
    glanceHint: "আপনার কনটেন্ট ডেটাবেস থেকে সরাসরি পাওয়া সংখ্যা।",
    metrics: {
      entries: "প্রকাশিত মিডিয়া এন্ট্রি",
      hero: "হিরো কনটেন্ট",
      carousel: "ক্যারোসেলের ছবি",
    },
    readiness: "সাইটের প্রস্তুতি",
    readinessHint: "হোমপেজ যে কনটেন্টে চলে, তার একটি ঝটপট পরীক্ষা।",
    checks: {
      hero: { label: "হিরো সেকশন সাজানো আছে", action: "হিরো সম্পাদনা" },
      carousel: {
        label: "হোমপেজের ক্যারোসেলে ছবি আছে",
        action: "হিরো পরিচালনা",
      },
      entries: {
        label: "মিডিয়া সেন্টারে প্রকাশিত এন্ট্রি আছে",
        action: "এন্ট্রি পরিচালনা",
      },
    },
    complete: " — সম্পন্ন",
    incomplete: " — মনোযোগ প্রয়োজন",
    contentTitle: "কনটেন্ট ব্যবস্থাপনা",
    contentBody:
      "হোমপেজ নতুন করে সাজাতে চাইলে যেকোনো সময় হিরোর শিরোনাম, বিবরণ ও ছবি আপডেট করুন।",
    openHero: "হিরো এডিটর খুলুন",
  },
  en: {
    eyebrow: "Administration",
    heading: "Keep your organisation on track",
    intro:
      "Review your site content and take care of the most important tasks from one place.",
    editHero: "Edit homepage hero",
    glance: "At a glance",
    glanceHint: "Live counts from your content database.",
    metrics: {
      entries: "Published media entries",
      hero: "Hero content",
      carousel: "Carousel images",
    },
    readiness: "Site readiness",
    readinessHint: "A quick check of the content powering your homepage.",
    checks: {
      hero: { label: "Hero section is configured", action: "Edit hero" },
      carousel: {
        label: "Homepage carousel has images",
        action: "Manage hero",
      },
      entries: {
        label: "Media Center has published entries",
        action: "Manage entries",
      },
    },
    complete: " — complete",
    incomplete: " — needs attention",
    contentTitle: "Content management",
    contentBody:
      "Update the hero heading, description, and artwork whenever you need to refresh the homepage.",
    openHero: "Open hero editor",
  },
};

type CountResult = {
  count: number | null;
  error: { message: string } | null;
};

function displayCount(result: CountResult, locale: AdminLocale) {
  return result.error
    ? "—"
    : (result.count ?? 0).toLocaleString(intlLocales[locale]);
}

export default async function AdminDashboardPage() {
  const supabase = await createClient();
  const locale = await getAdminLocale();
  const t = copy[locale];

  const [archiveEntries, heroContent, carouselImages] = await Promise.all([
    supabase
      .from("archive_entries")
      .select("id", { count: "exact", head: true })
      .eq("is_published", true),
    supabase.from("hero_content").select("id", { count: "exact", head: true }),
    supabase.from("carousel_images").select("id", { count: "exact", head: true }),
  ]);

  const metrics = [
    {
      title: t.metrics.entries,
      value: displayCount(archiveEntries, locale),
      icon: <Newspaper className="size-[18px]" />,
    },
    {
      title: t.metrics.hero,
      value: displayCount(heroContent, locale),
      icon: <LayoutPanelTop className="size-[18px]" />,
    },
    {
      title: t.metrics.carousel,
      value: displayCount(carouselImages, locale),
      icon: <ImageIcon className="size-[18px]" />,
    },
  ];

  const checks = [
    {
      ...t.checks.hero,
      complete: !heroContent.error && (heroContent.count ?? 0) > 0,
      href: "/admin/hero",
    },
    {
      ...t.checks.carousel,
      complete: !carouselImages.error && (carouselImages.count ?? 0) > 0,
      href: "/admin/hero",
    },
    {
      ...t.checks.entries,
      complete: !archiveEntries.error && (archiveEntries.count ?? 0) > 0,
      href: "/admin/archive",
    },
  ];

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <section className="flex flex-col justify-between gap-5 rounded-xl border border-ink-200 bg-surface p-6 shadow-xs sm:flex-row sm:items-center">
        <div>
          <p className="text-2xs font-semibold uppercase text-ochre-700">
            {t.eyebrow}
          </p>
          <h1 className="mt-2 text-2xl tracking-tight text-ink-900">
            {t.heading}
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-ink-500">
            {t.intro}
          </p>
        </div>

        <Link
          href="/admin/hero"
          className={buttonVariants({ className: "shrink-0" })}
        >
          {t.editHero}
          <ArrowRight aria-hidden="true" />
        </Link>
      </section>

      <section>
        <div className="mb-4">
          <h2 className="text-base font-semibold text-ink-900">{t.glance}</h2>
          <p className="mt-1 text-sm text-ink-500">
            {t.glanceHint}
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {metrics.map((metric, index) => (
            <StatsCard
              key={metric.title}
              title={metric.title}
              value={metric.value}
              icon={metric.icon}
              delay={index * 0.05}
            />
          ))}
        </div>
      </section>

      <section className="grid gap-5 lg:grid-cols-5">
        <div className="rounded-xl border border-ink-200 bg-surface p-6 shadow-xs lg:col-span-3">
          <div className="mb-5 flex items-center gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-700">
              <CheckCircle2 className="size-5" aria-hidden="true" />
            </span>
            <div>
              <h2 className="text-base font-semibold text-ink-900">
                {t.readiness}
              </h2>
              <p className="text-sm text-ink-500">
                {t.readinessHint}
              </p>
            </div>
          </div>

          <ul className="divide-y divide-ink-100">
            {checks.map((check) => (
              <li
                key={check.label}
                className="flex items-center gap-3 py-4 first:pt-0 last:pb-0"
              >
                {check.complete ? (
                  <CheckCircle2
                    className="size-5 shrink-0 text-success"
                    aria-hidden="true"
                  />
                ) : (
                  <CircleAlert
                    className="size-5 shrink-0 text-warning"
                    aria-hidden="true"
                  />
                )}

                <p className="min-w-0 flex-1 text-sm font-medium text-ink-700">
                  {check.label}
                  <span className="sr-only">
                    {check.complete ? t.complete : t.incomplete}
                  </span>
                </p>

                <Link
                  href={check.href}
                  className="shrink-0 rounded-sm text-sm font-medium text-brand-700 transition-ui hover:text-brand-800 hover:underline"
                >
                  {check.action}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-xl border border-transparent bg-brand-900 p-6 text-white lg:col-span-2">
          <Settings2 className="size-5 text-brand-300" aria-hidden="true" />

          <h2 className="mt-4 text-base font-semibold">{t.contentTitle}</h2>

          <p className="mt-2 text-sm leading-relaxed text-brand-100">
            {t.contentBody}
          </p>

          <Link
            href="/admin/hero"
            className="mt-6 inline-flex items-center gap-2 rounded-sm text-sm font-medium text-brand-300 transition-ui hover:text-white"
          >
            {t.openHero}
            <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
        </div>
      </section>
    </div>
  );
}
