import { type NextRequest, NextResponse } from "next/server";

import { RECOVERY_SESSION_COOKIE } from "@/lib/auth/recovery.mjs";
import { isLocale } from "@/lib/i18n/config";

const NO_STORE_HEADERS = {
  "Cache-Control": "private, no-cache, no-store, must-revalidate, max-age=0",
  Expires: "0",
  Pragma: "no-cache",
} as const;

function isSameOrigin(request: NextRequest): boolean {
  const originHeader = request.headers.get("origin");
  if (!originHeader) return false;

  try {
    const origin = new URL(originHeader);
    const forwardedHost = request.headers
      .get("x-forwarded-host")
      ?.split(",")[0]
      .trim();
    const forwardedProtocol = request.headers
      .get("x-forwarded-proto")
      ?.split(",")[0]
      .trim();
    const requestHost = forwardedHost || request.headers.get("host");
    const requestProtocol =
      forwardedProtocol || request.nextUrl.protocol.replace(":", "");

    return (
      Boolean(requestHost) &&
      origin.host === requestHost &&
      origin.protocol === `${requestProtocol}:`
    );
  } catch {
    return false;
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ lang: string }> },
) {
  const { lang } = await params;

  if (!isLocale(lang)) {
    return NextResponse.json(
      { ok: false },
      { status: 404, headers: NO_STORE_HEADERS },
    );
  }

  if (!isSameOrigin(request)) {
    return NextResponse.json(
      { ok: false },
      { status: 403, headers: NO_STORE_HEADERS },
    );
  }

  const response = NextResponse.json(
    { ok: true },
    { headers: NO_STORE_HEADERS },
  );
  response.cookies.set(RECOVERY_SESSION_COOKIE, "", {
    expires: new Date(0),
    httpOnly: true,
    maxAge: 0,
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });

  return response;
}
