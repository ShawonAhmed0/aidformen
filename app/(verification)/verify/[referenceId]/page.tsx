import type { Metadata } from "next";
import { ExternalLink, Mail } from "lucide-react";
import { notFound } from "next/navigation";

import { Container } from "@/components/ui/container";
import {
  getCertificateRecord,
  listCertificateReferenceIds,
} from "@/lib/certificates/registry";

type VerificationPageProps = {
  params: Promise<{ referenceId: string }>;
};

const metadataDescription =
  "Check the Aid For Men Foundation certificate record for reference AFM-WD-2026-K82L9MDT.";

export function generateStaticParams() {
  return listCertificateReferenceIds().map((referenceId) => ({ referenceId }));
}

export async function generateMetadata({
  params,
}: VerificationPageProps): Promise<Metadata> {
  const { referenceId } = await params;
  const record = getCertificateRecord(referenceId);

  if (!record) {
    return {
      title: "Certificate record not found | Aid For Men Foundation",
      robots: { index: false, follow: false },
    };
  }

  const canonicalUrl = `https://aidformen.com/verify/${record.referenceId}`;

  return {
    title: `Verify Certificate ${record.referenceId} | Aid For Men Foundation`,
    description: metadataDescription,
    alternates: { canonical: canonicalUrl },
    robots: { index: true, follow: true },
    openGraph: {
      type: "website",
      locale: "en_US",
      siteName: "Aid For Men Foundation",
      title: `Verify Certificate ${record.referenceId} | Aid For Men Foundation`,
      description: metadataDescription,
      url: canonicalUrl,
    },
  };
}

