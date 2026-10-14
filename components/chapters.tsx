'use client';

/* ═══════════════════════════════════════════════════════════════
   THE EIGHT CHAPTERS — one stratum of the machine each.

   Every chapter is built from the same four primitives in
   `components/record.tsx` (Chapter · Block · Rows · Record), so the
   site has one presentation language instead of a per-page layout.
   The differences between chapters are differences of CONTENT, not
   of vocabulary: a project record and a role record are the same
   shape because they are the same kind of claim.

   Nothing here measures, animates or touches a canvas. These are
   plain server-renderable trees, which is why every route ships its
   full text in the static HTML — the environment behind them is
   scaffolding the reader can lose without losing the document.

   All copy comes from `app/content.ts`. No string is written here,
   in either language: the bilingual purity gate can only hold if
   this layer never invents text.
   ═══════════════════════════════════════════════════════════════ */

import { useLang, localizeDigits } from '@/app/language';
import { PAGE_COUNT, sectionHref } from '@/app/sections';
import { serviceHref } from '@/app/services';
import { verificationHref } from '@/app/verification-routes';
import {
  Block,
  Chapter,
  Prose,
  Record,
  Ref,
  Refs,
  Rows,
  Tags,
  type State,
} from '@/components/record';

/* The content tree's eyebrows carry a hand-written chapter number
   ("04 — Featured Work") from the build where the reader could not
   tell where they were. The depth rail answers that now, and two
   eyebrows both said "04", so the index is stripped and only the
   name survives. Bengali digits are stripped too. */
function plainLabel(label: string): string {
  return label.replace(/^[\d০-৯]+\s*[—–-]\s*/, '');
}

/** The research status enum maps onto the record system's states. */
const RESEARCH_STATE: { [status: string]: State } = {
  validated: 'verified',
  experimental: 'experimental',
  investigating: 'investigating',
};

type ChapterProps = { index: number };

/* ── 00 · surface — who this is ──────────────────────────────────
   The glass: the first thing a reader touches. Identity, what the
   work is, and the two ways deeper into it. */
