/* ═══════════════════════════════════════════════════════════════
   SITE GUIDE KNOWLEDGE — slim, bilingual facts for local Q&A.

   Deliberately NOT importing services-content.ts or the full content
   tree. Those modules are large; the guide only needs titles, shorts,
   a few includes, contact identifiers, and featured project names.
   Keep this file the single knowledge surface for answerSiteQuestion.
   ═══════════════════════════════════════════════════════════════ */

import type { Lang } from './content';
import { SERVICE_SLUGS, serviceHref, type ServiceSlug } from './services';

export type GuideFactService = {
  slug: ServiceSlug;
  title: string;
  short: string;
  includes: string[];
};

export type GuideKnowledge = {
  nameFull: string;
  title: string;
  location: string;
  intro: string;
  email: string;
  telegram: string;
  availability: string;
  servicesHeading: string;
  workHeading: string;
  stackHeading: string;
  projects: { name: string; tagline: string }[];
  domains: { name: string; items: string[] }[];
  services: GuideFactService[];
  unknown: string;
  empty: string;
};

/** Hand-curated slice — mirrors SoT fields without pulling the trees. */
const EN_SERVICES: GuideFactService[] = [
  {
    slug: 'web-development',
    title: 'Website Development',
    short: 'Fast, static-first websites for individuals and small businesses — built, deployed and kept working.',
    includes: [
      'Planning the pages around what visitors need to find',
      'Responsive layout that stays readable on phones',
      'HTTPS deployment and basic upkeep',
      'Clear hand-off notes so you can keep editing content',
    ],
  },
  {
    slug: 'software-development',
    title: 'Custom Software Development',
    short: 'Purpose-built tools, Android apps and automation — when off-the-shelf software does not fit the job.',
    includes: [
      'Scoping the real workflow before writing code',
      'Android or desktop tools matched to the task',
      'Automation that removes repeated manual steps',
      'Source and build notes you can keep',
    ],
  },
  {
    slug: 'computer-support',
    title: 'Computer Setup & Troubleshooting',
    short: 'Windows and Linux setup, configuration and problem-solving — done remotely, explained clearly.',
    includes: [
      'Fresh setup and sensible defaults',
      'Diagnosing boot, driver and network issues',
      'Remote guided repair with plain-language notes',
      'A short written note of what was changed and why',
    ],
  },
  {
    slug: 'android-support',
    title: 'Android & Phone Software Support',
    short: 'Android configuration, software troubleshooting, ADB and device setup, and realistic performance tuning.',
    includes: [
      'Device setup and account configuration',
      'Software troubleshooting without guesswork',
      'ADB-assisted diagnosis when needed',
      'Honest performance expectations for the hardware',
    ],
  },
  {
    slug: 'business-technology',
    title: 'Small-Business Technology Support',
    short: 'Practical technology for small businesses and institutions — from the first spreadsheet to a real workflow tool.',
    includes: [
      'Choosing tools that fit the actual process',
      'Spreadsheet and form workflows that stay maintainable',
      'Light automation between existing apps',
      'Training notes so the team can run it day to day',
    ],
  },
  {
    slug: 'graphics-design',
    title: 'Graphics Design',
    short: 'Clean, practical digital graphics — social media posts, posters, banners and promotional materials for everyday use.',
    includes: [
      'Social posts and story frames',
      'Posters and banners for print or screen',
      'Simple brand-consistent colour and type',
      'Export-ready files in common formats',
    ],
  },
  {
    slug: 'office-administration',
    title: 'Office Administration & Operations Support',
    short: 'Organised, digital-first administrative support backed by years of real office and site-operations experience.',
    includes: [
      'Document organisation and filing systems',
      'Scheduling and follow-up routines',
      'Digital records that stay searchable',
      'Process notes the next person can follow',
    ],
  },
  {
    slug: 'data-entry',
    title: 'Data Entry & Data Work',
    short: 'Accurate data entry, clean-up and structuring — from paper and PDFs to spreadsheets and databases you can trust.',
    includes: [
      'Careful entry from paper, scans or PDFs',
      'Cleanup, dedupe and consistent formatting',
      'Structured sheets ready for analysis',
      'A short note of assumptions and edge cases',
    ],
  },
];

