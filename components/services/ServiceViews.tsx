'use client';

import Link from 'next/link';
import { useLang } from '@/app/language';
import { servicesContent } from '@/app/services-content';
import { SERVICE_SLUGS, serviceHref, type ServiceSlug } from '@/app/services';
import { sectionHref } from '@/app/sections';
import { BrandIcon } from '@/components/social-icons';

const card = { border: '1px solid rgba(228,226,223,0.08)', background: 'rgba(8,10,8,0.55)' } as const;
const muted = { color: 'rgba(228,226,223,0.6)' } as const;
const faint = { color: 'rgba(228,226,223,0.42)' } as const;

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <p className="font-mono text-[10px] uppercase tracking-[0.25em]" style={{ color: 'var(--accent)' }}>
      {children}
    </p>
  );
}

function Block({ title, items }: { title: string; items: string[] }) {
  if (items.length === 0) return null;
  return (
    <section className="mt-10">
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider" style={faint}>
        {title}
      </h2>
      <ul className="prose-list list-disc pl-5 text-[15px] leading-relaxed" style={muted}>
        {items.map((it) => (
          <li key={it}>{it}</li>
        ))}
      </ul>
    </section>
  );
}

function ContactCard() {
  const { t, lang } = useLang();
  const s = servicesContent[lang];
  return (
    <section className="mt-12 rounded-2xl p-6" style={{ border: '1px solid rgba(34,197,94,0.22)', background: 'rgba(8,14,10,0.6)' }}>
      <h2 className="mb-2 text-sm font-semibold uppercase tracking-wider" style={faint}>
        {s.labels.contact}
      </h2>
      <p className="text-[15px] leading-relaxed" style={muted}>
        {s.contactCta}
      </p>
      {/* Direct-contact hierarchy: WhatsApp leads (solid), Telegram is
          the same lane (green outline); email stays available but reads
          neutral; the contact page is the full directory. 2×2 on
          phones, one row once there is width. */}
      <div className="mt-5 grid grid-cols-2 gap-2.5 sm:flex sm:flex-wrap sm:items-center">
        <a
          href="https://wa.me/soobujmiah"
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center justify-center gap-2 rounded-full px-4 py-2.5 text-sm font-medium transition-opacity hover:opacity-85"
          style={{ background: 'var(--accent)', color: '#04140a' }}
        >
          <BrandIcon id="whatsapp" size={15} />
          {s.labels.whatsapp}
        </a>
        <a
          href="https://t.me/soobujmiah"
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center justify-center gap-2 rounded-full px-4 py-2.5 text-sm font-medium transition-colors duration-300"
          style={{ border: '1px solid rgba(34,197,94,0.35)', color: '#4ade80' }}
        >
          <BrandIcon id="telegram" size={15} />
          {s.labels.telegram}
        </a>
        <a
          href={t.contact.email.href}
          className="inline-flex items-center justify-center gap-2 rounded-full px-4 py-2.5 text-sm transition-colors duration-300"
          style={{ border: '1px solid rgba(228,226,223,0.14)', color: '#e4e2df' }}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <rect x="2" y="4" width="20" height="16" rx="2" />
            <path d="m22 7-10 6L2 7" />
          </svg>
          {t.contact.email.label}
        </a>
        <Link
          href={sectionHref(8)}
          className="inline-flex items-center justify-center gap-2 rounded-full px-4 py-2.5 text-sm transition-colors duration-300 hover:text-[#4ade80]"
          style={{ border: '1px solid rgba(228,226,223,0.14)', color: 'rgba(228,226,223,0.75)' }}
        >
          {s.labels.contactPage} →
        </Link>
      </div>
      <p className="mt-4 font-mono text-[11px]" style={faint}>
        {s.labels.availability}: {s.availability}
      </p>
    </section>
  );
}

/* ── hub ─────────────────────────────────────────────────────── */

