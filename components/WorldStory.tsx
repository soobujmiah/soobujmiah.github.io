'use client';

import { useEffect, type ReactNode } from 'react';
import { useLang, localizeDigits } from '@/app/language';

export type StoryBeat = {
  title: string;
  body: ReactNode;
  evidence?: ReactNode;
  links?: ReactNode;
  signal?: string;
};

export type StoryControls = {
  beat: number;
  onBeat: (beat: number) => void;
  onBeatCount: (count: number) => void;
};

/** Every beat is server-rendered. JavaScript turns the text into a sequence
 *  of labels projected from real scene anchors; without it all beats remain
 *  a readable, semantic document. */
export function WorldStory({ index, heading, beats, controls, heroName }: {
  index: number;
  heading: string;
  beats: StoryBeat[];
  controls: StoryControls;
  heroName?: ReactNode;
}) {
  const { lang } = useLang();
  const { beat, onBeat, onBeatCount } = controls;
  useEffect(() => onBeatCount(beats.length), [beats.length, onBeatCount]);
  const active = Math.max(0, Math.min(beats.length - 1, beat));
  return <section className={`world-story world-story--${index}`} data-story-index={index}>
    {!heroName && <h1 className="sr-only">{heading}</h1>}
    <div className="world-beats" aria-live="polite">
      {beats.map((item, i) => <article className="world-beat" data-beat={i} data-active={i === active} key={`${index}-${i}`}>
        <span className="world-beat-number">{localizeDigits(String(i + 1).padStart(2, '0'), lang)}<span aria-hidden="true"> / </span>{localizeDigits(String(beats.length).padStart(2, '0'), lang)}</span>
        {i === 0 && heroName && <h1 className="hero-name">{heroName}</h1>}
        <h2>{item.title}</h2>
        {item.signal && <p className="world-beat-signal">{item.signal}</p>}
        <div className="world-beat-body">{item.body}</div>
        {item.evidence && <p className="world-beat-evidence">{item.evidence}</p>}
        {item.links && <div className="world-beat-links">{item.links}</div>}
      </article>)}
    </div>
    {beats.length > 1 && <nav className="world-beat-nav" aria-label={lang === 'bn' ? 'দৃশ্যের অংশ' : 'Scene sequence'}>
      <button type="button" onClick={() => onBeat(Math.max(0, active - 1))} disabled={active === 0} aria-label={lang === 'bn' ? 'আগের অংশ' : 'Previous scene beat'}>←</button>
      <span>{localizeDigits(String(active + 1).padStart(2, '0'), lang)} <span aria-hidden="true">/</span> {localizeDigits(String(beats.length).padStart(2, '0'), lang)}</span>
      <button type="button" onClick={() => onBeat(Math.min(beats.length - 1, active + 1))} disabled={active === beats.length - 1} aria-label={lang === 'bn' ? 'পরের অংশ' : 'Next scene beat'}>→</button>
      <div className="world-beat-dots">{beats.map((item, i) => <button type="button" key={i} aria-label={item.title} aria-current={i === active ? 'step' : undefined} onClick={() => onBeat(i)} />)}</div>
    </nav>}
  </section>;
}
