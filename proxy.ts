import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

import { defaultLocale, isLocale, locales } from "@/lib/i18n/config";

const LOCALE_COOKIE = "NEXT_LOCALE";

/**
 * Picks a locale from the visitor's explicit choice first, then their browser
 * preference, then the Bengali default.
 */
function detectLocale(request: NextRequest): string {
  const cookie = request.cookies.get(LOCALE_COOKIE)?.value;
  if (isLocale(cookie)) return cookie;

  const header = request.headers.get("accept-language");
  if (header) {
    // "en-GB,en;q=0.9,bn;q=0.8" -> ranked base languages
    const ranked = header
      .split(",")
      .map((part) => {
        const [tag, q] = part.trim().split(";q=");
        return { tag: tag.split("-")[0].toLowerCase(), q: q ? Number(q) : 1 };
      })
      .sort((a, b) => b.q - a.q);

    const match = ranked.find((entry) =>
      (locales as readonly string[]).includes(entry.tag)
    );
    if (match) return match.tag;
  }

  return defaultLocale;
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ---------------------------------------------------------------------
  // 1. Locale routing for the public site.
  //    /admin and /dashboard keep their own un-prefixed URLs.
  // ---------------------------------------------------------------------
  const isAdminPath =
    pathname.startsWith("/admin") || pathname.startsWith("/dashboard");

  if (!isAdminPath) {
    const first = pathname.split("/")[1];

    if (!isLocale(first)) {
      const locale = detectLocale(request);
      const url = request.nextUrl.clone();
      url.pathname = `/${locale}${pathname === "/" ? "" : pathname}`;

      const redirect = NextResponse.redirect(url);
      // Remember the choice so the next visit skips detection.
      redirect.cookies.set(LOCALE_COOKIE, locale, {
        path: "/",
        maxAge: 60 * 60 * 24 * 365,
        sameSite: "lax",
      });
      return redirect;
    }
  }

  // ---------------------------------------------------------------------
  // 2. Auth — unchanged behaviour, now scoped to the admin paths only so the
  //    public site no longer pays for a Supabase round trip on every request.
  // ---------------------------------------------------------------------
  let response = NextResponse.next({
    request: { headers: request.headers },
  });

  if (!isAdminPath) return response;

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Login lives under the locale prefix now.
  const loginUrl = new URL(`/${defaultLocale}/login`, request.url);

  if (pathname.startsWith("/dashboard") && !user) {
    return NextResponse.redirect(loginUrl);
  }

  if (pathname.startsWith("/admin")) {
    if (!user) return NextResponse.redirect(loginUrl);

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (!profile || profile.role !== "admin") {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }

  return response;
}

export const config = {
  matcher: [
    // Everything except Next internals, the API, and any path with a file
    // extension (favicon.ico, images, fonts, robots.txt …).
    "/((?!_next/static|_next/image|api/|.*\\..*).*)",
  ],
};
