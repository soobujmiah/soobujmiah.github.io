import type { Metadata } from 'next';
import { VerificationShell } from '@/components/verification/VerificationShell';
import { VerificationView } from '@/components/verification/VerificationViews';
import { verificationJsonLd, verificationMetadata } from '@/app/verification-seo';
import { verificationSummary, type VerificationClaim } from '@/app/verification';
import projection from '@/public/verification.json';

/* /verification/ — the public proof page. A static document outside the
   pager (see app/verification-routes.ts for why), server-rendered in English
   exactly like the rest of the site, with the Bangla twin at /bn/verification/.

   The full evidence set is imported here, on the server, and handed to the
   client view as props. That keeps the claim detail in the HTML where the
   page that shows it lives, instead of in the shared JavaScript bundle that
   every route loads. */
export const metadata: Metadata = verificationMetadata('en');

export default function VerificationPage() {
  const claims = projection.claims as unknown as VerificationClaim[];
  return (
    <VerificationShell lang="en">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(verificationJsonLd('en')) }}
      />
      <VerificationView claims={claims} summary={verificationSummary} />
    </VerificationShell>
  );
}
