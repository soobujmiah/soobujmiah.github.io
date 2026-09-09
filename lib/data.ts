export const profile = {
  name: 'Sobuj Miah',
  nameBn: 'সবুজ মিয়া',
  title: 'Independent Software & AI Systems Engineer',
  location: 'Dhaka, Bangladesh',
  github: 'https://github.com/soobujmiah',
  email: 'soobujmiah@gmail.com',
  telegram: '@soobujmiah',
  linkedin: 'https://linkedin.com/in/soobujmiah',
} as const;

export const hero = {
  tagline: 'On-device AI · Android · Linux · ARM64 · GPU/NPU',
  headline: 'I build systems close to the hardware — mostly from a phone.',
  subhead:
    "Self-taught engineer working at the intersection of local LLM inference, Android systems, and ARM64 Linux tooling. Every project here routes builds through GitHub Actions and every hardware claim is checked against a physical device before I call it done.",
  cta: {
    primary: { label: 'Explore my work', href: '#work' },
    secondary: { label: 'View GitHub', href: 'https://github.com/soobujmiah' },
  },
} as const;

export const about = {
  paragraphs: [
    'I am a self-taught systems builder based in Dhaka, Bangladesh. My work sits at the intersection of on-device AI, Android systems, and ARM64 Linux — problems I pursue because the tools I needed did not exist yet on the hardware I had.',
    'A defining constraint: I develop, build, and validate software primarily from an Android phone running Termux and PRoot Debian, not a conventional PC. This shapes everything — tooling choices, CI architecture, how I verify claims, and which problems I choose to solve.',
    'My learning philosophy is simple: living till learning, dead upon stop learning. I learn through real problems — hypothesis, test, observation, formal theory, compare, iterate. Mechanism-first, evidence-backed, honest about what is proven versus what is still experimental.',
  ],
  facts: [
    { label: 'Based in', value: 'Dhaka, Bangladesh (GMT+6)' },
    { label: 'Languages', value: 'Bangla (native), English (fluent), Hindi/Urdu, Arabic' },
    { label: 'Education', value: 'Self-taught' },
    { label: 'Reference device', value: 'Redmi Turbo 4 Pro — Snapdragon 8s Gen 4 / Adreno 825' },
  ],
} as const;

export interface Project {
  name: string;
  tagline: string;
  description: string;
  problem: string;
  architecture: string[];
  status: string;
  evidence: string;
  repo: string;
  topics: string[];
  kind: 'flagship' | 'systems' | 'product';
}

