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
                          Twitter, keywords) in app/layout.tsx
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
    scrollHint: string;
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
    services: { label: string; items: string[] };
    entries: WorkEntry[];
  };
  contact: {
    eyebrow: string;
    headingA: string;
    headingB: string;
    sub: string;
    channels: { label: string; value: string; href: string }[];
  };
  nav: { scene: number; label: string }[];
  header: { homeLabel: string; githubLabel: string; langLabel: string; langAria: string; githubAria: string };
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
    pull: string;
    release: string;
    refreshing: string;
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
    title: 'Independent Systems Builder',
    tagline: 'On-Device AI · Android · ARM64 Linux · Native Tooling · Software Systems',
    location: 'Dhaka, Bangladesh',
    github: 'https://github.com/soobujmiah',
    email: 'soobujmiah@gmail.com',
    telegram: '@soobujmiah',
    linkedin: 'https://linkedin.com/in/soobujmiah',
  },
  meta: {
    title: 'Sobuj Miah — Independent Systems Builder · On-Device AI & ARM64 Systems',
    description:
      'On-device AI, Android, ARM64 Linux, native tooling. Built under constraint. Verified on real hardware with CI builds, tests, and physical-device evidence.',
  },
  hero: {
    intro:
      'Self-taught systems builder at the intersection of on-device AI, Android systems, and ARM64 Linux. Built under constraint — every build runs on CI, every claim checked against a physical device.',
    availability: 'Open to remote',
    ctaWork: 'Explore my work',
    ctaGithub: 'View GitHub ↗',
    scrollHint: 'Open index',
  },
  presence: {
    eyebrow: '02 — What I actually do',
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
    heading: 'Self-taught systems builder working from constraints most people treat as blockers.',
    paragraphs: [
      'I am a self-taught systems builder based in Dhaka, Bangladesh. My work sits at the intersection of on-device AI, Android systems, and ARM64 Linux — problems I pursue because the tools I needed did not exist yet on the hardware I had.',
      'A defining constraint: I develop, build, and validate software primarily from an Android phone running Termux and PRoot Debian, not a conventional PC. This shapes everything — tooling, CI architecture, how I verify claims.',
      'My learning philosophy: living till learning, dead upon stop learning. I learn through real problems — hypothesis, test, observation, formal theory, compare, iterate. Mechanism-first, evidence-backed.',
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
    heading: 'The strongest work — not every repository.',
    evidenceLabel: 'Evidence: ',
    liveLabel: 'Explore ↗',
    codeLabel: 'Code ↗',
    projects: [
      {
        name: 'LAI',
        tagline: 'Bangla-first local AI + consent-driven automation',
        year: '2024–26',
        description:
          'Source-only Android runtime for private on-device LLM inference and Accessibility-gated automation. CPU inference device-validated; GPU/NPU in qualification.',
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
        evidence:
          'Zink/Turnip renderer confirmed on Adreno 825: glmark2 score 140 (OpenGL 4.6). Blender 4.3.2 launched with Zink/Adreno/Turnip renderer.',
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
  },
  research: {
    eyebrow: '05 — Research & Experiments',
    heading: 'Honest about what is proven vs. experimental.',
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
    heading: 'Technologies I actually work with.',
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
    heading: '8+ years across operations, engineering, and administration.',
    services: {
      label: 'Practical work beyond engineering',
      items: [
        'Office administration',
        'Digital documentation',
        'Records & data organization',
        'Spreadsheet & workflow support',
        'Website & content management',
        'Digital workflow automation',
        'IT & software support',
      ],
    },
    entries: [
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
    sub: 'On-device AI, Android systems, ARM64 tooling, or local-first products — happy to talk.',
    channels: [
      { label: 'Email', value: 'soobujmiah@gmail.com', href: 'mailto:soobujmiah@gmail.com' },
      { label: 'GitHub', value: 'soobujmiah', href: 'https://github.com/soobujmiah' },
      { label: 'Telegram', value: '@soobujmiah', href: 'https://t.me/soobujmiah' },
      { label: 'LinkedIn', value: 'in/soobujmiah', href: 'https://linkedin.com/in/soobujmiah' },
    ],
  },
  nav: [
    { scene: 3, label: 'Work' },
    { scene: 4, label: 'Research' },
    { scene: 5, label: 'Stack' },
    { scene: 8, label: 'Contact' },
  ],
  header: { homeLabel: 'Back to home', githubLabel: 'GitHub', langLabel: 'Bangla', langAria: 'Switch to Bangla', githubAria: 'GitHub profile' },
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
    pull: 'Pull to refresh',
    release: 'Release to refresh',
    refreshing: 'Refreshing',
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
        title: 'Sobuj Miah — Independent Systems Builder · On-Device AI & ARM64 Systems',
        description:
          'On-device AI, Android, ARM64 Linux, native tooling. Built under constraint. Verified on real hardware with CI builds, tests, and physical-device evidence.',
      },
      {
        title: 'What I Build — On-Device AI, Android & ARM64 Systems',
        description:
          'What Sobuj Miah builds: on-device AI and LLM inference, Android systems with consent-gated automation, ARM64 Linux from AOSP to PRoot, and native tooling with signed releases.',
      },
      {
        title: 'About — Independent Systems Builder in Dhaka',
        description:
          'Self-taught independent systems builder in Dhaka, Bangladesh — developing from an Android phone, with engineering principles of evidence before claims and real hardware closing the loop.',
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
          '8+ years across operations, administration, and engineering: office administration, digital documentation, records and data organization, coordination, electrical work, and systems building.',
      },
      {
        title: 'Contact — Freelance, Remote & Collaboration',
        description:
          'Contact Sobuj Miah — open to freelance, remote, and collaboration on on-device AI, Android systems, ARM64 tooling, and local-first products.',
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
    title: 'স্বাধীন সিস্টেম নির্মাতা',
    tagline: 'অন-ডিভাইস এআই · অ্যান্ড্রয়েড · এআরএম ৬৪ লিনাক্স · নেটিভ টুলিং · সফটওয়্যার সিস্টেম',
    location: 'ঢাকা, বাংলাদেশ',
    github: 'https://github.com/soobujmiah',
    email: 'soobujmiah@gmail.com',
    telegram: '@soobujmiah',
    linkedin: 'https://linkedin.com/in/soobujmiah',
  },
  meta: {
    title: 'সবুজ মিয়া — স্বাধীন সিস্টেম নির্মাতা · অন-ডিভাইস এআই ও এআরএম ৬৪ সিস্টেম',
    description:
      'অন-ডিভাইস এআই, অ্যান্ড্রয়েড, এআরএম ৬৪ লিনাক্স, নেটিভ টুলিং। সীমাবদ্ধতার মধ্যে নির্মিত, বাস্তব হার্ডওয়্যারে যাচাইকৃত — সিআই বিল্ড, টেস্ট ও ফিজিক্যাল-ডিভাইস প্রমাণ।',
  },
  hero: {
    intro:
      'অন-ডিভাইস এআই, অ্যান্ড্রয়েড সিস্টেম ও এআরএম ৬৪ লিনাক্সের সংযোগস্থলে কাজ করা স্ব-শিক্ষিত সিস্টেম নির্মাতা। সীমাবদ্ধতার মধ্যে নির্মিত — প্রতিটি বিল্ড চলে সিআই-তে, প্রতিটি দাবি যাচাই হয় বাস্তব ফিজিক্যাল ডিভাইসে।',
    availability: 'রিমোটে উন্মুক্ত',
    ctaWork: 'আমার কাজ দেখুন',
    ctaGithub: 'গিটহাব দেখুন ↗',
    scrollHint: 'সূচি দেখুন',
  },
  presence: {
    eyebrow: '০২ — আমি আসলে যা করি',
    heading: 'অন-ডিভাইস এআই, অ্যান্ড্রয়েড সিস্টেম, এআরএম ৬৪ লিনাক্স, নেটিভ টুলিং।',
    items: [
      { label: 'অন-ডিভাইস এআই', detail: 'এলএলএম ইনফারেন্স, এনপিইউ/জিপিইউ যোগ্যতা-পরীক্ষা' },
      { label: 'অ্যান্ড্রয়েড সিস্টেমস', detail: 'কোটলিন, অ্যাক্সেসিবিলিটি, শিজুকু' },
      { label: 'এআরএম ৬৪ লিনাক্স', detail: 'এওএসপি বিল্ড, পিআরুট, টারমাক্স' },
      { label: 'নেটিভ টুলিং', detail: 'সোর্স থেকে বিল্ড-টুলস, সাইনড রিলিজ' },
    ],
  },
  about: {
    eyebrow: '০৩ — পরিচিতি',
    heading: 'স্ব-শিক্ষিত সিস্টেম নির্মাতা — সীমাবদ্ধতাকে বাধা নয়, ভিত্তি ধরে কাজ করি।',
    paragraphs: [
      'আমি ঢাকা, বাংলাদেশের একজন স্ব-শিক্ষিত সিস্টেম নির্মাতা। আমার কাজের কেন্দ্রে আছে অন-ডিভাইস এআই, অ্যান্ড্রয়েড সিস্টেম ও এআরএম ৬৪ লিনাক্স — এই সমস্যাগুলোর পেছনে লেগে আছি কারণ আমার হাতে থাকা হার্ডওয়্যারে প্রয়োজনীয় টুলগুলো তখন ছিলই না।',
      'একটি নির্ধারক সীমাবদ্ধতা: প্রচলিত পিসি নয় — মূলত একটি অ্যান্ড্রয়েড ফোনে টারমাক্স ও পিআরুট ডেবিয়ান চালিয়ে আমি সফটওয়্যার তৈরি, বিল্ড ও যাচাই করি। এটাই গড়ে দিয়েছে আমার টুলিং, সিআই আর্কিটেকচার, আর দাবি যাচাইয়ের পদ্ধতি।',
      'আমার শেখার দর্শন: যতদিন শিখি ততদিন বাঁচি, শেখা থামলেই মৃত্যু। শিখি বাস্তব সমস্যার মধ্য দিয়ে — প্রকল্প, পরীক্ষা, পর্যবেক্ষণ, প্রাতিষ্ঠানিক তত্ত্ব, তুলনা, পুনরাবৃত্তি। মেকানিজম-ফার্স্ট, প্রমাণ-ভিত্তিক।',
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
    heading: 'সব রিপোজিটরি নয় — সবচেয়ে শক্তিশালী কাজ।',
    evidenceLabel: 'প্রমাণ: ',
    liveLabel: 'ঘুরে দেখুন ↗',
    codeLabel: 'কোড ↗',
    projects: [
      {
        name: 'LAI',
        tagline: 'বাংলা-ফার্স্ট লোকাল এআই + সম্মতি-চালিত স্বয়ংক্রিয়তা',
        year: '২০২৪–২৬',
        description:
          'প্রাইভেট অন-ডিভাইস এলএলএম ইনফারেন্স ও অ্যাক্সেসিবিলিটি-নিয়ন্ত্রিত স্বয়ংক্রিয়তার অ্যান্ড্রয়েড রানটাইম। সিপিইউ ইনফারেন্স ডিভাইস-যাচাইকৃত; জিপিইউ/এনপিইউ এখনও যোগ্যতা-পরীক্ষায়।',
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
        evidence:
          'অ্যাড্রেনো ৮২৫-এ জিংক/টার্নিপ রেন্ডারার নিশ্চিত: গ্লমার্ক২ স্কোর ১৪০ (ওপেনজিএল ৪.৬)। জিংক/অ্যাড্রেনো/টার্নিপ রেন্ডারারে ব্লেন্ডার ৪.৩.২ চালু হয়েছে।',
        topics: ['ডেবিয়ান', 'ভলকান', 'টার্নিপ', 'জিংক', 'অ্যাড্রেনো', 'পিআরুট'],
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
  },
  research: {
    eyebrow: '০৫ — গবেষণা ও পরীক্ষা',
    heading: 'কোনটা প্রমাণিত, কোনটা পরীক্ষামূলক — সৎভাবে বলা।',
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
          'রুট ছাড়া পিআরুটে ডেবিয়ান/এক্সএফসিই, মাপা জিপিইউ পথসহ; ফোন-ফার্স্ট লুপ — সিআই আর্টিফ্যাক্ট বিল্ড করে, ডিভাইস সেটি যাচাই করে।',
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
    heading: 'যেসব প্রযুক্তি নিয়ে আমি আসলেই কাজ করি।',
    domains: [
      { name: 'অন-ডিভাইস এআই', items: ['লামা.সিপিপি', 'জিজিইউএফ', 'কেভি-ক্যাশ', 'সিপিইউ/জিপিইউ/এনপিইউ রাউটিং'] },
      { name: 'অ্যান্ড্রয়েড সিস্টেমস', items: ['কোটলিন', 'কম্পোজ', 'অ্যাক্সেসিবিলিটি', 'শিজুকু', 'জেএনআই/সি++'] },
      { name: 'লিনাক্স / এআরএম ৬৪', items: ['এওএসপি বিল্ড', 'ক্ল্যাং/সিএমেক/নিনজা', 'টারমাক্স + পিআরুট'] },
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
      { name: 'songjog', desc: 'বাংলা-ফার্স্ট ব্যবসায়িক লেজার ও অপারেশনস অ্যাপ (ওনার এডিশন)', lang: 'ডার্ট', stars: 0, url: 'https://github.com/soobujmiah/songjog', websiteUrl: null, tier: 'applied' },
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
    heading: 'অপারেশন, ইঞ্জিনিয়ারিং ও প্রশাসনে ৮+ বছর।',
    services: {
      label: 'ইঞ্জিনিয়ারিং-এর বাইরের ব্যবহারিক কাজ',
      items: [
        'অফিস অ্যাডমিনিস্ট্রেশন',
        'ডিজিটাল ডকুমেন্টেশন',
        'রেকর্ড ও ডেটা ব্যবস্থাপনা',
        'স্প্রেডশিট ও ওয়ার্কফ্লো সহায়তা',
        'ওয়েবসাইট ও কনটেন্ট ব্যবস্থাপনা',
        'ডিজিটাল ওয়ার্কফ্লো অটোমেশন',
        'আইটি ও সফটওয়্যার সহায়তা',
      ],
    },
    entries: [
      {
        period: 'মার্চ ২০২৫ – বর্তমান',
        role: 'অফিস অ্যাডমিনিস্ট্রেটর',
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
        role: 'কোঅর্ডিনেটর',
        company: 'আবদুল্লাহ ট্রেডিং প্রাইভেট লিমিটেড',
        location: 'জুবাইল, সৌদি আরব',
        desc: 'সাইট অপারেশন, লজিস্টিক, টিম কমিউনিকেশন।',
      },
      {
        period: '২০২০ – ২০২১',
        role: 'ইলেকট্রিশিয়ান',
        company: 'সৌদি ইলেকট্রিসিটি কোম্পানি ও খালেদ জুফফালি কোম্পানি',
        location: 'জেদ্দা, সৌদি আরব',
        desc: 'ইলেকট্রিক্যাল ইনস্টলেশন ও রক্ষণাবেক্ষণ।',
      },
      {
        period: '২০১৮ – ২০২০',
        role: 'প্রোগ্রেস রিপোর্টার',
        company: 'ফাদলি গ্যাস প্ল্যান্ট প্রজেক্ট / পিসিএমসি',
        location: 'সৌদি আরব',
        desc: 'দৈনিক অগ্রগতি ডেটা, ডিজিটাইজেশন, কাঠামোবদ্ধ রিপোর্টিং।',
      },
      {
        period: '২০১৭ – ২০১৮',
        role: 'ফায়ার ওয়াচার',
        company: 'ফাদলি গ্যাস প্ল্যান্ট / সৌদি আরামকো',
        location: 'সৌদি আরব',
        desc: 'অগ্নি-ঝুঁকি পর্যবেক্ষণ, দুর্ঘটনা প্রতিরোধ।',
      },
      {
        period: '২০১৫ – ২০১৭',
        role: 'ইমেইল মার্কেটিং স্পেশালিস্ট',
        company: 'ফ্রিল্যান্স',
        location: 'রিমোট',
        desc: 'টার্গেটেড ক্যাম্পেইন, সাবস্ক্রাইবার ব্যবস্থাপনা, স্ব-শিক্ষিত ডিজিটাল মার্কেটিং।',
      },
    ],
  },
  contact: {
    eyebrow: '০৯ — যোগাযোগ',
    headingA: 'ফ্রিল্যান্স,',
    headingB: 'রিমোট ও কোলাবরেশনে উন্মুক্ত।',
    sub: 'অন-ডিভাইস এআই, অ্যান্ড্রয়েড সিস্টেম, এআরএম ৬৪ টুলিং বা লোকাল-ফার্স্ট প্রোডাক্ট — কথা বলতে আগ্রহী।',
    channels: [
      { label: 'ইমেইল', value: 'soobujmiah@gmail.com', href: 'mailto:soobujmiah@gmail.com' },
      { label: 'গিটহাব', value: 'soobujmiah', href: 'https://github.com/soobujmiah' },
      { label: 'টেলিগ্রাম', value: '@soobujmiah', href: 'https://t.me/soobujmiah' },
      { label: 'লিংকডইন', value: 'in/soobujmiah', href: 'https://linkedin.com/in/soobujmiah' },
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
    pull: 'রিফ্রেশ করতে টানুন',
    release: 'রিফ্রেশে ছেড়ে দিন',
    refreshing: 'রিফ্রেশ হচ্ছে',
  },
  footer: {
    built: 'ফোন থেকে তৈরি।',
    claims: 'প্রতিটি দাবি সিআই বা বাস্তব-ডিভাইস প্রমাণে সমর্থিত।',
  },
  preloader: { status: 'চালু হচ্ছে' },
  seo: {
    sections: [
      {
        title: 'সবুজ মিয়া — স্বাধীন সিস্টেম নির্মাতা · অন-ডিভাইস এআই ও এআরএম ৬৪ সিস্টেম',
        description:
          'অন-ডিভাইস এআই, অ্যান্ড্রয়েড, এআরএম ৬৪ লিনাক্স, নেটিভ টুলিং। সীমাবদ্ধতার মধ্যে নির্মিত, বাস্তব হার্ডওয়্যারে যাচাইকৃত — সিআই বিল্ড, টেস্ট ও ফিজিক্যাল-ডিভাইস প্রমাণ।',
      },
      {
        title: 'আমি যা নির্মাণ করি — অন-ডিভাইস এআই, অ্যান্ড্রয়েড ও এআরএম ৬৪ সিস্টেম',
        description:
          'সবুজ মিয়ার নির্মাণক্ষেত্র: অন-ডিভাইস এআই ও এলএলএম ইনফারেন্স, সম্মতি-নিয়ন্ত্রিত স্বয়ংক্রিয়তাসহ অ্যান্ড্রয়েড সিস্টেম, এওএসপি থেকে পিআরুট পর্যন্ত এআরএম ৬৪ লিনাক্স, এবং সাইনড রিলিজসহ নেটিভ টুলিং।',
      },
      {
        title: 'পরিচিতি — ঢাকার স্বাধীন সিস্টেম নির্মাতা',
        description:
          'ঢাকা, বাংলাদেশের স্ব-শিক্ষিত স্বাধীন সিস্টেম নির্মাতা — অ্যান্ড্রয়েড ফোন থেকে কাজ করেন; দাবির আগে প্রমাণ আর বাস্তব হার্ডওয়্যারে যাচাই তাঁর ইঞ্জিনিয়ারিং নীতি।',
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
          'সবুজ মিয়ার কাজের প্রযুক্তি: লামা.সিপিপি ও জিজিইউএফ, কোটলিন ও ফ্লাটার, ভলকান, মেসা টার্নিপ ও জিংক, এওএসপি বিল্ড, টারমাক্স ও পিআরুট, গিটহাব অ্যাকশনস সিআই।',
      },
      {
        title: 'ওপেন সোর্স প্রজেক্ট — অ্যাপ্লাইড ও সহায়ক কাজ',
        description:
          'অ্যাপ্লাইড প্রোডাক্ট ও সহায়ক ওপেন সোর্স কাজ — ডকডিআর, ডেটাখোজ, এপিলুপ, আর্মস, ইকরা অনলাইন মার্ট ও সোবকিছু — কোড, লাইভ সাইট ও রিপোজিটরি প্রমাণের লিংকসহ।',
      },
      {
        title: 'অভিজ্ঞতা — অপারেশন, প্রশাসন ও ইঞ্জিনিয়ারিং',
        description:
          'অপারেশন, প্রশাসন ও ইঞ্জিনিয়ারিং জুড়ে ৮+ বছর: অফিস অ্যাডমিনিস্ট্রেশন, ডিজিটাল ডকুমেন্টেশন, রেকর্ড ও ডেটা ব্যবস্থাপনা, সমন্বয়, ইলেকট্রিক্যাল কাজ ও সিস্টেম নির্মাণ।',
      },
      {
        title: 'যোগাযোগ — ফ্রিল্যান্স, রিমোট ও কোলাবরেশন',
        description:
          'সবুজ মিয়ার সঙ্গে যোগাযোগ করুন — অন-ডিভাইস এআই, অ্যান্ড্রয়েড সিস্টেম, এআরএম ৬৪ টুলিং ও লোকাল-ফার্স্ট প্রোডাক্ট নিয়ে ফ্রিল্যান্স, রিমোট ও কোলাবরেশনে উন্মুক্ত।',
      },
    ],
  },
};

export const content: Record<Lang, Content> = { en, bn };
