import "server-only";

import { cookies } from "next/headers";

import {
  ADMIN_LOCALE_COOKIE,
  defaultAdminLocale,
  isAdminLocale,
  type AdminLocale,
} from "./admin";

/** The admin interface language for this request, for Server Components. */
export async function getAdminLocale(): Promise<AdminLocale> {
  const value = (await cookies()).get(ADMIN_LOCALE_COOKIE)?.value;
  return isAdminLocale(value) ? value : defaultAdminLocale;
}
