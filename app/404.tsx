import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-5 text-center">
      <p className="font-mono text-sm uppercase tracking-[0.2em] text-accent">404</p>
      <h1 className="mt-4 text-3xl font-semibold text-ink-50">Page not found</h1>
      <p className="mt-3 text-ink-400">The page you are looking for does not exist.</p>
      <Link
        href="/"
        className="mt-8 rounded-lg border border-ink-700 px-5 py-2.5 text-sm font-medium text-ink-200 transition-colors hover:border-accent hover:text-accent"
      >
        Return home
      </Link>
    </div>
  );
}
