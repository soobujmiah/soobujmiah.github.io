/* ═══════════════════════════════════════════════════════════════
   CONTENT — centralized, bilingual source of truth for the portfolio.

   LANGUAGE PURITY CONTRACT (enforced by scripts/check-content.mjs)
   ---------------------------------------------------------------
   EN mode  → zero Bengali codepoints anywhere in this tree.
   BN mode  → zero Latin letters (A–Z, a–z) anywhere in this tree,
              EXCEPT the enumerated verbatim-data fields below.

   The BN tree carries the same keys as EN (checked on every build),
   so no string is ever missing in either language. Prose is written
   natively in each language — never machine-translated phrasing.

   WHAT STAYS LATIN IN BANGLA MODE, AND WHY
   ----------------------------------------
   Four kinds of *data*, never language:
     1. The e-mail address        (must stay copyable and routable)
     2. Social handles            (the real account identifiers)
     3. Repository slugs          (must match the URL path)
     4. URLs                      (`repo`, `websiteUrl`, `href`)

   Everything else in the BN tree — every heading, description,
   button, badge, role, tooltip and accessibility label — is Bangla,
   including transliterated technology names (কোটলিন, ভলকান,
   গিটহাব, লামা.সিপিপি). That set is declared explicitly in
   `IDENTIFIER_PATHS` inside scripts/check-content.mjs, so the gate
   proves the exception list is exactly this small.

   No fabricated projects, repos, websites, employers, or statistics.
   websiteUrl is set ONLY for repositories with a verified live site.

   CONTENT → DISCOVERY DERIVATION (write once, generate the SEO)
   --------------------------------------------------------------
   This tree is the single source of truth for the site's visible
   copy AND its search infrastructure:

     profile/meta/hero ─► layout metadata (title, description, OG,
                          Twitter, keywords) in app/site-layout.tsx
     seo.sections[9] ───► per-route <title>, meta description, OG and
                          Twitter cards in app/[section]/page.tsx and
                          the live title swap in app/language.tsx
     app/sections.ts ──► routes, canonical URLs, sitemap.xml, nav
                          anchors and page labels (one registry)
     work.projects +
     work.nowBuilding ──► Featured Work UI and the SoftwareApplication
                          ItemList in the site JSON-LD
     openSource.repos ──► Open Source UI (tier-ordered: applied first)
                          and the internal link graph

   Adding a project or repository here automatically gives it a card,
   links, tier placement, structured data and — through the section
   registry — sitemap/canonical presence. No per-page manual SEO.
   ═══════════════════════════════════════════════════════════════ */

export type Lang = 'en' | 'bn';

export interface Project {
  name: string;
  tagline: string;
  year: string;
  description: string;
  role: string;
  evidence: string;
  topics: string[];
  repo: string;
  websiteUrl: string | null;
  accent: string;
}

export interface Repo {
  name: string;
  desc: string;
  lang: string;
  stars: number;
  url: string;
  websiteUrl: string | null;
  /* Machine enum (like research status) — where a project sits in the
     portfolio hierarchy. `flagship` repos are showcased on the Work
     page and are never repeated in Open Source. */
  tier: 'flagship' | 'applied' | 'supporting';
}

export interface SocialLink {
  /** Platform name — a word, so it is transliterated in Bangla. */
  label: string;
  /** Account handle: verbatim data, identical in both languages. */
  handle: string;
  /** Canonical URL: verbatim data, identical in both languages. */
  href: string;
}

export interface SocialGroup {
  label: string;
  links: SocialLink[];
}

export interface WorkEntry {
  period: string;
  role: string;
  company: string;
  location: string;
  desc: string;
}

export interface ResearchEntry {
  title: string;
  status: 'experimental' | 'validated' | 'investigating';
  statusLabel: string;
  description: string;
}

export interface Domain {
  name: string;
  items: string[];
}

export interface Content {
  profile: {
    name: string;
    nameFull: string;
    title: string;
    tagline: string;
    location: string;
    github: string;
    email: string;
    telegram: string;
    linkedin: string;
  };
  meta: {
    title: string;
    description: string;
  };
  hero: {
    intro: string;
    availability: string;
    ctaWork: string;
    ctaGithub: string;
  };
  presence: {
    eyebrow: string;
    heading: string;
    items: { label: string; detail: string }[];
  };
  about: {
    eyebrow: string;
    heading: string;
    paragraphs: string[];
    principles: string[];
    facts: { label: string; value: string }[];
  };
  work: {
    eyebrow: string;
    heading: string;
    evidenceLabel: string;
    roleLabel: string;
    liveLabel: string;
    codeLabel: string;
    projects: Project[];
    nowBuilding: {
      eyebrow: string;
      name: string;
      description: string;
      testsNote: string;
      cta: string;
      url: string;
    };
    /* ADT ↔ Ternux: two layers of one Android/ARM64 workflow. Prose
       only — the two repository/website links are identifiers, so they
       are declared in IDENTIFIER_PATHS alongside work.projects[].* */
    relationship: {
      eyebrow: string;
      heading: string;
      body: string;
      deviceLabel: string;
      layers: {
        name: string;
        role: string;
        note: string;
        websiteUrl: string;
        repo: string;
      }[];
      verifiedLabel: string;
      verified: string;
      experimentalLabel: string;
      experimental: string;
    };
  };
  research: {
    eyebrow: string;
    heading: string;
    entries: ResearchEntry[];
  };
  stack: {
    eyebrow: string;
    heading: string;
    domains: Domain[];
  };
  openSource: {
    eyebrow: string;
    heading: string;
    liveLabel: string;
    codeLabel: string;
    selected: string[];
    appliedBadge: string;
    note: string;
    moreLabel: string;
    moreSub: string;
    repos: Repo[];
  };
  experience: {
    eyebrow: string;
    heading: string;
    intro: string;
    professionalLabel: string;
    services: { label: string; items: string[] };
    entries: WorkEntry[];
  };
  contact: {
    eyebrow: string;
    headingA: string;
    headingB: string;
    sub: string;
/** The prominent direct channel, visually first and separate from
        the platform ecosystem below it — Telegram reaches the person;
        email joins the compact contact buttons. */
    telegram: { label: string; value: string; href: string };
    email: { label: string; value: string; href: string };
    groupsHeading: string;
    groupsNote: string;
    /** The complete ecosystem: 18 canonical links in six groups. One
        system, rendered once — never a second wall of icons elsewhere. */
    groups: SocialGroup[];
    /** Discovery link into the service-intent layer (/services/). */
    servicesLink: string;
  };
  nav: { scene: number; label: string }[];
  header: { homeLabel: string; githubLabel: string; langLabel: string; langAria: string; githubAria: string; cvLabel: string; cvAria: string; servicesLabel: string };
  footer: { built: string; claims: string };
  ui: {
    carouselPrev: string;
    carouselNext: string;
    pageLabels: string[];
    repoWord: string;
    liveSiteWord: string;
    navOpen: string;
    navTitle: string;
    navClose: string;
    navHint: string;
    current: string;
    /* Localized meridiem for the identity clock — Bengali must never
       render a Latin "AM/PM" (content-gate purity applies). */
    meridiemAm: string;
    meridiemPm: string;
    pull: string;
    release: string;
    refreshing: string;
    mapFocus: string;
    downloadCv: string;
  };
  preloader: { status: string };
  /* Per-route search metadata, aligned with SECTION_IDS in
     app/sections.ts (home first). Titles are complete, unique and
     name-bearing; descriptions are factual summaries of the section.
     Kept in the content tree so both languages stay indexable and the
     client-side language switch can re-title the live document. */
  seo: { sections: { title: string; description: string }[] };
}

/* ── English ─────────────────────────────────────────────────── */

