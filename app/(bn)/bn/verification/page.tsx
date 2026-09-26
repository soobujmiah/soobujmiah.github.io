import type { Metadata } from 'next';
import verification from '@/data/verification.json';

export const metadata: Metadata = {
  title: 'দাবি যাচাই নথি — সবুজ মিয়া',
  description: 'পোর্টফোলিওর প্রকল্প-দাবি, প্রমাণের সীমা এবং উৎস কমিটের যাচাই নথি।',
  alternates: { canonical: 'https://soobujmiah.github.io/bn/verification/' },
  openGraph: {
    title: 'দাবি যাচাই নথি — সবুজ মিয়া',
    description: 'পোর্টফোলিওর প্রকল্প-দাবি, প্রমাণের সীমা এবং উৎস কমিটের যাচাই নথি।',
    url: 'https://soobujmiah.github.io/bn/verification/',
    type: 'website',
  },
};

export default function BengaliVerificationPage() {
  return (
    <main className="min-h-screen bg-[#050507] px-6 py-16 text-[#e4e2df]">
      <div className="mx-auto max-w-5xl">
        <a href="/bn/" className="font-mono text-xs text-[#4ade80]">← পোর্টফোলিওতে ফিরুন</a>
        <header className="mt-10 max-w-3xl">
          <p className="font-mono text-xs uppercase tracking-[0.18em] text-[#4ade80]">দাবি যাচাই নথি</p>
          <h1 className="mt-3 text-3xl font-semibold">প্রকাশিত প্রকল্প-দাবির পেছনের প্রমাণ।</h1>
          <p className="mt-4 text-sm leading-7 text-white/60">
            এই পৃষ্ঠা এবং সিভির যাচাই একই প্রমাণ-রেজিস্ট্রি থেকে হয়। কোনো দাবিকে তার নথিভুক্ত প্রমাণের চেয়ে শক্তিশালী করে উপস্থাপন করা হয় না।
          </p>
        </header>
        <section className="mt-10 grid gap-5">
          {Object.values(verification.projects).map((p) => (
            <article key={p.name} className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
              <div className="flex flex-wrap items-baseline justify-between gap-3">
                <h2 className="text-xl font-medium">{p.name}</h2>
                <span className="font-mono text-xs text-[#4ade80]">{p.status.bn}</span>
              </div>
              <p className="mt-3 text-sm leading-7 text-white/65">{p.evidence.bn}</p>
              <div className="mt-4 flex flex-wrap gap-4 font-mono text-[11px] text-white/45">
                <a className="hover:text-[#4ade80]" href={p.repo}>রিপোজিটরি ↗</a>
                <a className="hover:text-[#4ade80]" href={`https://github.com/soobujmiah/${p.repo.split('/').pop()}/commit/${p.evidenceCommit}`}>প্রমাণ কমিট ↗</a>
                <span>বর্তমান হেড: {p.liveHead.slice(0, 7)}</span>
                <span>উৎস: {p.sourcePath}</span>
              </div>
            </article>
          ))}
        </section>
        <footer className="mt-10 border-t border-white/10 pt-5 text-xs text-white/40">
          রেজিস্ট্রি স্কিমা {verification.schemaVersion}। প্রমাণ কমিট হলো পর্যালোচিত উৎস-অবস্থা; বর্তমান হেড আলাদাভাবে দেখানো হয়েছে, যাতে পুরোনো দাবি দৃশ্যমান থাকে।
        </footer>
      </div>
    </main>
  );
}
