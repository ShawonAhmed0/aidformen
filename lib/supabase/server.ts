import { cache } from "react";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Request-scoped Supabase client.
 *
 * Wrapped in React `cache()` so one render reuses a single client. Without it
 * every caller built its own, and each new client re-ran the auth token
 * refresh — roughly ten network round trips for one homepage render.
 */
export const createClient = cache(async () => {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // Server Components cannot set cookies — Next throws here by
            // design. Ignoring it is safe because proxy.ts refreshes and
            // persists the session on every request that needs one; this
            // client only ever needs to *read* it.
            //
            // Letting it throw is what produced the wall of
            // "Cookies can only be modified in a Server Action or Route
            // Handler" errors, and the unhandled rejection behind them.
          }
        },
      },
    }
  );
});