export function SurfaceChapter({ index }: ChapterProps) {
  const { t, lang } = useLang();
  return (
    <Chapter
      index={index}
      total={PAGE_COUNT}
      stratum={t.ui.strata[index] ?? ''}
      heading={t.profile.nameFull}
      headingClass="chapter-heading--name"
      lede={
        <>
          <p className="lede-role">{t.profile.title}</p>
          <p className="lede-line">{t.profile.tagline}</p>
        </>
      }
    >
      <Prose paragraphs={[t.hero.intro]} />
      <Rows items={[{ label: t.profile.location, value: t.hero.availability }]} />
      <Refs>
        <Ref href={sectionHref(4, lang)} strong>
          {t.hero.ctaWork}
        </Ref>
        <Ref href={t.profile.github}>{t.profile.github.replace(/^https?:\/\//, '')}</Ref>
        <Ref href={serviceHref(undefined, lang)}>{t.header.servicesLabel}</Ref>
      </Refs>
    </Chapter>
  );
}

/* ── 01 · display — the instruments ──────────────────────────────
   What the work actually is, and the tools each part is done with.
   A definition list, because that is literally its structure. */
export function DisplayChapter({ index }: ChapterProps) {
  const { t } = useLang();
  const p = t.presence;
  return (
    <Chapter
      index={index}
      total={PAGE_COUNT}
      stratum={t.ui.strata[index] ?? ''}
      eyebrow={plainLabel(p.eyebrow)}
      heading={p.heading}
    >
      {p.items.map((item) => (
        <Record key={item.label} title={item.label}>
          <Prose paragraphs={[item.detail]} />
          <p className="record-tools">{item.tools}</p>
        </Record>
      ))}
    </Chapter>
  );
}

/* ── 02 · silicon — the constraint ───────────────────────────────
   The layer the work is shaped by: one phone, no second machine.
   Prose first, then the principles and the plain facts. */
export function SiliconChapter({ index }: ChapterProps) {
  const { t } = useLang();
  const a = t.about;
  return (
    <Chapter
      index={index}
      total={PAGE_COUNT}
      stratum={t.ui.strata[index] ?? ''}
      eyebrow={plainLabel(a.eyebrow)}
      heading={a.heading}
    >
      <Prose paragraphs={a.paragraphs} />
      <Block label={plainLabel(a.eyebrow)}>
        <Tags items={a.principles} />
      </Block>
      <Rows items={a.facts.map((fact) => ({ label: fact.label, value: fact.value }))} />
    </Chapter>
  );
}

/* ── 03 · userland — the workstation ─────────────────────────────
   The machine this site was built inside, as a dependency chain
   rather than a product shot. Each layer says what runs there and
   what the claim rests on. */
export function UserlandChapter({ index }: ChapterProps) {
  const { t, lang } = useLang();
  const w = t.workstation;
  return (
    <Chapter
      index={index}
      total={PAGE_COUNT}
      stratum={t.ui.strata[index] ?? ''}
      eyebrow={plainLabel(w.eyebrow)}
      heading={w.heading}
      lede={<p>{w.intro}</p>}
    >
      {w.layers.map((layer, i) => (
        <Record
          key={layer.id}
          title={layer.label}
          stamp={localizeDigits(String(i + 1).padStart(2, '0'), lang)}
          evidence={layer.evidence}
          evidenceLabel={w.evidenceLabel}
        >
          <Prose paragraphs={[layer.detail]} />
          <Rows items={[{ label: w.runsLabel, value: layer.runs }]} />
        </Record>
      ))}
      <p className="chapter-note">{w.note}</p>
    </Chapter>
  );
}

/* ── 04 · toolchain — the work ───────────────────────────────────
   The projects that needed native ARM64 tooling, each with its
   status, what it is, the role taken, and the evidence. Then the
   ecosystem relationship and the rest of the repositories. */
export function ToolchainChapter({ index }: ChapterProps) {
  const { t, lang } = useLang();
  const w = t.work;
  const os = t.openSource;
  const selected = os.selected
    .map((name) => os.repos.find((repo) => repo.name === name))
    .filter((repo): repo is NonNullable<typeof repo> => Boolean(repo));

  return (
    <Chapter
      index={index}
      total={PAGE_COUNT}
      stratum={t.ui.strata[index] ?? ''}
      eyebrow={plainLabel(w.eyebrow)}
      heading={w.heading}
    >
      {w.projects.map((project) => (
        <Record
          key={project.name}
          title={project.name}
          state="verified"
          stamp={`${project.status} · ${localizeDigits(project.year, lang)}`}
          evidence={project.evidence}
          evidenceLabel={w.evidenceLabel}
          refs={
            <Refs>
              <Ref href={project.repo}>{w.codeLabel}</Ref>
              {project.websiteUrl && <Ref href={project.websiteUrl}>{w.liveLabel}</Ref>}
            </Refs>
          }
        >
          <Prose paragraphs={[project.tagline, project.description]} />
          <Rows items={[{ label: w.roleLabel, value: project.role }]} />
          <Tags items={project.topics} />
        </Record>
      ))}

      <Record
        title={w.nowBuilding.name}
        state="live"
        stamp={plainLabel(w.nowBuilding.eyebrow)}
        evidence={w.nowBuilding.testsNote}
        evidenceLabel={w.evidenceLabel}
        refs={<Ref href={w.nowBuilding.url}>{w.nowBuilding.cta}</Ref>}
      >
        <Prose paragraphs={[w.nowBuilding.description]} />
      </Record>

      <Block label={w.relationship.heading} note={plainLabel(w.relationship.eyebrow)}>
        <Prose paragraphs={[w.relationship.body]} />
        <Rows
          items={w.relationship.layers.map((layer) => ({
            label: layer.name,
            value: (
              <>
                {layer.role}. {layer.note}{' '}
                <Refs>
                  <Ref href={layer.repo}>{t.ui.repoWord}</Ref>
                  <Ref href={layer.websiteUrl}>{t.ui.liveSiteWord}</Ref>
                </Refs>
              </>
            ),
          }))}
        />
        <Rows
          items={[
            { label: w.relationship.verifiedLabel, value: w.relationship.verified, state: 'verified' },
            {
              label: w.relationship.experimentalLabel,
              value: w.relationship.experimental,
              state: 'experimental',
            },
          ]}
        />
      </Block>

      <Block label={os.heading} note={plainLabel(os.eyebrow)}>
        <Prose paragraphs={[os.note]} />
        <Rows
          items={selected.map((repo) => ({
            label: repo.name,
            value: (
              <>
                {repo.desc} · {repo.lang}
                {repo.tier === 'applied' && <> · {os.appliedBadge}</>}{' '}
                <Refs>
                  <Ref href={repo.url}>{os.codeLabel}</Ref>
                  {repo.websiteUrl && <Ref href={repo.websiteUrl}>{os.liveLabel}</Ref>}
                </Refs>
              </>
            ),
          }))}
        />
        <p className="chapter-note">{os.moreSub}</p>
        <Ref href={t.profile.github}>{os.moreLabel}</Ref>
      </Block>
    </Chapter>
  );
}

/* ── 05 · frontier — the unqualified edge ────────────────────────
   Experiments that are not finished claims. The marks are hollow
   on purpose: this chapter is where the site says "not yet". */
export function FrontierChapter({ index }: ChapterProps) {
  const { t } = useLang();
  const r = t.research;
  return (
    <Chapter
      index={index}
      total={PAGE_COUNT}
      stratum={t.ui.strata[index] ?? ''}
      eyebrow={plainLabel(r.eyebrow)}
      heading={r.heading}
    >
      {r.entries.map((entry) => (
        <Record
          key={entry.title}
          title={entry.title}
          state={RESEARCH_STATE[entry.status] ?? 'experimental'}
          stamp={entry.statusLabel}
        >
          <Prose paragraphs={[entry.description]} />
        </Record>
      ))}
    </Chapter>
  );
}

/* ── 06 · bus — the line through the years ───────────────────────
   Where the work has been applied. Roles are records like
   everything else; the period is the stamp. */
export function BusChapter({ index }: ChapterProps) {
  const { t, lang } = useLang();
  const e = t.experience;
  return (
    <Chapter
      index={index}
      total={PAGE_COUNT}
      stratum={t.ui.strata[index] ?? ''}
      eyebrow={plainLabel(e.eyebrow)}
      heading={e.heading}
      lede={<p>{e.intro}</p>}
    >
      <Block label={e.professionalLabel}>
        {e.entries.map((entry) => (
          <Record
            key={`${entry.role}-${entry.period}`}
            title={entry.role}
            stamp={localizeDigits(entry.period, lang)}
          >
            <Rows
              items={[{ label: entry.company, value: entry.location }]}
            />
            <Prose paragraphs={[entry.desc]} />
          </Record>
        ))}
      </Block>
      <Block label={e.services.label}>
        <Tags items={e.services.items} />
        <Ref href={serviceHref(undefined, lang)}>{t.header.servicesLabel}</Ref>
      </Block>
    </Chapter>
  );
}

/* ── 07 · port — the way out ─────────────────────────────────────
   The last stratum is the only one that faces outward: every real
   channel, once, as one list. */
export function PortChapter({ index }: ChapterProps) {
  const { t, lang } = useLang();
  const c = t.contact;
  return (
    <Chapter
      index={index}
      total={PAGE_COUNT}
      stratum={t.ui.strata[index] ?? ''}
      eyebrow={plainLabel(c.eyebrow)}
      heading={`${c.headingA} ${c.headingB}`}
      lede={<p>{c.sub}</p>}
    >
      <Rows
        items={[
          {
            label: c.telegram.label,
            value: (
              <Ref href={c.telegram.href} strong>
                {c.telegram.value}
              </Ref>
            ),
          },
          {
            label: c.email.label,
            value: (
              <Ref href={c.email.href} strong>
                {c.email.value}
              </Ref>
            ),
          },
        ]}
      />
      <Block label={c.groupsHeading} note={c.groupsNote}>
        {c.groups.map((group) => (
          <Rows
            key={group.label}
            items={[
              {
                label: group.label,
                value: (
                  <Refs>
                    {group.links.map((link) => (
                      <Ref key={link.href} href={link.href}>
                        {link.label}
                      </Ref>
                    ))}
                  </Refs>
                ),
              },
            ]}
          />
        ))}
      </Block>
      <Refs>
        <Ref href={serviceHref(undefined, lang)}>{c.servicesLink}</Ref>
        <Ref href={verificationHref(lang)}>{t.footer.proofLink}</Ref>
      </Refs>
    </Chapter>
  );
}

/** The chapters in `SECTION_IDS` order — the only place that order
    is turned into components, so the journey host never switches on
    an index it has hard-coded itself. */
export const CHAPTERS = [
  SurfaceChapter,
  DisplayChapter,
  SiliconChapter,
  UserlandChapter,
  ToolchainChapter,
  FrontierChapter,
  BusChapter,
  PortChapter,
] as const;
