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
    items: { label: string; detail: string }[];
  };
  about: {
    eyebrow: string;
    heading: string;
    paragraphs: string[];
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
    note: string;
    moreLabel: string;
    moreSub: string;
    repos: Repo[];
  };
  experience: {
    eyebrow: string;
    heading: string;
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
}

/* ── English ─────────────────────────────────────────────────── */

const en: Content = {
  profile: {
    name: 'Sobuj',
    nameFull: 'Sobuj Miah',
    title: 'Independent Software Developer & On-Device AI Systems Builder',
    tagline: 'On-device AI · Android · Linux · ARM64 · GPU/NPU',
    location: 'Dhaka, Bangladesh',
    github: 'https://github.com/soobujmiah',
    email: 'soobujmiah@gmail.com',
    telegram: '@soobujmiah',
    linkedin: 'https://linkedin.com/in/soobujmiah',
  },
  meta: {
    title: 'Sobuj Miah — Software Developer & On-Device AI Systems Builder',
    description:
      'On-device AI, Android, Linux, ARM64, GPU/NPU acceleration. Self-taught systems builder working from an Android phone — every claim backed by CI or real-device evidence.',
  },
  hero: {
    intro:
      'Self-taught developer at the intersection of on-device AI, Android systems, and ARM64 Linux. Every build runs on CI. Every claim checked against a physical device.',
    availability: 'Open to remote',
    ctaWork: 'Explore my work',
    ctaGithub: 'View GitHub ↗',
    scrollHint: 'Open index',
  },
  presence: {
    eyebrow: '02 — What I actually do',
    items: [
      { label: 'On-Device AI', detail: 'LLM inference, NPU/GPU acceleration' },
      { label: 'Android Systems', detail: 'Kotlin, Accessibility, Shizuku' },
      { label: 'ARM64 Linux', detail: 'AOSP, PRoot, native toolchains' },
      { label: 'Local-First', detail: 'Private, offline, consent-driven' },
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
        websiteUrl: null,
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
        title: 'Snapdragon / Hexagon NPU',
        status: 'experimental',
        statusLabel: 'experimental',
        description:
          'Qualcomm Hexagon HTP NPU evaluation. First real non-CPU backend confirmed working with FastRPC/DSP evidence.',
      },
      {
        title: 'Adreno Vulkan / GPU',
        status: 'experimental',
        statusLabel: 'experimental',
        description:
          'Mesa Turnip Vulkan, Zink OpenGL-on-Vulkan. Vulkan compute crashes at decode — root-caused, documented.',
      },
      {
        title: 'Android Automation',
        status: 'validated',
        statusLabel: 'validated',
        description:
          'AccessibilityService + Shizuku privileged execution with explicit consent, hash-chained audit trails.',
      },
      {
        title: 'AI Agents & Orchestration',
        status: 'investigating',
        statusLabel: 'investigating',
        description:
          'Policy-gated tool dispatch, signed model catalog with SHA-256 verification, multi-provider gateway.',
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
    selected: ['faridpur-police-app', 'docdr', 'apiloop', 'datakhoj-android', 'sobkichu', 'arms', 'iqra-online-mart'],
    note: 'Beyond the featured projects — each one earns its place.',
    moreLabel: 'Everything on GitHub',
    moreSub: 'Experiments, prototypes, and work in progress live there.',
    repos: [
      { name: 'lai', desc: 'Bangla-first local AI + automation runtime', lang: 'Kotlin', stars: 1, url: 'https://github.com/soobujmiah/lai', websiteUrl: null },
      { name: 'adt', desc: 'ARM64 Android dev toolchain from AOSP source', lang: 'Shell', stars: 0, url: 'https://github.com/soobujmiah/adt', websiteUrl: null },
      { name: 'ternux', desc: 'GPU-accelerated Linux desktop on Android', lang: 'Shell', stars: 1, url: 'https://github.com/soobujmiah/ternux', websiteUrl: 'https://soobujmiah.github.io/ternux/' },
      { name: 'ggen', desc: 'Android-first creative & document studio', lang: 'Dart', stars: 0, url: 'https://github.com/soobujmiah/ggen', websiteUrl: null },
      { name: 'datakhoj-android', desc: 'Universal data collector for Android', lang: 'Kotlin', stars: 0, url: 'https://github.com/soobujmiah/datakhoj-android', websiteUrl: null },
      { name: 'songjog', desc: 'Bengali-first business operations app', lang: 'Dart', stars: 0, url: 'https://github.com/soobujmiah/songjog', websiteUrl: null },
      { name: 'apiloop', desc: 'Provider-agnostic AI API gateway', lang: 'Python', stars: 0, url: 'https://github.com/soobujmiah/apiloop', websiteUrl: null },
      { name: 'sobkichu', desc: 'Bangladesh hyperlocal super-app', lang: 'TypeScript', stars: 0, url: 'https://github.com/soobujmiah/sobkichu', websiteUrl: null },
      { name: 'docdr', desc: 'Mobile-first offline document workspace', lang: 'Dart', stars: 0, url: 'https://github.com/soobujmiah/docdr', websiteUrl: null },
      { name: 'faridpur-police-app', desc: 'Official WebView app shell for the district police website', lang: 'Dart', stars: 0, url: 'https://github.com/soobujmiah/faridpur-police-app', websiteUrl: null },
      { name: 'iqra-online-mart', desc: 'Bilingual e-commerce storefront demo', lang: 'JavaScript', stars: 0, url: 'https://github.com/soobujmiah/iqra-online-mart', websiteUrl: 'https://soobujmiah.github.io/iqra-online-mart/' },
      { name: 'arms', desc: 'Searchable ARM64 Linux tool catalog + static site', lang: 'HTML', stars: 0, url: 'https://github.com/soobujmiah/arms', websiteUrl: 'https://soobujmiah.github.io/arms' },
    ],
  },
  experience: {
    eyebrow: '08 — Experience',
    heading: '8+ years across operations, engineering, and administration.',
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
    title: 'স্বাধীন সফটওয়্যার ডেভেলপার ও অন-ডিভাইস এআই সিস্টেম নির্মাতা',
    tagline: 'অন-ডিভাইস এআই · অ্যান্ড্রয়েড · লিনাক্স · এআরএম ৬৪ · জিপিইউ/এনপিইউ',
    location: 'ঢাকা, বাংলাদেশ',
    github: 'https://github.com/soobujmiah',
    email: 'soobujmiah@gmail.com',
    telegram: '@soobujmiah',
    linkedin: 'https://linkedin.com/in/soobujmiah',
  },
  meta: {
    title: 'সবুজ মিয়া — সফটওয়্যার ডেভেলপার ও অন-ডিভাইস এআই সিস্টেম নির্মাতা',
    description:
      'অন-ডিভাইস এআই, অ্যান্ড্রয়েড, লিনাক্স, এআরএম ৬৪, জিপিইউ/এনপিইউ ত্বরণ। অ্যান্ড্রয়েড ফোন থেকে কাজ করা স্ব-শিক্ষিত সিস্টেম নির্মাতা — প্রতিটি দাবি সিআই বা বাস্তব-ডিভাইস প্রমাণে সমর্থিত।',
  },
  hero: {
    intro:
      'অন-ডিভাইস এআই, অ্যান্ড্রয়েড সিস্টেম ও এআরএম ৬৪ লিনাক্সের সংযোগস্থলে কাজ করা স্ব-শিক্ষিত ডেভেলপার। প্রতিটি বিল্ড চলে সিআই-তে। প্রতিটি দাবি যাচাই করা হয় বাস্তব ডিভাইসে।',
    availability: 'রিমোটে উন্মুক্ত',
    ctaWork: 'আমার কাজ দেখুন',
    ctaGithub: 'গিটহাব দেখুন ↗',
    scrollHint: 'সূচি দেখুন',
  },
  presence: {
    eyebrow: '০২ — আমি আসলে যা করি',
    items: [
      { label: 'অন-ডিভাইস এআই', detail: 'এলএলএম ইনফারেন্স, এনপিইউ/জিপিইউ ত্বরণ' },
      { label: 'অ্যান্ড্রয়েড সিস্টেমস', detail: 'কোটলিন, অ্যাক্সেসিবিলিটি, শিজুকু' },
      { label: 'এআরএম ৬৪ লিনাক্স', detail: 'এওএসপি, পিআরুট, নেটিভ টুলচেইন' },
      { label: 'লোকাল-ফার্স্ট', detail: 'প্রাইভেট, অফলাইন, সম্মতি-চালিত' },
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
        websiteUrl: null,
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
        title: 'স্ন্যাপড্রাগন / হেক্সাগন এনপিইউ',
        status: 'experimental',
        statusLabel: 'পরীক্ষামূলক',
        description:
          'কোয়ালকম হেক্সাগন এইচটিপি এনপিইউ মূল্যায়ন। ফাস্টআরপিসি/ডিএসপি প্রমাণসহ প্রথম বাস্তব নন-সিপিইউ ব্যাকএন্ড কাজ করছে বলে নিশ্চিত।',
      },
      {
        title: 'অ্যাড্রেনো ভলকান / জিপিইউ',
        status: 'experimental',
        statusLabel: 'পরীক্ষামূলক',
        description:
          'মেসা টার্নিপ ভলকান, জিংক ওপেনজিএল-অন-ভলকান। ডিকোডে ভলকান কম্পিউট ক্র্যাশ করে — মূল কারণ বের করে ডকুমেন্ট করা হয়েছে।',
      },
      {
        title: 'অ্যান্ড্রয়েড স্বয়ংক্রিয়তা',
        status: 'validated',
        statusLabel: 'যাচাইকৃত',
        description:
          'স্পষ্ট সম্মতিসহ অ্যাক্সেসিবিলিটি সার্ভিস ও শিজুকু প্রিভিলেজড এক্সিকিউশন, হ্যাশ-চেইনড অডিট ট্রেইল।',
      },
      {
        title: 'এআই এজেন্ট ও অর্কেস্ট্রেশন',
        status: 'investigating',
        statusLabel: 'অনুসন্ধানাধীন',
        description:
          'পলিসি-নিয়ন্ত্রিত টুল ডিসপ্যাচ, এসএইচএ-২৫৬ যাচাইসহ সাইনড মডেল ক্যাটালগ, মাল্টি-প্রোভাইডার গেটওয়ে।',
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
    selected: ['faridpur-police-app', 'docdr', 'apiloop', 'datakhoj-android', 'sobkichu', 'arms', 'iqra-online-mart'],
    note: 'নির্বাচিত প্রজেক্টের বাইরে — প্রতিটি তার জায়গা অর্জন করে।',
    moreLabel: 'গিটহাবে সবকিছু',
    moreSub: 'পরীক্ষা, প্রোটোটাইপ ও চলমান কাজ থাকে সেখানে।',
    repos: [
      { name: 'lai', desc: 'বাংলা-ফার্স্ট লোকাল এআই + স্বয়ংক্রিয়তা রানটাইম', lang: 'কোটলিন', stars: 1, url: 'https://github.com/soobujmiah/lai', websiteUrl: null },
      { name: 'adt', desc: 'এওএসপি সোর্স থেকে এআরএম ৬৪ অ্যান্ড্রয়েড ডেভ টুলচেইন', lang: 'শেল', stars: 0, url: 'https://github.com/soobujmiah/adt', websiteUrl: null },
      { name: 'ternux', desc: 'অ্যান্ড্রয়েডে জিপিইউ-ত্বরান্বিত লিনাক্স ডেস্কটপ', lang: 'শেল', stars: 1, url: 'https://github.com/soobujmiah/ternux', websiteUrl: 'https://soobujmiah.github.io/ternux/' },
      { name: 'ggen', desc: 'অ্যান্ড্রয়েড-ফার্স্ট ক্রিয়েটিভ ও ডকুমেন্ট স্টুডিও', lang: 'ডার্ট', stars: 0, url: 'https://github.com/soobujmiah/ggen', websiteUrl: null },
      { name: 'datakhoj-android', desc: 'অ্যান্ড্রয়েডের জন্য সার্বজনীন ডেটা সংগ্রাহক', lang: 'কোটলিন', stars: 0, url: 'https://github.com/soobujmiah/datakhoj-android', websiteUrl: null },
      { name: 'songjog', desc: 'বাংলা-ফার্স্ট ব্যবসায়িক কার্যক্রম অ্যাপ', lang: 'ডার্ট', stars: 0, url: 'https://github.com/soobujmiah/songjog', websiteUrl: null },
      { name: 'apiloop', desc: 'প্রোভাইডার-নিরপেক্ষ এআই এপিআই গেটওয়ে', lang: 'পাইথন', stars: 0, url: 'https://github.com/soobujmiah/apiloop', websiteUrl: null },
      { name: 'sobkichu', desc: 'বাংলাদেশি হাইপারলোকাল সুপার-অ্যাপ', lang: 'টাইপস্ক্রিপ্ট', stars: 0, url: 'https://github.com/soobujmiah/sobkichu', websiteUrl: null },
      { name: 'docdr', desc: 'মোবাইল-ফার্স্ট অফলাইন ডকুমেন্ট ওয়ার্কস্পেস', lang: 'ডার্ট', stars: 0, url: 'https://github.com/soobujmiah/docdr', websiteUrl: null },
      { name: 'faridpur-police-app', desc: 'জেলা পুলিশ ওয়েবসাইটের অফিসিয়াল ওয়েবভিউ অ্যাপ শেল', lang: 'ডার্ট', stars: 0, url: 'https://github.com/soobujmiah/faridpur-police-app', websiteUrl: null },
      { name: 'iqra-online-mart', desc: 'দ্বিভাষিক ই-কমার্স স্টোরফ্রন্ট ডেমো', lang: 'জাভাস্ক্রিপ্ট', stars: 0, url: 'https://github.com/soobujmiah/iqra-online-mart', websiteUrl: 'https://soobujmiah.github.io/iqra-online-mart/' },
      { name: 'arms', desc: 'এআরএম ৬৪ লিনাক্স টুল ক্যাটালগ + স্ট্যাটিক সাইট', lang: 'এইচটিএমএল', stars: 0, url: 'https://github.com/soobujmiah/arms', websiteUrl: 'https://soobujmiah.github.io/arms' },
    ],
  },
  experience: {
    eyebrow: '০৮ — অভিজ্ঞতা',
    heading: 'অপারেশন, ইঞ্জিনিয়ারিং ও প্রশাসনে ৮+ বছর।',
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
};

export const content: Record<Lang, Content> = { en, bn };