export const projects: Project[] = [
  {
    name: 'LAI',
    tagline: 'Bangla-first local AI + consent-driven Android automation',
    description:
      'A source-only Android runtime for private, on-device LLM inference and Accessibility-gated automation. CPU inference is device-validated; GPU and NPU backends are in qualification.',
    problem:
      'Cloud AI sends prompts, screen content, and personal context off-device. I wanted a local-first assistant that could converse in Bangla, understand device state, and act on the phone — without transmitting personal data.',
    architecture: [
      'Kotlin/Compose UI with MainViewModel orchestration',
      'Isolated JNI/C++ llama.cpp adapter for CPU inference',
      'Consent-gated Accessibility + Shizuku automation with hash-chained audit trail',
      'Signed model catalog with SHA-256 verification and offline registry',
      'Thermal/memory-aware backend scheduler (CPU → GPU → NPU)',
    ],
    status: 'v0.9.7 production-signed · CPU inference device-validated · GPU/NPU in qualification',
    evidence:
      'Real arm64 llama.cpp CPU inference (GGUF, streaming, KV-prefix reuse), ~20 tok/s decode, device-measured TTFT. Symbolized root-cause diagnosis of an Adreno Vulkan driver crash (vkCmdBindPipeline SIGSEGV) that shaped a fail-closed CPU-default architecture.',
    repo: 'https://github.com/soobujmiah/lai',
    topics: ['Kotlin', 'llama.cpp', 'Vulkan', 'Accessibility', 'Shizuku', 'GGUF', 'Bangla'],
    kind: 'flagship',
  },
  {
    name: 'GGEN',
    tagline: 'Android-first creative & document studio',
    description:
      'A Flutter/Dart foundation for professional vector, raster, painting, document, and PDF work — with optional local/cloud/custom AI. Documentation-first architecture with a pure-Dart core.',
    problem:
      'Existing creative tools are either desktop-only, cloud-dependent, or visually derivative. I wanted a phone-first creative environment with an independent design language and verifiable state integrity.',
    architecture: [
      'Pure-Dart core (packages/ggen_core) — immutable document values, bounded revision history',
      'Deterministic text-layout engine with proven conservation invariant',
      'Transactional file persistence with SHA-256 receipts and recovery journal',
      'Flutter shell with widget-free studio controller',
      'Protected asset registry with path/size/SHA-256 verification',
    ],
    status: 'Phase 1 core + Phase 2 creative surface · device-validated on Redmi Turbo 4 Pro',
    evidence:
      '143 pure-Dart unit tests, 353 widget/controller tests. Multi-stage PR history validated on a physical device round after round.',
    repo: 'https://github.com/soobujmiah/ggen',
    topics: ['Flutter', 'Dart', 'Document Generation', 'Vector Graphics', 'Testing'],
    kind: 'flagship',
  },
  {
    name: 'ADT',
    tagline: 'Native ARM64 Android development toolchain',
    description:
      'Builds Android SDK build-tools and platform-tools from AOSP source for Linux ARM64/glibc — not just Android/Bionic. Ships SHA-256-verified offline release artifacts.',
    problem:
      "Google's Android SDK distribution centers on x86_64 host binaries. On an ARM64 phone running PRoot Debian, those binaries cannot run. I needed a native ARM64 toolchain to build, sign, and install Android apps without a PC.",
    architecture: [
      'AOSP source builds adapted from lzhiyong/android-sdk-tools',
      'Linux host compiler (not NDK toolchain) for host tools',
      'Version-specific patches separated from reusable base patches',
      'SHA-256-verified offline release artifacts',
      'End-to-end validation: source → APK → sign → install → JNI load → run',
    ],
    status: 'Build-tools 35.0.2 + 36.0.0 · platform-tools · real-device validated',
    evidence:
      'Full ARM64 native APK pipeline validated end-to-end on Snapdragon 8s Gen 4: native source → ARM64 shared library → APK packaging → signing → ADB installation → JNI loading → native execution.',
    repo: 'https://github.com/soobujmiah/adt',
    topics: ['AOSP', 'ARM64', 'Build Tools', 'Cross-compilation', 'Toolchain'],
    kind: 'systems',
  },
  {
    name: 'Ternux',
    tagline: 'No-root Debian/Xfce Linux desktop on an Android phone',
    description:
      'Installs a real Debian ARM64 userspace, Xfce4 desktop, Termux:X11 display, PulseAudio bridge, and a Zink/Turnip GPU route on supported Adreno devices — one command, no root.',
    problem:
      'A phone is capable of running a real Linux desktop, but the setup is fragmented and fragile. I wanted a single, reproducible installer with diagnostic tooling and honest evidence boundaries.',
    architecture: [
      'Modular Bash installer with doctor/repair/benchmark CLI',
      'Mesa Zink → Turnip → KGSL for OpenGL-on-Vulkan on Adreno',
      'VirGL compatibility fallback for unsupported devices',
      'PulseAudio over loopback TCP for audio routing',
      'Explicit separation of measured vs. untested claims',
    ],
    status: 'v1.4.0 · one-device GPU evidence · broad compatibility unproven',
    evidence:
      'Zink/Turnip renderer confirmed on Redmi Turbo 4 Pro (Adreno 825): glmark2 score 140 (OpenGL 4.6), 364 (OpenGL ES 3.2). Blender 4.3.2 launched with Zink/Adreno/Turnip renderer.',
    repo: 'https://github.com/soobujmiah/ternux',
    topics: ['Debian', 'Vulkan', 'Turnip', 'Zink', 'Adreno', 'Xfce4', 'PRoot'],
    kind: 'systems',
  },
];

export interface ResearchArea {
  title: string;
  subtitle: string;
  description: string;
  status: 'validated' | 'experimental' | 'investigating';
  details: string[];
}

