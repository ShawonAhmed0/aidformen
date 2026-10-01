import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

import {
  invalidResetPasswordPath,
  isSuccessfulRecoveryExchange,
  RECOVERY_SESSION_COOKIE,
  RECOVERY_SESSION_MAX_AGE_SECONDS,
  resetPasswordPath,
} from "@/lib/auth/recovery.mjs";
import { isLocale } from "@/lib/i18n/config";

const NO_STORE_HEADERS = {
  "Cache-Control": "private, no-cache, no-store, must-revalidate, max-age=0",
  Expires: "0",
  Pragma: "no-cache",
} as const;

function noStore(response: NextResponse): NextResponse {
  for (const [name, value] of Object.entries(NO_STORE_HEADERS)) {
    response.headers.set(name, value);
  }
  return response;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ lang: string }> },
) {
  const { lang } = await params;

  if (!isLocale(lang)) {
    return new NextResponse("Not found", {
      status: 404,
      headers: NO_STORE_HEADERS,
    });
  }

  const invalidUrl = new URL(invalidResetPasswordPath(lang), request.url);
  const code = request.nextUrl.searchParams.get("code")?.trim();

  if (!code) return noStore(NextResponse.redirect(invalidUrl));

  // Buffer cookie writes until the exchange has been proven to be a password
  // recovery. A valid OAuth/signup code must not establish a session through
  // this recovery-only endpoint.
  const pendingCookieWriters: Array<(response: NextResponse) => void> = [];

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll(cookiesToSet, headersToSet) {
          pendingCookieWriters.push((response) => {
            cookiesToSet.forEach(({ name, value, options }) => {
              response.cookies.set(name, value, options);
            });
            Object.entries(headersToSet).forEach(([name, value]) => {
              response.headers.set(name, value);
            });
          });
        },
      },
    },
  );

  try {
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    // auth-js returns this PKCE flow marker at runtime, while supabase-js's
    // public response type currently omits it.
    const redirectType = (
      data as typeof data & { redirectType?: string | null }
    ).redirectType;

    if (
      !isSuccessfulRecoveryExchange({ ...data, redirectType }, error) ||
      !data.user
    ) {
      return noStore(NextResponse.redirect(invalidUrl));
    }

    const response = noStore(
      NextResponse.redirect(new URL(resetPasswordPath(lang), request.url)),
    );
    pendingCookieWriters.forEach((writeCookies) => writeCookies(response));
    response.cookies.set(RECOVERY_SESSION_COOKIE, data.user.id, {
      httpOnly: true,
      maxAge: RECOVERY_SESSION_MAX_AGE_SECONDS,
      path: "/",
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    });

    return noStore(response);
  } catch {
    return noStore(NextResponse.redirect(invalidUrl));
  }
}
