/* ═══════════════════════════════════════════════════════════════
   VERIFICATION COPY — the bilingual text of /verification/.

   Deliberately a separate module from `app/content.ts`, exactly like
   `app/services-content.ts`: this copy belongs to one static document
   outside the pager, and keeping it out of the shared content tree
   means it is only ever shipped to the route that renders it — the
   fixed footer on every other page does not pay for it.

   `claimLabels` carries the localized display text for every claim id
   in `verification/claims.json`. The canonical claim wording lives in
   soobujmiah/skb; this is presentation copy only. Every published id
   must have a label in BOTH trees — `scripts/check-verification.mjs`
   proves that, in both directions (no missing label, no orphan copy).

   The same two purity rules as app/content.ts apply, and the same
   gate proves them: EN carries no Bengali, BN carries no Latin except
   the enumerated verbatim-data paths — here, the claim ids.
   ═══════════════════════════════════════════════════════════════ */

import type { Lang } from './content';

export interface VerificationCopy {
  eyebrow: string;
  heading: string;
  intro: string;
  summaryLabel: string;
  summaryTotal: string;
  summaryVerified: string;
  summaryFailed: string;
  summaryStale: string;
  summaryHuman: string;
  asOfLabel: string;
  machineHeading: string;
  machineIntro: string;
  humanHeading: string;
  humanIntro: string;
  statusVerified: string;
  statusFailed: string;
  statusStale: string;
  statusUnverified: string;
  statusSuperseded: string;
  statusHuman: string;
  verifiedAtLabel: string;
  viewEvidence: string;
  viewRun: string;
  sourceLabel: string;
  scopeHeading: string;
  scopeMachine: string;
  scopeHuman: string;
  scopeSource: string;
  footerNote: string;
  claimLabels: { id: string; label: string }[];
}

