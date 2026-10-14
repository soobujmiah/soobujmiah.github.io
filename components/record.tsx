'use client';

/* ═══════════════════════════════════════════════════════════════
   RECORD — the typographic system for text inside the machine.

   The reader is standing inside one device, so the text is written
   the way the machine's own records are: a mono label, an index, a
   hairline rule, and prose. There are no cards, no rounded panels,
   no blurred surfaces and no floating stat tiles — those were the
   previous build's vocabulary, and stacking them is what made the
   site read as overlapping layers.

   What replaces them:
     · a hairline rule under every label, and nothing else enclosing
     · indentation and leading for hierarchy, not borders
     · one accent colour, reserved for state (verified / live / now)
     · definition lists for anything that is label → value, so the
       structure is real markup a crawler and a screen reader get for
       free rather than a visual convention

   Everything here is server-renderable: no component in this file
   depends on an effect, a measurement or a canvas. That is what
   keeps every route's text in the static HTML.
   ═══════════════════════════════════════════════════════════════ */

import type { ReactNode } from 'react';
import { useLang, localizeDigits } from '@/app/language';

/* ── The chapter frame ──────────────────────────────────────────
   Depth index + stratum name, the heading, and an optional lede.
   `headingLevel` exists because exactly one route-level <h1> is
   allowed: the chapter heading is it, and every record below is an
   <h2> or lower. */
export function Chapter({
  index,
  total,
  stratum,
  eyebrow,
  heading,
  headingClass,
  lede,
  children,
}: {
  index: number;
  total: number;
  stratum: string;
  eyebrow?: string;
  heading: ReactNode;
  headingClass?: string;
  lede?: ReactNode;
  children?: ReactNode;
}) {
  const { lang } = useLang();
  const depth = localizeDigits(String(index + 1).padStart(2, '0'), lang);
  const span = localizeDigits(String(total).padStart(2, '0'), lang);
  return (
    <article className="chapter">
      <header className="chapter-head">
        <p className="chapter-depth">
          <span className="chapter-depth-index">{depth}</span>
          <span className="chapter-depth-sep" aria-hidden="true">
            /
          </span>
          <span className="chapter-depth-total">{span}</span>
          <span className="chapter-depth-stratum">{stratum}</span>
        </p>
        {eyebrow && <p className="chapter-eyebrow">{eyebrow}</p>}
        <h1 className={headingClass ? `chapter-heading ${headingClass}` : 'chapter-heading'}>{heading}</h1>
        {lede && <div className="chapter-lede">{lede}</div>}
      </header>
      {children && <div className="chapter-body">{children}</div>}
    </article>
  );
}

/* ── A labelled block ───────────────────────────────────────────
   A mono label on a hairline rule, then anything. This is the only
   container in the system. */
export function Block({
  label,
  note,
  children,
}: {
  label: string;
  note?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="block">
      <h2 className="block-label">
        {label}
        {note && <span className="block-note">{note}</span>}
      </h2>
      {children}
    </section>
  );
}

/* ── Label → value rows ─────────────────────────────────────────
   A real definition list. Used for facts, layers, periods: anything
   whose shape is "this is called that". */
export function Rows({ items }: { items: { label: string; value: ReactNode; state?: State }[] }) {
  return (
    <dl className="rows">
      {items.map((item, i) => (
        <div className="row" key={`${item.label}-${i}`}>
          <dt className="row-label">
            {item.state && <Mark state={item.state} />}
            {item.label}
          </dt>
          <dd className="row-value">{item.value}</dd>
        </div>
      ))}
    </dl>
  );
}

/* ── Records ────────────────────────────────────────────────────
   The heavier unit: a titled entry with a state, prose, an evidence
   line and references. Projects, research entries and roles are all
   this one shape, which is why they finally look like one system. */
export type State = 'verified' | 'live' | 'experimental' | 'investigating' | 'now' | 'neutral';

export function Mark({ state }: { state: State }) {
  const glyph = state === 'experimental' || state === 'investigating' ? '◇' : state === 'neutral' ? '·' : '◆';
  return (
    <span className="mark" data-state={state} aria-hidden="true">
      {glyph}
    </span>
  );
}

export function Record({
  title,
  state,
  stamp,
  children,
  evidence,
  evidenceLabel,
  refs,
}: {
  title: string;
  state?: State;
  stamp?: string;
  children?: ReactNode;
  evidence?: ReactNode;
  evidenceLabel?: string;
  refs?: ReactNode;
}) {
  return (
    <section className="record">
      <h3 className="record-title">
        {state && <Mark state={state} />}
        <span className="record-name">{title}</span>
        {stamp && <span className="record-stamp">{stamp}</span>}
      </h3>
      {children && <div className="record-body">{children}</div>}
      {evidence && (
        <p className="record-evidence">
          {evidenceLabel && <span className="record-evidence-label">{evidenceLabel}</span>}
          {evidence}
        </p>
      )}
      {refs && <p className="record-refs">{refs}</p>}
    </section>
  );
}

/* ── A reference out of the machine ─────────────────────────────
   Every outbound link in the site is this component, so there is one
   link treatment rather than buttons, pills and plain anchors
   competing. External targets open in a new tab with the usual
   `rel`; internal routes stay in place. */
export function Ref({
  href,
  children,
  strong = false,
}: {
  href: string;
  children: ReactNode;
  strong?: boolean;
}) {
  const external = /^https?:\/\//i.test(href) || href.startsWith('mailto:');
  /* Several labels in `content.ts` were written with an arrow baked into
     the string ("Code ↗", "View all services →") because the previous
     build had no shared link component. This one owns the arrow, so a
     baked-in trailing arrow is stripped rather than doubled — the copy
     stays as the owner wrote it, in both languages, and no call site has
     to remember which labels carry one. */
  const label = typeof children === 'string' ? children.replace(/\s*[↗→]+\s*$/, '') : children;
  return (
    <a
      className={strong ? 'ref ref--strong' : 'ref'}
      href={href}
      {...(external && !href.startsWith('mailto:')
        ? { target: '_blank', rel: 'noreferrer noopener' }
        : {})}
    >
      {label}
      <span className="ref-arrow" aria-hidden="true">
        {external ? '↗' : '→'}
      </span>
    </a>
  );
}

/** A run of references, laid out as a wrapping line. */
export function Refs({ children }: { children: ReactNode }) {
  return <span className="refs">{children}</span>;
}

/** Inline mono list — topics, tools, principles. Comma-free by
    design: the separator is a hairline dot, so Bangla and English
    wrap the same way without punctuation drifting between them. */
export function Tags({ items }: { items: string[] }) {
  return (
    <ul className="tags">
      {items.map((item) => (
        <li className="tag" key={item}>
          {item}
        </li>
      ))}
    </ul>
  );
}

/** A plain prose paragraph set — the only place body copy lives. */
export function Prose({ paragraphs }: { paragraphs: string[] }) {
  return (
    <div className="prose">
      {paragraphs.map((p, i) => (
        <p key={i}>{p}</p>
      ))}
    </div>
  );
}