const BN_SERVICES: GuideFactService[] = [
  {
    slug: 'web-development',
    title: 'ওয়েবসাইট তৈরি',
    short: 'ব্যক্তি ও ছোট ব্যবসার জন্য দ্রুত, স্ট্যাটিক-ফার্স্ট ওয়েবসাইট — তৈরি, ডিপ্লয় ও সচল রাখা।',
    includes: [
      'দর্শক যা খুঁজে পায় সে অনুযায়ী পৃষ্ঠা পরিকল্পনা',
      'ফোনেও পাঠযোগ্য রেসপন্সিভ লেআউট',
      'এইচটিটিপিএস ডিপ্লয় ও মৌলিক রক্ষণাবেক্ষণ',
      'কন্টেন্ট সম্পাদনা চালিয়ে যাওয়ার স্পষ্ট হস্তান্তর নোট',
    ],
  },
  {
    slug: 'software-development',
    title: 'কাস্টম সফটওয়্যার তৈরি',
    short: 'উদ্দেশ্য-ভিত্তিক টুল, অ্যান্ড্রয়েড অ্যাপ ও অটোমেশন — যখন তৈরি-করা সফটওয়্যার কাজে মেলে না।',
    includes: [
      'কোড লেখার আগে আসল কর্মপ্রবাহ নির্ধারণ',
      'কাজের সাথে মিলিয়ে অ্যান্ড্রয়েড বা ডেস্কটপ টুল',
      'বারবার ম্যানুয়াল ধাপ সরানো অটোমেশন',
      'রাখার মতো সোর্স ও বিল্ড নোট',
    ],
  },
  {
    slug: 'computer-support',
    title: 'কম্পিউটার সেটআপ ও সমস্যা সমাধান',
    short: 'উইন্ডোজ ও লিনাক্স সেটআপ, কনফিগারেশন ও সমস্যা সমাধান — রিমোটে, স্পষ্টভাবে ব্যাখ্যাসহ।',
    includes: [
      'নতুন সেটআপ ও যুক্তিসঙ্গত ডিফল্ট',
      'বুট, ড্রাইভার ও নেটওয়ার্ক সমস্যা নির্ণয়',
      'সহজ ভাষার নোটসহ রিমোট নির্দেশিত মেরামত',
      'কী বদলানো হয়েছে ও কেন — সংক্ষিপ্ত লিখিত নোট',
    ],
  },
  {
    slug: 'android-support',
    title: 'অ্যান্ড্রয়েড ও ফোন সফটওয়্যার সহায়তা',
    short: 'অ্যান্ড্রয়েড কনফিগারেশন, সফটওয়্যার সমস্যা সমাধান, এডিবি ও ডিভাইস সেটআপ, এবং বাস্তবসম্মত পারফরম্যান্স টিউনিং।',
    includes: [
      'ডিভাইস সেটআপ ও অ্যাকাউন্ট কনফিগারেশন',
      'অনুমান ছাড়া সফটওয়্যার সমস্যা সমাধান',
      'প্রয়োজনে এডিবি-সহায়ক নির্ণয়',
      'হার্ডওয়্যার অনুযায়ী সৎ পারফরম্যান্স প্রত্যাশা',
    ],
  },
  {
    slug: 'business-technology',
    title: 'ছোট ব্যবসার প্রযুক্তি সহায়তা',
    short: 'ছোট ব্যবসা ও প্রতিষ্ঠানের ব্যবহারিক প্রযুক্তি — প্রথম স্প্রেডশিট থেকে আসল কর্মপ্রবাহ টুল পর্যন্ত।',
    includes: [
      'আসল প্রক্রিয়ার সাথে মেলানো টুল বাছাই',
      'রক্ষণাবেক্ষণযোগ্য স্প্রেডশিট ও ফর্ম ওয়ার্কফ্লো',
      'বিদ্যমান অ্যাপের মধ্যে হালকা অটোমেশন',
      'দল যেন চালাতে পারে — প্রশিক্ষণ নোট',
    ],
  },
  {
    slug: 'graphics-design',
    title: 'গ্রাফিক্স ডিজাইন',
    short: 'পরিষ্কার, ব্যবহারিক ডিজিটাল গ্রাফিক্স — সামাজিক পোস্ট, পোস্টার, ব্যানার ও দৈনন্দিন প্রচার সামগ্রী।',
    includes: [
      'সামাজিক পোস্ট ও স্টোরি ফ্রেম',
      'প্রিন্ট বা স্ক্রিনের পোস্টার ও ব্যানার',
      'সহজ ব্র্যান্ড-সঙ্গত রং ও টাইপ',
      'সাধারণ ফরম্যাটে এক্সপোর্ট-রেডি ফাইল',
    ],
  },
  {
    slug: 'office-administration',
    title: 'অফিস প্রশাসন ও অপারেশনস সহায়তা',
    short: 'বাস্তব অফিস ও সাইট-অপারেশন অভিজ্ঞতায় ভিত্তি করা সংগঠিত, ডিজিটাল-প্রথম প্রশাসনিক সহায়তা।',
    includes: [
      'নথি সংগঠন ও ফাইলিং ব্যবস্থা',
      'সময়সূচি ও ফলো-আপ রুটিন',
      'অনুসন্ধানযোগ্য ডিজিটাল রেকর্ড',
      'পরবর্তী ব্যক্তি অনুসরণ করতে পারে এমন প্রক্রিয়া নোট',
    ],
  },
  {
    slug: 'data-entry',
    title: 'ডেটা এন্ট্রি ও ডেটা কাজ',
    short: 'নিখুঁত ডেটা এন্ট্রি, পরিষ্কারকরণ ও কাঠামো — কাগজ ও পিডিএফ থেকে বিশ্বাসযোগ্য স্প্রেডশিট ও ডেটাবেস পর্যন্ত।',
    includes: [
      'কাগজ, স্ক্যান বা পিডিএফ থেকে সতর্ক এন্ট্রি',
      'পরিষ্কারকরণ, ডুপ্লিকেট সরানো ও সামঞ্জস্যপূর্ণ ফরম্যাট',
      'বিশ্লেষণের জন্য প্রস্তুত কাঠামোবদ্ধ শিট',
      'অনুমান ও এজ কেসের সংক্ষিপ্ত নোট',
    ],
  },
];

