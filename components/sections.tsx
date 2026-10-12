'use client';

import { useEffect, useState } from 'react';
import { useLang, localizeDigits } from '@/app/language';
import { segmentGraphemes } from '@/app/graphemes';
import { sectionHref } from '@/app/sections';
import { serviceHref } from '@/app/services';
import { WorldStory, type StoryBeat, type StoryControls } from '@/components/WorldStory';

function NameReveal({ text, play }: { text: string; play: boolean }) {
  let cluster = 0;
  return <>{text.split(/(\s+)/).map((part, index) => part.trim() ? <span className="sig-word" key={index}><span className={`cinema-word${play ? ' cinema-word--play' : ''}`}>{segmentGraphemes(part).map((g, gi) => <span className="sig-c" key={gi} style={{ '--i': cluster++ } as React.CSSProperties}>{g}</span>)}</span></span> : <span key={index}>{part}</span>)}</>;
}

export function HeroScene({ reducedMotion, armed = true, ...controls }: StoryControls & { reducedMotion: boolean; armed?: boolean }) {
  const { t, lang } = useLang();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const beats: StoryBeat[] = [
    { title: t.profile.title, body: <p>{t.profile.tagline}</p>, signal: t.profile.location,
      links: <><a href={sectionHref(4, lang)}>{t.hero.ctaWork}</a><a href={t.profile.github}>{t.hero.ctaGithub}</a></> },
    { title: lang === 'bn' ? 'ফোন থেকেই নির্মাণ' : 'Built from the phone', body: <p>{t.hero.intro}</p>, evidence: t.hero.availability,
      links: <a href={sectionHref(3, lang)}>{lang === 'bn' ? 'কর্মপরিবেশ দেখুন ↗' : 'See the workstation ↗'}</a> },
  ];
  return <WorldStory index={0} heading={t.profile.nameFull} beats={beats} controls={controls}
    heroName={<NameReveal text={t.profile.nameFull} play={mounted && armed && !reducedMotion} />} />;
}

export function StatsScene(controls: StoryControls) {
  const { t } = useLang(); const p = t.presence;
  const beats: StoryBeat[] = p.items.map(item => ({ title: item.label, body: <p>{item.detail}</p>, evidence: item.tools }));
  return <WorldStory index={1} heading={p.heading} beats={beats} controls={controls} />;
}

export function AboutScene(controls: StoryControls) {
  const { t, lang } = useLang(); const a = t.about;
  const titles = lang === 'bn' ? ['পরিচয়', 'সীমার মধ্যে নির্মাণ', 'শেখার পদ্ধতি'] : ['The builder', 'The constraint', 'The method'];
  const beats: StoryBeat[] = a.paragraphs.map((paragraph, i) => ({ title: titles[i] ?? a.heading, body: <p>{paragraph}</p> }));
  beats.push({ title: lang === 'bn' ? 'কাজের নীতি' : 'Working principles', body: <p>{a.principles.join(' · ')}</p> });
  a.facts.forEach(fact => beats.push({ title: fact.label, body: <p>{fact.value}</p> }));
  return <WorldStory index={2} heading={a.heading} beats={beats} controls={controls} />;
}

export function WorkstationScene(controls: StoryControls) {
  const { t } = useLang(); const w = t.workstation;
  const beats: StoryBeat[] = w.layers.map((layer, i) => ({
    title: layer.label,
    body: <><p>{i === 0 && w.intro} {layer.detail}</p><p>{layer.runs}</p></>,
    evidence: <>{layer.evidence}{i === w.layers.length - 1 && <> {w.note}</>}</>,
  }));
  return <WorldStory index={3} heading={w.heading} beats={beats} controls={controls} />;
}