export default async function CertificateVerificationPage({
  params,
}: VerificationPageProps) {
  const { referenceId } = await params;
  const record = getCertificateRecord(referenceId);

  if (!record) notFound();

  const canonicalUrl = `https://aidformen.com/verify/${record.referenceId}`;
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CreativeWork",
    name: record.certificateType,
    identifier: record.referenceId,
    description: record.achievement,
    url: canonicalUrl,
    ...(record.issueDateIso ? { dateCreated: record.issueDateIso } : {}),
    about: {
      "@type": "Person",
      name: record.recipient,
    },
    publisher: {
      "@type": "Organization",
      name: "Aid For Men Foundation",
      url: record.website,
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c"),
        }}
      />

      <section className="bg-[#153E54] text-white" aria-labelledby="page-title">
        <Container className="py-14 sm:py-18 lg:py-22">
          <p className="text-xs font-bold tracking-[0.2em] text-[#8CC6D8] uppercase sm:text-sm">
            Official record check
          </p>
          <h1
            id="page-title"
            className="mt-4 max-w-3xl font-display text-4xl font-semibold tracking-tight sm:text-5xl lg:text-6xl"
          >
            Certificate verification
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-relaxed text-white/85 sm:text-lg">
            Review the authoritative Aid For Men Foundation record associated
            with this certificate reference.
          </p>
        </Container>
      </section>

      <section className="bg-[#8CC6D8]/10 pb-18 sm:pb-24">
        <Container className="relative -top-7 sm:-top-9">
          <div
            className="overflow-hidden rounded-2xl border border-[#8CC6D8] bg-white shadow-lg shadow-[#153E54]/8"
            aria-labelledby="verification-result"
          >
            <div className="grid lg:grid-cols-[0.9fr_1.4fr]">
              <div className="border-b border-[#8CC6D8]/70 p-6 sm:p-8 lg:border-r lg:border-b-0 lg:p-10">
                <p className="text-xs font-bold tracking-[0.16em] text-[#216587] uppercase">
                  Verification result
                </p>
                <div className="mt-3 flex items-center gap-3">
                  <span
                    aria-hidden="true"
                    className="size-3 shrink-0 rounded-full bg-[#216587]"
                  />
                  <h2
                    id="verification-result"
                    className="font-display text-3xl font-semibold text-[#153E54] sm:text-4xl"
                  >
                    {record.verificationResult}
                  </h2>
                </div>
              </div>

              <div className="bg-[#8CC6D8]/15 p-6 sm:p-8 lg:p-10">
                <p className="text-xs font-bold tracking-[0.16em] text-[#216587] uppercase">
                  Document status
                </p>
                <p className="mt-3 text-xl font-semibold leading-snug text-[#153E54] sm:text-2xl">
                  {record.documentStatus}
                </p>
              </div>
            </div>

            <div className="border-t border-[#8CC6D8]/70 px-6 py-5 sm:px-8 lg:px-10">
              <p className="max-w-4xl text-sm leading-relaxed font-medium text-[#153E54] sm:text-base">
                <span className="font-bold">Important:</span> {record.notice}
              </p>
            </div>
          </div>

          <article className="mt-8 rounded-2xl border border-[#8CC6D8]/80 bg-white p-6 sm:p-8 lg:p-10">
            <div className="flex flex-col gap-3 border-b border-[#8CC6D8]/70 pb-7 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs font-bold tracking-[0.16em] text-[#216587] uppercase">
                  Registry entry
                </p>
                <h2 className="mt-2 font-display text-3xl font-semibold text-[#153E54] sm:text-4xl">
                  Certificate details
                </h2>
              </div>
              <p className="text-sm font-medium text-[#216587]">
                Public verification record
              </p>
            </div>

            <dl className="divide-y divide-[#8CC6D8]/60">
              <DetailRow label="Reference ID">
                <span className="break-all font-semibold" data-numeric>
                  {record.referenceId}
                </span>
              </DetailRow>
              <DetailRow label="Certificate type">
                {record.certificateType}
              </DetailRow>
              <DetailRow label="Recipient">{record.recipient}</DetailRow>
              <DetailRow label="Achievement">{record.achievement}</DetailRow>
              <DetailRow label="Website">
                <a
                  href={record.website}
                  className="rounded-sm font-semibold text-[#216587] underline decoration-[#8CC6D8] decoration-2 underline-offset-4 hover:text-[#153E54] focus-visible:outline-[#216587]"
                >
                  {record.website}
                </a>
              </DetailRow>
              <DetailRow label="Contact">
                <a
                  href={`mailto:${record.contact}`}
                  className="rounded-sm font-semibold text-[#216587] underline decoration-[#8CC6D8] decoration-2 underline-offset-4 hover:text-[#153E54] focus-visible:outline-[#216587]"
                >
                  {record.contact}
                </a>
              </DetailRow>
              <DetailRow label="Issue date">
                {record.issueDate ?? "Not yet provided"}
              </DetailRow>
              <DetailRow label="Authorized signatory">
                {record.authorizedSignatory ?? "Not yet provided"}
              </DetailRow>
            </dl>

            <div className="mt-8 flex flex-col gap-3 border-t border-[#8CC6D8]/70 pt-8 sm:flex-row sm:flex-wrap">
              <a
                href={record.website}
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-[#216587] px-6 py-3 text-base font-semibold text-white transition-colors hover:bg-[#153E54] focus-visible:outline-[#153E54]"
              >
                Visit aidformen.com
                <ExternalLink className="size-4" aria-hidden="true" />
              </a>
              <a
                href={`mailto:${record.contact}`}
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg border-2 border-[#216587] bg-white px-6 py-3 text-base font-semibold text-[#153E54] transition-colors hover:bg-[#8CC6D8]/20 focus-visible:outline-[#216587]"
              >
                <Mail className="size-4" aria-hidden="true" />
                Email the foundation
              </a>
            </div>
          </article>
        </Container>
      </section>
    </>
  );
}

function DetailRow({
  label,
  children,
}: Readonly<{
  label: string;
  children: React.ReactNode;
}>) {
  return (
    <div className="grid gap-2 py-5 sm:grid-cols-[12rem_1fr] sm:gap-8 sm:py-6">
      <dt className="text-xs font-bold tracking-[0.14em] text-[#216587] uppercase">
        {label}
      </dt>
      <dd className="min-w-0 text-base leading-relaxed font-medium text-[#153E54] sm:text-lg">
        {children}
      </dd>
    </div>
  );
}