const KNOWLEDGE: Record<Lang, GuideKnowledge> = {
  en: {
    nameFull: 'Sobuj Miah',
    title: 'Independent Software & AI Systems Engineer',
    location: 'Savar, Dhaka, Bangladesh',
    intro:
      'Independent software and AI systems engineer at the intersection of on-device AI, Android systems, and ARM64 Linux. Self-taught, and built under constraint — every build runs on CI, every claim checked against a physical device.',
    email: 'soobujmiah@gmail.com',
    telegram: '@soobujmiah',
    availability:
      'Based in Savar, Dhaka, Bangladesh · remote worldwide. Work is delivered remotely; on-site visits are not offered as a standard service.',
    servicesHeading: 'Software engineering, practical technology services, and digital office support.',
    workHeading: 'Selected projects with CI and device evidence.',
    stackHeading: 'Core technologies in day-to-day use.',
    projects: [
      { name: 'LAI', tagline: 'Bangla-first local AI + consent-driven automation' },
      { name: 'GGEN', tagline: 'Android-first creative & document studio' },
      { name: 'ADT', tagline: 'Native ARM64 Android development toolchain' },
    ],
    domains: [
      { name: 'On-device AI', items: ['llama.cpp', 'GGUF', 'Kotlin', 'Vulkan'] },
      { name: 'Android systems', items: ['AOSP', 'Shizuku', 'Accessibility', 'ADB'] },
      { name: 'ARM64 Linux', items: ['glibc', 'cross-compilation', 'native tooling'] },
    ],
    services: EN_SERVICES,
    unknown: 'I do not have information about that on this site.',
    empty: 'Ask a short question about this portfolio.',
  },
  bn: {
    nameFull: 'সবুজ মিয়া',
    title: 'স্বাধীন সফটওয়্যার ও এআই সিস্টেম ইঞ্জিনিয়ার',
    location: 'সাভার, ঢাকা, বাংলাদেশ',
    intro:
      'অন-ডিভাইস এআই, অ্যান্ড্রয়েড সিস্টেম ও এআরএম ৬৪ লিনাক্সের সংযোগস্থলে কাজ করা স্বাধীন সফটওয়্যার ও এআই সিস্টেম ইঞ্জিনিয়ার। স্ব-শিক্ষিত, এবং সীমাবদ্ধতার মধ্যে নির্মিত — প্রতিটি বিল্ড চলে সিআই-তে, প্রতিটি দাবি যাচাই হয় বাস্তব ফিজিক্যাল ডিভাইসে।',
    email: 'soobujmiah@gmail.com',
    telegram: '@soobujmiah',
    availability:
      'সাভার, ঢাকা, বাংলাদেশে অবস্থিত · বিশ্বব্যাপী রিমোট। কাজ রিমোটে সম্পন্ন হয়; সরেজমিন পরিদর্শন নিয়মিত সেবা হিসেবে দেওয়া হয় না।',
    servicesHeading: 'সফটওয়্যার ইঞ্জিনিয়ারিং, ব্যবহারিক প্রযুক্তি সেবা ও ডিজিটাল অফিস সহায়তা।',
    workHeading: 'সিআই ও ডিভাইস প্রমাণসহ নির্বাচিত প্রজেক্ট।',
    stackHeading: 'দৈনন্দিন কাজের মূল প্রযুক্তি।',
    projects: [
      { name: 'LAI', tagline: 'বাংলা-প্রথম লোকাল এআই + সম্মতি-চালিত অটোমেশন' },
      { name: 'GGEN', tagline: 'অ্যান্ড্রয়েড-প্রথম সৃজনশীল ও ডকুমেন্ট স্টুডিও' },
      { name: 'ADT', tagline: 'নেটিভ এআরএম ৬৪ অ্যান্ড্রয়েড ডেভেলপমেন্ট টুলচেইন' },
    ],
    domains: [
      { name: 'অন-ডিভাইস এআই', items: ['llama.cpp', 'GGUF', 'Kotlin', 'Vulkan'] },
      { name: 'অ্যান্ড্রয়েড সিস্টেম', items: ['AOSP', 'Shizuku', 'Accessibility', 'ADB'] },
      { name: 'এআরএম ৬৪ লিনাক্স', items: ['glibc', 'ক্রস-কম্পাইলেশন', 'নেটিভ টুলিং'] },
    ],
    services: BN_SERVICES,
    unknown: 'এই সাইটে সেই বিষয়ে তথ্য নেই।',
    empty: 'এই পোর্টফোলিও সম্পর্কে একটি সংক্ষিপ্ত প্রশ্ন করুন।',
  },
};

// Keep service order locked to the registry even if the curated lists drift.
function orderedServices(lang: Lang): GuideFactService[] {
  const bySlug = new Map(KNOWLEDGE[lang].services.map((s) => [s.slug, s]));
  return SERVICE_SLUGS.map((slug) => {
    const hit = bySlug.get(slug);
    if (hit) return hit;
    return { slug, title: slug, short: '', includes: [] };
  });
}

export function guideKnowledge(lang: Lang): GuideKnowledge {
  const base = KNOWLEDGE[lang];
  return { ...base, services: orderedServices(lang) };
}

export function guideServiceHref(slug?: ServiceSlug): string {
  return serviceHref(slug);
}
