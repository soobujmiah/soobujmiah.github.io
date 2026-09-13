import Link from 'next/link';

/* App Router 404 (static export renders this to 404.html).
   Server component: bilingual static copy, no client hooks. */
export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6 text-center" style={{ background: 'var(--bg)' }}>
      <p className="font-mono text-xs uppercase tracking-[0.3em] mb-4" style={{ color: 'var(--accent)' }}>
        404
      </p>
      <h1 className="text-4xl font-semibold mb-3" style={{ color: 'var(--fg)' }}>
        Page not found
      </h1>
      <p className="mb-2" style={{ color: 'var(--muted)' }}>
        The page you are looking for does not exist.
      </p>
      <p className="mb-8 text-sm" style={{ color: 'var(--muted)' }}>
        আপনি যে পেজটি খুঁজছেন তা পাওয়া যায়নি।
      </p>
      <Link
        href="/"
        className="rounded-full border px-6 py-2.5 text-sm font-medium transition-colors duration-300 hover:opacity-80"
        style={{ borderColor: 'rgba(232,230,227,0.15)', color: 'var(--fg)' }}
        data-magnetic
      >
        Return home · হোমে ফিরুন
      </Link>
    </div>
  );
}
