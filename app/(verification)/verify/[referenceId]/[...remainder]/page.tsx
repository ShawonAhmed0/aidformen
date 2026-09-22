import { notFound } from "next/navigation";

/** Reject paths that contain anything after the single reference segment. */
export default function InvalidCertificateReferencePathPage() {
  notFound();
}
