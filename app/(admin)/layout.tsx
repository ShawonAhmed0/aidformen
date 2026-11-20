import type { Metadata } from "next";

import { Document } from "@/app/document";
import { getAdminLocale } from "@/lib/i18n/admin-server";
import "@/app/globals.css";

export const metadata: Metadata = {
  title: "Admin | Aid For Men Foundation",
  // The dashboard must never be indexed.
  robots: { index: false, follow: false },
};

/**
 * Root layout for the admin panel.
 *
 * Separate from the public one so /admin is not nested under the [lang]
 * segment and does not inherit the marketing header and footer. The admin has
 * its own interface language (a cookie, switched from the header), and the
 * lang attribute follows it so Bengali text gets Bengali shaping and fonts.
 */
export default async function AdminRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Document lang={await getAdminLocale()} bodyClassName="bg-surface-sunken font-sans text-foreground">
      {children}
    </Document>
  );
}
