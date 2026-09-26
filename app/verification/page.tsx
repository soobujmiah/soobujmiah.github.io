import type { Metadata } from 'next';
import verification from '@/data/verification.json';

export const metadata: Metadata = {
  title: 'Claim Verification Log — Sobuj Miah',
  description: 'Project claims, evidence boundaries, and source commits for the portfolio.',
  alternates: { canonical: 'https://soobujmiah.github.io/verification/' },
  openGraph: {
    title: 'Claim Verification Log — Sobuj Miah',
    description: 'Project claims, evidence boundaries, and source commits for the portfolio.',
    url: 'https://soobujmiah.github.io/verification/',
    type: 'website',
  },
};

export default function VerificationPage() {
  return (
    <main className="min-h-screen bg-[#050507] px-6 py-16 text-[#e4e2df]">
      <div className="mx-auto max-w-5xl">
        <a href="/" className="font-mono text-xs text-[#4ade80]">← Back to portfolio</a>
        <header className="mt-10 max-w-3xl">
          <p className="font-mono text-xs uppercase tracking-[0.18em] text-[#4ade80]">Claim verification log</p>
          <h1 className="mt-3 text-3xl font-semibold">Evidence behind the published project claims.</h1>
          <p className="mt-4 text-sm leading-7 text-white/60">
            This page is generated from the same verification registry used to check portfolio and CV claims.
            A claim is not treated as stronger than its recorded evidence.
          </p>
        </header>
        <section className="mt-10 grid gap-5">
          {Object.values(verification.projects).map((p) => (
            <article key={p.name} className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
              <div className="flex flex-wrap items-baseline justify-between gap-3">
                <h2 className="text-xl font-medium">{p.name}</h2>
                <span className="font-mono text-xs text-[#4ade80]">{p.status.en}</span>
              </div>
              <p className="mt-3 text-sm leading-7 text-white/65">{p.evidence.en}</p>
              <div className="mt-4 flex flex-wrap gap-4 font-mono text-[11px] text-white/45">
                <a className="hover:text-[#4ade80]" href={p.repo}>repository ↗</a>
                <a className="hover:text-[#4ade80]" href={`https://github.com/soobujmiah/${p.repo.split('/').pop()}/commit/${p.evidenceCommit}`}>evidence commit ↗</a>
                <span>live head: {p.liveHead.slice(0, 7)}</span>
                <span>source: {p.sourcePath}</span>
              </div>
            </article>
          ))}
        </section>
        <footer className="mt-10 border-t border-white/10 pt-5 text-xs text-white/40">
          Registry schema {verification.schemaVersion}. Evidence commits are the reviewed source states; live heads are shown separately so stale claims remain visible.
        </footer>
      </div>
    </main>
  );
}
