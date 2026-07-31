import { Toaster } from "@/components/ui/sonner";
import { fontVariables } from "./fonts";

/**
 * Shared document shell.
 *
 * There are two root layouts — one for the public bilingual site and one for
 * the admin panel — because they need different `<html lang>` values and
 * completely different chrome. Everything they *do* share lives here so the
 * two cannot drift apart.
 */
export function Document({
  lang,
  children,
  bodyClassName,
}: {
  lang: string;
  children: React.ReactNode;
  bodyClassName?: string;
}) {
  return (
    <html lang={lang} className={fontVariables} suppressHydrationWarning>
      <body className={bodyClassName ?? "bg-background font-sans text-foreground"}>
        {children}
        <Toaster position="top-center" richColors closeButton />
      </body>
    </html>
  );
}