export const research: ResearchArea[] = [
  {
    title: 'Snapdragon / Hexagon NPU',
    subtitle: 'On-device AI acceleration',
    description:
      'Qualcomm Hexagon HTP NPU evaluation for local LPU inference. First real non-CPU backend confirmed working with FastRPC/DSP evidence.',
    status: 'experimental',
    details: [
      'Hexagon HTP NPU reproducibly confirmed working (FastRPC/DSP evidence, twice)',
      'First working non-CPU backend for local inference',
      'QAIRT/QNN runtime evaluation ongoing',
      'Treated as a qualification gate, not a shipped capability',
    ],
  },
  {
    title: 'Adreno Vulkan / GPU',
    subtitle: 'Graphics and compute',
    description:
      'Mesa Turnip Vulkan driver, Zink OpenGL-on-Vulkan translation, and native Vulkan compute. Includes symbolized crash diagnosis on vendor drivers.',
    status: 'experimental',
    details: [
      'Zink/Turnip Vulkan route confirmed on Adreno 825 (glmark2, Blender)',
      'Vulkan compute crashes at decode (vkCmdBindPipeline) — root-caused, documented',
      'Fail-closed CPU-default architecture adopted after GPU crash analysis',
      'OpenCL path localized to clGetPlatformIDs() never returning — cause not established',
    ],
  },
  {
    title: 'Android Automation',
    subtitle: 'Consent-gated system control',
    description:
      'AccessibilityService and Shizuku privileged execution with explicit user consent, hash-chained audit trails, and typed operation policies.',
    status: 'validated',
    details: [
      'Accessibility snapshot, selector, click, set-text, scroll, screenshot',
      'Shizuku binder state, permission, UID, structured operation policy',
      'No raw shell command API — elevated actions compile from typed operations',
      'Hash-chained audit trail with exact-call replay',
    ],
  },
  {
    title: 'AI Agents & Orchestration',
    subtitle: 'Tool dispatch and model routing',
    description:
      'Policy-gated tool dispatch, local model lifecycle management, and multi-provider AI API orchestration with encrypted credential storage.',
    status: 'investigating',
    details: [
      'Local tool proposals with per-tool schemas and one-validated-action maximum',
      'Signed model catalog with mandatory SHA-256 verification',
      'Multi-provider gateway (OpenAI, Anthropic, Ollama, custom) with failover routing',
      'Encrypted credential store with automatic redaction',
    ],
  },
];

export interface TechDomain {
  name: string;
  items: string[];
}

export const techDomains: TechDomain[] = [
  {
    name: 'On-Device AI',
    items: ['llama.cpp', 'GGUF', 'KV-cache reuse', 'Model integrity verification', 'CPU/GPU/NPU backend routing'],
  },
  {
    name: 'Android Systems',
    items: ['Kotlin', 'Compose', 'AccessibilityService', 'Shizuku', 'JNI/C++ boundary'],
  },
  {
    name: 'Linux / ARM64',
    items: ['AOSP source builds', 'Clang/CMake/Ninja', 'Termux + PRoot', 'Bash/shell scripting'],
  },
  {
    name: 'GPU / Graphics',
    items: ['Vulkan', 'Mesa Turnip', 'Zink', 'OpenGL-on-Vulkan', 'Adreno KGSL'],
  },
  {
    name: 'Mobile & Web',
    items: ['Flutter', 'Dart', 'TypeScript', 'Python', 'HTML/CSS/JS'],
  },
  {
    name: 'Engineering Ops',
    items: ['GitHub Actions CI/CD', 'Reproducible builds', 'Signed releases', 'Real-device validation'],
  },
];

export interface GitHubRepo {
  name: string;
  description: string;
  language: string;
  stars: number;
  url: string;
  topics: string[];
}

