import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  CircleAlert,
  Image as ImageIcon,
  LayoutPanelTop,
  Settings2,
  Users,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { StatsCard } from "@/components/admin/StatsCard";
import { buttonVariants } from "@/components/ui/button";

type CountResult = {
  count: number | null;
  error: { message: string } | null;
};

function displayCount(result: CountResult) {
  return result.error ? "—" : (result.count ?? 0).toLocaleString();
}

export default async function AdminDashboardPage() {
  const supabase = await createClient();

  const [members, heroContent, carouselImages] = await Promise.all([
    supabase.from("profiles").select("id", { count: "exact", head: true }),
    supabase.from("hero_content").select("id", { count: "exact", head: true }),
    supabase.from("carousel_images").select("id", { count: "exact", head: true }),
  ]);

  const metrics = [
    {
      title: "Registered members",
      value: displayCount(members),
      icon: <Users className="size-[18px]" />,
    },
    {
      title: "Hero content",
      value: displayCount(heroContent),
      icon: <LayoutPanelTop className="size-[18px]" />,
    },
    {
      title: "Carousel images",
      value: displayCount(carouselImages),
      icon: <ImageIcon className="size-[18px]" />,
    },
  ];

  const checks = [
    {
      label: "Hero section is configured",
      complete: !heroContent.error && (heroContent.count ?? 0) > 0,
      href: "/admin/hero",
      action: "Edit hero",
    },
    {
      label: "Homepage carousel has images",
      complete: !carouselImages.error && (carouselImages.count ?? 0) > 0,
      href: "/admin/hero",
      action: "Manage hero",
    },
    {
      label: "Member records are available",
      complete: !members.error,
      href: "/admin/users",
      action: "View members",
    },
  ];

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <section className="flex flex-col justify-between gap-5 rounded-xl border border-ink-200 bg-surface p-6 shadow-xs sm:flex-row sm:items-center">
        <div>
          <p className="text-2xs font-semibold uppercase text-ochre-700">
            Administration
          </p>
          <h1 className="mt-2 text-2xl tracking-tight text-ink-900">
            Keep your organisation on track
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-ink-500">
            Review your site content and take care of the most important tasks
            from one place.
          </p>
        </div>

        <Link
          href="/admin/hero"
          className={buttonVariants({ className: "shrink-0" })}
        >
          Edit homepage hero
          <ArrowRight aria-hidden="true" />
        </Link>
      </section>

      <section>
        <div className="mb-4">
          <h2 className="text-base font-semibold text-ink-900">At a glance</h2>
          <p className="mt-1 text-sm text-ink-500">
            Live counts from your content database.
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
                Site readiness
              </h2>
              <p className="text-sm text-ink-500">
                A quick check of the content powering your homepage.
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
                    {check.complete ? " — complete" : " — needs attention"}
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

          <h2 className="mt-4 text-base font-semibold">Content management</h2>

          <p className="mt-2 text-sm leading-relaxed text-brand-100">
            Update the hero heading, description, and artwork whenever you need
            to refresh the homepage.
          </p>

          <Link
            href="/admin/hero"
            className="mt-6 inline-flex items-center gap-2 rounded-sm text-sm font-medium text-brand-300 transition-ui hover:text-white"
          >
            Open hero editor
            <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
        </div>
      </section>
    </div>
  );
}