const en: VerificationCopy = {
    eyebrow: 'Proof',
    heading: 'Verification',
    intro:
      'Selected statements on this site are backed by machine-checkable evidence: each repository publishes its own deterministic state, and this page resolves the current claims against it. Nothing here is written by hand from memory.',
    summaryLabel: 'Current state',
    summaryTotal: 'Machine-checked claims',
    summaryVerified: 'Verified',
    summaryFailed: 'Not currently passing',
    summaryStale: 'Stale',
    summaryHuman: 'Human-attested',
    asOfLabel: 'Evidence as of',
    machineHeading: 'Machine-verified claims',
    machineIntro:
      'Each row below is resolved automatically from the cited repository state. A claim that stops holding is shown as failing, not hidden.',
    humanHeading: 'Not automatically verified',
    humanIntro:
      'These statements are owner-authored positioning or figures recorded from real devices and releases. They are intentionally excluded from automatic verification, and no automation may rewrite them.',
    statusVerified: 'Verified',
    statusFailed: 'Not currently passing',
    statusStale: 'Stale',
    statusUnverified: 'Unverified',
    statusSuperseded: 'Superseded',
    statusHuman: 'Human-attested',
    verifiedAtLabel: 'Verified at',
    viewEvidence: 'View evidence',
    viewRun: 'View CI run',
    sourceLabel: 'Source',
    scopeHeading: 'What this page does and does not claim',
    scopeMachine:
      'Verified rows are derived from each repository’s own deterministic state file, refreshed on every push to that repository’s main branch and re-resolved here on every push to this one.',
    scopeHuman:
      'Human-attested rows carry no machine-readable evidence by design. Treat them as statements of record, re-checked by the owner before professional reuse.',
    scopeSource:
      'The canonical claim registry lives in the owner’s private knowledge repository. This page publishes only a public-safe projection of it: no private repository, credential, or internal detail is exposed.',
    footerNote:
      'Generated data. Do not hand-edit. The claim definitions are owned by the canonical registry, and the footer on every page reads the same generated file.',
    claimLabels: [
      { id: 'portfolio.source.public', label: 'The portfolio source repository is publicly accessible.' },
      { id: 'portfolio.build.passing', label: 'The portfolio site builds successfully, including every content, design and purity gate.' },
      { id: 'portfolio.export.passing', label: 'The portfolio static export passes its post-build acceptance validation.' },
      { id: 'repo.lai.build.passing', label: 'LAI reports a passing continuous-integration build.' },
      { id: 'repo.adt.build.passing', label: 'ADT reports a passing continuous-integration build.' },
      { id: 'repo.ternux.build.passing', label: 'Ternux reports a passing continuous-integration build.' },
      { id: 'repo.ggen.build.passing', label: 'GGEN reports a passing continuous-integration build.' },
      { id: 'repo.songjog.build.passing', label: 'Songjog reports a passing continuous-integration build.' },
      { id: 'repo.docdr.build.passing', label: 'DocDr reports a passing continuous-integration build.' },
      { id: 'repo.apiloop.build.passing', label: 'Apiloop reports a passing continuous-integration build.' },
      { id: 'repo.arms.build.passing', label: 'ARMS reports a passing continuous-integration build.' },
      { id: 'repo.iqra-online-mart.build.passing', label: 'Iqra Online Mart reports a passing continuous-integration build.' },
      { id: 'repo.datakhoj-android.build.passing', label: 'DataKhoj Android reports a passing continuous-integration build.' },
      { id: 'repo.sobkichu.build.passing', label: 'Sobkichu reports a passing continuous-integration build.' },
      { id: 'showcase.live_sites.published', label: 'The repositories behind the live-site links publish GitHub Pages sites.' },
      { id: 'positioning.software_practice', label: 'I build practical software.' },
      { id: 'attested.ggen.unit_tests', label: 'GGEN carries 143 pure-Dart unit tests.' },
      { id: 'attested.ggen.widget_tests', label: 'GGEN carries 353 widget and controller tests.' },
      { id: 'attested.lai.decode_throughput', label: 'LAI decodes at 12–20 tok/s on the reference device.' },
      { id: 'attested.ternux.glmark2', label: 'Ternux scores 140 on glmark2 (OpenGL 4.6).' },
      { id: 'attested.ternux.blender', label: 'Ternux runs Blender 4.3.2 on Zink, Adreno and Turnip.' },
      { id: 'attested.songjog.test_count', label: 'Songjog carries 94 tests.' },
      { id: 'attested.adt.apk_pipeline', label: 'ADT produces a signed, installable ARM64 APK end to end.' },
      { id: 'attested.device_validation', label: 'Selected projects were validated on a physical Redmi Turbo 4 Pro running Termux and PRoot Debian.' },
    ],
};