const en: Content = {
  profile: {
    name: 'Sobuj',
    nameFull: 'Sobuj Miah',
    title: 'Independent Software & AI Systems Builder',
    tagline: 'Software · On-Device AI · Android · Computing · Automation',
    location: 'Dhaka, Bangladesh',
    github: 'https://github.com/soobujmiah',
    email: 'soobujmiah@gmail.com',
    telegram: '@soobujmiah',
    linkedin: 'https://linkedin.com/in/soobujmiah',
  },
  meta: {
    title: 'Sobuj Miah — Software, AI & Practical Technology',
    description:
      'Software, on-device AI, Android, computing and automation. I learn by experimenting, building and solving practical problems, with project evidence from real hardware and CI.',
  },
  hero: {
    intro:
      'A long-running, hands-on journey with technology: learning, experimenting, building and solving practical problems. Today I work across software, on-device AI, Android, computing, automation and digital tools.',
    availability: 'Open to remote',
    ctaWork: 'Explore my work',
    ctaGithub: 'View GitHub ↗',
  },
  presence: {
    eyebrow: '02 — What I Build',
    heading: 'On-device AI, Android systems, ARM64 Linux, native tooling.',
    items: [
      { label: 'On-Device AI', detail: 'LLM inference, NPU/GPU qualification' },
      { label: 'Android Systems', detail: 'Kotlin, Accessibility, Shizuku' },
      { label: 'ARM64 Linux', detail: 'AOSP builds, PRoot, Termux' },
      { label: 'Native Tooling', detail: 'Build-tools from source, signed releases' },
    ],
  },
  about: {
    eyebrow: '03 — About',
    heading: 'Learning through systems, constraints, and practical problems.',
    paragraphs: [
      'I am a self-taught software and technology builder based in Dhaka, Bangladesh. My interests range from software and on-device AI to Android, computing and automation.',
      'A defining constraint: I develop, build, and validate software primarily from an Android phone running Termux and PRoot Debian rather than a conventional PC. This shapes my tooling, my CI architecture, and how I verify results.',
      'I learn through real problems: hypothesis, test, observation, formal theory, comparison, iteration. Mechanism-first and evidence-backed — a working principle I summarise as “living till learning.”',
    ],
    principles: [
      'Built under constraint',
      'Evidence before claims',
      'Real hardware closes the loop',
      'Failure becomes architecture',
      'Local-first where it matters',
      'Documentation is engineering',
    ],
    facts: [
      { label: 'Based in', value: 'Dhaka, Bangladesh (GMT+6)' },
      { label: 'Languages', value: 'Bangla, English, Hindi/Urdu, Arabic' },
      { label: 'Reference device', value: 'Redmi Turbo 4 Pro — SD 8s Gen 4' },
      { label: 'Build pipeline', value: 'GitHub Actions CI/CD' },
    ],
  },
  work: {
    eyebrow: '04 — Featured Work',
    heading: 'Selected projects with CI and device evidence.',
    evidenceLabel: 'Evidence: ',
    roleLabel: 'My role: ',
    liveLabel: 'Explore ↗',
    codeLabel: 'Code ↗',
    projects: [
      {
        name: 'LAI',
        tagline: 'Bangla-first local AI + consent-driven automation',
        year: '2024–26',
        description:
          'Source-only Android runtime for private on-device LLM inference and Accessibility-gated automation. CPU inference device-validated; GPU/NPU in qualification.',
        role: 'Designed the runtime and Android integration; validated CPU inference and consent boundaries on-device.',
        evidence:
          'Real arm64 llama.cpp CPU inference, 12–20 tok/s decode, KV-prefix reuse. Root-cause diagnosis of an Adreno Vulkan driver crash that shaped a fail-closed CPU-default architecture.',
        topics: ['Kotlin', 'llama.cpp', 'Vulkan', 'Accessibility', 'Shizuku', 'GGUF'],
        repo: 'https://github.com/soobujmiah/lai',
        websiteUrl: null,
        accent: '#22c55e',
      },
      {
        name: 'GGEN',
        tagline: 'Android-first creative & document studio',
        year: '2024–26',
        description:
          'Flutter/Dart foundation for professional vector, raster, document, and PDF work. Documentation-first architecture with pure-Dart core and SHA-256 state integrity.',
        role: 'Built the application and reusable Dart foundation; verified core behavior and Flutter interactions.',
        evidence:
          '143 pure-Dart unit tests, 353 widget/controller tests. Validated on a physical device round after round.',
        topics: ['Flutter', 'Dart', 'Document Generation', 'Vector Graphics'],
        repo: 'https://github.com/soobujmiah/ggen',
        websiteUrl: null,
        accent: '#4ade80',
      },
      {
        name: 'ADT',
        tagline: 'Native ARM64 Android development toolchain',
        year: '2023–26',
        description:
          'Builds Android SDK build-tools and platform-tools from AOSP source for Linux ARM64/glibc. SHA-256-verified offline release artifacts.',
        role: 'Developed the source-build and release pipeline, then validated the APK workflow on ARM64 hardware.',
        evidence:
          'Full ARM64 native APK pipeline validated end-to-end on Snapdragon 8s Gen 4: source → APK → sign → install → JNI load → run.',
        topics: ['AOSP', 'ARM64', 'Build Tools', 'Cross-compilation'],
        repo: 'https://github.com/soobujmiah/adt',
        websiteUrl: 'https://soobujmiah.github.io/adt/',
        accent: '#10b981',
      },
      {
        name: 'Ternux',
        tagline: 'No-root Debian/Xfce Linux desktop on Android',
        year: '2023–26',
        description:
          'Installs a real Debian ARM64 userspace, Xfce4 desktop, Termux:X11 display, PulseAudio bridge, and Zink/Turnip GPU route — one command, no root.',
        role: 'Built the installation and desktop tooling; measured supported graphics paths on the reference device.',
        evidence:
          'Zink/Turnip renderer confirmed on Adreno 825: glmark2 score 140 (OpenGL 4.6), with a documented compatibility fallback route. Blender 4.3.2 launched, but its own report still named device type SOFTWARE — only the viewport OpenGL path through Zink/Turnip is proven, not Cycles GPU rendering.',
        topics: ['Debian', 'Vulkan', 'Turnip', 'Zink', 'Adreno', 'PRoot'],
        repo: 'https://github.com/soobujmiah/ternux',
        websiteUrl: 'https://soobujmiah.github.io/ternux/',
        accent: '#86efac',
      },
    ],
    nowBuilding: {
      eyebrow: 'Now building — P0 release track',
      name: 'Songjog',
      description:
        'Bengali-first business and institution operations app. Owner Edition: fast daily entry, local SQLite records, auditable corrections instead of destructive deletes.',
      testsNote: '94 tests green on CI · export/diagnostics device-validated on the Redmi Turbo 4 Pro',
      cta: 'Follow the build ↗',
      url: 'https://github.com/soobujmiah/songjog',
    },
    relationship: {
      eyebrow: 'Ecosystem — two layers, one device',
      heading: 'ADT and Ternux are two halves of the same Android/ARM64 workflow.',
      body: 'One physical Android device, two complementary toolchains. ADT turns it into an Android development workstation — build, sign, install, debug. Ternux turns it into a Linux ARM64 desktop — Debian, Xfce4, GPU acceleration. Neither needs a conventional PC, and both are maintained as independent repositories with their own documentation and evidence.',
      deviceLabel: 'One physical Android device',
      layers: [
        {
          name: 'ADT',
          role: 'Android development layer',
          note: 'Native aarch64 build-tools and platform-tools from AOSP source: build, sign, install and inspect real APKs from the phone itself.',
          websiteUrl: 'https://soobujmiah.github.io/adt/',
          repo: 'https://github.com/soobujmiah/adt',
        },
        {
          name: 'Ternux',
          role: 'Linux desktop layer',
          note: 'A real Debian ARM64 userspace with an Xfce4 desktop and an explicit graphics route, installed on the same device with no root.',
          websiteUrl: 'https://soobujmiah.github.io/ternux/',
          repo: 'https://github.com/soobujmiah/ternux',
        },
      ],
      verifiedLabel: 'Verified: ',
      verified: 'Both toolchains were validated on the same physical device — a Redmi Turbo 4 Pro running Termux and PRoot Debian. Ternux installs that Debian desktop; ADT runs inside it and produced, signed and installed a real APK end to end.',
      experimentalLabel: 'Not yet proven: ',
      experimental: 'Joint automation, shared build orchestration and a GPU-assisted build path are not yet in place. Each project is validated on its own evidence rather than on a combined pipeline.',
    },
  },
  research: {
    eyebrow: '05 — Research & Experiments',
    heading: 'Validated results and open experiments, clearly separated.',
    entries: [
      {
        title: 'On-device LLM inference',
        status: 'validated',
        statusLabel: 'validated',
        description:
          'arm64 llama.cpp/GGUF CPU runtime: streaming multi-turn inference, KV-prefix reuse, measured decode throughput and TTFT on Snapdragon 8s Gen 4.',
      },
      {
        title: 'Snapdragon / Hexagon NPU',
        status: 'experimental',
        statusLabel: 'experimental',
        description:
          'Qualcomm Hexagon HTP evaluation; first non-CPU backend confirmed with FastRPC/DSP evidence. No acceleration claimed until qualification completes.',
      },
      {
        title: 'Adreno GPU — Vulkan, Turnip, Zink',
        status: 'experimental',
        statusLabel: 'experimental',
        description:
          'Mesa Turnip Vulkan and Zink on Adreno 825; Vulkan compute crash at decode root-caused and documented; Zink desktop path measured (glmark2 140).',
      },
      {
        title: 'Consent-gated Android automation',
        status: 'validated',
        statusLabel: 'validated',
        description:
          'AccessibilityService + Shizuku privileged execution with explicit confirmation, typed operations, and a hash-chained audit trail.',
      },
      {
        title: 'Linux on Android — ARM64 workstation',
        status: 'validated',
        statusLabel: 'validated',
        description:
          'No-root Debian/Xfce over PRoot with a measured GPU route, plus a phone-first loop where CI builds artifacts and the device validates them.',
      },
      {
        title: 'Native ARM64 tooling from AOSP source',
        status: 'validated',
        statusLabel: 'validated',
        description:
          'Android SDK build-tools/platform-tools compiled for Linux ARM64/glibc; SHA-256-verified offline artifacts; APK pipeline validated end-to-end on device.',
      },
    ],
  },
  stack: {
    eyebrow: '06 — Technical Focus',
    heading: 'Core technologies in day-to-day use.',
    domains: [
      { name: 'On-Device AI', items: ['llama.cpp', 'GGUF', 'KV-cache', 'CPU/GPU/NPU routing'] },
      { name: 'Android Systems', items: ['Kotlin', 'Compose', 'Accessibility', 'Shizuku', 'JNI/C++'] },
      { name: 'Linux / ARM64', items: ['AOSP builds', 'Clang/CMake/Ninja', 'Termux + PRoot'] },
      { name: 'GPU / Graphics', items: ['Vulkan', 'Mesa Turnip', 'Zink', 'Adreno KGSL'] },
      { name: 'Mobile & Web', items: ['Flutter', 'Dart', 'TypeScript', 'Python'] },
      { name: 'Eng Ops', items: ['GitHub Actions', 'Signed releases', 'Device validation'] },
    ],
  },
  openSource: {
    eyebrow: '07 — Open Source',
    heading: 'Selected repositories.',
    liveLabel: 'Explore ↗',
    codeLabel: 'Code ↗',
    selected: ['docdr', 'datakhoj-android', 'apiloop', 'arms', 'iqra-online-mart', 'sobkichu'],
    appliedBadge: 'Applied product',
    note: 'Applied products and supporting work beyond the featured projects — status and evidence live in each repository.',
    moreLabel: 'Everything on GitHub',
    moreSub: 'Experiments, prototypes, and work in progress live there.',
    repos: [
      { name: 'lai', desc: 'Bangla-first local AI + automation runtime', lang: 'Kotlin', stars: 1, url: 'https://github.com/soobujmiah/lai', websiteUrl: null, tier: 'flagship' },
      { name: 'adt', desc: 'ARM64 Android dev toolchain from AOSP source', lang: 'Shell', stars: 0, url: 'https://github.com/soobujmiah/adt', websiteUrl: 'https://soobujmiah.github.io/adt/', tier: 'flagship' },
      { name: 'ternux', desc: 'GPU-accelerated Linux desktop on Android', lang: 'Shell', stars: 1, url: 'https://github.com/soobujmiah/ternux', websiteUrl: 'https://soobujmiah.github.io/ternux/', tier: 'flagship' },
      { name: 'ggen', desc: 'Android-first creative & document studio', lang: 'Dart', stars: 0, url: 'https://github.com/soobujmiah/ggen', websiteUrl: null, tier: 'flagship' },
      { name: 'songjog', desc: 'Bangla-first business ledger & operations app (Owner Edition)', lang: 'Dart', stars: 0, url: 'https://github.com/soobujmiah/songjog', websiteUrl: null, tier: 'applied' },
      { name: 'docdr', desc: 'Mobile-first offline document workspace — viewing, scanning, templates, generation', lang: 'Dart', stars: 0, url: 'https://github.com/soobujmiah/docdr', websiteUrl: null, tier: 'applied' },
      { name: 'datakhoj-android', desc: 'Public-data pipeline — search, extract, clean, deduplicate, and export typed datasets; JobSpec engine shared with a Python twin. Pre-alpha.', lang: 'Kotlin', stars: 0, url: 'https://github.com/soobujmiah/datakhoj-android', websiteUrl: null, tier: 'applied' },
      { name: 'apiloop', desc: 'Provider-agnostic AI API gateway', lang: 'Python', stars: 0, url: 'https://github.com/soobujmiah/apiloop', websiteUrl: null, tier: 'supporting' },
      { name: 'arms', desc: 'Searchable ARM64 Linux tool catalog + static site', lang: 'HTML', stars: 0, url: 'https://github.com/soobujmiah/arms', websiteUrl: 'https://soobujmiah.github.io/arms', tier: 'supporting' },
      { name: 'iqra-online-mart', desc: 'Bilingual static storefront demo for local retail', lang: 'JavaScript', stars: 0, url: 'https://github.com/soobujmiah/iqra-online-mart', websiteUrl: 'https://soobujmiah.github.io/iqra-online-mart/', tier: 'supporting' },
      { name: 'sobkichu', desc: 'Bangladesh hyperlocal super-app — architecture & specification', lang: 'TypeScript', stars: 0, url: 'https://github.com/soobujmiah/sobkichu', websiteUrl: null, tier: 'supporting' },
    ],
  },
  experience: {
    eyebrow: '08 — Experience',
    heading: 'A hands-on journey with technology, alongside professional work.',
    intro: 'My interest in computers and technology predates my listed professional roles. It has grown through exploration, troubleshooting, building and learning from practical problems. Professional work is one part of that story; the projects show what I continue to explore and build today.',
    professionalLabel: 'Professional experience',
    services: {
      label: 'Other practical work',
      items: [
        'Office and digital administration',
        'Software, websites, and workflow tools',
        'Computer and Android support',
      ],
    },
    entries: [
      {
        period: 'Apr 2026 – Present',
        role: 'Independent Software & AI Systems Builder',
        company: 'Pro-Jukti Info Tech',
        location: 'Self-employed',
        desc: 'Independent systems work — on-device AI, ARM64 Android tooling and Linux systems, delivered through Pro-Jukti Info Tech.',
      },
      {
        period: 'Mar 2025 – Present',
        role: 'Office Administrator',
        company: 'Rabeya Education Family',
        location: 'Savar, Dhaka',
        desc: 'Daily operations, social media, SEO, student registration, document management, promotional graphics.',
      },
      {
        period: 'Sep 2022 – Feb 2023',
        role: 'Computer Operator',
        company: 'Monika Enterprise',
        location: 'Savar, Dhaka',
        desc: 'Online activities, document processing, filing systems.',
      },
      {
        period: '2021 – 2022',
        role: 'Coordinator',
        company: 'Abdullah Trading Pvt Ltd',
        location: 'Jubail, Saudi Arabia',
        desc: 'Site operations, logistics, team communication.',
      },
      {
        period: '2020 – 2021',
        role: 'Electrician',
        company: 'Saudi Electricity Company & Khaled Juffali Company',
        location: 'Jeddah, Saudi Arabia',
        desc: 'Electrical installation and maintenance.',
      },
      {
        period: '2018 – 2020',
        role: 'Progress Reporter',
        company: 'Fadhli Gas Plant Project / PCMC',
        location: 'Saudi Arabia',
        desc: 'Daily progress data, digitization, structured reporting.',
      },
      {
        period: '2017 – 2018',
        role: 'Fire Watcher',
        company: 'Fadhli Gas Plant / Saudi Aramco',
        location: 'Saudi Arabia',
        desc: 'Fire hazard monitoring, incident prevention.',
      },
      {
        period: '2015 – 2017',
        role: 'Email Marketing Specialist',
        company: 'Freelance',
        location: 'Remote',
        desc: 'Targeted campaigns, subscriber management, self-taught digital marketing.',
      },
    ],
  },
  contact: {
    eyebrow: '09 — Contact',
    headingA: 'Open to freelance,',
    headingB: 'remote, and collaboration.',
    sub: 'I work across software, AI and practical digital technology, with remote availability from Savar, Dhaka, Bangladesh. For a project or service enquiry, contact me directly.',
    telegram: { label: 'Telegram', value: '@soobujmiah', href: 'https://t.me/soobujmiah' },
    email: { label: 'Email', value: 'soobujmiah@gmail.com', href: 'mailto:soobujmiah@gmail.com' },
    servicesLink: 'View all services →',
    groupsHeading: 'Find me online',
    groupsNote: 'One handle across every platform.',
    groups: [
      {
        label: 'Core',
        links: [
          { label: 'GitHub', handle: 'soobujmiah', href: 'https://github.com/soobujmiah' },
          { label: 'Portfolio', handle: 'soobujmiah.github.io', href: 'https://soobujmiah.github.io' },
        ],
      },
      {
        label: 'Professional',
        links: [
          { label: 'LinkedIn', handle: 'in/soobujmiah', href: 'https://linkedin.com/in/soobujmiah' },
          { label: 'Peerlist', handle: 'soobujmiah', href: 'https://peerlist.io/soobujmiah' },
          { label: 'Product Hunt', handle: '@soobujmiah', href: 'https://www.producthunt.com/@soobujmiah' },
        ],
      },
      {
        label: 'AI / Developer',
        links: [
          { label: 'Hugging Face', handle: 'soobujmiah', href: 'https://huggingface.co/soobujmiah' },
          { label: 'DEV.to', handle: 'soobujmiah', href: 'https://dev.to/soobujmiah' },
          { label: 'Hashnode', handle: '@soobujmiah', href: 'https://hashnode.com/@soobujmiah' },
          { label: 'Medium', handle: '@soobujmiah', href: 'https://medium.com/@soobujmiah' },
        ],
      },
      {
        label: 'Social',
        links: [
          { label: 'X', handle: '@soobujmiah', href: 'https://x.com/soobujmiah' },
          { label: 'Instagram', handle: '@soobujmiah', href: 'https://instagram.com/soobujmiah' },
          { label: 'Threads', handle: '@soobujmiah', href: 'https://threads.net/@soobujmiah' },
          { label: 'Facebook', handle: 'soobujmiah', href: 'https://facebook.com/soobujmiah' },
          { label: 'YouTube', handle: '@soobujmiah', href: 'https://youtube.com/@soobujmiah' },
        ],
      },
      {
        label: 'Direct',
        links: [
          { label: 'Telegram', handle: '@soobujmiah', href: 'https://t.me/soobujmiah' },
          { label: 'Email', handle: 'soobujmiah@gmail.com', href: 'mailto:soobujmiah@gmail.com' },
        ],
      },
      {
        label: 'Personal',
        links: [
          { label: 'About.me', handle: 'soobujmiah', href: 'https://about.me/soobujmiah' },
          { label: 'Buy Me a Coffee', handle: 'soobujmiah', href: 'https://buymeacoffee.com/soobujmiah' },
        ],
      },
    ],
  },
  nav: [
    { scene: 3, label: 'Work' },
    { scene: 4, label: 'Research' },
    { scene: 5, label: 'Stack' },
    { scene: 8, label: 'Contact' },
  ],
  header: { homeLabel: 'Back to home', githubLabel: 'GitHub', langLabel: 'Bangla', langAria: 'Switch to Bangla', githubAria: 'GitHub profile', cvLabel: 'CV', cvAria: 'Download CV (PDF)', servicesLabel: 'Services' },
  ui: {
    carouselPrev: 'Previous',
    carouselNext: 'Next',
    pageLabels: ['Home', 'Presence', 'About', 'Featured work', 'Research', 'Technical focus', 'Open source', 'Experience', 'Contact'],
    repoWord: 'repository',
    liveSiteWord: 'live site',
    navOpen: 'Open section index',
    navTitle: 'Index',
    navClose: 'Close index',
    navHint: 'Arrow keys move · Enter opens · Esc closes',
    current: 'You are here',
    meridiemAm: 'AM',
    meridiemPm: 'PM',
    pull: 'Pull to refresh',
    release: 'Release to refresh',
    refreshing: 'Refreshing',
    mapFocus: 'Background map focus',
    downloadCv: 'Download CV',
  },
  footer: {
    built: 'Built from a phone.',
    claims: 'Every claim backed by CI or real-device evidence.',
  },
  preloader: { status: 'Initializing' },
  seo: {
    /* Aligned with SECTION_IDS (app/sections.ts): home first, then one
       entry per section route. Titles are complete and name-bearing;
       descriptions are factual, unique, and written from real content. */
    sections: [
      {
        title: 'Sobuj Miah — Software, AI & Practical Technology',
        description:
          'Software, on-device AI, Android, computing and automation. A hands-on practice of learning, experimenting and building, with project evidence from real hardware and CI.',
      },
      {
        title: 'What I Build — On-Device AI, Android & ARM64 Systems',
        description:
          'What Sobuj Miah builds: on-device AI and LLM inference, Android systems with consent-gated automation, ARM64 Linux from AOSP to PRoot, and native tooling with signed releases.',
      },
      {
        title: 'About — Independent Systems Builder in Dhaka',
        description:
          'About Sobuj Miah: a self-taught software and technology builder in Dhaka, Bangladesh, learning through practical projects, real devices and problem-solving.',
      },
      {
        title: 'Featured Work — LAI, GGEN, ADT, Ternux',
        description:
          'Flagship systems by Sobuj Miah: LAI on-device AI runtime, GGEN creative & document studio, ADT ARM64 Android toolchain, and Ternux no-root Linux desktop — each with CI and device evidence.',
      },
      {
        title: 'Research — On-Device AI, NPU, Vulkan & ARM64 Experiments',
        description:
          'Evidence-graded research themes: on-device LLM inference, Hexagon NPU qualification, Adreno Vulkan/Turnip/Zink, consent-gated automation, Linux on Android, and native ARM64 tooling.',
      },
      {
        title: 'Technical Stack — llama.cpp, Kotlin, Flutter, Vulkan, Termux',
        description:
          'Technologies Sobuj Miah works with: llama.cpp and GGUF, Kotlin and Flutter, Vulkan, Mesa Turnip and Zink, AOSP builds, Termux and PRoot, GitHub Actions CI.',
      },
      {
        title: 'Open Source Projects — Applied & Supporting Work',
        description:
          'Applied products and supporting open-source work — DocDr, DataKhoj, ApiLoop, arms, Iqra Online Mart, and Sobkichu — with links to code, live sites, and repository evidence.',
      },
      {
        title: 'Experience — Operations, Administration & Engineering',
        description:
          'A long-running technology journey of learning, experimenting, building and solving practical problems, alongside professional experience in operations and administration. View the dated roles and projects.',
      },
      {
        title: 'Contact — Freelance, Remote & Collaboration',
        description:
          'Contact Sobuj Miah about software, AI, practical technology services or collaboration. Based in Savar, Dhaka, Bangladesh, and available for remote work.',
      },
    ],
  },
};

