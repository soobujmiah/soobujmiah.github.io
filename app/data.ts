/* ═══════════════════════════════════════════════════════════════
   DATA — centralized source of truth for the portfolio.
   Content preserved from the existing portfolio. No fabricated
   projects, repos, websites, employers, or statistics.

   websiteUrl is optional metadata for the future state where a
   project may have both a GitHub repo and a dedicated website.
   Projects without a website set websiteUrl: null (never fabricate).
   ═══════════════════════════════════════════════════════════════ */

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
  description: string;
}

export interface Stat {
  value: string;
  label: string;
}

export const profile = {
  name: 'Sobuj',
  nameFull: 'Sobuj Miah',
  title: 'Independent Software & AI Systems Engineer',
  tagline: 'On-device AI · Android · Linux · ARM64 · GPU/NPU',
  location: 'Dhaka, Bangladesh',
  github: 'https://github.com/soobujmiah',
  email: 'soobujmiah@gmail.com',
  telegram: '@soobujmiah',
  linkedin: 'https://linkedin.com/in/soobujmiah',
};

/* — work history — */
export const workHistory: WorkEntry[] = [
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
];

/* — featured projects — */
export const projects: Project[] = [
  {
    name: 'LAI',
    tagline: 'Bangla-first local AI + consent-driven automation',
    year: '2024–26',
    description:
      'Source-only Android runtime for private on-device LLM inference and Accessibility-gated automation. CPU inference device-validated; GPU/NPU in qualification.',
    evidence:
      'Real arm64 llama.cpp CPU inference, ~20 tok/s decode, KV-prefix reuse. Root-cause diagnosis of an Adreno Vulkan driver crash that shaped a fail-closed CPU-default architecture.',
    topics: ['Kotlin', 'llama.cpp', 'Vulkan', 'Accessibility', 'Shizuku', 'GGUF'],
    repo: 'https://github.com/soobujmiah/lai',
    websiteUrl: null,
    accent: '#38bdf8',
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
    accent: '#00e5a0',
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
    accent: '#a78bfa',
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
    websiteUrl: null,
    accent: '#f59e0b',
  },
];

/* — research & experiments — */
export const research: ResearchEntry[] = [
  {
    title: 'Snapdragon / Hexagon NPU',
    status: 'experimental',
    description:
      'Qualcomm Hexagon HTP NPU evaluation. First real non-CPU backend confirmed working with FastRPC/DSP evidence.',
  },
  {
    title: 'Adreno Vulkan / GPU',
    status: 'experimental',
    description:
      'Mesa Turnip Vulkan, Zink OpenGL-on-Vulkan. Vulkan compute crashes at decode — root-caused, documented.',
  },
  {
    title: 'Android Automation',
    status: 'validated',
    description:
      'AccessibilityService + Shizuku privileged execution with explicit consent, hash-chained audit trails.',
  },
  {
    title: 'AI Agents & Orchestration',
    status: 'investigating',
    description:
      'Policy-gated tool dispatch, signed model catalog with SHA-256 verification, multi-provider gateway.',
  },
];

/* — all repositories — */
export const allRepos: Repo[] = [
  { name: 'lai', desc: 'Bangla-first local AI + automation runtime', lang: 'Kotlin', stars: 1, url: 'https://github.com/soobujmiah/lai', websiteUrl: null },
  { name: 'adt', desc: 'ARM64 Android dev toolchain from AOSP source', lang: 'Shell', stars: 0, url: 'https://github.com/soobujmiah/adt', websiteUrl: null },
  { name: 'ternux', desc: 'GPU-accelerated Linux desktop on Android', lang: 'Shell', stars: 1, url: 'https://github.com/soobujmiah/ternux', websiteUrl: null },
  { name: 'ggen', desc: 'Android-first creative & document studio', lang: 'Dart', stars: 0, url: 'https://github.com/soobujmiah/ggen', websiteUrl: null },
  { name: 'datakhoj-android', desc: 'Universal data collector for Android', lang: 'Kotlin', stars: 0, url: 'https://github.com/soobujmiah/datakhoj-android', websiteUrl: null },
  { name: 'songjog', desc: 'Bangla-first business ledger app', lang: 'Dart', stars: 0, url: 'https://github.com/soobujmiah/songjog', websiteUrl: null },
  { name: 'apiloop', desc: 'Provider-agnostic AI API gateway', lang: 'Python', stars: 0, url: 'https://github.com/soobujmiah/apiloop', websiteUrl: null },
  { name: 'sobkichu', desc: 'Bangladesh hyperlocal super-app', lang: 'TypeScript', stars: 0, url: 'https://github.com/soobujmiah/sobkichu', websiteUrl: null },
  { name: 'docdr', desc: 'Mobile-first offline document workspace', lang: 'Dart', stars: 0, url: 'https://github.com/soobujmiah/docdr', websiteUrl: null },
  { name: 'faridpur-police-app', desc: 'Official Faridpur District Police app', lang: 'Dart', stars: 0, url: 'https://github.com/soobujmiah/faridpur-police-app', websiteUrl: null },
  { name: 'iqra-online-mart', desc: 'Bilingual e-commerce storefront demo', lang: 'JavaScript', stars: 0, url: 'https://github.com/soobujmiah/iqra-online-mart', websiteUrl: null },
  { name: 'arms', desc: 'ARM64 dev environment setup scripts', lang: 'HTML', stars: 0, url: 'https://github.com/soobujmiah/arms', websiteUrl: null },
];

/* — stats — */
export const stats: Stat[] = [
  { value: '13', label: 'Public Repos' },
  { value: '7', label: 'Languages' },
  { value: '19', label: 'Total Projects' },
  { value: '8+', label: 'Years Working' },
];

/* — technical focus domains — */
export const domains = [
  { name: 'On-Device AI', items: ['llama.cpp', 'GGUF', 'KV-cache', 'CPU/GPU/NPU routing'] },
  { name: 'Android Systems', items: ['Kotlin', 'Compose', 'Accessibility', 'Shizuku', 'JNI/C++'] },
  { name: 'Linux / ARM64', items: ['AOSP builds', 'Clang/CMake/Ninja', 'Termux + PRoot'] },
  { name: 'GPU / Graphics', items: ['Vulkan', 'Mesa Turnip', 'Zink', 'Adreno KGSL'] },
  { name: 'Mobile & Web', items: ['Flutter', 'Dart', 'TypeScript', 'Python'] },
  { name: 'Eng Ops', items: ['GitHub Actions', 'Signed releases', 'Device validation'] },
];

/* — navigation — */
export const navLinks = [
  { href: '#work', label: 'Work' },
  { href: '#research', label: 'Research' },
  { href: '#stack', label: 'Stack' },
  { href: '#contact', label: 'Contact' },
];

/* — contact channels — */
export const contactChannels = [
  { label: 'Email', value: profile.email, href: `mailto:${profile.email}` },
  { label: 'GitHub', value: 'soobujmiah', href: 'https://github.com/soobujmiah' },
  { label: 'Telegram', value: profile.telegram, href: 'https://t.me/soobujmiah' },
  { label: 'LinkedIn', value: 'in/soobujmiah', href: 'https://linkedin.com/in/soobujmiah' },
];