const bn: VerificationCopy = {
    eyebrow: 'প্রমাণ',
    heading: 'যাচাই',
    intro:
      'এই সাইটের কিছু বাক্য যন্ত্রচেকযোগ্য প্রমাণে ভিত্তিক: প্রতিটি রিপোজিটরি নিজের নির্ণায়ক অবস্থা প্রকাশ করে, এবং এই পৃষ্ঠা বর্তমান দাবিগুলো সেই অবস্থার বিপরীতে যাচাই করে। এখানকার কিছুই স্মৃতি থেকে হাতে লেখা নয়।',
    summaryLabel: 'বর্তমান অবস্থা',
    summaryTotal: 'যন্ত্র-যাচাইকৃত দাবি',
    summaryVerified: 'যাচাইকৃত',
    summaryFailed: 'বর্তমানে পাস করছে না',
    summaryStale: 'পুরোনো',
    summaryHuman: 'মানব-প্রমাণিত',
    asOfLabel: 'প্রমাণের তারিখ',
    machineHeading: 'যন্ত্র-যাচাইকৃত দাবি',
    machineIntro:
      'নিচের প্রতিটি সারি স্বয়ংক্রিয়ভাবে উল্লিখিত রিপোজিটরির অবস্থা থেকে যাচাই করা হয়। যে দাবি আর সত্যি নয়, তা লুকানো হয় না — ব্যর্থ দেখানো হয়।',
    humanHeading: 'স্বয়ংক্রিয়ভাবে যাচাই করা হয় না',
    humanIntro:
      'এই বাক্যগুলো মালিকের লেখা অবস্থান বা বাস্তব ডিভাইস ও রিলিজ থেকে নেওয়া সংখ্যা। এগুলো ইচ্ছে করে স্বয়ংক্রিয় যাচাই থেকে বাদ দেওয়া হয়েছে, এবং কোনো স্বয়ংক্রিয় প্রক্রিয়া এগুলো বদলাতে পারে না।',
    statusVerified: 'যাচাইকৃত',
    statusFailed: 'বর্তমানে পাস করছে না',
    statusStale: 'পুরোনো',
    statusUnverified: 'যাচাই হয়নি',
    statusSuperseded: 'প্রতিস্থাপিত',
    statusHuman: 'মানব-প্রমাণিত',
    verifiedAtLabel: 'যাচাইর তারিখ',
    viewEvidence: 'প্রমাণ দেখুন',
    viewRun: 'সিআই রান দেখুন',
    sourceLabel: 'সূত্র',
    scopeHeading: 'এই পৃষ্ঠা কী দাবি করে এবং কী করে না',
    scopeMachine:
      'যাচাইকৃত সারিগুলো প্রতিটি রিপোজিটরির নিজের নির্ণায়ক অবস্থা-ফাইল থেকে প্রস্তুত করা হয়; সেই রিপোজিটরির প্রধান শাখায় প্রতিবার পুশে এবং এখানেও প্রতিবার পুশে নতুন করে যাচাই করা হয়।',
    scopeHuman:
      'মানব-প্রমাণিত সারিগুলো ডিজাইন অনুসারে যন্ত্রচেকযোগ্য প্রমাণ বহন করে না। এগুলো নথিভুক্ত বাক্য হিসেবে গ্রহণ করুন; পেশাগত ব্যবহারের আগে মালিক পুনরায় যাচাই করেন।',
    scopeSource:
      'ক্যানোনিকাল দাবি-তালিকা মালিকের ব্যক্তিগত জ্ঞান-রিপোজিটরিতে থাকে। এই পৃষ্ঠা তার শুধু সর্বজনীন-নিরাপদ অংশ প্রকাশ করে: কোনো ব্যক্তিগত রিপোজিটরি, শনাক্তকরণ-সূত্র বা অভ্যন্তরীণ বিবরণ প্রকাশ করা হয় না।',
    footerNote:
      'স্বয়ংক্রিয়ভাবে তৈরি তথ্য। হাতে সম্পাদনা করবেন না। দাবির সংজ্ঞা ক্যানোনিকাল তালিকার মালিকানা, এবং প্রতিটি পৃষ্ঠার ফুটার একই তৈরি ফাইল পড়ে।',
    claimLabels: [
      { id: 'portfolio.source.public', label: 'পোর্টফোলিওর সূত্র-রিপোজিটরি সর্বজনীনভাবে উপলব্ধ।' },
      { id: 'portfolio.build.passing', label: 'পোর্টফোলিও সাইট সফলভাবে তৈরি হয় — বিষয়বস্তু, ডিজাইন ও ভাষা-শুদ্ধতার প্রতিটি স্তরসহ।' },
      { id: 'portfolio.export.passing', label: 'পোর্টফোলিওর স্ট্যাটিক এক্সপোর্ট তৈরি-পরবর্তী গ্রহণ-যাচাই পাস করে।' },
      { id: 'repo.lai.build.passing', label: 'লাই নিরন্তর-সংযুক্তির যাচাইয়ে পাসযুক্ত বিল্ড জানায়।' },
      { id: 'repo.adt.build.passing', label: 'এডিটি নিরন্তর-সংযুক্তির যাচাইয়ে পাসযুক্ত বিল্ড জানায়।' },
      { id: 'repo.ternux.build.passing', label: 'টার্নাক্স নিরন্তর-সংযুক্তির যাচাইয়ে পাসযুক্ত বিল্ড জানায়।' },
      { id: 'repo.ggen.build.passing', label: 'জিজেন নিরন্তর-সংযুক্তির যাচাইয়ে পাসযুক্ত বিল্ড জানায়।' },
      { id: 'repo.songjog.build.passing', label: 'সংযোগ নিরন্তর-সংযুক্তির যাচাইয়ে পাসযুক্ত বিল্ড জানায়।' },
      { id: 'repo.docdr.build.passing', label: 'ডকডক্টর নিরন্তর-সংযুক্তির যাচাইয়ে পাসযুক্ত বিল্ড জানায়।' },
      { id: 'repo.apiloop.build.passing', label: 'এপিলুপ নিরন্তর-সংযুক্তির যাচাইয়ে পাসযুক্ত বিল্ড জানায়।' },
      { id: 'repo.arms.build.passing', label: 'আর্মস নিরন্তর-সংযুক্তির যাচাইয়ে পাসযুক্ত বিল্ড জানায়।' },
      { id: 'repo.iqra-online-mart.build.passing', label: 'ইকরা অনলাইন মার্ট নিরন্তর-সংযুক্তির যাচাইয়ে পাসযুক্ত বিল্ড জানায়।' },
      { id: 'repo.datakhoj-android.build.passing', label: 'ডেটাখোজ অ্যান্ড্রয়েড নিরন্তর-সংযুক্তির যাচাইয়ে পাসযুক্ত বিল্ড জানায়।' },
      { id: 'repo.sobkichu.build.passing', label: 'সবকিচু নিরন্তর-সংযুক্তির যাচাইয়ে পাসযুক্ত বিল্ড জানায়।' },
      { id: 'showcase.live_sites.published', label: 'সরাসরি-সাইটের লিঙ্কের পেছনের রিপোজিটরিগুলো গিটহাব পেজস সাইট প্রকাশ করে।' },
      { id: 'positioning.software_practice', label: 'আমি ব্যবহারিক সফটওয়্যার তৈরি করি।' },
      { id: 'attested.ggen.unit_tests', label: 'জিজেনে ১৪৩টি খাঁটি ডার্ট ইউনিট পরীক্ষা রয়েছে।' },
      { id: 'attested.ggen.widget_tests', label: 'জিজেনে ৩৫৩টি উইজেট ও কন্ট্রোলার পরীক্ষা রয়েছে।' },
      { id: 'attested.lai.decode_throughput', label: 'লাই সংজ্ঞায়িত ডিভাইসে সেকেন্ডে ১২–২০ টোকেন ডিকোড করে।' },
      { id: 'attested.ternux.glmark2', label: 'টার্নাক্স গ্লমার্ক২-তে ১৪০ স্কোর পায় (ওপেনজিএল ৪.৬)।' },
      { id: 'attested.ternux.blender', label: 'টার্নাক্স জিংক, অ্যাড্রেনো ও টার্নিপে ব্লেন্ডার ৪.৩.২ চালায়।' },
      { id: 'attested.songjog.test_count', label: 'সংযোগে ৯৪টি পরীক্ষা রয়েছে।' },
      { id: 'attested.adt.apk_pipeline', label: 'এডিটি শুরু থেকে শেষ পর্যন্ত সাইন করা, ইনস্টলযোগ্য এআরএম ৬৪ এপিকে তৈরি করে।' },
      { id: 'attested.device_validation', label: 'নির্বাচিত প্রকল্প টার্মাক্স ও পি-রুট ডেবিয়ানে চলা একটি বাস্তব রেডমি টার্বো ৪ প্রো ডিভাইসে যাচাই করা হয়েছে।' },
    ],
};

export const verificationCopy: Record<Lang, VerificationCopy> = { en, bn };
