/* ═══════════════════════════════════════════════════════════════
   VERIFICATION — pure helpers and the footer's generated summary.

   Split in two on purpose, and the split is load-bearing:

   · `verification-summary.json` (GENERATED, committed) holds only
     counts and one timestamp. The site's shared chrome — the fixed
     footer on every route — imports that, so the pager bundle grows
     by a few hundred bytes instead of the whole evidence set.
   · `public/verification.json` (GENERATED, committed, and publicly
     linkable) holds the full claim detail. Only the /verification/
     page reads it, and it reads it on the server, so the evidence
     detail ships as HTML rather than as JavaScript on every page.

   Nothing here is hand-written: `tools/verification` regenerates
   both files inside .github/workflows/repo-knowledge-sync.yml.

   This module deliberately imports no data and no client-only
   module, so the same helpers work from the server-rendered page
   and from the client-rendered footer.
   ═══════════════════════════════════════════════════════════════ */

import type { Lang } from './content';
import summary from './verification-summary.json';

export type ClaimStatus =
  | 'verified'
  | 'failed'
  | 'stale'
  | 'unverified'
  | 'superseded'
  | 'human_attested';

export type ClaimClass = 'evidence_backed' | 'positioning';

export interface VerificationEvidence {
  type: string;
  project_id?: string;
  repository?: string;
  field?: string;
  value?: string;
  at?: string | null;
  commit?: string | null;
  run_id?: string | null;
  public?: boolean;
  url?: string | null;
  repositories?: { repository: string; has_pages: boolean }[];
}

export interface VerificationClaim {
  id: string;
  class: ClaimClass;
  status: ClaimStatus;
  verified_at: string | null;
  public?: boolean;
  evidence?: VerificationEvidence;
  carried_forward?: boolean;
  superseded_by?: string;
}

export interface VerificationSummary {
  schema: string;
  schema_version: number;
  as_of: string | null;
  verified: number;
  failed: number;
  stale: number;
  unverified: number;
  superseded: number;
  human_attested: number;
  machine_total: number;
  human_total: number;
  last_verified: string | null;
}

/** The footer's whole view of the verification state. */
export const verificationSummary = summary as VerificationSummary;

export const verifiedCount = verificationSummary.verified;
export const failedCount = verificationSummary.failed;
export const staleCount = verificationSummary.stale;
export const machineClaimCount = verificationSummary.machine_total;
export const humanClaimCount = verificationSummary.human_total;
export const lastVerifiedAt = verificationSummary.last_verified;

const BN_DIGITS = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];

/** Bengali numerals in Bangla mode, Latin otherwise — same rule as app/language.tsx. */
export function localizeDigits(value: string | number, lang: Lang): string {
  const s = String(value);
  if (lang !== 'bn') return s;
  return s.replace(/[0-9]/g, (d) => BN_DIGITS[Number(d)]);
}

/**
 * Render an evidence timestamp as a plain calendar date. Deliberately ISO-shaped:
 * it contains no letters, so the Bangla render stays pure Bangla after digit
 * localization and the English render stays free of Bengali by construction.
 */
export function formatVerifiedDate(iso: string | null | undefined, lang: Lang): string {
  if (!iso) return '—';
  return localizeDigits(iso.slice(0, 10), lang);
}

/** Where a claim's evidence comes from, in one short line. */
export function evidenceSource(claim: VerificationClaim): string {
  const e = claim.evidence;
  if (!e) return '';
  if (e.type === 'github_pages') {
    return (e.repositories ?? []).map((r) => r.repository).join(', ');
  }
  if (!e.repository) return e.type;
  return e.field ? `${e.repository} · ${e.field}` : e.repository;
}

/** External link to the evidence itself, when one exists. */
export function evidenceUrl(claim: VerificationClaim): string | null {
  const url = claim.evidence?.url;
  return typeof url === 'string' && /^https:/.test(url) ? url : null;
}

/** CI run link for a claim backed by a build/test result. */
export function runUrl(claim: VerificationClaim): string | null {
  const e = claim.evidence;
  if (!e?.run_id || !e?.repository) return null;
  return `https://github.com/${e.repository}/actions/runs/${e.run_id}`;
}

export type StatusTone = 'ok' | 'bad' | 'warn' | 'neutral';

export function statusTone(status: ClaimStatus): StatusTone {
  if (status === 'verified') return 'ok';
  if (status === 'failed') return 'bad';
  if (status === 'stale' || status === 'superseded' || status === 'unverified') return 'warn';
  return 'neutral';
}
