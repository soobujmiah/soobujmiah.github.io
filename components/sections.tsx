'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { useLang, localizeDigits } from '@/app/language';
import { segmentGraphemes } from '@/app/graphemes';
import { sectionHref } from '@/app/sections';
import { serviceHref } from '@/app/services';

/* One inscription per shot. The full evidence is available by opening the
   field record below the frame instead of covering the three-dimensional work. */
function Chapter({ index, title, lead, cue, children, actions }: {
  index: number; title: string; lead: string; cue: string; children: ReactNode; actions?: ReactNode;
}) {
  const { lang } = useLang();
  return <section className={`film-chapter film-chapter--${index}`}>
    <div className="film-frame">
      <div className="film-caption">
        <p className="film-cue"><span>{localizeDigits(String(index + 1).padStart(2, '0'), lang)}</span><span className="film-cue-line" />{cue.replace(/^\s*[0-9০-৯]{2}\s*[—-]\s*/, '')}</p>
        <h1 className="film-title">{title}</h1>
        <p className="film-lead">{lead}</p>
        {actions && <div className="film-actions">{actions}</div>}
      </div>
      <span className="film-axis" aria-hidden="true" />
    </div>
    <details className="field-record"><summary>{lang === 'bn' ? 'প্রমাণ ও বিস্তারিত পড়ুন' : 'Open the field record'} <span aria-hidden="true">↗</span></summary><div className="field-record-body">{children}</div></details>
  </section>;
}

function NameReveal({ text, play }: { text: string; play: boolean }) {
  let cluster = 0;
  return <>{text.split(/(\s+)/).map((part, index) => part.trim() ? <span className="sig-word" key={index}><span className={`cinema-word${play ? ' cinema-word--play' : ''}`}>{segmentGraphemes(part).map((g, gi) => <span className="sig-c" key={gi} style={{ '--i': cluster++ } as React.CSSProperties}>{g}</span>)}</span></span> : <span key={index}>{part}</span>)}</>;
}

export function HeroScene({ reducedMotion, armed = true }: { reducedMotion: boolean; armed?: boolean }) {
  const { t, lang } = useLang();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return <section className="film-chapter film-chapter--0 film-home">
    <div className="film-frame"><div className="film-identity">
      <p className="film-cue"><span>{localizeDigits('01', lang)}</span><span className="film-cue-line" />{t.profile.location}</p>
      <h1 className="hero-name"><NameReveal text={t.profile.nameFull} play={mounted && armed && !reducedMotion} /></h1>
      <p className="film-role">{t.profile.title}</p><p className="film-thesis">{t.profile.tagline}</p>
      <div className="film-actions"><a href={sectionHref(4, lang)}>{t.hero.ctaWork}</a><a href={t.profile.github}>{t.hero.ctaGithub}</a></div>
    </div></div>
    <details className="field-record"><summary>{lang === 'bn' ? 'ভূমিকা পড়ুন' : 'Read the introduction'} <span aria-hidden="true">↗</span></summary><div className="field-record-body"><p>{t.hero.intro}</p><p>{t.hero.availability}</p></div></details>
  </section>;
}

export function StatsScene() {
  const { t, lang } = useLang(); const p = t.presence;
  return <Chapter index={1} title={p.heading} cue={p.eyebrow} lead={p.items[0].detail}><div className="record-grid">{p.items.map((item, i) => <article key={item.label}><small>{localizeDigits(String(i + 1).padStart(2, '0'), lang)} / {item.tools}</small><h2>{item.label}</h2><p>{item.detail}</p></article>)}</div></Chapter>;
}

export function AboutScene() {
  const { t } = useLang(); const a = t.about;
  return <Chapter index={2} title={a.heading} cue={a.eyebrow} lead={a.paragraphs[0]}><div className="record-prose">{a.paragraphs.slice(1).map((p, i) => <p key={i}>{p}</p>)}</div><ul className="record-keywords">{a.principles.map(p => <li key={p}>{p}</li>)}</ul><dl className="record-facts">{a.facts.map(f => <div key={f.label}><dt>{f.label}</dt><dd>{f.value}</dd></div>)}</dl></Chapter>;
}

export function WorkstationScene() {
  const { t, lang } = useLang(); const w = t.workstation;
  return <Chapter index={3} title={w.heading} cue={w.eyebrow} lead={w.intro}><ol className="record-stack">{w.layers.map((l, i) => <li key={l.id}><span>{localizeDigits(String(i + 1).padStart(2, '0'), lang)}</span><div><h2>{l.label}</h2><p>{l.detail}</p><small>{l.runs}</small><p className="record-evidence">{l.evidence}</p></div></li>)}</ol><p className="record-evidence">{w.note}</p></Chapter>;
}

