'use client';

import { useEffect, useState } from 'react';
import { useReducedMotion } from 'framer-motion';
import { useLang, localizeDigits } from '@/app/language';
import { segmentGraphemes } from '@/app/graphemes';
import { sectionHref } from '@/app/sections';
import { serviceHref } from '@/app/services';
import type { ReactNode } from 'react';

/* The exhibit is a single architectural route. Every inscription is real,
   selectable DOM text; the WebGL and Canvas scenes supply the monuments. */
function Inscription({ index, eyebrow, title, children, className = '' }: {
  index: number; eyebrow: string; title: string; children: ReactNode; className?: string;
}) {
  const { lang } = useLang();
  return <div className={`exhibit exhibit--${index} ${className}`}>
    <div className="exhibit-sightline" aria-hidden="true"><span /></div>
    <div className="exhibit-body">
      <p className="exhibit-kicker"><span className="exhibit-index">{localizeDigits(String(index + 1).padStart(2, '0'), lang)}</span><span className="exhibit-rule" />{eyebrow.replace(/^\s*[0-9০-৯]{2}\s*[—-]\s*/, '')}</p>
      <h1 className="exhibit-title">{title}</h1>
      <div className="exhibit-copy">{children}</div>
    </div>
  </div>;
}

function NameReveal({ text, play }: { text: string; play: boolean }) {
  let cluster = 0;
  return <>{text.split(/(\s+)/).map((part, index) => part.trim() ?
    <span className="sig-word" key={index}><span className={`cinema-word${play ? ' cinema-word--play' : ''}`}>
      {segmentGraphemes(part).map((g, gi) => <span className="sig-c" key={gi} style={{ '--i': cluster++ } as React.CSSProperties}>{g}</span>)}
    </span></span> : <span key={index}>{part}</span>)}</>;
}

export function HeroScene({ reducedMotion, armed = true }: { reducedMotion: boolean; armed?: boolean }) {
  const { t, lang } = useLang();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return <div className="exhibit exhibit--0 exhibit-home">
    <div className="exhibit-sightline" aria-hidden="true"><span /></div>
    <div className="exhibit-body">
      <p className="exhibit-kicker"><span className="exhibit-index">{localizeDigits('01', lang)}</span><span className="exhibit-rule" />{t.profile.location}</p>
      <h1 className="hero-name"><NameReveal text={t.profile.nameFull} play={mounted && armed && !reducedMotion} /></h1>
      <p className="hero-profession">{t.profile.title}</p>
      <p className="hero-thesis">{t.profile.tagline}</p>
      <p className="hero-introduction">{t.hero.intro}</p>
      <div className="exhibit-actions">
        <a href={sectionHref(4, lang)}>{t.hero.ctaWork}</a>
        <a href={t.profile.github}>{t.hero.ctaGithub}</a>
      </div>
    </div>
    <p className="exhibit-groundnote">{t.hero.availability}</p>
  </div>;
}

export function StatsScene() {
  const { t, lang } = useLang();
  return <Inscription index={1} eyebrow={t.presence.eyebrow} title={t.presence.heading}>
    <ol className="engraved-list">{t.presence.items.map((p, i) => <li key={p.label}>
      <span className="engraved-number">{localizeDigits(String(i + 1).padStart(2, '0'), lang)}</span>
      <div><h2>{p.label}</h2><p>{p.detail}</p><small>{p.tools}</small></div>
    </li>)}</ol>
  </Inscription>;
}

export function AboutScene() {
  const { t } = useLang();
  return <Inscription index={2} eyebrow={t.about.eyebrow} title={t.about.heading}>
    <div className="exhibit-prose">{t.about.paragraphs.map((p, i) => <p key={i}>{p}</p>)}</div>
    <ul className="exhibit-principles">{t.about.principles.map(p => <li key={p}>{p}</li>)}</ul>
    <dl className="exhibit-facts">{t.about.facts.map(f => <div key={f.label}><dt>{f.label}</dt><dd>{f.value}</dd></div>)}</dl>
  </Inscription>;
}

export function WorkstationScene() {
  const { t, lang } = useLang();
  const w = t.workstation;
  return <Inscription index={3} eyebrow={w.eyebrow} title={w.heading}>
    <p className="exhibit-lead">{w.intro}</p>
    <ol className="engraved-list workstation-strata">{w.layers.map((l, i) => <li key={l.id}>
      <span className="engraved-number">{localizeDigits(String(i + 1).padStart(2, '0'), lang)}</span>
      <div><h2>{l.label}</h2><p>{l.detail}</p><small>{l.runs}</small><p className="exhibit-evidence">{l.evidence}</p></div>
    </li>)}</ol>
    <p className="exhibit-footnote">{w.note}</p>
  </Inscription>;
}

