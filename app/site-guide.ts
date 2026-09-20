/* ═══════════════════════════════════════════════════════════════
   SITE GUIDE — local, deterministic Q&A over portfolio knowledge.

   No external AI. No network. Answers come from site-guide-knowledge
   (a slim curated slice) via keyword/intent matching.
   ═══════════════════════════════════════════════════════════════ */

import type { Lang } from './content';
import { SERVICE_SLUGS, type ServiceSlug } from './services';
import { guideKnowledge, guideServiceHref } from './site-guide-knowledge';

export type GuideAnswer = {
  text: string;
  href?: string;
};

type Intent = {
  id: string;
  needles: string[];
  answer: (lang: Lang) => GuideAnswer;
};

const norm = (s: string) =>
  s
    .toLowerCase()
    .normalize('NFKC')
    .replace(/[^\p{L}\p{N}\s+.-]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const SOFT_SERVICE: { slug: ServiceSlug; words: string[] }[] = [
  { slug: 'web-development', words: ['website', 'web site', 'web development', 'ওয়েবসাইট', 'ওয়েব'] },
  { slug: 'software-development', words: ['software', 'custom software', 'application', 'সফটওয়্যার', 'অ্যাপ'] },
  { slug: 'computer-support', words: ['computer', 'pc', 'laptop', 'windows', 'linux', 'কম্পিউটার', 'ল্যাপটপ'] },
  { slug: 'android-support', words: ['android', 'phone', 'mobile', 'adb', 'অ্যান্ড্রয়েড', 'ফোন'] },
  {
    slug: 'business-technology',
    words: ['business technology', 'small business', 'workflow', 'ব্যবসা', 'বিজনেস'],
  },
  { slug: 'graphics-design', words: ['graphics', 'graphic design', 'poster', 'banner', 'ডিজাইন', 'গ্রাফিক্স'] },
  {
    slug: 'office-administration',
    words: ['office admin', 'administration', 'operations support', 'প্রশাসন', 'অফিস'],
  },
  { slug: 'data-entry', words: ['data entry', 'data work', 'spreadsheet', 'ডেটা এন্ট্রি', 'স্প্রেডশিট'] },
];

function serviceAnswer(lang: Lang, slug: ServiceSlug): GuideAnswer {
  const k = guideKnowledge(lang);
  const page = k.services.find((s) => s.slug === slug);
  if (!page) return { text: k.unknown };
  const includeLabel = lang === 'en' ? 'Includes:' : 'যা অন্তর্ভুক্ত:';
  const bits = [page.title, page.short, '', includeLabel, ...page.includes.slice(0, 4).map((x) => `• ${x}`)];
  return { text: bits.join('\n'), href: guideServiceHref(slug) };
}

const INTENTS: Intent[] = [
  {
    id: 'who',
    needles: [
      'who is',
      'who are you',
      'about sobuj',
      'about you',
      'your name',
      'সবুজ কে',
      'কে তুমি',
      'কে আপনি',
      'পরিচিতি',
      'আপনি কে',
    ],
    answer: (lang) => {
      const k = guideKnowledge(lang);
      return {
        text: `${k.nameFull} — ${k.title}. ${k.location}. ${k.intro}`,
        href: '/about/',
      };
    },
  },
  {
    id: 'services-list',
    needles: [
      'what services',
      'which services',
      'services available',
      'list of services',
      'all services',
      'your services',
      'কী কী সেবা',
      'সেবাগুলো',
      'সার্ভিস',
      'সেবা আছে',
      'কোন সেবা',
    ],
    answer: (lang) => {
      const k = guideKnowledge(lang);
      const list = k.services.map((p) => `• ${p.title} — ${p.short}`).join('\n');
      return { text: `${k.servicesHeading}\n\n${list}`, href: guideServiceHref() };
    },
  },
  {
    id: 'contact',
    needles: [
      'contact',
      'email',
      'telegram',
      'reach',
      'get in touch',
      'hire',
      'how can i contact',
      'যোগাযোগ',
      'ইমেইল',
      'টেলিগ্রাম',
      'কীভাবে যোগাযোগ',
    ],
    answer: (lang) => {
      const k = guideKnowledge(lang);
      if (lang === 'en') {
        return {
          text: `Contact ${k.nameFull}: email ${k.email}, Telegram ${k.telegram}. ${k.availability}`,
          href: '/contact/',
        };
      }
      return {
        text: `যোগাযোগ — ${k.nameFull}: ইমেইল ${k.email}, টেলিগ্রাম ${k.telegram}. ${k.availability}`,
        href: '/contact/',
      };
    },
  },
  {
    id: 'projects',
    needles: [
      'projects',
      'featured',
      'your work',
      'portfolio projects',
      'what do you build',
      'what projects',
      'প্রকল্প',
      'নির্বাচিত',
      'কোন প্রকল্প',
    ],
    answer: (lang) => {
      const k = guideKnowledge(lang);
      const lines = k.projects.map((f) => `• ${f.name} — ${f.tagline}`).join('\n');
      return { text: `${k.workHeading}\n\n${lines}`, href: '/work/' };
    },
  },
  {
    id: 'stack',
    needles: [
      'technolog',
      'stack',
      'tools',
      'skills',
      'what do you use',
      'tech focus',
      'প্রযুক্তি',
      'টুল',
      'দক্ষতা',
      'স্ট্যাক',
    ],
    answer: (lang) => {
      const k = guideKnowledge(lang);
      const lines = k.domains.map((d) => `• ${d.name}: ${d.items.join(', ')}`).join('\n');
      return { text: `${k.stackHeading}\n\n${lines}`, href: '/stack/' };
    },
  },
  {
    id: 'cv',
    needles: ['cv', 'resume', 'curriculum', 'সিভি', 'রেজিউমি'],
    answer: (lang) => ({
      text:
        lang === 'en'
          ? 'Download CV: available from the site header.'
          : 'সিভি ডাউনলোড: সাইট হেডার থেকে পাওয়া যায়।',
    }),
  },
  {
    id: 'location',
    needles: ['where', 'location', 'based', 'dhaka', 'savar', 'bangladesh', 'কোথায়', 'লোকেশন', 'ঢাকা', 'সাভার'],
    answer: (lang) => {
      const k = guideKnowledge(lang);
      return {
        text: `${k.nameFull} — ${k.location}. ${k.availability}`,
        href: '/contact/',
      };
    },
  },
];

for (const slug of SERVICE_SLUGS) {
  INTENTS.push({
    id: `service:${slug}`,
    needles: [slug.replace(/-/g, ' '), slug],
    answer: (lang) => serviceAnswer(lang, slug),
  });
}

function score(q: string, needles: string[]): number {
  let s = 0;
  for (const n of needles) {
    const nn = norm(n);
    if (!nn) continue;
    if (q.includes(nn)) s += nn.length >= 8 ? 3 : 2;
  }
  return s;
}

/** Answer a question using only on-site structured knowledge. */
export function answerSiteQuestion(raw: string, lang: Lang): GuideAnswer {
  const k = guideKnowledge(lang);
  const q = norm(raw);
  if (!q) return { text: k.empty };

  let best: { intent: Intent; score: number } | null = null;
  for (const intent of INTENTS) {
    let needles = intent.needles;
    if (intent.id.startsWith('service:')) {
      const slug = intent.id.slice('service:'.length) as ServiceSlug;
      const page = k.services.find((s) => s.slug === slug);
      const enPage = guideKnowledge('en').services.find((s) => s.slug === slug);
      needles = [
        ...needles,
        page?.title ?? '',
        enPage?.title ?? '',
        ...(page?.title ? page.title.split(/\s+/).filter((w) => w.length > 4) : []),
        ...(enPage?.title ? enPage.title.split(/\s+/).filter((w) => w.length > 4) : []),
      ];
    }
    const sc = score(q, needles);
    if (sc > 0 && (!best || sc > best.score)) best = { intent, score: sc };
  }

  if (!best || best.score < 2) {
    for (const { slug, words } of SOFT_SERVICE) {
      if (words.some((w) => q.includes(norm(w)))) {
        return serviceAnswer(lang, slug);
      }
    }
  }

  if (!best) return { text: k.unknown };
  return best.intent.answer(lang);
}
