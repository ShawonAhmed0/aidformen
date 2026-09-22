import { Container } from "@/components/ui/container";

export default function CertificateNotFound() {
  return (
    <section className="bg-[#8CC6D8]/10 py-16 sm:py-24 lg:py-28">
      <Container width="prose">
        <div className="rounded-2xl border border-[#8CC6D8] bg-white p-7 text-center shadow-lg shadow-[#153E54]/8 sm:p-12">
          <p className="text-xs font-bold tracking-[0.2em] text-[#216587] uppercase">
            Verification result · 404
          </p>
          <h1 className="mt-4 font-display text-4xl font-semibold tracking-tight text-[#153E54] sm:text-5xl">
            Certificate record not found
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-[#153E54] sm:text-lg">
            The reference is malformed or does not match a certificate record
            held by Aid For Men Foundation. Check the reference exactly as it
            appears on the document.
          </p>
          <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed font-medium text-[#216587]">
            A record must be found and its document status reviewed before any
            certificate can be relied upon.
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <a
              href="https://aidformen.com"
              className="inline-flex min-h-12 items-center justify-center rounded-lg bg-[#216587] px-6 py-3 font-semibold text-white transition-colors hover:bg-[#153E54] focus-visible:outline-[#153E54]"
            >
              Visit aidformen.com
            </a>
            <a
              href="mailto:info@aidformen.com"
              className="inline-flex min-h-12 items-center justify-center rounded-lg border-2 border-[#216587] bg-white px-6 py-3 font-semibold text-[#153E54] transition-colors hover:bg-[#8CC6D8]/20 focus-visible:outline-[#216587]"
            >
              Contact info@aidformen.com
            </a>
          </div>
        </div>
      </Container>
    </section>
  );
}
