import { redirect } from "next/navigation";

import { AdminAccessManager } from "@/components/admin/AdminAccessManager";
import { requireAdminManager } from "@/lib/actions/shared";

export default async function AdminAccessPage() {
  const auth = await requireAdminManager();
  if (!auth.ok) redirect("/admin");

  const [userResult, administratorsResult] = await Promise.all([
    auth.supabase.auth.getUser(),
    auth.supabase.rpc("list_admin_accounts"),
  ]);

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
          Account security
        </p>
        <h1 className="mt-1 text-2xl tracking-tight text-ink-900">
          Administrator access
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-ink-600">
          Grant an existing Aid For Men account access to the administration
          dashboard. Only access managers can add more administrators.
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