export function WorkScene() {
  const { t, lang } = useLang(); const [selected, setSelected] = useState(0); const projects = t.work.projects; const p = projects[selected];
  const focus = (i: number) => { setSelected(i); window.dispatchEvent(new CustomEvent('portfolio-project', { detail: i })); };
  useEffect(() => { window.dispatchEvent(new CustomEvent('portfolio-project', { detail: selected })); }, [selected]);
  return <Chapter index={4} title={p.name} cue={t.work.eyebrow} lead={p.tagline} actions={<><span className="film-status">{p.status} · {localizeDigits(p.year, lang)}</span><nav className="film-project-selector" aria-label={lang === 'bn' ? 'প্রকল্প নির্বাচন' : 'Select a project'}>{projects.map((project, i) => <button type="button" aria-current={i === selected ? 'true' : undefined} key={project.name} onClick={() => focus(i)}>{project.name}</button>)}</nav><a href={p.repo}>{t.work.codeLabel}</a>{p.websiteUrl && <a href={p.websiteUrl}>{t.work.liveLabel}</a>}</>}>
    <div className="record-project"><h2>{p.name}</h2><p>{p.description}</p><p>{p.role}</p><p className="record-evidence">{p.evidence}</p></div>
    <div className="record-grid"><article><h2>{t.work.nowBuilding.name}</h2><p>{t.work.nowBuilding.description}</p><p className="record-evidence">{t.work.nowBuilding.testsNote}</p><a href={t.work.nowBuilding.url}>{t.work.nowBuilding.cta}</a></article><article><h2>{t.work.relationship.heading}</h2><p>{t.work.relationship.body}</p><p className="record-evidence">{t.work.relationship.verified}</p><p className="record-evidence">{t.work.relationship.experimental}</p></article><article><h2>{lang === 'bn' ? 'জ্ঞান অবকাঠামো' : 'Knowledge infrastructure'}</h2><p>{lang === 'bn' ? 'এসকেবি প্রকল্প, সিদ্ধান্ত ও প্রমাণের ধারাবাহিকতা ধরে রাখার ব্যক্তিগত জ্ঞানভাণ্ডার।' : 'SKB is a private knowledge base for continuity across projects, decisions and evidence. Its source is not public.'}</p></article></div>
    <div className="record-sources"><h2>{t.openSource.heading}</h2><p>{t.openSource.note}</p><p>{t.openSource.selected.map(name => t.openSource.repos.find(r => r.name === name)).filter(r => Boolean(r)).map(r => r && <a key={r.name} href={r.url}>{r.name} ↗</a>)}</p><a href="https://github.com/soobujmiah">{t.openSource.moreLabel} ↗</a></div>
  </Chapter>;
}

export function ResearchScene() {
  const { t, lang } = useLang(); const r = t.research;
  return <Chapter index={5} title={r.heading} cue={r.eyebrow} lead={r.entries[0].description}><div className="record-grid">{r.entries.map((entry, i) => <article key={entry.title}><small>{localizeDigits(String(i + 1).padStart(2, '0'), lang)} / {entry.statusLabel}</small><h2>{entry.title}</h2><p>{entry.description}</p></article>)}</div></Chapter>;
}

export function ExperienceScene() {
  const { t, lang } = useLang(); const e = t.experience;
  return <Chapter index={6} title={e.heading} cue={e.eyebrow} lead={e.intro}><ol className="record-stack">{e.entries.map((entry, i) => <li key={`${entry.company}-${i}`}><span>{localizeDigits(entry.period, lang)}</span><div><h2>{entry.role}</h2><small>{entry.company} · {entry.location}</small><p>{entry.desc}</p></div></li>)}</ol><h2>{e.services.label}</h2><ul className="record-keywords">{e.services.items.map(x => <li key={x}>{x}</li>)}</ul></Chapter>;
}

export function ContactScene() {
  const { t, lang } = useLang(); const c = t.contact;
  return <Chapter index={7} title={`${c.headingA} ${c.headingB}`} cue={c.eyebrow} lead={c.sub} actions={<><a href={c.telegram.href}>{c.telegram.value} ↗</a><a href={c.email.href}>{c.email.value} ↗</a></>}><p><a href={serviceHref(undefined, lang)}>{c.servicesLink} ↗</a></p><h2>{c.groupsHeading}</h2><p>{c.groupsNote}</p><div className="record-grid">{c.groups.map(g => <article key={g.label}><h3>{g.label}</h3><p>{g.links.map(l => <a key={l.href} href={l.href}>{l.label} ↗</a>)}</p></article>)}</div></Chapter>;
}
