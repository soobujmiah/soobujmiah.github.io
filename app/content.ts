/* ═══════════════════════════════════════════════════════════════
   CONTENT — centralized, bilingual source of truth for the portfolio.

   - `en` and `bn` trees carry the same keys; every user-facing string
     exists in both languages. No fabricated projects, repos, websites,
     employers, or statistics.
   - Technical identifiers (Kotlin, llama.cpp, Vulkan, GGUF, repo names,
     versions, benchmark numbers) stay in Latin script in BOTH languages.
     This is deliberate: Bangla transliteration of domain terms causes
     wrong-meaning substitutions (see SKB repositories/portfolio.md i18n
     pitfall note). Prose is translated; identifiers are preserved.
   - websiteUrl is set ONLY for repositories with a verified live site.
     Projects without one use websiteUrl: null (never fabricate).
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
  ui: { carouselPrev: string; carouselNext: string; pageLabels: string[]; repoWord: string };
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
    ctaWork: 'Explore my work',
    ctaGithub: 'View GitHub ↗',
    scrollHint: 'Swipe',
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
  header: { homeLabel: 'Back to top', githubLabel: 'GitHub', langLabel: 'Bangla', langAria: 'Switch to Bangla', githubAria: 'GitHub profile' },
  ui: { carouselPrev: 'Previous', carouselNext: 'Next', pageLabels: ['Home', 'Presence', 'About', 'Featured work', 'Research', 'Technical focus', 'Open source', 'Experience', 'Contact'], repoWord: 'repository' },
  footer: {
    built: 'Built from a phone.',
    claims: 'Every claim backed by CI or real-device evidence.',
  },
  preloader: { status: 'Initializing' },
};

/* ── Bangla ────────────────────────────────────────────────────
   Technical identifiers stay in Latin script (see header note).
   Company/product proper nouns stay in Latin script.           */

