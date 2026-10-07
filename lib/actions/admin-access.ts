"use server";

import { revalidatePath } from "next/cache";

import {
  normalizeAdminEmail,
  runAdminPromotion,
  validateAdminEmail,
} from "@/lib/auth/admin-access.mjs";
import { requireAdminManager } from "@/lib/actions/shared";

export type AdminAccessActionResult =
  | { ok: true; status: "promoted" | "already_admin" }
  | {
      ok: false;
      code: "unauthorized" | "required" | "invalid" | "not_found" | "failed";
    };

export type AdminCandidateActionResult =
  | {
      ok: true;
      candidate: {
        email: string;
        userId: string;
        fullName: string | null;
        avatarUrl: string | null;
        alreadyAdmin: boolean;
      };
    }
  | {
      ok: false;
      code: "unauthorized" | "required" | "invalid" | "not_found" | "failed";
    };

export async function reviewAdminCandidate(
  formData: FormData,
): Promise<AdminCandidateActionResult> {
  const auth = await requireAdminManager();
  if (!auth.ok) return { ok: false, code: "unauthorized" };

  const rawEmail = formData.get("email");
  const validation = validateAdminEmail(rawEmail);
  if (validation) return { ok: false, code: validation };

  const email = normalizeAdminEmail(rawEmail);
  const { data, error } = await auth.supabase
    .rpc("lookup_admin_candidate", { target_email: email })
    .single();

  if (error || !data) {
    console.error("[admin-access] candidate lookup failed", error?.code);
    return { ok: false, code: "failed" };
  }

  const candidateRow = data as {
    outcome?: unknown;
    user_id?: unknown;
    full_name?: unknown;
    avatar_url?: unknown;
  };
  const outcome = candidateRow.outcome;
  if (outcome === "not_found") return { ok: false, code: "not_found" };
  if (outcome === "invalid") return { ok: false, code: "invalid" };
  if (outcome !== "found" && outcome !== "already_admin") {
    return { ok: false, code: "failed" };
  }
  if (typeof candidateRow.user_id !== "string") {
    return { ok: false, code: "failed" };
  }

  return {
    ok: true,
    candidate: {
      email,
      userId: candidateRow.user_id,
      fullName:
        typeof candidateRow.full_name === "string" ? candidateRow.full_name : null,
      avatarUrl:
        typeof candidateRow.avatar_url === "string" ? candidateRow.avatar_url : null,
      alreadyAdmin: outcome === "already_admin",
    },
  };
}

export async function grantAdminAccess(
  formData: FormData,
): Promise<AdminAccessActionResult> {
  const auth = await requireAdminManager();
  const email = formData.get("email");
  const userId = formData.get("userId");

  const result = await runAdminPromotion({ email, userId }, {
    authorized: auth.ok,
    promote: async (normalizedEmail: string, reviewedUserId: string) => {
      if (!auth.ok) return "failed";

      const { data, error } = await auth.supabase.rpc("promote_admin_by_email", {
        target_user_id: reviewedUserId,
        target_email: normalizedEmail,
      });

      if (error) {
        // Keep private database details server-side. The UI receives only a
        // stable code it can explain without leaking account information.
        console.error("[admin-access] promotion failed", error.code);
        return "failed";
      }

      return data;
    },
  });

  if (result.ok && result.status === "promoted") {
    revalidatePath("/admin/access");
    revalidatePath("/admin/users");
  }

  return result as AdminAccessActionResult;
}
