import { redirect } from "next/navigation";

import { AdminAccessManager } from "@/components/admin/AdminAccessManager";
import { requireAdminManager } from "@/lib/actions/shared";
import { getAdminLocale } from "@/lib/i18n/admin-server";

const copy = {
  bn: {
    eyebrow: "অ্যাকাউন্টের নিরাপত্তা",
    heading: "অ্যাডমিনিস্ট্রেটর অ্যাক্সেস",
    intro:
      "বিদ্যমান কোনো এইড ফর মেন অ্যাকাউন্টকে অ্যাডমিন ড্যাশবোর্ডে প্রবেশাধিকার দিন। শুধু অ্যাক্সেস ম্যানেজাররাই নতুন অ্যাডমিনিস্ট্রেটর যোগ করতে পারেন।",
  },
  en: {
    eyebrow: "Account security",
    heading: "Administrator access",
    intro:
      "Grant an existing Aid For Men account access to the administration dashboard. Only access managers can add more administrators.",
  },
};

export default async function AdminAccessPage() {
  const auth = await requireAdminManager();
  if (!auth.ok) redirect("/admin");

  const [userResult, administratorsResult, locale] = await Promise.all([
    auth.supabase.auth.getUser(),
    auth.supabase.rpc("list_admin_accounts"),
    getAdminLocale(),
  ]);
  const t = copy[locale];

  if (administratorsResult.error) {
    console.error(
      "[admin-access] administrators could not be loaded",
      administratorsResult.error.code,
    );
  }

  const currentUser = userResult.data.user;

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.14em] text-brand-700">
          {t.eyebrow}
        </p>
        <h1 className="mt-1 text-2xl tracking-tight text-ink-900">
          {t.heading}
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-ink-600">
          {t.intro}
        </p>
      </div>

      <AdminAccessManager
        currentUserId={auth.userId}
        currentUserEmail={currentUser?.email ?? null}
        administrators={administratorsResult.data ?? []}
      />
    </div>
  );
}
