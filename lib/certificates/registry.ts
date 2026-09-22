import "server-only";

/**
 * Public certificate fields are kept in this server-only registry. There is no
 * browser-side lookup or mutation endpoint: a deployment is required to add or
 * change an authoritative record.
 */
export type CertificateRecord = Readonly<{
  referenceId: string;
  certificateType: string;
  recipient: string;
  achievement: string;
  website: string;
  contact: string;
  issueDate: string | null;
  authorizedSignatory: string | null;
  verificationResult: "Record found";
  documentStatus: "Pending completion and authorized signature";
  notice: string;
}>;

export const CERTIFICATE_REFERENCE_PATTERN =
  /^AFM-WD-[0-9]{4}-[A-Z0-9]{8}$/;

const certificateRegistry: Readonly<Record<string, CertificateRecord>> =
  Object.freeze({
    "AFM-WD-2026-K82L9MDT": Object.freeze({
      referenceId: "AFM-WD-2026-K82L9MDT",
      certificateType: "Certificate of Website Development",
      recipient: "Shawon Ahmed",
      achievement:
        "Designed and developed the website aidformen.com for Aid For Men Foundation",
      website: "https://aidformen.com",
      contact: "info@aidformen.com",
      issueDate: null,
      authorizedSignatory: null,
      verificationResult: "Record found",
      documentStatus: "Pending completion and authorized signature",
      notice:
        "This reference matches a certificate record held by Aid For Men Foundation. The certificate becomes valid only when completed and signed by an authorized representative.",
    }),
  });

export function isValidCertificateReference(referenceId: string): boolean {
  return CERTIFICATE_REFERENCE_PATTERN.test(referenceId);
}

export function getCertificateRecord(
  referenceId: string
): CertificateRecord | null {
  if (!isValidCertificateReference(referenceId)) return null;

  if (!Object.prototype.hasOwnProperty.call(certificateRegistry, referenceId)) {
    return null;
  }

  return certificateRegistry[referenceId] ?? null;
}

export function listCertificateReferenceIds(): string[] {
  return Object.keys(certificateRegistry);
}