/* ── Bangla ────────────────────────────────────────────────────
   Prose is Bangla only. Technology, company and product names are
   transliterated (কোটলিন, গিটহাব, লামা.সিপিপি); only the four
   verbatim-data kinds listed at the top of this file stay Latin.
   Numerals inside Bangla prose are Bengali digits.               */

const bn: Content = {
  profile: {
    name: 'সবুজ',
    nameFull: 'সবুজ মিয়া',
    title: 'স্বাধীন সফটওয়্যার ও এআই সিস্টেম নির্মাতা',
    tagline: 'সফটওয়্যার · অন-ডিভাইস এআই · অ্যান্ড্রয়েড · কম্পিউটিং · অটোমেশন',
    location: 'ঢাকা, বাংলাদেশ',
    github: 'https://github.com/soobujmiah',
    email: 'soobujmiah@gmail.com',
    telegram: '@soobujmiah',
    linkedin: 'https://linkedin.com/in/soobujmiah',
  },
  meta: {
    title: 'সবুজ মিয়া — সফটওয়্যার, এআই ও ব্যবহারিক প্রযুক্তি',
    description:
      'সফটওয়্যার, অন-ডিভাইস এআই, অ্যান্ড্রয়েড, কম্পিউটিং ও অটোমেশন। হাতে-কলমে শেখা ও নির্মাণের দীর্ঘ যাত্রা, বাস্তব ডিভাইস ও সিআই-ভিত্তিক প্রকল্প প্রমাণসহ।',
  },
  hero: {
    intro:
      'প্রযুক্তি নিয়ে দীর্ঘদিনের হাতে-কলমে শেখা, পরীক্ষা, নির্মাণ ও বাস্তব সমস্যা সমাধানের পথ। এখন সফটওয়্যার, অন-ডিভাইস এআই, অ্যান্ড্রয়েড, কম্পিউটিং, অটোমেশন ও ডিজিটাল টুল নিয়ে কাজ করি।',
    availability: 'রিমোট কাজের জন্য উন্মুক্ত',
    ctaWork: 'আমার কাজ দেখুন',
    ctaGithub: 'গিটহাব দেখুন ↗',
  },
  presence: {
    eyebrow: '০২ — আমি যা তৈরি করি',
    heading: 'অন-ডিভাইস এআই, অ্যান্ড্রয়েড সিস্টেম, এআরএম ৬৪ লিনাক্স, নেটিভ টুলিং।',
    items: [
      { label: 'অন-ডিভাইস এআই', detail: 'এলএলএম ইনফারেন্স, এনপিইউ/জিপিইউ যোগ্যতা-পরীক্ষা' },
      { label: 'অ্যান্ড্রয়েড সিস্টেম', detail: 'কোটলিন, অ্যাক্সেসিবিলিটি, শিজুকু' },
      { label: 'এআরএম ৬৪ লিনাক্স', detail: 'এওএসপি বিল্ড, পি-রুট, টারমাক্স' },
      { label: 'নেটিভ টুলিং', detail: 'সোর্স থেকে বিল্ড-টুলস, সাইনড রিলিজ' },
    ],
  },
  about: {
    eyebrow: '০৩ — পরিচিতি',
    heading: 'সিস্টেম, সীমাবদ্ধতা ও বাস্তব সমস্যা থেকে শেখা।',
    paragraphs: [
      'আমি ঢাকা, বাংলাদেশের একজন স্ব-শিক্ষিত সফটওয়্যার ও প্রযুক্তি নির্মাতা। সফটওয়্যার ও অন-ডিভাইস এআই থেকে অ্যান্ড্রয়েড, কম্পিউটিং ও অটোমেশন পর্যন্ত নানা বিষয়ে আমার আগ্রহ।',
      'একটি নির্ধারক সীমাবদ্ধতা: প্রচলিত পিসি নয়, মূলত একটি অ্যান্ড্রয়েড ফোনে টারমাক্স ও পি-রুট ডেবিয়ান চালিয়ে আমি সফটওয়্যার তৈরি, বিল্ড ও যাচাই করি। এটিই গড়ে দিয়েছে আমার টুলিং, সিআই আর্কিটেকচার ও ফলাফল যাচাইয়ের পদ্ধতি।',
      'আমি শিখি বাস্তব সমস্যার মধ্য দিয়ে: প্রকল্প, পরীক্ষা, পর্যবেক্ষণ, প্রাতিষ্ঠানিক তত্ত্ব, তুলনা, পুনরাবৃত্তি। মেকানিজম-ফার্স্ট ও প্রমাণ-ভিত্তিক — একটি কর্মনীতি, যাকে সংক্ষেপে বলি “যতদিন শিখি, ততদিন বাঁচি”।',
    ],
    principles: [
      'সীমাবদ্ধতার মধ্যে নির্মাণ',
      'দাবির আগে প্রমাণ',
      'বাস্তব হার্ডওয়্যারই শেষ যাচাই',
      'ব্যর্থতাই হয়ে ওঠে আর্কিটেকচার',
      'প্রযোজ্য স্থানে লোকাল-ফার্স্ট',
      'ডকুমেন্টেশনও ইঞ্জিনিয়ারিং',
    ],
    facts: [
      { label: 'অবস্থান', value: 'ঢাকা, বাংলাদেশ (জিএমটি+৬)' },
      { label: 'ভাষা', value: 'বাংলা, ইংরেজি, হিন্দি/উর্দু, আরবি' },
      { label: 'রেফারেন্স ডিভাইস', value: 'রেডমি টার্বো ৪ প্রো — এসডি ৮এস জেন ৪' },
      { label: 'বিল্ড পাইপলাইন', value: 'গিটহাব অ্যাকশনস সিআই/সিডি' },
    ],
  },
  work: {
    eyebrow: '০৪ — নির্বাচিত কাজ',
    heading: 'সিআই ও ডিভাইস প্রমাণসহ নির্বাচিত প্রজেক্ট।',
    evidenceLabel: 'প্রমাণ: ',
    roleLabel: 'আমার ভূমিকা: ',
    liveLabel: 'ঘুরে দেখুন ↗',
    codeLabel: 'কোড ↗',
    projects: [
      {
        name: 'LAI',
        tagline: 'বাংলা-ফার্স্ট লোকাল এআই + সম্মতি-চালিত স্বয়ংক্রিয়তা',
        year: '২০২৪–২৬',
        description:
          'প্রাইভেট অন-ডিভাইস এলএলএম ইনফারেন্স ও অ্যাক্সেসিবিলিটি-নিয়ন্ত্রিত স্বয়ংক্রিয়তার অ্যান্ড্রয়েড রানটাইম। সিপিইউ ইনফারেন্স ডিভাইস-যাচাইকৃত; জিপিইউ/এনপিইউ এখনও যোগ্যতা-পরীক্ষায়।',
        role: 'রানটাইম ও অ্যান্ড্রয়েড সংযোগ তৈরি; ডিভাইসে সিপিইউ ইনফারেন্স ও সম্মতির সীমা যাচাই।',
        evidence:
          'বাস্তব এআরএম ৬৪ লামা.সিপিপি সিপিইউ ইনফারেন্স, ডিকোডে সেকেন্ডে ১২–২০ টোকেন, কেভি-প্রিফিক্স পুনর্ব্যবহার। অ্যাড্রেনো ভলকান ড্রাইভার ক্র্যাশের মূল কারণ নির্ণয় — যা গড়ে দিয়েছে ফেইল-ক্লোজড সিপিইউ-ডিফল্ট আর্কিটেকচার।',
        topics: ['কোটলিন', 'লামা.সিপিপি', 'ভলকান', 'অ্যাক্সেসিবিলিটি', 'শিজুকু', 'জিজিইউএফ'],
        repo: 'https://github.com/soobujmiah/lai',
        websiteUrl: null,
        accent: '#22c55e',
      },
      {
        name: 'GGEN',
        tagline: 'অ্যান্ড্রয়েড-ফার্স্ট ক্রিয়েটিভ ও ডকুমেন্ট স্টুডিও',
        year: '২০২৪–২৬',
        description:
          'পেশাদার ভেক্টর, রাস্টার, ডকুমেন্ট ও পিডিএফ কাজের ফ্লাটার/ডার্ট ভিত্তি। এসএইচএ-২৫৬ স্টেট ইন্টিগ্রিটিসহ পিওর-ডার্ট কোরের ডকুমেন্টেশন-ফার্স্ট আর্কিটেকচার।',
        role: 'অ্যাপ ও পুনর্ব্যবহারযোগ্য ডার্ট ভিত্তি তৈরি; কোর আচরণ ও ফ্লাটার ইন্টারঅ্যাকশন যাচাই।',
        evidence:
          '১৪৩টি পিওর-ডার্ট ইউনিট টেস্ট, ৩৫৩টি উইজেট/কন্ট্রোলার টেস্ট। বারবার বাস্তব ডিভাইসে যাচাইকৃত।',
        topics: ['ফ্লাটার', 'ডার্ট', 'ডকুমেন্ট জেনারেশন', 'ভেক্টর গ্রাফিক্স'],
        repo: 'https://github.com/soobujmiah/ggen',
        websiteUrl: null,
        accent: '#4ade80',
      },
      {
        name: 'ADT',
        tagline: 'নেটিভ এআরএম ৬৪ অ্যান্ড্রয়েড ডেভেলপমেন্ট টুলচেইন',
        year: '২০২৩–২৬',
        description:
          'লিনাক্স এআরএম ৬৪/গ্লিবসি-র জন্য এওএসপি সোর্স থেকে অ্যান্ড্রয়েড এসডিকে বিল্ড-টুলস ও প্লাটফর্ম-টুলস তৈরি করে। এসএইচএ-২৫৬-যাচাইকৃত অফলাইন রিলিজ আর্টিফ্যাক্ট।',
        role: 'সোর্স-বিল্ড ও রিলিজ পাইপলাইন তৈরি; এআরএম ৬৪ হার্ডওয়্যারে এপিকে কর্মপ্রবাহ যাচাই।',
        evidence:
          'স্ন্যাপড্রাগন ৮এস জেন ৪-এ সম্পূর্ণ এআরএম ৬৪ নেটিভ এপিকে পাইপলাইন শুরু থেকে শেষ পর্যন্ত যাচাইকৃত: সোর্স → এপিকে → সাইন → ইনস্টল → জেএনআই লোড → রান।',
        topics: ['এওএসপি', 'এআরএম ৬৪', 'বিল্ড টুলস', 'ক্রস-কম্পাইলেশন'],
        repo: 'https://github.com/soobujmiah/adt',
        websiteUrl: 'https://soobujmiah.github.io/adt/',
        accent: '#10b981',
      },
      {
        name: 'Ternux',
        tagline: 'রুট ছাড়াই অ্যান্ড্রয়েডে ডেবিয়ান/এক্সএফসিই লিনাক্স ডেস্কটপ',
        year: '২০২৩–২৬',
        description:
          'এক কমান্ডে আসল ডেবিয়ান এআরএম ৬৪ ইউজারস্পেস, এক্সএফসিই৪ ডেস্কটপ, টারমাক্স:এক্স১১ ডিসপ্লে, পালসঅডিও ব্রিজ ও জিংক/টার্নিপ জিপিইউ রুট — রুট ছাড়াই।',
        role: 'ইনস্টলেশন ও ডেস্কটপ টুলিং তৈরি; রেফারেন্স ডিভাইসে সমর্থিত গ্রাফিক্স পথ পরিমাপ।',
        evidence:
          'অ্যাড্রেনো ৮২৫-এ জিংক/টার্নিপ রেন্ডারার নিশ্চিত: গ্লমার্ক২ স্কোর ১৪০ (ওপেনজিএল ৪.৬), সঙ্গে নথিভুক্ত সামঞ্জস্য-ফলব্যাক রুট। ব্লেন্ডার ৪.৩.২ চালু হয়েছে, তবে তার নিজের রিপোর্টে ডিভাইস টাইপ সফটওয়্যার ছিল — কেবল জিংক/টার্নিপ দিয়ে ভিউপোর্ট ওপেনজিএল পথটিই প্রমাণিত, সাইকেলস জিপিইউ রেন্ডারিং নয়।',
        topics: ['ডেবিয়ান', 'ভলকান', 'টার্নিপ', 'জিংক', 'অ্যাড্রেনো', 'পি-রুট'],
        repo: 'https://github.com/soobujmiah/ternux',
        websiteUrl: 'https://soobujmiah.github.io/ternux/',
        accent: '#86efac',
      },
    ],
    nowBuilding: {
      eyebrow: 'এখন যা বানাচ্ছি — পি০ রিলিজ ট্র্যাক',
      name: 'সংযোগ',
      description:
        'বাংলা-ফার্স্ট ব্যবসা ও প্রতিষ্ঠান পরিচালনার অ্যাপ। ওনার এডিশন: দ্রুত দৈনিক এন্ট্রি, লোকাল এসকিউলাইট রেকর্ড, ধ্বংসাত্মক ডিলিটের বদলে অডিটযোগ্য সংশোধন।',
      testsNote: 'সিআই-তে ৯৪টি টেস্ট সবুজ · রেডমি টার্বো ৪ প্রো-তে এক্সপোর্ট ও ডায়াগনস্টিক ডিভাইস-যাচাইকৃত',
      cta: 'বিল্ড অনুসরণ করুন ↗',
      url: 'https://github.com/soobujmiah/songjog',
    },
    relationship: {
      eyebrow: 'ইকোসিস্টেম — এক ডিভাইস, দুই স্তর',
      heading: 'এডিটি ও টার্নাক্স — একই অ্যান্ড্রয়েড/এআরএম ৬৪ কর্মপ্রবাহের দুই অর্ধ।',
      body: 'একটিই ভৌত অ্যান্ড্রয়েড ডিভাইস, দুটি পরস্পর পূরক টুলচেইন। এডিটি তা অ্যান্ড্রয়েড ডেভেলপমেন্ট ওয়ার্কস্টেশনে বদলে দেয় — বিল্ড, সাইন, ইনস্টল, ডিবাগ। টার্নাক্স তা লিনাক্স এআরএম ৬৪ ডেস্কটপে বদলায় — ডেবিয়ান, এক্সএফসিই৪ ডেস্কটপ, জিপিইউ ত্বরণ। কোনোটিই প্রচলিত পিসির উপর নির্ভর করে না; দুটিই স্বতন্ত্র রিপোজিটরি হিসেবে নিজস্ব ডকুমেন্টেশন ও প্রমাণসহ রক্ষিত।',
      deviceLabel: 'একটিই ভৌত অ্যান্ড্রয়েড ডিভাইস',
      layers: [
        {
          name: 'ADT',
          role: 'অ্যান্ড্রয়েড ডেভেলপমেন্ট স্তর',
          note: 'এওএসপি সোর্স থেকে নেটিভ এআরএম ৬৪ বিল্ড-টুলস ও প্লাটফর্ম-টুলস: ফোন থেকেই আসল এপিকে বিল্ড, সাইন, ইনস্টল ও পরিদর্শন।',
          websiteUrl: 'https://soobujmiah.github.io/adt/',
          repo: 'https://github.com/soobujmiah/adt',
        },
        {
          name: 'Ternux',
          role: 'লিনাক্স ডেস্কটপ স্তর',
          note: 'আসল ডেবিয়ান এআরএম ৬৪ ইউজারস্পেস ও এক্সএফসিই৪ ডেস্কটপ, সঙ্গে স্পষ্ট গ্রাফিক্স রুট — একই ডিভাইসে, রুট ছাড়াই।',
          websiteUrl: 'https://soobujmiah.github.io/ternux/',
          repo: 'https://github.com/soobujmiah/ternux',
        },
      ],
      verifiedLabel: 'যাচাইকৃত: ',
      verified: 'দুটি টুলচেইনই একই ভৌত ডিভাইসে যাচাই করা হয়েছে — টারমাক্স ও পি-রুট ডেবিয়ানে চলা একটি রেডমি টার্বো ৪ প্রো। টার্নাক্স সেই ডেবিয়ান ডেস্কটপ ইনস্টল করে; এডিটি তার ভেতরেই চলে এবং একটি আসল এপিকে শুরু থেকে শেষ পর্যন্ত তৈরি, সাইন ও ইনস্টল করেছে।',
      experimentalLabel: 'এখনো প্রমাণিত নয়: ',
      experimental: 'কোনো যৌথ অটোমেশন নেই, সাধারণ বিল্ড অর্কেস্ট্রেশন নেই, জিপিইউ-সহায়ক বিল্ড পথও নেই। প্রতিটি প্রকল্প নিজস্ব প্রমাণে দাঁড়ায় — মিলিত পাইপলাইনে নয়।',
    },
  },
  research: {
    eyebrow: '০৫ — গবেষণা ও পরীক্ষা',
    heading: 'যাচাইকৃত ফলাফল ও চলমান পরীক্ষা — স্পষ্টভাবে আলাদা।',
    entries: [
      {
        title: 'অন-ডিভাইস এলএলএম ইনফারেন্স',
        status: 'validated',
        statusLabel: 'যাচাইকৃত',
        description:
          'এআরএম ৬৪ লামা.সিপিপি/জিজিইউএফ সিপিইউ রানটাইম: স্ট্রিমিং মাল্টি-টার্ন ইনফারেন্স, কেভি-প্রিফিক্স পুনর্ব্যবহার, স্ন্যাপড্রাগন ৮এস জেন ৪-এ মাপা ডিকোড থ্রুপুট ও টিটিএফটি।',
      },
      {
        title: 'স্ন্যাপড্রাগন / হেক্সাগন এনপিইউ',
        status: 'experimental',
        statusLabel: 'পরীক্ষামূলক',
        description:
          'কোয়ালকম হেক্সাগন এইচটিপি মূল্যায়ন; ফাস্টআরপিসি/ডিএসপি প্রমাণসহ প্রথম নন-সিপিইউ ব্যাকএন্ড নিশ্চিত। যোগ্যতা-পরীক্ষা শেষ না হওয়া পর্যন্ত কোনো ত্বরণের দাবি নয়।',
      },
      {
        title: 'অ্যাড্রেনো জিপিইউ — ভলকান, টার্নিপ, জিংক',
        status: 'experimental',
        statusLabel: 'পরীক্ষামূলক',
        description:
          'অ্যাড্রেনো ৮২৫-এ মেসা টার্নিপ ভলকান ও জিংক; ডিকোডে ভলকান কম্পিউট ক্র্যাশের মূল কারণ নির্ণয় করে ডকুমেন্ট করা; জিংক ডেস্কটপ পথ মাপা হয়েছে (গ্লমার্ক২ স্কোর ১৪০)।',
      },
      {
        title: 'সম্মতি-নিয়ন্ত্রিত অ্যান্ড্রয়েড স্বয়ংক্রিয়তা',
        status: 'validated',
        statusLabel: 'যাচাইকৃত',
        description:
          'স্পষ্ট সম্মতিসহ অ্যাক্সেসিবিলিটি সার্ভিস ও শিজুকু প্রিভিলেজড এক্সিকিউশন, টাইপড অপারেশন এবং হ্যাশ-চেইনড অডিট ট্রেইল।',
      },
      {
        title: 'অ্যান্ড্রয়েডে লিনাক্স — এআরএম ৬৪ ওয়ার্কস্টেশন',
        status: 'validated',
        statusLabel: 'যাচাইকৃত',
        description:
          'রুট ছাড়া পি-রুটে ডেবিয়ান/এক্সএফসিই, মাপা জিপিইউ পথসহ; ফোন-ফার্স্ট লুপ — সিআই আর্টিফ্যাক্ট বিল্ড করে, ডিভাইস সেটি যাচাই করে।',
      },
      {
        title: 'এওএসপি সোর্স থেকে নেটিভ এআরএম ৬৪ টুলিং',
        status: 'validated',
        statusLabel: 'যাচাইকৃত',
        description:
          'লিনাক্স এআরএম ৬৪/গ্লিবসির জন্য অ্যান্ড্রয়েড এসডিকে বিল্ড-টুলস ও প্লাটফর্ম-টুলস কম্পাইল; এসএইচএ-২৫৬-যাচাইকৃত অফলাইন আর্টিফ্যাক্ট; ডিভাইসে শুরু থেকে শেষ পর্যন্ত যাচাইকৃত এপিকে পাইপলাইন।',
      },
    ],
  },
  stack: {
    eyebrow: '০৬ — প্রযুক্তিগত ফোকাস',
    heading: 'দৈনন্দিন কাজের মূল প্রযুক্তি।',
    domains: [
      { name: 'অন-ডিভাইস এআই', items: ['লামা.সিপিপি', 'জিজিইউএফ', 'কেভি-ক্যাশ', 'সিপিইউ/জিপিইউ/এনপিইউ রাউটিং'] },
      { name: 'অ্যান্ড্রয়েড সিস্টেম', items: ['কোটলিন', 'কম্পোজ', 'অ্যাক্সেসিবিলিটি', 'শিজুকু', 'জেএনআই/সি++'] },
      { name: 'লিনাক্স / এআরএম ৬৪', items: ['এওএসপি বিল্ড', 'ক্ল্যাং/সিএমেক/নিনজা', 'টারমাক্স + পি-রুট'] },
      { name: 'জিপিইউ / গ্রাফিক্স', items: ['ভলকান', 'মেসা টার্নিপ', 'জিংক', 'অ্যাড্রেনো কেজিএসএল'] },
      { name: 'মোবাইল ও ওয়েব', items: ['ফ্লাটার', 'ডার্ট', 'টাইপস্ক্রিপ্ট', 'পাইথন'] },
      { name: 'প্রকৌশল পরিচালনা', items: ['গিটহাব অ্যাকশনস', 'সাইনড রিলিজ', 'ডিভাইস যাচাইকরণ'] },
    ],
  },
  openSource: {
    eyebrow: '০৭ — ওপেন সোর্স',
    heading: 'নির্বাচিত রিপোজিটরি।',
    liveLabel: 'ঘুরে দেখুন ↗',
    codeLabel: 'কোড ↗',
    selected: ['docdr', 'datakhoj-android', 'apiloop', 'arms', 'iqra-online-mart', 'sobkichu'],
    appliedBadge: 'অ্যাপ্লাইড প্রোডাক্ট',
    note: 'নির্বাচিত প্রজেক্টের বাইরে অ্যাপ্লাইড প্রোডাক্ট ও সহায়ক কাজ — স্ট্যাটাস ও প্রমাণ প্রতিটি রিপোজিটরিতে।',
    moreLabel: 'গিটহাবে সবকিছু',
    moreSub: 'পরীক্ষা, প্রোটোটাইপ ও চলমান কাজ থাকে সেখানে।',
    repos: [
      { name: 'lai', desc: 'বাংলা-ফার্স্ট লোকাল এআই + স্বয়ংক্রিয়তা রানটাইম', lang: 'কোটলিন', stars: 1, url: 'https://github.com/soobujmiah/lai', websiteUrl: null, tier: 'flagship' },
      { name: 'adt', desc: 'এওএসপি সোর্স থেকে এআরএম ৬৪ অ্যান্ড্রয়েড ডেভ টুলচেইন', lang: 'শেল', stars: 0, url: 'https://github.com/soobujmiah/adt', websiteUrl: 'https://soobujmiah.github.io/adt/', tier: 'flagship' },
      { name: 'ternux', desc: 'অ্যান্ড্রয়েডে জিপিইউ-ত্বরান্বিত লিনাক্স ডেস্কটপ', lang: 'শেল', stars: 1, url: 'https://github.com/soobujmiah/ternux', websiteUrl: 'https://soobujmiah.github.io/ternux/', tier: 'flagship' },
      { name: 'ggen', desc: 'অ্যান্ড্রয়েড-ফার্স্ট ক্রিয়েটিভ ও ডকুমেন্ট স্টুডিও', lang: 'ডার্ট', stars: 0, url: 'https://github.com/soobujmiah/ggen', websiteUrl: null, tier: 'flagship' },
      { name: 'songjog', desc: 'বাংলা-ফার্স্ট ব্যবসায়িক খাতা ও পরিচালনা অ্যাপ (মালিক সংস্করণ)', lang: 'ডার্ট', stars: 0, url: 'https://github.com/soobujmiah/songjog', websiteUrl: null, tier: 'applied' },
      { name: 'docdr', desc: 'মোবাইল-ফার্স্ট অফলাইন ডকুমেন্ট ওয়ার্কস্পেস — দেখা, স্ক্যান, টেমপ্লেট, জেনারেশন', lang: 'ডার্ট', stars: 0, url: 'https://github.com/soobujmiah/docdr', websiteUrl: null, tier: 'applied' },
      { name: 'datakhoj-android', desc: 'পাবলিক-ডেটা পাইপলাইন — অনুসন্ধান, নিষ্কাশন, পরিষ্কার, ডুপ্লিকেট বাদ দিয়ে টাইপড ডেটাসেট এক্সপোর্ট; পাইথন ইঞ্জিনের সঙ্গে শেয়ার্ড জবস্পেক। প্রি-আলফা।', lang: 'কোটলিন', stars: 0, url: 'https://github.com/soobujmiah/datakhoj-android', websiteUrl: null, tier: 'applied' },
      { name: 'apiloop', desc: 'প্রোভাইডার-নিরপেক্ষ এআই এপিআই গেটওয়ে', lang: 'পাইথন', stars: 0, url: 'https://github.com/soobujmiah/apiloop', websiteUrl: null, tier: 'supporting' },
      { name: 'arms', desc: 'এআরএম ৬৪ লিনাক্স টুল ক্যাটালগ + স্ট্যাটিক সাইট', lang: 'এইচটিএমএল', stars: 0, url: 'https://github.com/soobujmiah/arms', websiteUrl: 'https://soobujmiah.github.io/arms', tier: 'supporting' },
      { name: 'iqra-online-mart', desc: 'স্থানীয় রিটেইলের জন্য দ্বিভাষিক স্ট্যাটিক স্টোরফ্রন্ট ডেমো', lang: 'জাভাস্ক্রিপ্ট', stars: 0, url: 'https://github.com/soobujmiah/iqra-online-mart', websiteUrl: 'https://soobujmiah.github.io/iqra-online-mart/', tier: 'supporting' },
      { name: 'sobkichu', desc: 'বাংলাদেশি হাইপারলোকাল সুপার-অ্যাপ — আর্কিটেকচার ও স্পেসিফিকেশন', lang: 'টাইপস্ক্রিপ্ট', stars: 0, url: 'https://github.com/soobujmiah/sobkichu', websiteUrl: null, tier: 'supporting' },
    ],
  },
  experience: {
    eyebrow: '০৮ — অভিজ্ঞতা',
    heading: 'প্রযুক্তি নিয়ে হাতে-কলমে দীর্ঘ যাত্রা, পাশাপাশি পেশাগত কাজ।',
    intro: 'কম্পিউটার ও প্রযুক্তির প্রতি আমার আগ্রহ তালিকাভুক্ত পেশাগত কাজেরও আগে শুরু। অনুসন্ধান, সমস্যা সমাধান, নির্মাণ ও বাস্তব কাজ থেকে শেখার মধ্য দিয়ে তা বেড়েছে। পেশাগত কাজ এই পথের একটি অংশ; প্রকল্পগুলো দেখায় এখন কী নিয়ে পরীক্ষা ও নির্মাণ চালিয়ে যাচ্ছি।',
    professionalLabel: 'পেশাগত অভিজ্ঞতা',
    services: {
      label: 'অন্যান্য ব্যবহারিক কাজ',
      items: [
        'অফিস ও ডিজিটাল প্রশাসন',
        'সফটওয়্যার, ওয়েবসাইট ও কর্মপ্রবাহের টুল',
        'কম্পিউটার ও অ্যান্ড্রয়েড সহায়তা',
      ],
    },
    entries: [
      {
        period: 'এপ্রিল ২০২৬ – বর্তমান',
        role: 'স্বাধীন সফটওয়্যার ও এআই সিস্টেম নির্মাতা',
        company: 'প্রো-জুকতি ইনফো টেক',
        location: 'স্ব-নিয়োজিত',
        desc: 'স্বাধীন সিস্টেম কাজ — অন-ডিভাইস এআই, এআরএম ৬৪ অ্যান্ড্রয়েড টুলিং ও লিনাক্স সিস্টেম, প্রো-জুকতি ইনফো টেক-এর মাধ্যমে পরিবেশিত।',
      },
      {
        period: 'মার্চ ২০২৫ – বর্তমান',
        role: 'অফিস প্রশাসক',
        company: 'রাবেয়া এডুকেশন ফ্যামিলি',
        location: 'সাভার, ঢাকা',
        desc: 'দৈনিক কার্যক্রম, সোশ্যাল মিডিয়া, সার্চ ইঞ্জিন অপটিমাইজেশন, শিক্ষার্থী নিবন্ধন, ডকুমেন্ট ব্যবস্থাপনা, প্রচারণামূলক গ্রাফিক্স।',
      },
      {
        period: 'সেপ্টেম্বর ২০২২ – ফেব্রুয়ারি ২০২৩',
        role: 'কম্পিউটার অপারেটর',
        company: 'মনিকা এন্টারপ্রাইজ',
        location: 'সাভার, ঢাকা',
        desc: 'অনলাইন কার্যক্রম, ডকুমেন্ট প্রসেসিং, ফাইলিং সিস্টেম।',
      },
      {
        period: '২০২১ – ২০২২',
        role: 'সমন্বয়ক',
        company: 'আবদুল্লাহ ট্রেডিং প্রাইভেট লিমিটেড',
        location: 'জুবাইল, সৌদি আরব',
        desc: 'সাইট পরিচালনা, সরবরাহ ব্যবস্থা ও দলীয় যোগাযোগ।',
      },
      {
        period: '২০২০ – ২০২১',
        role: 'ইলেকট্রিশিয়ান',
        company: 'সৌদি ইলেকট্রিসিটি কোম্পানি ও খালেদ জুফফালি কোম্পানি',
        location: 'জেদ্দা, সৌদি আরব',
        desc: 'বৈদ্যুতিক স্থাপনা ও রক্ষণাবেক্ষণ।',
      },
      {
        period: '২০১৮ – ২০২০',
        role: 'অগ্রগতি প্রতিবেদক',
        company: 'ফাদলি গ্যাস প্ল্যান্ট প্রজেক্ট / পিসিএমসি',
        location: 'সৌদি আরব',
        desc: 'দৈনিক অগ্রগতি ডেটা, ডিজিটাইজেশন, কাঠামোবদ্ধ রিপোর্টিং।',
      },
      {
        period: '২০১৭ – ২০১৮',
        role: 'অগ্নি পর্যবেক্ষক',
        company: 'ফাদলি গ্যাস প্ল্যান্ট / সৌদি আরামকো',
        location: 'সৌদি আরব',
        desc: 'অগ্নি-ঝুঁকি পর্যবেক্ষণ, দুর্ঘটনা প্রতিরোধ।',
      },
      {
        period: '২০১৫ – ২০১৭',
        role: 'ইমেইল মার্কেটিং বিশেষজ্ঞ',
        company: 'ফ্রিল্যান্স',
        location: 'রিমোট',
        desc: 'লক্ষ্যভিত্তিক প্রচারণা, সাবস্ক্রাইবার ব্যবস্থাপনা, স্ব-শিক্ষিত ডিজিটাল মার্কেটিং।',
      },
    ],
  },
  contact: {
    eyebrow: '০৯ — যোগাযোগ',
    headingA: 'ফ্রিল্যান্স,',
    headingB: 'রিমোট ও সহযোগিতায় উন্মুক্ত।',
    sub: 'অন-ডিভাইস এআই, অ্যান্ড্রয়েড সিস্টেম, এআরএম ৬৪ টুলিং ও লোকাল-ফার্স্ট প্রোডাক্টের পাশাপাশি ব্যবহারিক প্রযুক্তি কাজেও পাওয়া যাবে: ওয়েবসাইট তৈরি, কাস্টম সফটওয়্যার, কম্পিউটার বা অ্যান্ড্রয়েড সহায়তা। সাভার, ঢাকা, বাংলাদেশে অবস্থিত; বিশ্বব্যাপী রিমোট।',
    telegram: { label: 'টেলিগ্রাম', value: '@soobujmiah', href: 'https://t.me/soobujmiah' },
    email: { label: 'ইমেইল', value: 'soobujmiah@gmail.com', href: 'mailto:soobujmiah@gmail.com' },
    servicesLink: 'সব সেবার পূর্ণ তালিকা দেখুন →',
    groupsHeading: 'অনলাইনে আমাকে পাবেন',
    groupsNote: 'সব প্ল্যাটফর্মে একই হ্যান্ডেল।',
    groups: [
      {
        label: 'মূল',
        links: [
          { label: 'গিটহাব', handle: 'soobujmiah', href: 'https://github.com/soobujmiah' },
          { label: 'পোর্টফোলিও', handle: 'soobujmiah.github.io', href: 'https://soobujmiah.github.io' },
        ],
      },
      {
        label: 'পেশাগত',
        links: [
          { label: 'লিংকডইন', handle: 'in/soobujmiah', href: 'https://linkedin.com/in/soobujmiah' },
          { label: 'পিয়ারলিস্ট', handle: 'soobujmiah', href: 'https://peerlist.io/soobujmiah' },
          { label: 'প্রোডাক্ট হান্ট', handle: '@soobujmiah', href: 'https://www.producthunt.com/@soobujmiah' },
        ],
      },
      {
        label: 'এআই ও ডেভেলপার',
        links: [
          { label: 'হাগিং ফেস', handle: 'soobujmiah', href: 'https://huggingface.co/soobujmiah' },
          { label: 'ডেভ.টু', handle: 'soobujmiah', href: 'https://dev.to/soobujmiah' },
          { label: 'হ্যাশনোড', handle: '@soobujmiah', href: 'https://hashnode.com/@soobujmiah' },
          { label: 'মিডিয়াম', handle: '@soobujmiah', href: 'https://medium.com/@soobujmiah' },
        ],
      },
      {
        label: 'সামাজিক',
        links: [
          { label: 'এক্স', handle: '@soobujmiah', href: 'https://x.com/soobujmiah' },
          { label: 'ইনস্টাগ্রাম', handle: '@soobujmiah', href: 'https://instagram.com/soobujmiah' },
          { label: 'থ্রেডস', handle: '@soobujmiah', href: 'https://threads.net/@soobujmiah' },
          { label: 'ফেসবুক', handle: 'soobujmiah', href: 'https://facebook.com/soobujmiah' },
          { label: 'ইউটিউব', handle: '@soobujmiah', href: 'https://youtube.com/@soobujmiah' },
        ],
      },
      {
        label: 'সরাসরি',
        links: [
          { label: 'টেলিগ্রাম', handle: '@soobujmiah', href: 'https://t.me/soobujmiah' },
          { label: 'ইমেইল', handle: 'soobujmiah@gmail.com', href: 'mailto:soobujmiah@gmail.com' },
        ],
      },
      {
        label: 'ব্যক্তিগত',
        links: [
          { label: 'অ্যাবাউট.মি', handle: 'soobujmiah', href: 'https://about.me/soobujmiah' },
          { label: 'বাই মি আ কফি', handle: 'soobujmiah', href: 'https://buymeacoffee.com/soobujmiah' },
        ],
      },
    ],
  },
  nav: [
    { scene: 3, label: 'কাজ' },
    { scene: 4, label: 'গবেষণা' },
    { scene: 5, label: 'স্ট্যাক' },
    { scene: 8, label: 'যোগাযোগ' },
  ],
  header: {
    homeLabel: 'হোমে ফিরুন',
    githubLabel: 'গিটহাব',
    langLabel: 'ইংরেজি',
    langAria: 'ইংরেজিতে বদলান',
    githubAria: 'গিটহাব প্রোফাইল',
    cvLabel: 'সিভি',
    cvAria: 'সিভি ডাউনলোড করুন',
    servicesLabel: 'সার্ভিস',
  },
  ui: {
    carouselPrev: 'আগের',
    carouselNext: 'পরের',
    pageLabels: ['হোম', 'উপস্থিতি', 'পরিচিতি', 'নির্বাচিত কাজ', 'গবেষণা', 'প্রযুক্তিগত ফোকাস', 'ওপেন সোর্স', 'অভিজ্ঞতা', 'যোগাযোগ'],
    repoWord: 'রিপোজিটরি',
    liveSiteWord: 'লাইভ সাইট',
    navOpen: 'সূচি খুলুন',
    navTitle: 'সূচি',
    navClose: 'সূচি বন্ধ করুন',
    navHint: 'অ্যারো কী দিয়ে চলুন · এন্টার দিয়ে খুলুন · এসকেপে বন্ধ করুন',
    current: 'এখানে আছেন',
    meridiemAm: 'এএম',
    meridiemPm: 'পিএম',
    pull: 'রিফ্রেশ করতে টানুন',
    release: 'রিফ্রেশে ছেড়ে দিন',
    refreshing: 'রিফ্রেশ হচ্ছে',
    mapFocus: 'পটভূমি মানচিত্রের কেন্দ্র',
    downloadCv: 'সিভি ডাউনলোড করুন',
  },
  footer: {
    built: 'ফোন থেকে তৈরি।',
    claims: 'প্রতিটি দাবি সিআই বা বাস্তব-ডিভাইস প্রমাণে সমর্থিত।',
  },
  preloader: { status: 'চালু হচ্ছে' },
  seo: {
    sections: [
      {
    title: 'সবুজ মিয়া — সফটওয়্যার, এআই ও ব্যবহারিক প্রযুক্তি',
        description:
          'সফটওয়্যার, অন-ডিভাইস এআই, অ্যান্ড্রয়েড, কম্পিউটিং ও অটোমেশন। হাতে-কলমে শেখা ও নির্মাণের দীর্ঘ যাত্রা, বাস্তব ডিভাইস ও সিআই-ভিত্তিক প্রকল্প প্রমাণসহ।',
      },
      {
        title: 'আমি যা নির্মাণ করি — অন-ডিভাইস এআই, অ্যান্ড্রয়েড ও এআরএম ৬৪ সিস্টেম',
        description:
          'সবুজ মিয়ার নির্মাণক্ষেত্র: অন-ডিভাইস এআই ও এলএলএম ইনফারেন্স, সম্মতি-নিয়ন্ত্রিত স্বয়ংক্রিয়তাসহ অ্যান্ড্রয়েড সিস্টেম, এওএসপি থেকে পি-রুট পর্যন্ত এআরএম ৬৪ লিনাক্স, এবং সাইনড রিলিজসহ নেটিভ টুলিং।',
      },
      {
        title: 'পরিচিতি — ঢাকার স্বাধীন সিস্টেম নির্মাতা',
        description:
          'সবুজ মিয়া সম্পর্কে: ঢাকার স্ব-শিক্ষিত সফটওয়্যার ও প্রযুক্তি নির্মাতা, যিনি ব্যবহারিক প্রকল্প, বাস্তব ডিভাইস ও সমস্যা সমাধানের মধ্য দিয়ে শেখেন।',
      },
      {
        title: 'নির্বাচিত কাজ — লাই, জিজেন, এডিটি, টারনাক্স',
        description:
          'সবুজ মিয়ার ফ্ল্যাগশিপ সিস্টেম: লাই অন-ডিভাইস এআই রানটাইম, জিজেন ক্রিয়েটিভ ও ডকুমেন্ট স্টুডিও, এডিটি এআরএম ৬৪ অ্যান্ড্রয়েড টুলচেইন, টারনাক্স রুট-ছাড়া লিনাক্স ডেস্কটপ — প্রতিটিতে সিআই ও ডিভাইস প্রমাণ।',
      },
      {
        title: 'গবেষণা — অন-ডিভাইস এআই, এনপিইউ, ভলকান ও এআরএম ৬৪ পরীক্ষা',
        description:
          'প্রমাণ-স্তরবিন্যস্ত গবেষণা: অন-ডিভাইস এলএলএম ইনফারেন্স, হেক্সাগন এনপিইউ যোগ্যতা-পরীক্ষা, অ্যাড্রেনো ভলকান/টার্নিপ/জিংক, সম্মতি-নিয়ন্ত্রিত স্বয়ংক্রিয়তা, অ্যান্ড্রয়েডে লিনাক্স ও নেটিভ এআরএম ৬৪ টুলিং।',
      },
      {
        title: 'প্রযুক্তিগত স্ট্যাক — লামা.সিপিপি, কোটলিন, ফ্লাটার, ভলকান, টারমাক্স',
        description:
          'সবুজ মিয়ার কাজের প্রযুক্তি: লামা.সিপিপি ও জিজিইউএফ, কোটলিন ও ফ্লাটার, ভলকান, মেসা টার্নিপ ও জিংক, এওএসপি বিল্ড, টারমাক্স ও পি-রুট, গিটহাব অ্যাকশনস সিআই।',
      },
      {
        title: 'ওপেন সোর্স প্রজেক্ট — অ্যাপ্লাইড ও সহায়ক কাজ',
        description:
          'অ্যাপ্লাইড প্রোডাক্ট ও সহায়ক ওপেন সোর্স কাজ — ডকডিআর, ডেটাখোজ, এপিলুপ, আর্মস, ইকরা অনলাইন মার্ট ও সোবকিছু — কোড, লাইভ সাইট ও রিপোজিটরি প্রমাণের লিংকসহ।',
      },
      {
        title: 'অভিজ্ঞতা — অপারেশন, প্রশাসন ও ইঞ্জিনিয়ারিং',
        description:
          'প্রযুক্তি নিয়ে দীর্ঘদিনের শেখা, পরীক্ষা, নির্মাণ ও বাস্তব সমস্যা সমাধানের পথ; পাশাপাশি অপারেশন ও প্রশাসনে পেশাগত অভিজ্ঞতা। তারিখসহ কাজের তালিকা ও প্রকল্প দেখুন।',
      },
      {
        title: 'যোগাযোগ — ফ্রিল্যান্স, রিমোট ও কোলাবরেশন',
        description:
          'সফটওয়্যার, এআই, ব্যবহারিক প্রযুক্তি সেবা বা সহযোগিতা নিয়ে সবুজ মিয়ার সঙ্গে যোগাযোগ করুন। সাভার, ঢাকা, বাংলাদেশ থেকে রিমোট কাজের জন্য উপলব্ধ।',
      },
    ],
  },
};

export const content: Record<Lang, Content> = { en, bn };