export function ServicesHub() {
  const { t, lang } = useLang();
  const s = servicesContent[lang];
  return (
    <>
      <Eyebrow>{s.eyebrow}</Eyebrow>
      <h1 className="mt-3 max-w-3xl text-3xl font-semibold leading-tight sm:text-4xl" style={{ color: 'var(--fg)' }}>
        {s.heading}
      </h1>
      <p className="mt-5 max-w-3xl text-[15px] leading-relaxed" style={muted}>
        {s.intro}
      </p>

      <div className="mt-12 grid gap-10">
        {s.pillars.map((pillar) => (
          <section key={pillar.label}>
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider" style={faint}>
              {pillar.label}
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {pillar.slugs.map((slug) => {
                const page = s.pages.find((p) => p.slug === slug);
                if (!page) return null;
                return (
                  <Link
                    key={page.slug}
                    href={serviceHref(page.slug as ServiceSlug)}
                    className="group rounded-2xl p-5 transition-colors duration-300 hover:border-[rgba(34,197,94,0.35)]"
                    style={card}
                  >
                    <h3 className="text-base font-semibold" style={{ color: 'var(--fg)' }}>
                      {page.title}
                    </h3>
                    <p className="mt-2 text-[13.5px] leading-relaxed" style={muted}>
                      {page.short}
                    </p>
                    <span className="mt-3 inline-block font-mono text-[11px] group-hover:text-[#4ade80]" style={faint}>
                      →
                    </span>
                  </Link>
                );
              })}
            </div>
          </section>
        ))}
      </div>

      <ContactCard />
    </>
  );
}

/* ── one service ─────────────────────────────────────────────── */

export function ServiceDetail({ slug }: { slug: ServiceSlug }) {
  const { t, lang } = useLang();
  const s = servicesContent[lang];
  const page = s.pages.find((p) => p.slug === slug);
  if (!page) return null;
  const related = SERVICE_SLUGS.filter((x) => x !== slug)
    .map((x) => s.pages.find((p) => p.slug === x))
    .filter((p): p is NonNullable<typeof p> => Boolean(p))
    .slice(0, 3);

  return (
    <article>
      <Eyebrow>{s.eyebrow}</Eyebrow>
      <h1 className="mt-3 max-w-3xl text-3xl font-semibold leading-tight sm:text-4xl" style={{ color: 'var(--fg)' }}>
        {page.title}
      </h1>
      <p className="mt-5 max-w-3xl text-[16px] leading-relaxed" style={muted}>
        {page.short}
      </p>

      <Block title={s.labels.forWho} items={page.forWho} />
      <Block title={s.labels.problems} items={page.problems} />
      <Block title={s.labels.included} items={page.included} />
      <Block title={s.labels.notIncluded} items={page.notIncluded} />

      <section className="mt-10">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider" style={faint}>
          {s.labels.capabilities}
        </h2>
        <div className="flex flex-wrap gap-1.5">
          {page.capabilities.map((c) => (
            <span key={c} className="rounded-full px-2.5 py-1 font-mono text-[11px]" style={{ border: '1px solid rgba(228,226,223,0.09)', color: 'rgba(228,226,223,0.6)' }}>
              {c}
            </span>
          ))}
        </div>
      </section>

      <section className="mt-10">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider" style={faint}>
          {s.labels.evidence}
        </h2>
        <ul className="grid gap-3 sm:grid-cols-2">
          {page.evidence.map((e) => (
            <li key={e.url} className="rounded-xl p-4" style={card}>
              <a href={e.url} className="font-mono text-[13px] font-medium hover:text-[#4ade80]" style={{ color: 'var(--fg)' }}>
                {e.name} <span aria-hidden>↗</span>
              </a>
              <p className="mt-1 text-[13px] leading-relaxed" style={muted}>
                {e.note}
              </p>
            </li>
          ))}
        </ul>
      </section>

      {page.faq.length > 0 && (
        <section className="mt-10">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider" style={faint}>
            {s.labels.faq}
          </h2>
          <dl className="grid gap-4">
            {page.faq.map((f) => (
              <div key={f.q} className="rounded-xl p-4" style={card}>
                <dt className="text-[15px] font-semibold" style={{ color: 'var(--fg)' }}>
                  {f.q}
                </dt>
                <dd className="mt-1.5 text-[14px] leading-relaxed" style={muted}>
                  {f.a}
                </dd>
              </div>
            ))}
          </dl>
        </section>
      )}

      <ContactCard />

      <section className="mt-12">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider" style={faint}>
          {s.labels.related}
        </h2>
        <div className="flex flex-wrap gap-2">
          {related.map((r) => (
            <Link key={r.slug} href={serviceHref(r.slug as ServiceSlug)} className="rounded-full px-4 py-1.5 text-[13px] transition-colors hover:text-[#4ade80]" style={card}>
              {r.title}
            </Link>
          ))}
          <Link href={serviceHref()} className="rounded-full px-4 py-1.5 font-mono text-[12px] hover:text-[#4ade80]" style={{ ...card, ...faint }}>
            {s.labels.allServices}
          </Link>
        </div>
      </section>
    </article>
  );
}
