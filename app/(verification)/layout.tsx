import type { Metadata } from "next";
import Image from "next/image";

import { fontVariables } from "@/app/fonts";
import { Container } from "@/components/ui/container";
import "@/app/globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://aidformen.com"),
  title: "Certificate Verification | Aid For Men Foundation",
  description:
    "Check an Aid For Men Foundation certificate record by its reference ID.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function VerificationLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={fontVariables}>
      <body className="min-h-dvh bg-white font-sans text-[#153E54] antialiased">
        <div className="flex min-h-dvh flex-col">
          <a
            href="#main"
            className="sr-only rounded-md bg-[#216587] px-4 py-2 text-sm font-semibold text-white focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus-visible:outline-[#153E54]"
          >
            Skip to certificate record
          </a>

          <header className="border-b border-[#8CC6D8]/60 bg-white">
            <Container width="wide">
              <div className="flex min-h-24 items-center justify-between gap-5 py-4 sm:min-h-28">
                <a
                  href="https://aidformen.com"
                  className="flex min-w-0 items-center gap-4 rounded-md focus-visible:outline-[#216587]"
                  aria-label="Aid For Men Foundation home"
                >
                  <Image
                    src="/logo (1).png"
                    alt="Aid For Men Foundation logo"
                    width={72}
                    height={72}
                    priority
                    className="size-16 shrink-0 object-contain sm:size-18"
                  />
                  <span className="min-w-0">
                    <span className="block font-display text-lg font-semibold tracking-tight text-[#153E54] sm:text-2xl">
                      Aid For Men Foundation
                    </span>
                    <span className="mt-0.5 block text-xs font-semibold tracking-[0.16em] text-[#216587] uppercase sm:text-sm">
                      Certificate registry
                    </span>
                  </span>
                </a>

                <span className="hidden border-l border-[#8CC6D8] pl-5 text-right text-sm font-medium text-[#216587] md:block">
                  Official record verification
                </span>
              </div>
            </Container>
          </header>

          <main id="main" className="flex-1">
            {children}
          </main>

          <footer className="bg-[#153E54] text-white">
            <Container width="wide">
              <div className="flex flex-col gap-4 py-8 text-sm sm:flex-row sm:items-center sm:justify-between">
                <p className="font-medium">
                  Aid For Men Foundation · Official certificate verification
                </p>
                <div className="flex flex-wrap gap-x-6 gap-y-3 text-[#8CC6D8]">
                  <a
                    href="https://aidformen.com"
                    className="rounded-sm font-semibold underline-offset-4 hover:text-white hover:underline focus-visible:outline-[#8CC6D8]"
                  >
                    aidformen.com
                  </a>
                  <a
                    href="mailto:info@aidformen.com"
                    className="rounded-sm font-semibold underline-offset-4 hover:text-white hover:underline focus-visible:outline-[#8CC6D8]"
                  >
                    info@aidformen.com
                  </a>
                </div>
              </div>
            </Container>
          </footer>
        </div>
      </body>
    </html>
  );
}
