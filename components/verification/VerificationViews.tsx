'use client';

import { useLang, localizeDigits } from '@/app/language';
import { verificationCopy } from '@/app/verification-copy';
import {
  evidenceSource,
  evidenceUrl,
  formatVerifiedDate,
  runUrl,
  statusTone,
  type ClaimStatus,
  type VerificationClaim,
  type VerificationSummary,
} from '@/app/verification';

/* ═══════════════════════════════════════════════════════════════
   VERIFICATION VIEW — the public proof page body.

   Two lists, deliberately separated:

     · machine-verified  — resolved automatically from each
       repository's own deterministic state. A claim that stops
       holding is shown as failing, never hidden.
     · not automatically verified — owner-authored positioning and
       figures recorded from real devices and releases. No
       automation may rewrite these or mark them verified.

   All wording comes from app/content.ts (both languages). Every
   number, date, status and link comes from the generated
   public/verification.json. Nothing on this page is typed by hand.
   ═══════════════════════════════════════════════════════════════ */

const TONE_COLOR: Record<string, string> = {
  ok: '#4ade80',
  bad: '#f87171',
  warn: '#fbbf24',
  neutral: 'rgba(228,226,223,0.45)',
};

const STATUS_KEY: Record<ClaimStatus, 'statusVerified' | 'statusFailed' | 'statusStale' | 'statusUnverified' | 'statusSuperseded' | 'statusHuman'> = {
  verified: 'statusVerified',
  failed: 'statusFailed',
  stale: 'statusStale',
  unverified: 'statusUnverified',
  superseded: 'statusSuperseded',
  human_attested: 'statusHuman',
};

function StatusPill({ status }: { status: ClaimStatus }) {
  const { lang } = useLang();
  const v = verificationCopy[lang];
  const tone = statusTone(status);
  return (
    <span
      className="inline-flex items-center rounded-full px-2 py-0.5 font-mono text-[10px] whitespace-nowrap"
      style={{ border: `1px solid ${TONE_COLOR[tone]}55`, color: TONE_COLOR[tone] }}
    >
      {v[STATUS_KEY[status]]}
    </span>
  );
}

/** Localized display copy for a claim id. Presentation only — the canonical
    claim wording lives in soobujmiah/skb → verification/claims.json. */
function labelFor(claim: VerificationClaim, labels: { id: string; label: string }[]): string {
  return labels.find((c) => c.id === claim.id)?.label ?? claim.id;
}

function MachineRow({ claim }: { claim: VerificationClaim }) {
  const { lang } = useLang();
  const v = verificationCopy[lang];
  const evidence = evidenceUrl(claim);
  const run = runUrl(claim);
  return (
    <li className="border-b py-4 last:border-b-0" style={{ borderColor: 'rgba(228,226,223,0.06)' }}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <p className="max-w-xl text-[13px] leading-relaxed" style={{ color: 'rgba(228,226,223,0.82)' }}>
          {labelFor(claim, v.claimLabels)}
        </p>
        <StatusPill status={claim.status} />
      </div>
      <dl className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 font-mono text-[10px]" style={{ color: 'rgba(228,226,223,0.42)' }}>
        <div className="flex gap-1.5">
          <dt>{v.sourceLabel}:</dt>
          <dd style={{ color: 'rgba(228,226,223,0.6)' }}>{evidenceSource(claim) || '—'}</dd>
        </div>
        <div className="flex gap-1.5">
          <dt>{v.verifiedAtLabel}:</dt>
          <dd>{formatVerifiedDate(claim.verified_at, lang)}</dd>
        </div>
        {evidence && (
          <div>
            <a href={evidence} target="_blank" rel="noreferrer" className="transition-colors duration-300 hover:text-[#4ade80]">
              {v.viewEvidence} <span aria-hidden>↗</span>
            </a>
          </div>
        )}
        {run && (
          <div>
            <a href={run} target="_blank" rel="noreferrer" className="transition-colors duration-300 hover:text-[#4ade80]">
              {v.viewRun} <span aria-hidden>↗</span>
            </a>
          </div>
        )}
      </dl>
    </li>
  );
}

function HumanRow({ claim }: { claim: VerificationClaim }) {
  const { lang } = useLang();
  const v = verificationCopy[lang];
  return (
    <li className="border-b py-4 last:border-b-0" style={{ borderColor: 'rgba(228,226,223,0.06)' }}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <p className="max-w-xl text-[13px] leading-relaxed" style={{ color: 'rgba(228,226,223,0.82)' }}>
          {labelFor(claim, v.claimLabels)}
        </p>
        <span
          className="inline-flex items-center rounded-full px-2 py-0.5 font-mono text-[10px] whitespace-nowrap"
          style={{ border: '1px solid rgba(228,226,223,0.14)', color: 'rgba(228,226,223,0.45)' }}
        >
          {v.statusHuman}
        </span>
      </div>
    </li>
  );
}