const bn: Content = {
  profile: {
    name: 'Sobuj',
    nameFull: 'Sobuj Miah',
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
      'অন-ডিভাইস এআই, অ্যান্ড্রয়েড, লিনাক্স, এআরএম ৬৪, জিপিইউ/এনপিইউ ত্বরণ। অ্যান্ড্রয়েড ফোন থেকে কাজ করা স্ব-শিক্ষিত সিস্টেম নির্মাতা — প্রতিটি দাবি CI বা বাস্তব-ডিভাইস প্রমাণে সমর্থিত।',
  },
  hero: {
    intro:
      'অন-ডিভাইস এআই, অ্যান্ড্রয়েড সিস্টেম ও এআরএম ৬৪ লিনাক্সের সংযোগস্থলে কাজ করা স্ব-শিক্ষিত ডেভেলপার। প্রতিটি বিল্ড চলে CI-তে। প্রতিটি দাবি যাচাই করা হয় বাস্তব ডিভাইসে।',
    ctaWork: 'আমার কাজ দেখুন',
    ctaGithub: 'GitHub দেখুন ↗',
    scrollHint: 'সোয়াইপ',
  },
  presence: {
    eyebrow: '০২ — আমি আসলে যা করি',
    items: [
      { label: 'অন-ডিভাইস এআই', detail: 'LLM ইনফারেন্স, এনপিইউ/জিপিইউ ত্বরণ' },
      { label: 'অ্যান্ড্রয়েড সিস্টেমস', detail: 'Kotlin, Accessibility, Shizuku' },
      { label: 'এআরএম ৬৪ লিনাক্স', detail: 'AOSP, PRoot, নেটিভ টুলচেইন' },
      { label: 'লোকাল-ফার্স্ট', detail: 'প্রাইভেট, অফলাইন, সম্মতি-চালিত' },
    ],
  },
  about: {
    eyebrow: '০৩ — পরিচিতি',
    heading: 'স্ব-শিক্ষিত সিস্টেম নির্মাতা — সীমাবদ্ধতাকে বাধা নয়, ভিত্তি ধরে কাজ করি।',
    paragraphs: [
      'আমি ঢাকা, বাংলাদেশের একজন স্ব-শিক্ষিত সিস্টেম নির্মাতা। আমার কাজের কেন্দ্রে আছে অন-ডিভাইস এআই, অ্যান্ড্রয়েড সিস্টেম ও এআরএম ৬৪ লিনাক্স — এই সমস্যাগুলোর পেছনে লেগে আছি কারণ আমার হাতে থাকা হার্ডওয়্যারে প্রয়োজনীয় টুলগুলো তখন ছিলই না।',
      'একটি নির্ধারক সীমাবদ্ধতা: প্রচলিত PC নয় — মূলত একটি অ্যান্ড্রয়েড ফোনে Termux ও PRoot Debian চালিয়ে আমি সফটওয়্যার তৈরি, বিল্ড ও যাচাই করি। এটাই গড়ে দিয়েছে আমার টুলিং, CI আর্কিটেকচার, আর দাবি যাচাইয়ের পদ্ধতি।',
      'আমার শেখার দর্শন: যতদিন শিখি ততদিন বাঁচি, শেখা থামলেই মৃত্যু। শিখি বাস্তব সমস্যার মধ্য দিয়ে — হাইপোথিসিস, পরীক্ষা, পর্যবেক্ষণ, প্রাতিষ্ঠানিক তত্ত্ব, তুলনা, পুনরাবৃত্তি। মেকানিজম-ফার্স্ট, প্রমাণ-ভিত্তিক।',
    ],
    facts: [
      { label: 'অবস্থান', value: 'ঢাকা, বাংলাদেশ (GMT+6)' },
      { label: 'ভাষা', value: 'বাংলা, ইংরেজি, হিন্দি/উর্দু, আরবি' },
      { label: 'রেফারেন্স ডিভাইস', value: 'Redmi Turbo 4 Pro — SD 8s Gen 4' },
      { label: 'বিল্ড পাইপলাইন', value: 'GitHub Actions CI/CD' },
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
          'প্রাইভেট অন-ডিভাইস LLM ইনফারেন্স ও Accessibility-নিয়ন্ত্রিত স্বয়ংক্রিয়তাের Android রানটাইম। CPU ইনফারেন্স ডিভাইস-যাচাইকৃত; জিপিইউ/এনপিইউ যোগ্যতা-পরীক্ষাধীন।',
        evidence:
          'বাস্তব arm64 llama.cpp CPU ইনফারেন্স, 12–20 tok/s ডিকোড, KV-prefix পুনর্ব্যবহার। Adreno Vulkan ড্রাইভার ক্র্যাশের রুট-কজ নির্ণয় — যা গড়েছে ফেইল-ক্লোজড CPU-ডিফল্ট আর্কিটেকচার।',
        topics: ['Kotlin', 'llama.cpp', 'Vulkan', 'Accessibility', 'Shizuku', 'GGUF'],
        repo: 'https://github.com/soobujmiah/lai',
        websiteUrl: null,
        accent: '#22c55e',
      },
      {
        name: 'GGEN',
        tagline: 'Android-ফার্স্ট ক্রিয়েটিভ ও ডকুমেন্ট স্টুডিও',
        year: '২০২৪–২৬',
        description:
          'পেশাদার ভেক্টর, রাস্টার, ডকুমেন্ট ও PDF কাজের Flutter/Dart ভিত্তি। SHA-256 স্টেট ইন্টেগ্রিটিসহ পিওর-Dart কোরের ডকুমেন্টেশন-ফার্স্ট আর্কিটেকচার।',
        evidence:
          '143টি পিওর-Dart ইউনিট টেস্ট, 353টি উইজেট/কন্ট্রোলার টেস্ট। বারবার বাস্তব ডিভাইসে যাচাইকৃত।',
        topics: ['Flutter', 'Dart', 'ডকুমেন্ট জেনারেশন', 'ভেক্টর গ্রাফিক্স'],
        repo: 'https://github.com/soobujmiah/ggen',
        websiteUrl: null,
        accent: '#4ade80',
      },
      {
        name: 'ADT',
        tagline: 'নেটিভ এআরএম ৬৪ অ্যান্ড্রয়েড ডেভেলপমেন্ট টুলচেইন',
        year: '২০২৩–২৬',
        description:
          'লিনাক্স এআরএম ৬৪/glibc-এর জন্য AOSP সোর্স থেকে Android SDK build-tools ও platform-tools তৈরি করে। SHA-256-যাচাইকৃত অফলাইন রিলিজ আর্টিফ্যাক্ট।',
        evidence:
          'Snapdragon 8s Gen 4-এ সম্পূর্ণ এআরএম ৬৪ নেটিভ APK পাইপলাইন শুরু থেকে শেষ পর্যন্ত যাচাইকৃত: সোর্স → APK → সাইন → ইনস্টল → JNI লোড → রান।',
        topics: ['AOSP', 'এআরএম ৬৪', 'বিল্ড টুলস', 'ক্রস-কম্পাইলেশন'],
        repo: 'https://github.com/soobujmiah/adt',
        websiteUrl: null,
        accent: '#10b981',
      },
      {
        name: 'Ternux',
        tagline: 'রুট ছাড়াই Android-এ Debian/Xfce লিনাক্স ডেস্কটপ',
        year: '২০২৩–২৬',
        description:
          'এক কমান্ডে আসল Debian এআরএম ৬৪ ইউজারস্পেস, Xfce4 ডেস্কটপ, Termux:X11 ডিসপ্লে, PulseAudio ব্রিজ ও Zink/Turnip GPU রুট — রুট ছাড়াই।',
        evidence:
          'Adreno 825-এ Zink/Turnip রেন্ডারার নিশ্চিত: glmark2 স্কোর 140 (OpenGL 4.6)। Zink/Adreno/Turnip রেন্ডারারে Blender 4.3.2 চালু হয়েছে।',
        topics: ['Debian', 'Vulkan', 'Turnip', 'Zink', 'Adreno', 'PRoot'],
        repo: 'https://github.com/soobujmiah/ternux',
        websiteUrl: 'https://soobujmiah.github.io/ternux/',
        accent: '#86efac',
      },
    ],
    nowBuilding: {
      eyebrow: 'এখন যা বানাচ্ছি — P0 রিলিজ ট্র্যাক',
      name: 'Songjog (সংযোগ)',
      description:
        'বাংলা-ফার্স্ট ব্যবসা ও প্রতিষ্ঠান পরিচালনার অ্যাপ। ওনার এডিশন: দ্রুত দৈনিক এন্ট্রি, লোকাল SQLite রেকর্ড, ধ্বংসাত্মক ডিলিটের বদলে অডিটযোগ্য সংশোধন।',
      testsNote: 'CI-তে 94টি টেস্ট সবুজ · Redmi Turbo 4 Pro-তে এক্সপোর্ট/ডায়াগনস্টিক ডিভাইস-যাচাইকৃত',
      cta: 'বিল্ড অনুসরণ করুন ↗',
      url: 'https://github.com/soobujmiah/songjog',
    },
  },
  research: {
    eyebrow: '০৫ — গবেষণা ও পরীক্ষা',
    heading: 'কোনটা প্রমাণিত, কোনটা পরীক্ষামূলক — সৎভাবে বলা।',
    entries: [
      {
        title: 'Snapdragon / Hexagon NPU',
        status: 'experimental',
        statusLabel: 'পরীক্ষামূলক',
        description:
          'Qualcomm Hexagon HTP NPU মূল্যায়ন। FastRPC/DSP প্রমাণসহ প্রথম বাস্তব non-CPU ব্যাকএন্ড কাজ করছে বলে নিশ্চিত।',
      },
      {
        title: 'Adreno Vulkan / GPU',
        status: 'experimental',
        statusLabel: 'পরীক্ষামূলক',
        description:
          'Mesa Turnip Vulkan, Zink OpenGL-on-Vulkan। ডিকোডে Vulkan compute ক্র্যাশ করে — রুট-কজ বের করে ডকুমেন্ট করা হয়েছে।',
      },
      {
        title: 'অ্যান্ড্রয়েড স্বয়ংক্রিয়তা',
        status: 'validated',
        statusLabel: 'যাচাইকৃত',
        description:
          'স্পষ্ট সম্মতিসহ AccessibilityService + Shizuku প্রিভিলেজড এক্সিকিউশন, হ্যাশ-চেইনড অডিট ট্রেইল।',
      },
      {
        title: 'AI এজেন্ট ও অর্কেস্ট্রেশন',
        status: 'investigating',
        statusLabel: 'অনুসন্ধানাধীন',
        description:
          'পলিসি-নিয়ন্ত্রিত টুল ডিসপ্যাচ, SHA-256 যাচাইসহ সাইনড মডেল ক্যাটালগ, মাল্টি-প্রোভাইডার গেটওয়ে।',
      },
    ],
  },
  stack: {
    eyebrow: '০৬ — প্রযুক্তিগত ফোকাস',
    heading: 'যেসব প্রযুক্তি নিয়ে আমি আসলেই কাজ করি।',
    domains: [
      { name: 'অন-ডিভাইস এআই', items: ['llama.cpp', 'GGUF', 'KV-cache', 'CPU/জিপিইউ/এনপিইউ রাউটিং'] },
      { name: 'অ্যান্ড্রয়েড সিস্টেমস', items: ['Kotlin', 'Compose', 'Accessibility', 'Shizuku', 'JNI/C++'] },
      { name: 'লিনাক্স / এআরএম ৬৪', items: ['AOSP বিল্ড', 'Clang/CMake/Ninja', 'Termux + PRoot'] },
      { name: 'GPU / গ্রাফিক্স', items: ['Vulkan', 'Mesa Turnip', 'Zink', 'Adreno KGSL'] },
      { name: 'মোবাইল ও ওয়েব', items: ['Flutter', 'Dart', 'TypeScript', 'Python'] },
      { name: 'প্রকৌশল পরিচালনা', items: ['GitHub Actions', 'সাইনড রিলিজ', 'ডিভাইস যাচাইকরণ'] },
    ],
  },
  openSource: {
    eyebrow: '০৭ — ওপেন সোর্স',
    heading: 'নির্বাচিত রিপোজিটরি।',
    liveLabel: 'ঘুরে দেখুন ↗',
    codeLabel: 'কোড ↗',
    selected: ['faridpur-police-app', 'docdr', 'apiloop', 'datakhoj-android', 'sobkichu', 'arms', 'iqra-online-mart'],
    note: 'নির্বাচিত প্রজেক্টের বাইরে — প্রতিটি তার জায়গা অর্জন করে।',
    moreLabel: 'GitHub-এ সবকিছু',
    moreSub: 'পরীক্ষা, প্রোটোটাইপ ও চলমান কাজ থাকে সেখানে।',
    repos: [
      { name: 'lai', desc: 'বাংলা-ফার্স্ট লোকাল এআই + স্বয়ংক্রিয়তা রানটাইম', lang: 'Kotlin', stars: 1, url: 'https://github.com/soobujmiah/lai', websiteUrl: null },
      { name: 'adt', desc: 'AOSP সোর্স থেকে এআরএম ৬৪ অ্যান্ড্রয়েড ডেভ টুলচেইন', lang: 'Shell', stars: 0, url: 'https://github.com/soobujmiah/adt', websiteUrl: null },
      { name: 'ternux', desc: 'অ্যান্ড্রয়েডে জিপিইউ-ত্বরান্বিত লিনাক্স ডেস্কটপ', lang: 'Shell', stars: 1, url: 'https://github.com/soobujmiah/ternux', websiteUrl: 'https://soobujmiah.github.io/ternux/' },
      { name: 'ggen', desc: 'Android-ফার্স্ট ক্রিয়েটিভ ও ডকুমেন্ট স্টুডিও', lang: 'Dart', stars: 0, url: 'https://github.com/soobujmiah/ggen', websiteUrl: null },
      { name: 'datakhoj-android', desc: 'Android-এর জন্য সার্বজনীন ডেটা সংগ্রাহক', lang: 'Kotlin', stars: 0, url: 'https://github.com/soobujmiah/datakhoj-android', websiteUrl: null },
      { name: 'songjog', desc: 'বাংলা-ফার্স্ট ব্যবসায়িক কার্যক্রম অ্যাপ', lang: 'Dart', stars: 0, url: 'https://github.com/soobujmiah/songjog', websiteUrl: null },
      { name: 'apiloop', desc: 'প্রোভাইডার-নিরপেক্ষ এআই API গেটওয়ে', lang: 'Python', stars: 0, url: 'https://github.com/soobujmiah/apiloop', websiteUrl: null },
      { name: 'sobkichu', desc: 'বাংলাদেশি হাইপারলোকাল সুপার-অ্যাপ', lang: 'TypeScript', stars: 0, url: 'https://github.com/soobujmiah/sobkichu', websiteUrl: null },
      { name: 'docdr', desc: 'মোবাইল-ফার্স্ট অফলাইন ডকুমেন্ট ওয়ার্কস্পেস', lang: 'Dart', stars: 0, url: 'https://github.com/soobujmiah/docdr', websiteUrl: null },
      { name: 'faridpur-police-app', desc: 'জেলা পুলিশ ওয়েবসাইটের অফিসিয়াল WebView অ্যাপ শেল', lang: 'Dart', stars: 0, url: 'https://github.com/soobujmiah/faridpur-police-app', websiteUrl: null },
      { name: 'iqra-online-mart', desc: 'দ্বিভাষিক ই-কমার্স স্টোরফ্রন্ট ডেমো', lang: 'JavaScript', stars: 0, url: 'https://github.com/soobujmiah/iqra-online-mart', websiteUrl: 'https://soobujmiah.github.io/iqra-online-mart/' },
      { name: 'arms', desc: 'এআরএম ৬৪ লিনাক্স টুল ক্যাটালগ + স্ট্যাটিক সাইট', lang: 'HTML', stars: 0, url: 'https://github.com/soobujmiah/arms', websiteUrl: 'https://soobujmiah.github.io/arms' },
    ],
  },
  experience: {
    eyebrow: '০৮ — অভিজ্ঞতা',
    heading: 'অপারেশন, ইঞ্জিনিয়ারিং ও প্রশাসনে ৮+ বছর।',
    entries: [
      {
        period: 'মার্চ ২০২৫ – বর্তমান',
        role: 'অফিস অ্যাডমিনিস্ট্রেটর',
        company: 'Rabeya Education Family',
        location: 'সাভার, ঢাকা',
        desc: 'দৈনিক কার্যক্রম, সোশ্যাল মিডিয়া, SEO, শিক্ষার্থী নিবন্ধন, ডকুমেন্ট ব্যবস্থাপনা, প্রচারণামূলক গ্রাফিক্স।',
      },
      {
        period: 'সেপ্টে ২০২২ – ফেব্রু ২০২৩',
        role: 'কম্পিউটার অপারেটর',
        company: 'Monika Enterprise',
        location: 'সাভার, ঢাকা',
        desc: 'অনলাইন কার্যক্রম, ডকুমেন্ট প্রসেসিং, ফাইলিং সিস্টেম।',
      },
      {
        period: '২০২১ – ২০২২',
        role: 'কোঅর্ডিনেটর',
        company: 'Abdullah Trading Pvt Ltd',
        location: 'জুবাইল, সৌদি আরব',
        desc: 'সাইট অপারেশন, লজিস্টিক, টিম কমিউনিকেশন।',
      },
      {
        period: '২০২০ – ২০২১',
        role: 'ইলেকট্রিশিয়ান',
        company: 'Saudi Electricity Company ও Khaled Juffali Company',
        location: 'জেদ্দা, সৌদি আরব',
        desc: 'ইলেকট্রিক্যাল ইনস্টলেশন ও রক্ষণাবেক্ষণ।',
      },
      {
        period: '২০১৮ – ২০২০',
        role: 'প্রোগ্রেস রিপোর্টার',
        company: 'Fadhli Gas Plant Project / PCMC',
        location: 'সৌদি আরব',
        desc: 'দৈনিক অগ্রগতি ডেটা, ডিজিটাইজেশন, কাঠামোবদ্ধ রিপোর্টিং।',
      },
      {
        period: '২০১৭ – ২০১৮',
        role: 'ফায়ার ওয়াচার',
        company: 'Fadhli Gas Plant / Saudi Aramco',
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
      { label: 'GitHub', value: 'soobujmiah', href: 'https://github.com/soobujmiah' },
      { label: 'টেলিগ্রাম', value: '@soobujmiah', href: 'https://t.me/soobujmiah' },
      { label: 'LinkedIn', value: 'in/soobujmiah', href: 'https://linkedin.com/in/soobujmiah' },
    ],
  },
  nav: [
    { scene: 3, label: 'কাজ' },
    { scene: 4, label: 'গবেষণা' },
    { scene: 5, label: 'স্ট্যাক' },
    { scene: 8, label: 'যোগাযোগ' },
  ],
  header: { homeLabel: 'উপরে ফিরুন', githubLabel: 'GitHub', langLabel: 'ইংরেজি', langAria: 'ইংরেজিতে বদলান', githubAria: 'GitHub প্রোফাইল' },
  ui: { carouselPrev: 'আগের', carouselNext: 'পরের', pageLabels: ['হোম', 'উপস্থিতি', 'পরিচিতি', 'নির্বাচিত কাজ', 'গবেষণা', 'প্রযুক্তিগত ফোকাস', 'ওপেন সোর্স', 'অভিজ্ঞতা', 'যোগাযোগ'], repoWord: 'রিপোজিটরি' },
  footer: {
    built: 'ফোন থেকে তৈরি।',
    claims: 'প্রতিটি দাবি CI বা বাস্তব-ডিভাইস প্রমাণে সমর্থিত।',
  },
  preloader: { status: 'চালু হচ্ছে' },
};

export const content: Record<Lang, Content> = { en, bn };
