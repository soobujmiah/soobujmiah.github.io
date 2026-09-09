'use client';

import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6 text-center" style={{ background: 'var(--bg)' }}>
      <p className="font-mono text-xs uppercase tracking-[0.3em] mb-4" style={{ color: 'var(--accent)' }}>
        404
      </p>
      <h1 className="text-4xl font-semibold mb-3" style={{ color: 'var(--fg)' }}>
        Page not found
      </h1>
      <p className="mb-8" style={{ color: 'var(--muted)' }}>
        The page you are looking for does not exist.
      </p>
      <Link
        href="/"
        className="rounded-full border px-6 py-2.5 text-sm font-medium transition-colors duration-300 hover:opacity-80"
        style={{ borderColor: 'rgba(232,230,227,0.15)', color: 'var(--fg)' }}
        data-magnetic
      >
        Return home
      </Link>
    </div>
  );
}