export function WorkScene(controls: StoryControls) {
  const { t, lang } = useLang(); const w = t.work;
  const proofs = lang === 'bn' ? [
    'অ্যাড্রেনো ৮২৫-এ জিঙ্ক/টার্নিপ পথ মাপা হয়েছে; ব্লেন্ডারের সাইকেলস জিপিইউ রেন্ডারিং দাবি করা হচ্ছে না।',
    'উৎস থেকে এপিকে তৈরি, স্বাক্ষর, ইনস্টল, জেএনআই লোড ও চালানো বাস্তব ডিভাইসে যাচাই করা।',
    'সিপিইউ ইনফারেন্স যাচাই করা; জিপিইউ ও এনপিইউ পথ এখনো পরীক্ষাধীন।',
    'ডার্ট কোরের ১৪৩টি এবং উইজেট/কন্ট্রোলারের ৩৫৩টি পরীক্ষা।',
  ] : [
    'Adreno 825 Zink/Turnip path measured; Blender Cycles GPU rendering is not claimed.',
    'Source → APK → sign → install → JNI load → run, validated on device.',
    'CPU inference validated; GPU and NPU paths remain under qualification.',
    '143 pure-Dart core tests and 353 widget/controller tests.',
  ];
  const beats: StoryBeat[] = w.projects.map((project, i) => ({
    title: project.name, signal: `${project.status} · ${localizeDigits(project.year, lang)}`,
    body: <><p>{project.tagline}</p><span className="sr-only">{project.description} {project.role} {project.evidence}</span></>,
    evidence: proofs[i],
    links: <><a href={project.repo}>{w.codeLabel}</a>{project.websiteUrl && <a href={project.websiteUrl}>{w.liveLabel}</a>}</>,
  }));
  beats.push({ title: lang === 'bn' ? 'এসকেবি · জ্ঞান অবকাঠামো' : 'SKB · knowledge infrastructure',
    body: <p>{lang === 'bn' ? 'প্রকল্প, সিদ্ধান্ত ও প্রমাণের ধারাবাহিকতা ধরে রাখার ব্যক্তিগত জ্ঞানভাণ্ডার। উৎস ব্যক্তিগত।' : 'A private knowledge base that preserves continuity across projects, decisions and evidence. Its source is private.'}</p> });
  beats.push({ title: w.nowBuilding.name, signal: w.nowBuilding.eyebrow,
    body: <p>{w.nowBuilding.description}</p>, evidence: w.nowBuilding.testsNote,
    links: <a href={w.nowBuilding.url}>{w.nowBuilding.cta}</a> });
  beats.push({ title: w.relationship.heading,
    body: <><p>{w.relationship.body}</p>{w.relationship.layers.map(layer => <p key={layer.name}>{layer.name}: {layer.role}. {layer.note}</p>)}</>,
    evidence: <>{w.relationship.verified} {w.relationship.experimental}</>,
    links: w.relationship.layers.map(layer => <a key={layer.name} href={layer.repo}>{layer.name} ↗</a>) });
  const selected = t.openSource.selected.map(name => t.openSource.repos.find(repo => repo.name === name)).filter(repo => Boolean(repo));
  beats.push({ title: t.openSource.heading, body: <p>{t.openSource.note}</p>,
    links: <>{selected.map(repo => repo && <a key={repo.name} href={repo.url}>{repo.name} ↗</a>)}<a href="https://github.com/soobujmiah">{t.openSource.moreLabel} ↗</a></> });
  return <WorldStory index={4} heading={w.heading} beats={beats} controls={controls} />;
}

export function ResearchScene(controls: StoryControls) {
  const { t } = useLang(); const r = t.research;
  const beats: StoryBeat[] = r.entries.map(entry => ({ title: entry.title, signal: entry.statusLabel, body: <p>{entry.description}</p> }));
  return <WorldStory index={5} heading={r.heading} beats={beats} controls={controls} />;
}

export function ExperienceScene(controls: StoryControls) {
  const { t, lang } = useLang(); const e = t.experience;
  const beats: StoryBeat[] = [{ title: e.professionalLabel, body: <p>{e.intro}</p> }];
  e.entries.forEach(entry => beats.push({ title: entry.role, signal: localizeDigits(entry.period, lang),
    body: <><p>{entry.company} · {entry.location}</p><p>{entry.desc}</p></> }));
  beats.push({ title: e.services.label, body: <p>{e.services.items.join(' · ')}</p> });
  return <WorldStory index={6} heading={e.heading} beats={beats} controls={controls} />;
}

export function ContactScene(controls: StoryControls) {
  const { t, lang } = useLang(); const c = t.contact;
  const beats: StoryBeat[] = [
    { title: `${c.headingA} ${c.headingB}`, body: <p>{c.sub}</p>,
      links: <><a href={c.telegram.href}>{c.telegram.label}: {c.telegram.value} ↗</a><a href={serviceHref(undefined, lang)}>{c.servicesLink} ↗</a></> },
    { title: c.email.label, body: <p>{c.email.value}</p>, links: <a href={c.email.href}>{c.email.value} ↗</a> },
  ];
  c.groups.forEach((group, i) => beats.push({ title: group.label, body: i === 0 ? <p>{c.groupsNote}</p> : undefined,
    links: group.links.map(link => <a key={link.href} href={link.href}>{link.label} ↗</a>) }));
  return <WorldStory index={7} heading={c.groupsHeading} beats={beats} controls={controls} />;
}
