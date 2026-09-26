import type { Metadata } from 'next';
import { VerificationShell } from '@/components/verification/VerificationShell';
import { VerificationView } from '@/components/verification/VerificationViews';
import { verificationJsonLd, verificationMetadata } from '@/app/verification-seo';
import { verificationSummary, type VerificationClaim } from '@/app/verification';
import projection from '@/public/verification.json';

/* /bn/verification/ — the Bangla twin of the public proof page.
   Independently crawlable, same generated data, Bangla copy. */
export const metadata: Metadata = verificationMetadata('bn');

export default function BengaliVerificationPage() {
  const claims = projection.claims as unknown as VerificationClaim[];
  return (
    <VerificationShell lang="bn">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(verificationJsonLd('bn')) }}
      />
      <VerificationView claims={claims} summary={verificationSummary} />
    </VerificationShell>
  );
}
