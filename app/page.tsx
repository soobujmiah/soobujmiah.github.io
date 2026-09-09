import {
  hero,
  about,
  projects,
  research,
  techDomains,
  githubRepos,
  timeline,
  contact,
  profile,
} from '@/lib/data';

/* ─── tiny helpers ─── */
const section = (id: string, label: string, children: React.ReactNode) => (
  <section id={id} className="scroll-mt-20 py-20 md:py-28">
    <div className="mx-auto max-w-6xl px-5 sm:px-8">
      <p className="mb-3 font-mono text-xs uppercase tracking-[0.2em] text-accent">
        {label}
      </p>
      {children}
    </div>
  </section>
);

/* ─── nav ─── */
const navLinks = [
  { href: '#about', label: 'About' },
  { href: '#work', label: 'Work' },
  { href: '#research', label: 'Research' },
  { href: '#stack', label: 'Stack' },
  { href: '#open-source', label: 'Open Source' },
  { href: '#contact', label: 'Contact' },
];

function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-ink-800/60 bg-ink-950/80 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-5 sm:px-8">
        <a href="#" className="font-mono text-sm font-medium tracking-tight text-ink-100">
          sobuj<span className="text-accent">.</span>miah
        </a>
        <nav className="hidden gap-6 md:flex">
          {navLinks.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="text-sm text-ink-400 transition-colors hover:text-ink-100"
            >
              {l.label}
            </a>
          ))}
        </nav>
        <a
          href="https://github.com/soobujmiah"
          className="rounded-md border border-ink-700 px-3 py-1.5 text-xs font-medium text-ink-300 transition-colors hover:border-accent hover:text-accent"
        >
          GitHub
        </a>
      </div>
    </header>
  );
}

/* ─── hero ─── */
function Hero() {
  return (
    <section className="relative overflow-hidden pb-16 pt-24 md:pb-24 md:pt-36">
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <p className="mb-6 font-mono text-xs uppercase tracking-[0.25em] text-accent">
          {hero.tagline}
        </p>
        <h1 className="max-w-4xl text-balance text-4xl font-semibold leading-[1.1] tracking-tight text-ink-50 sm:text-5xl md:text-6xl lg:text-7xl">
          {hero.headline}
        </h1>
        <p className="mt-6 max-w-2xl text-balance text-lg leading-relaxed text-ink-400 sm:text-xl">
          {hero.subhead}
        </p>
        <div className="mt-10 flex flex-wrap gap-4">
          <a
            href={hero.cta.primary.href}
            className="rounded-lg bg-accent px-6 py-3 text-sm font-medium text-ink-950 transition-colors hover:bg-accent-dim"
          >
            {hero.cta.primary.label}
          </a>
          <a
            href={hero.cta.secondary.href}
            className="rounded-lg border border-ink-700 px-6 py-3 text-sm font-medium text-ink-200 transition-colors hover:border-ink-500 hover:text-ink-50"
          >
            {hero.cta.secondary.label}
          </a>
        </div>
      </div>
    </section>
  );
}