export function VerificationView({
  claims,
  summary,
}: {
  claims: VerificationClaim[];
  summary: VerificationSummary;
}) {
  const { lang } = useLang();
  const v = verificationCopy[lang];
  const n = (value: number) => localizeDigits(value, lang);
  const machineClaims = claims.filter((c) => c.class === 'evidence_backed');
  const humanClaims = claims.filter((c) => c.class === 'positioning');

  return (
    <article className="pb-10">
      <p className="font-mono text-[11px] uppercase tracking-[0.2em]" style={{ color: '#4ade80' }}>
        {v.eyebrow}
      </p>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl" style={{ color: '#e4e2df' }}>
        {v.heading}
      </h1>
      <p className="mt-4 max-w-2xl text-[14px] leading-relaxed" style={{ color: 'rgba(228,226,223,0.62)' }}>
        {v.intro}
      </p>

      {/* ── current state ── */}
      <section className="mt-10" aria-labelledby="verification-summary">
        <h2 id="verification-summary" className="font-mono text-[11px] uppercase tracking-[0.18em]" style={{ color: 'rgba(228,226,223,0.5)' }}>
          {v.summaryLabel}
        </h2>
        <dl className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {[
            { label: v.summaryTotal, value: summary.machine_total },
            { label: v.summaryVerified, value: summary.verified },
            { label: v.summaryFailed, value: summary.failed },
            { label: v.summaryStale, value: summary.stale },
            { label: v.summaryHuman, value: summary.human_total },
          ].map((cell) => (
            <div key={cell.label} className="rounded-lg px-4 py-3" style={{ border: '1px solid rgba(228,226,223,0.08)' }}>
              <dt className="font-mono text-[10px]" style={{ color: 'rgba(228,226,223,0.45)' }}>
                {cell.label}
              </dt>
              <dd className="mt-1 font-mono text-xl" style={{ color: '#e4e2df' }}>
                {n(cell.value)}
              </dd>
            </div>
          ))}
        </dl>
        <p className="mt-3 font-mono text-[10px]" style={{ color: 'rgba(228,226,223,0.4)' }}>
          {v.asOfLabel}: {formatVerifiedDate(summary.last_verified, lang)}
        </p>
      </section>

      {/* ── machine-verified ── */}
      <section className="mt-12" aria-labelledby="verification-machine">
        <h2 id="verification-machine" className="text-lg font-medium tracking-tight" style={{ color: '#e4e2df' }}>
          {v.machineHeading}
        </h2>
        <p className="mt-2 max-w-2xl text-[13px] leading-relaxed" style={{ color: 'rgba(228,226,223,0.55)' }}>
          {v.machineIntro}
        </p>
        <ul className="mt-5">
          {machineClaims.map((claim) => (
            <MachineRow key={claim.id} claim={claim} />
          ))}
        </ul>
      </section>

      {/* ── not automatically verified ── */}
      <section className="mt-12" aria-labelledby="verification-human">
        <h2 id="verification-human" className="text-lg font-medium tracking-tight" style={{ color: '#e4e2df' }}>
          {v.humanHeading}
        </h2>
        <p className="mt-2 max-w-2xl text-[13px] leading-relaxed" style={{ color: 'rgba(228,226,223,0.55)' }}>
          {v.humanIntro}
        </p>
        <ul className="mt-5">
          {humanClaims.map((claim) => (
            <HumanRow key={claim.id} claim={claim} />
          ))}
        </ul>
      </section>

      {/* ── scope ── */}
      <section className="mt-12" aria-labelledby="verification-scope">
        <h2 id="verification-scope" className="text-lg font-medium tracking-tight" style={{ color: '#e4e2df' }}>
          {v.scopeHeading}
        </h2>
        <div className="mt-4 space-y-3 text-[13px] leading-relaxed" style={{ color: 'rgba(228,226,223,0.55)' }}>
          <p>{v.scopeMachine}</p>
          <p>{v.scopeHuman}</p>
          <p>{v.scopeSource}</p>
        </div>
        <p className="mt-6 font-mono text-[10px]" style={{ color: 'rgba(228,226,223,0.35)' }}>
          {v.footerNote}
        </p>
      </section>
    </article>
  );
}