export function WorkScene() {
  const { t, lang } = useLang();
  const selected = t.openSource.selected.map(name => t.openSource.repos.find(r => r.name === name)).filter(Boolean);
  return <Inscription index={4} eyebrow={t.work.eyebrow} title={t.work.heading}>
    <div className="project-monuments">{t.work.projects.map((p, i) => <article className="project-monument" key={p.name}>
      <span className="engraved-number">{localizeDigits(String(i + 1).padStart(2, '0'), lang)}</span>
      <div><p className="project-state">{p.status} · {localizeDigits(p.year, lang)}</p><h2>{p.name}</h2><p className="project-tagline">{p.tagline}</p><p>{p.description}</p>
        <p className="exhibit-evidence">{p.evidence}</p>
        <div className="exhibit-actions"><a href={p.repo}>{t.work.codeLabel}</a>{p.websiteUrl && <a href={p.websiteUrl}>{t.work.liveLabel}</a>}</div>
      </div>
    </article>)}</div>
    <div className="exhibit-secondary"><h2>{t.work.nowBuilding.name}</h2><p>{t.work.nowBuilding.description}</p><p className="exhibit-evidence">{t.work.nowBuilding.testsNote}</p><a href={t.work.nowBuilding.url}>{t.work.nowBuilding.cta}</a></div>
    <div className="exhibit-secondary"><h2>{t.work.relationship.heading}</h2><p>{t.work.relationship.body}</p>
      {t.work.relationship.layers.map(l => <p key={l.name}><a href={l.repo}>{l.name} ↗</a> — {l.role}. {l.note}</p>)}
      <p className="exhibit-evidence">{t.work.relationship.verified}</p><p className="exhibit-evidence">{t.work.relationship.experimental}</p>
    </div>
    <div className="exhibit-secondary"><h2>{t.openSource.heading}</h2><p>{t.openSource.note}</p>
      <ul className="source-links">{selected.map(r => r && <li key={r.name}><a href={r.url}>{r.name} ↗</a><span>{r.desc}</span></li>)}</ul>
      <a href="https://github.com/soobujmiah">{t.openSource.moreLabel} ↗</a>
    </div>
  </Inscription>;
}

export function ResearchScene() {
  const { t, lang } = useLang();
  return <Inscription index={5} eyebrow={t.research.eyebrow} title={t.research.heading}>
    <ol className="engraved-list research-records">{t.research.entries.map((r, i) => <li key={r.title}>
      <span className="engraved-number">{localizeDigits(String(i + 1).padStart(2, '0'), lang)}</span>
      <div><small>{r.statusLabel}</small><h2>{r.title}</h2><p>{r.description}</p></div>
    </li>)}</ol>
  </Inscription>;
}

export function ExperienceScene() {
  const { t, lang } = useLang();
  return <Inscription index={6} eyebrow={t.experience.eyebrow} title={t.experience.heading}>
    <p className="exhibit-lead">{t.experience.intro}</p>
    <ol className="engraved-list experience-records">{t.experience.entries.map((w, i) => <li key={`${w.company}-${i}`}>
      <span className="engraved-number">{localizeDigits(w.period, lang)}</span>
      <div><h2>{w.role}</h2><small>{w.company} · {w.location}</small><p>{w.desc}</p></div>
    </li>)}</ol>
    <div className="exhibit-secondary"><h2>{t.experience.services.label}</h2><ul>{t.experience.services.items.map(x => <li key={x}>{x}</li>)}</ul></div>
  </Inscription>;
}

export function ContactScene() {
  const { t, lang } = useLang();
  return <Inscription index={7} eyebrow={t.contact.eyebrow} title={`${t.contact.headingA} ${t.contact.headingB}`}>
    <p className="exhibit-lead">{t.contact.sub} <a href={serviceHref(undefined, lang)}>{t.contact.servicesLink} ↗</a></p>
    <div className="contact-portal"><a href={t.contact.telegram.href}>{t.contact.telegram.value} <span aria-hidden>↗</span></a><span>{t.contact.telegram.label}</span></div>
    <div className="contact-portal"><a href={t.contact.email.href}>{t.contact.email.value} <span aria-hidden>↗</span></a><span>{t.contact.email.label}</span></div>
    <div className="exhibit-secondary"><h2>{t.contact.groupsHeading}</h2><p>{t.contact.groupsNote}</p>
      {t.contact.groups.map(g => <div className="contact-network" key={g.label}><h3>{g.label}</h3><ul>{g.links.map(l => <li key={l.href}><a href={l.href}>{l.label} ↗</a></li>)}</ul></div>)}
    </div>
  </Inscription>;
}