/* ─── about ─── */
function About() {
  return section('about', '01 — About', (
    <div className="grid gap-12 lg:grid-cols-[1.2fr_1fr]">
      <div>
        <h2 className="mb-8 text-3xl font-semibold tracking-tight text-ink-50 sm:text-4xl">
          Self-taught systems builder working from constraints most people treat as blockers.
        </h2>
        <div className="space-y-4 text-base leading-relaxed text-ink-300 sm:text-lg">
          {about.paragraphs.map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </div>
      </div>
      <dl className="grid grid-cols-2 gap-x-6 gap-y-8 self-start rounded-xl border border-ink-800 bg-ink-900/40 p-6">
        {about.facts.map((f) => (
          <div key={f.label}>
            <dt className="font-mono text-xs uppercase tracking-wider text-ink-500">
              {f.label}
            </dt>
            <dd className="mt-1.5 text-sm font-medium text-ink-100">{f.value}</dd>
          </div>
        ))}
      </dl>
    </div>
  ));
}

/* ─── project card ─── */
function ProjectCard({ p }: { p: typeof projects[number] }) {
  return (
    <article className="group flex flex-col rounded-xl border border-ink-800 bg-ink-900/30 p-6 transition-colors hover:border-ink-700 sm:p-8">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <h3 className="text-2xl font-semibold tracking-tight text-ink-50">{p.name}</h3>
          <p className="mt-1 text-sm text-accent">{p.tagline}</p>
        </div>
        <span
          className={`shrink-0 rounded-full px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-wider ${
            p.kind === 'flagship'
              ? 'bg-accent/10 text-accent'
              : p.kind === 'systems'
                ? 'bg-signal/10 text-signal'
                : 'bg-ink-700 text-ink-300'
          }`}
        >
          {p.kind}
        </span>
      </div>

      <p className="mb-5 text-sm leading-relaxed text-ink-300">{p.description}</p>

      <div className="mb-5">
        <p className="mb-2 font-mono text-xs uppercase tracking-wider text-ink-500">
          Problem
        </p>
        <p className="text-sm leading-relaxed text-ink-400">{p.problem}</p>
      </div>

      <div className="mb-5">
        <p className="mb-2 font-mono text-xs uppercase tracking-wider text-ink-500">
          Architecture
        </p>
        <ul className="space-y-1">
          {p.architecture.map((a, i) => (
            <li key={i} className="flex gap-2 text-sm text-ink-300">
              <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-accent/60" />
              {a}
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-auto border-t border-ink-800 pt-5">
        <div className="mb-3 flex flex-wrap gap-1.5">
          {p.topics.map((t) => (
            <span
              key={t}
              className="rounded-md bg-ink-800 px-2 py-0.5 font-mono text-[11px] text-ink-400"
            >
              {t}
            </span>
          ))}
        </div>
        <div className="flex items-center justify-between gap-4">
          <p className="text-xs text-ink-500">
            <span className="font-medium text-ink-400">Status:</span> {p.status}
          </p>
          <a
            href={p.repo}
            className="font-mono text-xs text-accent transition-colors hover:text-accent-dim"
          >
            Repository →
          </a>
        </div>
      </div>
    </article>
  );
}

/* ─── featured work ─── */
function Work() {
  const flagships = projects.filter((p) => p.kind === 'flagship');
  const systems = projects.filter((p) => p.kind === 'systems');
  return section('work', '02 — Featured Work', (
    <>
      <h2 className="mb-4 max-w-2xl text-3xl font-semibold tracking-tight text-ink-50 sm:text-4xl">
        The strongest work — not every repository.
      </h2>
      <p className="mb-12 max-w-xl text-ink-400">
        Selected projects that demonstrate real technical depth, originality, and evidence of
        actual work. Each communicates what problem it addresses, what I built, and what can
        actually be proven.
      </p>

      <h3 className="mb-6 font-mono text-sm font-medium uppercase tracking-wider text-accent">
        Flagships
      </h3>
      <div className="mb-14 grid gap-6 lg:grid-cols-2">
        {flagships.map((p) => (
          <ProjectCard key={p.name} p={p} />
        ))}
      </div>

      <h3 className="mb-6 font-mono text-sm font-medium uppercase tracking-wider text-signal">
        Systems & Infrastructure
      </h3>
      <div className="grid gap-6 lg:grid-cols-2">
        {systems.map((p) => (
          <ProjectCard key={p.name} p={p} />
        ))}
      </div>
    </>
  ));
}

/* ─── research ─── */
function Research() {
  return section('research', '03 — Research & Experiments', (
    <>
      <h2 className="mb-4 max-w-2xl text-3xl font-semibold tracking-tight text-ink-50 sm:text-4xl">
        Serious technical exploration — honest about what is proven.
      </h2>
      <p className="mb-12 max-w-xl text-ink-400">
        Investigations into hardware acceleration, GPU compute, on-device AI, and system-level
        automation. Each area is labeled by its evidence status — validated, experimental, or
        still investigating.
      </p>

      <div className="grid gap-6 md:grid-cols-2">
        {research.map((r) => (
          <div
            key={r.title}
            className="rounded-xl border border-ink-800 bg-ink-900/30 p-6 sm:p-8"
          >
            <div className="mb-4 flex items-center gap-3">
              <span
                className={`h-2 w-2 rounded-full ${
                  r.status === 'validated'
                    ? 'bg-signal'
                    : r.status === 'experimental'
                      ? 'bg-accent'
                      : 'bg-ink-500'
                }`}
              />
              <span className="font-mono text-[10px] uppercase tracking-wider text-ink-500">
                {r.status}
              </span>
            </div>
            <h3 className="text-xl font-semibold text-ink-50">{r.title}</h3>
            <p className="mt-0.5 text-sm text-accent">{r.subtitle}</p>
            <p className="mt-3 text-sm leading-relaxed text-ink-400">{r.description}</p>
            <ul className="mt-4 space-y-1.5">
              {r.details.map((d, i) => (
                <li key={i} className="flex gap-2 text-sm text-ink-300">
                  <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-accent/50" />
                  {d}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </>
  ));
}

/* ─── tech domains ─── */
function Stack() {
  return section('stack', '04 — Technical Focus', (
    <>
      <h2 className="mb-4 max-w-2xl text-3xl font-semibold tracking-tight text-ink-50 sm:text-4xl">
        Technologies I actually work with.
      </h2>
      <p className="mb-12 max-w-xl text-ink-400">
        Only domains supported by repository evidence — no padding, no buzzwords.
      </p>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {techDomains.map((d) => (
          <div
            key={d.name}
            className="rounded-xl border border-ink-800 bg-ink-900/20 p-5"
          >
            <h3 className="mb-3 font-mono text-sm font-medium text-accent">{d.name}</h3>
            <ul className="space-y-1">
              {d.items.map((item) => (
                <li key={item} className="text-sm text-ink-300">
                  {item}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </>
  ));
}

/* ─── open source ─── */
function OpenSource() {
  return section('open-source', '05 — Open Source', (
    <>
      <h2 className="mb-4 max-w-2xl text-3xl font-semibold tracking-tight text-ink-50 sm:text-4xl">
        Selected repositories.
      </h2>
      <p className="mb-12 max-w-xl text-ink-400">
        A curated subset of my public repositories — ranked by technical depth, originality,
        and evidence of actual work.
      </p>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {githubRepos.map((r) => (
          <a
            key={r.name}
            href={r.url}
            className="group flex flex-col rounded-xl border border-ink-800 bg-ink-900/20 p-5 transition-colors hover:border-ink-700"
          >
            <div className="mb-2 flex items-center gap-2">
              <h3 className="font-mono text-sm font-semibold text-ink-100 group-hover:text-accent">
                {r.name}
              </h3>
              {r.stars > 0 && (
                <span className="font-mono text-[10px] text-ink-500">★ {r.stars}</span>
              )}
            </div>
            <p className="mb-3 flex-1 text-xs leading-relaxed text-ink-400">{r.description}</p>
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-accent/70" />
              <span className="font-mono text-[11px] text-ink-500">{r.language}</span>
            </div>
          </a>
        ))}
      </div>

      <p className="mt-8 text-sm text-ink-500">
        See all {githubRepos.length}+ repositories on{' '}
        <a
          href="https://github.com/soobujmiah"
          className="text-accent underline-offset-4 hover:underline"
        >
          github.com/soobujmiah
        </a>
        .
      </p>
    </>
  ));
}

/* ─── timeline ─── */
function Journey() {
  return section('journey', '06 — Journey', (
    <>
      <h2 className="mb-12 max-w-2xl text-3xl font-semibold tracking-tight text-ink-50 sm:text-4xl">
        How the work evolved.
      </h2>

      <div className="relative space-y-0">
        <div className="absolute bottom-0 left-[7px] top-0 w-px bg-ink-800 md:left-1/2" />
        {timeline.map((e, i) => (
          <div
            key={e.year}
            className={`relative flex flex-col pb-10 md:flex-row ${
              i % 2 === 0 ? 'md:flex-row-reverse' : ''
            }`}
          >
            <div className="flex-1 md:px-8">
              <div
                className={`rounded-xl border border-ink-800 bg-ink-900/30 p-5 ${
                  i % 2 === 0 ? 'md:text-right' : ''
                }`}
              >
                <span className="font-mono text-sm font-bold text-accent">{e.year}</span>
                <h3 className="mt-1 text-lg font-semibold text-ink-100">{e.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-400">{e.description}</p>
              </div>
            </div>
            <div className="absolute left-0 top-1 z-10 h-4 w-4 rounded-full border-2 border-accent bg-ink-950 md:left-1/2 md:-translate-x-1/2" />
            <div className="flex-1 md:px-8" />
          </div>
        ))}
      </div>
    </>
  ));
}

/* ─── contact ─── */
function Contact() {
  return section('contact', '07 — Contact', (
    <div className="mx-auto max-w-2xl text-center">
      <h2 className="mb-4 text-3xl font-semibold tracking-tight text-ink-50 sm:text-4xl">
        {contact.headline}
      </h2>
      <p className="mb-10 text-ink-400">{contact.subhead}</p>

      <div className="flex flex-wrap justify-center gap-4">
        {contact.channels.map((c) => (
          <a
            key={c.label}
            href={c.href}
            className="group flex items-center gap-2 rounded-lg border border-ink-800 bg-ink-900/30 px-5 py-3 transition-colors hover:border-accent"
          >
            <span className="text-sm font-medium text-ink-200 group-hover:text-accent">
              {c.label}
            </span>
            <span className="font-mono text-xs text-ink-500">{c.value}</span>
          </a>
        ))}
      </div>
    </div>
  ));
}

/* ─── footer ─── */
function Footer() {
  return (
    <footer className="border-t border-ink-800 py-8">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-5 sm:flex-row sm:px-8">
        <p className="font-mono text-xs text-ink-600">
          © {new Date().getFullYear()} {profile.name}. Built from a phone.
        </p>
        <p className="font-mono text-xs text-ink-600">
          Every claim backed by CI or real-device evidence.
        </p>
      </div>
    </footer>
  );
}

/* ─── page ─── */
export default function Page() {
  return (
    <>
      <Header />
      <main>
        <Hero />
        <About />
        <Work />
        <Research />
        <Stack />
        <OpenSource />
        <Journey />
        <Contact />
      </main>
      <Footer />
    </>
  );
}
