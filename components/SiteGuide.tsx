'use client';

/* ═══════════════════════════════════════════════════════════════
   SITE GUIDE — compact local Q&A panel (no external AI).

   Floating trigger + panel. Anchored bottom-start so it never covers
   the centred name morph, primary CTAs, or the bottom HUD control.
   ═══════════════════════════════════════════════════════════════ */

import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { useLang } from '@/app/language';
import { answerSiteQuestion } from '@/app/site-guide';

type Msg = { role: 'user' | 'guide'; text: string; href?: string };

export function SiteGuide() {
  const { t, lang } = useLang();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const panelId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    const tFocus = window.setTimeout(() => inputRef.current?.focus(), 40);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.clearTimeout(tFocus);
    };
  }, [open]);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' });
  }, [msgs, open]);

  // Clear thread on language switch so answers stay language-pure.
  useEffect(() => {
    setMsgs([]);
    setInput('');
  }, [lang]);

  const ask = useCallback(
    (raw: string) => {
      const q = raw.trim();
      if (!q) return;
      const ans = answerSiteQuestion(q, lang);
      setMsgs((m) => [...m, { role: 'user', text: q }, { role: 'guide', text: ans.text, href: ans.href }]);
      setInput('');
    },
    [lang],
  );

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    ask(input);
  };

  return (
    <div className="site-guide" data-open={open ? 'true' : 'false'}>
      {open && (
        <div
          id={panelId}
          className="site-guide-panel"
          role="dialog"
          aria-modal="false"
          aria-label={t.ui.siteGuideTitle}
        >
          <div className="site-guide-head">
            <p className="site-guide-title">{t.ui.siteGuideTitle}</p>
            <button
              type="button"
              className="site-guide-x"
              aria-label={t.ui.siteGuideClose}
              onClick={() => setOpen(false)}
            >
              ×
            </button>
          </div>

          <div className="site-guide-body" ref={listRef}>
            {msgs.length === 0 && (
              <div className="site-guide-empty">
                <p>{t.ui.siteGuideEmpty}</p>
                <ul className="site-guide-hints">
                  {t.ui.siteGuideHints.map((h) => (
                    <li key={h}>
                      <button type="button" className="site-guide-hint" onClick={() => ask(h)}>
                        {h}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {msgs.map((m, i) => (
              <div key={`${m.role}-${i}`} className={`site-guide-msg site-guide-msg--${m.role}`}>
                <p className="site-guide-msg-text">{m.text}</p>
                {m.href && (
                  <a href={m.href} className="site-guide-link">
                    {m.href}
                  </a>
                )}
              </div>
            ))}
          </div>

          <form className="site-guide-form" onSubmit={onSubmit}>
            <input
              ref={inputRef}
              type="text"
              className="site-guide-input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={t.ui.siteGuidePlaceholder}
              autoComplete="off"
              enterKeyHint="send"
              maxLength={200}
              aria-label={t.ui.siteGuidePlaceholder}
            />
            <button type="submit" className="site-guide-send" disabled={!input.trim()}>
              {t.ui.siteGuideSubmit}
            </button>
          </form>
        </div>
      )}

      <button
        type="button"
        className="site-guide-fab"
        aria-label={open ? t.ui.siteGuideClose : t.ui.siteGuideOpen}
        aria-expanded={open}
        aria-controls={open ? panelId : undefined}
        onClick={() => setOpen((v) => !v)}
      >
        <span className="site-guide-fab-icon" aria-hidden>
          {open ? '×' : '?'}
        </span>
        <span className="site-guide-fab-label">{open ? t.ui.siteGuideClose : t.ui.siteGuideOpen}</span>
      </button>
    </div>
  );
}
