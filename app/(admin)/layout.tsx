import type { Metadata } from "next";

import { Document } from "@/app/document";
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
 * segment and does not inherit the marketing header and footer. The admin UI
 * is English-only, hence the fixed lang attribute.
 */
export default function AdminRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Document lang="en" bodyClassName="bg-surface-sunken font-sans text-foreground">
      {children}
    </Document>
  );
}