export const githubRepos: GitHubRepo[] = [
  {
    name: 'lai',
    description: 'Bangla-first on-device local AI and consent-driven Android automation runtime',
    language: 'Kotlin',
    stars: 1,
    url: 'https://github.com/soobujmiah/lai',
    topics: ['android', 'arm64', 'gguf', 'llama-cpp', 'local-llm', 'on-device-ai', 'vulkan'],
  },
  {
    name: 'adt',
    description: 'ARM64 Android development toolchain — native aarch64 build-tools/platform-tools from AOSP source',
    language: 'Shell',
    stars: 0,
    url: 'https://github.com/soobujmiah/adt',
    topics: ['android', 'aosp', 'arm64', 'build-tools', 'cross-compilation', 'toolchain'],
  },
  {
    name: 'ternux',
    description: 'GPU-accelerated Linux desktop on Android — Termux + PRoot + Xfce4 + Zink/Turnip Vulkan',
    language: 'Shell',
    stars: 1,
    url: 'https://github.com/soobujmiah/ternux',
    topics: ['adreno', 'android', 'debian', 'gpu-acceleration', 'termux', 'turnip', 'vulkan'],
  },
  {
    name: 'ggen',
    description: 'Android-first AI Creative & Document Studio — Flutter/Dart, documentation-first',
    language: 'Dart',
    stars: 0,
    url: 'https://github.com/soobujmiah/ggen',
    topics: ['android', 'creative-tools', 'dart', 'document-generation', 'flutter'],
  },
  {
    name: 'datakhoj-android',
    description: 'Universal data collector for Android — search, extract, structure, export. AGPL-3.0.',
    language: 'Kotlin',
    stars: 0,
    url: 'https://github.com/soobujmiah/datakhoj-android',
    topics: ['android', 'data-extraction', 'jsoup', 'kotlin', 'offline-first', 'room-database'],
  },
  {
    name: 'songjog',
    description: 'Bangla-first Android business ledger and operations app for shops (Owner Edition)',
    language: 'Dart',
    stars: 0,
    url: 'https://github.com/soobujmiah/songjog',
    topics: ['android', 'bangla', 'business', 'dart', 'flutter', 'offline-first'],
  },
  {
    name: 'apiloop',
    description: 'Provider-agnostic AI API gateway, router, orchestrator, and credential manager',
    language: 'Python',
    stars: 0,
    url: 'https://github.com/soobujmiah/apiloop',
    topics: [],
  },
  {
    name: 'sobkichu',
    description: 'Bangladesh hyperlocal super-app — architecture spec & NestJS backend vertical slice',
    language: 'TypeScript',
    stars: 0,
    url: 'https://github.com/soobujmiah/sobkichu',
    topics: ['architecture', 'specification', 'super-app', 'typescript'],
  },
  {
    name: 'docdr',
    description: 'Mobile-first offline document workspace — commercial successor to RGEN document engine',
    language: 'Dart',
    stars: 0,
    url: 'https://github.com/soobujmiah/docdr',
    topics: ['dart', 'document-management', 'flutter', 'offline-first', 'pdf'],
  },
];

export interface TimelineEvent {
  year: string;
  title: string;
  description: string;
}

export const timeline: TimelineEvent[] = [
  {
    year: '2019',
    title: 'GitHub journey begins',
    description: 'Started building and publishing open-source projects from an Android phone.',
  },
  {
    year: '2022',
    title: 'Phone-as-workstation',
    description: 'Established Termux + PRoot Debian as a primary development environment. Ternux born from this constraint.',
  },
  {
    year: '2024',
    title: 'Local AI focus',
    description: 'Began serious work on on-device LLM inference. LAI project started. llama.cpp CPU backend validated on ARM64.',
  },
  {
    year: '2025',
    title: 'Ecosystem expansion',
    description: 'GGEN creative studio, ADT toolchain, DataKhoj, Songjog, Sobkichu — multiple projects in parallel. CI/CD pipelines standardized.',
  },
  {
    year: '2026',
    title: 'NPU qualification + GPU diagnosis',
    description: 'Hexagon HTP NPU confirmed working (first non-CPU backend). Vulkan GPU crash root-caused and documented. 19 active repositories.',
  },
];

export const contact = {
  headline: 'Open to freelance, remote, and collaboration.',
  subhead:
    'If you are working on on-device AI, Android systems, ARM64 tooling, or local-first products — I would be happy to talk.',
  channels: [
    { label: 'Email', value: 'soobujmiah@gmail.com', href: 'mailto:soobujmiah@gmail.com' },
    { label: 'GitHub', value: 'soobujmiah', href: 'https://github.com/soobujmiah' },
    { label: 'Telegram', value: '@soobujmiah', href: 'https://t.me/soobujmiah' },
    { label: 'LinkedIn', value: 'in/soobujmiah', href: 'https://linkedin.com/in/soobujmiah' },
  ],
} as const;
