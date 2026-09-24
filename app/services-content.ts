/* ═══════════════════════════════════════════════════════════════
   SERVICES CONTENT — the service-intent layer's copy, bilingual.

   Kept in its own module (not inside content.ts) so the seven pager
   routes never download it: only /services/* imports this file. The
   same parity/purity contract applies — scripts/check-content.mjs
   loads this module too and holds it to the identical rules
   (EN pure, BN pure, identical keys, enumerated verbatim fields).
   Evidence links point only at the owner's public repositories or
   verified live sites. No customers, reviews, prices or offices.
   ═══════════════════════════════════════════════════════════════ */

import type { Lang } from './content';

export interface ServiceFaq {
  q: string;
  a: string;
}

/** One search intent per page. Every field renders; nothing here is
    a claim the page does not make. Evidence links point only at
    public repositories or verified live sites. */
export interface ServicePage {
  slug: string;
  title: string;
  short: string;
  seoTitle: string;
  seoDescription: string;
  forWho: string[];
  problems: string[];
  included: string[];
  notIncluded: string[];
  capabilities: string[];
  evidence: { name: string; note: string; url: string }[];
  faq: ServiceFaq[];
}

export interface ServicesContent {
  eyebrow: string;
  heading: string;
  intro: string;
  /** Pillar → service slugs; labels are prose, slugs are verbatim routes. */
  pillars: { label: string; slugs: string[] }[];
  hubSeoTitle: string;
  hubSeoDescription: string;
  labels: {
    hub: string;
    forWho: string;
    problems: string;
    included: string;
    notIncluded: string;
    capabilities: string;
    evidence: string;
    availability: string;
    contact: string;
    faq: string;
    related: string;
    backHome: string;
    allServices: string;
    viewSource: string;
    breadcrumbHome: string;
    whatsapp: string;
    telegram: string;
    contactPage: string;
  };
  availability: string;
  contactCta: string;
  pages: ServicePage[];
}


const en: ServicesContent = {
  eyebrow: 'Services',
  heading: 'Software, AI, and practical digital technology.',
  intro:
    'For individuals, small businesses and institutions: software and websites, computer and Android support, and digital or office work. Each service page explains its scope, limits and examples.',
  pillars: [
    { label: 'Software & web', slugs: ['web-development', 'software-development'] },
    { label: 'Computer, Android & business technology', slugs: ['computer-support', 'android-support', 'business-technology'] },
    { label: 'Design & office support', slugs: ['graphics-design', 'office-administration', 'data-entry'] },
  ],
  hubSeoTitle: 'Services — Software, Web, Computer Support & Digital Office Work',
  hubSeoDescription:
    'Services by Sobuj Miah: websites and custom software, computer and Android support, plus design, administration and data work. Based in Savar, Dhaka; remote worldwide.',
  labels: {
    hub: 'Services',
    forWho: 'Who it is for',
    problems: 'Problems it addresses',
    included: 'What is included',
    notIncluded: 'What is not included',
    capabilities: 'Tools & capabilities',
    evidence: 'Public evidence',
    availability: 'Availability',
    contact: 'How to get in touch',
    faq: 'Frequently asked questions',
    related: 'Related services',
    backHome: 'Back to portfolio',
    allServices: 'Browse all services',
    viewSource: 'View on GitHub',
    breadcrumbHome: 'Sobuj Miah',
    whatsapp: 'WhatsApp',
    telegram: 'Telegram',
    contactPage: 'Contact page',
  },
  availability: 'Based in Savar, Dhaka, Bangladesh · remote worldwide. Work is delivered remotely; on-site visits are not offered as a standard service.',
  contactCta: 'Direct contact is available on WhatsApp and Telegram; email also works, and the contact page lists every channel. Describe the problem, the desired outcome and the timeline if there is one; I will respond with the relevant questions and a practical next step.',
  pages: [
    {
      slug: 'web-development',
      title: 'Website Development',
      short: 'Fast, static-first websites for individuals and small businesses — built, deployed and kept working.',
      seoTitle: 'Website Development & Maintenance — Small-Business Websites',
      seoDescription:
        'Websites for small businesses and professionals: design, bilingual content, technical SEO and maintenance. Based in Dhaka, Bangladesh; remote worldwide.',
      forWho: [
        'Small businesses, shops, schools and institutions that need a clear, trustworthy web presence',
        'Individuals and professionals who need a portfolio or profile site',
        'Owners of an existing site that is slow, broken, outdated or invisible in search',
      ],
      problems: [
        'No website, or a template site that no longer reflects the business',
        'Slow pages, broken layouts on phones, missing HTTPS',
        'Missing page titles, descriptions, sitemap or structured data',
        'Content that exists only in English when customers read Bangla — or the reverse',
      ],
      included: [
        'Planning the pages around what visitors need to find',
        'Building the site (static-first: Next.js, plain HTML/CSS/JS, or Jekyll for documentation sites)',
        'Mobile-first, accessible layout; bilingual English/Bangla content when needed',
        'Technical SEO: titles, descriptions, canonical URLs, Open Graph cards, sitemap, robots, JSON-LD',
        'Deployment (GitHub Pages or your own hosting) and a written handover',
        'Ongoing maintenance: content updates, fixes, dependency and security updates',
      ],
      notIncluded: [
        'Paid advertising management or guaranteed search rankings',
        'Copywriting in languages other than English and Bangla',
        'Large e-commerce platforms with custom payment integration (discussed case by case)',
      ],
      capabilities: ['Next.js / React / TypeScript', 'Tailwind CSS', 'Jekyll & GitHub Pages', 'HTML / CSS / JavaScript', 'Technical SEO & structured data', 'GitHub Actions deployment'],
      evidence: [
        { name: 'soobujmiah.github.io', note: 'This portfolio — Next.js static export, fully bilingual, per-route metadata, build-time content gates', url: 'https://github.com/soobujmiah/soobujmiah.github.io' },
        { name: 'Ternux site', note: 'Bilingual Jekyll documentation site with sitemap, hreflang and structured data', url: 'https://soobujmiah.github.io/ternux/' },
        { name: 'ADT site', note: 'Project site with documentation hub and release evidence', url: 'https://soobujmiah.github.io/adt/' },
      ],
      faq: [
        { q: 'Do you build WordPress sites?', a: 'I maintain and repair existing WordPress sites. For new builds I generally recommend static-first sites: they are fast, simple to host and easier to maintain over time.' },
        { q: 'Can the site be in Bangla?', a: 'Yes — English, Bangla, or both with a proper language switch, as this portfolio does.' },
      ],
    },
    {
      slug: 'software-development',
      title: 'Custom Software Development',
      short: 'Purpose-built tools, Android apps and automation — when off-the-shelf software does not fit the job.',
      seoTitle: 'Custom Software & Android App Development — Tools and Automation',
      seoDescription:
        'Custom software, Android apps and workflow automation by Sobuj Miah. Kotlin, Flutter and local-first tools. Dhaka, Bangladesh; remote worldwide.',
      forWho: [
        'Small businesses that run on spreadsheets and chat messages and need one reliable tool instead',
        'Teams that need an internal utility, a data pipeline or an automated report',
        'Product owners who want a local-first Android application built carefully',
      ],
      problems: [
        'A repetitive manual process that should be a script or an app',
        'Data spread across several places that needs a single source of truth',
        'An Android application that needs to be validated on real devices, not only emulators',
        'Existing software without documentation or a maintainer',
      ],
      included: [
        'Requirements written down in plain language before any code',
        'Android applications in Kotlin or Flutter, command-line tools in Python or Shell, small web services',
        'Local-first and privacy-respecting defaults; explicit user consent for anything powerful',
        'Automated builds and tests on GitHub Actions; releases with checksums',
        'Documentation that lets someone else maintain the software',
      ],
      notIncluded: [
        'Software that requires collecting data without the user’s knowledge',
        'Claims of hardware acceleration or performance that have not been measured',
        'Large enterprise systems needing a full team',
      ],
      capabilities: ['Kotlin & Android SDK', 'Flutter / Dart', 'Python & Shell', 'C/C++ & JNI', 'SQLite', 'GitHub Actions CI', 'llama.cpp / GGUF (local AI)'],
      evidence: [
        { name: 'LAI', note: 'Bangla-first local AI and consent-driven Android automation runtime (Kotlin, C++)', url: 'https://github.com/soobujmiah/lai' },
        { name: 'GGEN', note: 'Android-first creative and document studio (Flutter/Dart), 380+ automated tests', url: 'https://github.com/soobujmiah/ggen' },
        { name: 'Songjog', note: 'Bangla-first business and institution operations app with local SQLite records', url: 'https://github.com/soobujmiah/songjog' },
        { name: 'ApiLoop', note: 'Supporting tooling repository', url: 'https://github.com/soobujmiah/apiloop' },
      ],
      faq: [
        { q: 'Can you add AI to my app?', a: 'Yes, where it adds value — including fully local, offline AI on the device. Where a simpler rule-based solution is the better fit, I will recommend that instead.' },
      ],
    },
    {
      slug: 'computer-support',
      title: 'Computer Setup & Troubleshooting',
      short: 'Windows and Linux setup, configuration and problem-solving — done remotely, explained clearly.',
      seoTitle: 'Computer Setup & Troubleshooting — Windows and Linux Support',
      seoDescription:
        'Remote help with Windows or Linux setup, software problems, backups and development environments. Based in Savar, Dhaka; available worldwide.',
      forWho: [
        'Home users and small offices with a computer that is slow, unstable or newly purchased',
        'People moving to Linux, or running Linux and Windows side by side',
        'Students and developers who need a working development environment',
      ],
      problems: [
        'Slow start-up, pop-ups, unwanted software, full disks',
        'Operating system installation, upgrades, drivers, dual boot',
        'Software that fails to install, update or open',
        'No backup, or a backup nobody has ever tested',
        'Setting up compilers, package managers, Git, SSH and editors',
      ],
      included: [
        'Remote diagnosis over screen sharing or step-by-step chat instructions',
        'Windows and Linux (Debian/Ubuntu family) installation, configuration and clean-up',
        'Software installation and configuration; browser, email and office tools',
        'Backup strategy set up and verified',
        'A short written note of what was changed and why',
      ],
      notIncluded: [
        'Physical hardware repair (screens, boards, soldering) — this is software and configuration support',
        'On-site visits as a standard service',
        'Circumventing software licences, passwords or activation',
      ],
      capabilities: ['Windows 10/11', 'Debian / Ubuntu Linux', 'Termux & PRoot environments', 'Shell scripting', 'Backup tooling', 'Developer toolchains'],
      evidence: [
        { name: 'Ternux', note: 'A complete Debian desktop with GPU route installed on Android — diagnostic, repair and benchmark tooling included', url: 'https://github.com/soobujmiah/ternux' },
        { name: 'ADT', note: 'Native ARM64 Android toolchain for Linux with a “doctor” command that pinpoints broken pieces', url: 'https://github.com/soobujmiah/adt' },
      ],
      faq: [
        { q: 'Can you fix a broken laptop screen?', a: 'No. Hardware repair is outside this service; I handle the software side — operating system, drivers, configuration, performance and data.' },
        { q: 'How does remote support work?', a: 'A screen-sharing session or a message thread with exact steps. You stay in control of your computer the whole time.' },
      ],
    },
    {
      slug: 'android-support',
      title: 'Android & Phone Software Support',
      short: 'Android configuration, software troubleshooting, ADB and device setup, and realistic performance tuning.',
      seoTitle: 'Android Support — Phone Setup, Software Troubleshooting & ADB',
      seoDescription:
        'Android setup and troubleshooting, ADB, wireless debugging and Termux configuration. Remote support from Savar, Dhaka, Bangladesh.',
      forWho: [
        'Anyone whose Android phone is slow, out of storage, misconfigured or unstable',
        'People who want a clean, private, well-organised phone without root',
        'Developers and advanced users who need ADB, wireless debugging, Termux or a Linux environment configured',
      ],
      problems: [
        'Storage full, battery draining, apps crashing or not updating',
        'Migrating to a new phone without losing data',
        'ADB not detecting the device; pairing and wireless debugging',
        'Setting up Termux, PRoot Debian or a full Linux desktop on the phone',
        'Understanding which permissions and background apps are really needed',
      ],
      included: [
        'Guided remote setup and clean-up (no root required)',
        'ADB and developer-options configuration; app installation and inspection via ADB',
        'Privacy-conscious defaults: permissions, backups, account hygiene',
        'Termux, PRoot and Linux-on-Android environments',
        'Plain-language explanation of what was changed',
      ],
      notIncluded: [
        'Screen, battery or board repair',
        'Unlocking devices without proof of ownership, bypassing FRP or activation locks, and warranty-voiding modifications',
        'Performance claims that have not been measured on the device',
      ],
      capabilities: ['ADB & fastboot (built from source for ARM64)', 'Android developer options', 'Shizuku & Accessibility (consent-based)', 'Termux / PRoot Debian', 'GGUF local models on-device'],
      evidence: [
        { name: 'ADT', note: 'Native ARM64 adb/fastboot and build-tools compiled from AOSP source, validated on a real device', url: 'https://github.com/soobujmiah/adt' },
        { name: 'LAI', note: 'Device-verified local AI on Android with consent-gated automation', url: 'https://github.com/soobujmiah/lai' },
        { name: 'Ternux', note: 'No-root Linux desktop on Android with measured GPU routes', url: 'https://github.com/soobujmiah/ternux' },
      ],
      faq: [
        { q: 'Do you root phones?', a: 'No. Everything I configure works without root, which keeps the warranty, banking applications and device security intact.' },
      ],
    },
    {
      slug: 'business-technology',
      title: 'Small-Business Technology Support',
      short: 'Practical technology for small businesses and institutions — from the first spreadsheet to a real workflow tool.',
      seoTitle: 'Small-Business Technology Support — Workflow Tools & Automation',
      seoDescription:
        'Technology support for small businesses: digital workflows, records, practical software and tool setup. Savar, Dhaka; remote worldwide.',
      forWho: [
        'Shops, agencies, schools, coaching centres and family businesses',
        'Owners who know their operations well but have no one responsible for the technology',
        'Institutions moving from paper and chat messages to digital records',
      ],
      problems: [
        'Records spread across notebooks, phones and messaging apps',
        'Daily reports that take hours to assemble by hand',
        'No clear system for invoices, registrations, attendance or inventory',
        'Software bought but never set up properly',
      ],
      included: [
        'A clear assessment of what the business needs — frequently less than expected',
        'Setting up and configuring the right tools (Google Workspace, Microsoft 365, spreadsheets, forms)',
        'Automating repetitive reporting; connecting the pieces that should talk to each other',
        'Simple custom software when nothing off-the-shelf fits (see Custom Software)',
        'Training notes so staff can keep it running',
      ],
      notIncluded: [
        'Accounting or legal advice',
        'Enterprise ERP roll-outs',
        'Practices that mislead customers, including fabricated reviews',
      ],
      capabilities: ['Google Workspace & Microsoft 365', 'Spreadsheet systems & automation', 'Bangla-first business software', 'SQLite-backed local records', 'Documentation & process design'],
      evidence: [
        { name: 'Songjog', note: 'Bangla-first business & institution operations app — fast daily entry, local records, auditable corrections', url: 'https://github.com/soobujmiah/songjog' },
        { name: 'DataKhoj', note: 'Data lookup tooling', url: 'https://github.com/soobujmiah/datakhoj' },
      ],
      faq: [
        { q: 'We are a very small business. Is this for us?', a: 'Yes. The first goal is usually to reduce friction with the tools already in place before introducing new software.' },
      ],
    },
    {
      slug: 'graphics-design',
      title: 'Graphics Design',
      short: 'Clean, practical digital graphics — social media posts, posters, banners and promotional materials for everyday use.',
      seoTitle: 'Graphics Design — Social Media Graphics, Posters & Promotional Materials',
      seoDescription:
        'Bangla and English social graphics, posters, banners and notices for small businesses and institutions. Dhaka, Bangladesh; remote worldwide.',
      forWho: [
        'Small businesses, schools and institutions that need regular, tidy visual materials',
        'Anyone who needs a poster, banner or announcement graphic done properly and quickly',
      ],
      problems: [
        'Announcements and offers posted as plain text or blurry photos',
        'Inconsistent fonts, colours and logos across posts',
        'Bangla text that renders badly in design tools',
      ],
      included: [
        'Social media graphics, posters, banners, notices, simple flyers and certificates',
        'Bangla and English typography handled correctly',
        'Consistent use of your existing logo and colours; simple reusable templates',
        'Export in the right sizes and formats for print or each platform',
      ],
      notIncluded: [
        'Brand identity systems, logo design from scratch, illustration or 3D work',
        'Video production (basic edits only, discussed case by case)',
      ],
      capabilities: ['Canva & GIMP', 'Inkscape (vector)', 'Bangla/English typography', 'Print and social export presets'],
      evidence: [
        { name: 'Experience', note: 'Promotional graphics and social media as part of the Office Administrator role at Rabeya Education Family (2025–present)', url: 'https://soobujmiah.github.io/experience/' },
        { name: 'GGEN', note: 'An Android-first creative and document studio in development (Flutter/Dart)', url: 'https://github.com/soobujmiah/ggen' },
      ],
      faq: [],
    },
    {
      slug: 'office-administration',
      title: 'Office Administration & Operations Support',
      short: 'Organised, digital-first administrative support backed by years of real office and site-operations experience.',
      seoTitle: 'Office Administration & Operations Support — Remote Administrative Services',
      seoDescription:
        'Remote office support with records, documents, registrations, reporting and digital workflows. Based in Savar, Dhaka, Bangladesh.',
      forWho: [
        'Small offices, schools and institutions without a dedicated administrator',
        'Business owners who need reliable back-office follow-through',
        'Teams that need their documents, records and routines put in order',
      ],
      problems: [
        'Documents that cannot be found when they are needed',
        'Registrations, records and correspondence handled inconsistently',
        'Reports assembled by hand from several sources every week',
        'No standard procedures, leaving operations dependent on individual memory',
      ],
      included: [
        'Document processing, digital filing systems and records organisation',
        'Registration, scheduling, correspondence and follow-up',
        'Structured reporting and simple dashboards',
        'Documented procedures so the office runs consistently',
        'Google Workspace / Microsoft Office set-up for the team',
      ],
      notIncluded: [
        'Legal, HR-compliance or accounting responsibility',
        'Physical reception or on-site presence as a standard service',
      ],
      capabilities: ['Microsoft Office & Google Workspace', 'Document management', 'Records & filing systems', 'Structured reporting', 'Bangla and English correspondence'],
      evidence: [
        { name: 'Experience', note: 'Office Administrator (Rabeya Education Family, 2025–present); Computer Operator; Coordinator and Progress Reporter on industrial sites in Saudi Arabia', url: 'https://soobujmiah.github.io/experience/' },
      ],
      faq: [],
    },
    {
      slug: 'data-entry',
      title: 'Data Entry & Data Work',
      short: 'Accurate data entry, clean-up and structuring — from paper and PDFs to spreadsheets and databases you can trust.',
      seoTitle: 'Data Entry & Data Work — Data Cleanup, Spreadsheets and Structured Data',
      seoDescription:
        'Data entry, cleanup and spreadsheet structuring from paper, PDFs or scans to usable records. Remote support from Savar, Dhaka, Bangladesh.',
      forWho: [
        'Businesses and institutions with paper records, PDFs or scans that need to become usable data',
        'Teams with messy spreadsheets: duplicates, inconsistent formats, missing fields',
        'Researchers and analysts who need data prepared before analysis',
      ],
      problems: [
        'Backlogs of forms, invoices or registers waiting to be typed in',
        'Spreadsheets with inconsistent spellings, dates and numbers',
        'Data in one format that another system needs in a different one',
        'Bangla text data that must be entered and stored correctly (Unicode)',
      ],
      included: [
        'Bulk data entry from paper, images and PDFs, with a verification pass',
        'Cleanup: de-duplication, normalisation, validation rules, consistent formats',
        'Format conversion (CSV, Excel, JSON, SQLite) and preparation for databases',
        'Scripted processing (Python) for large or repeated jobs — faster and more consistent than manual re-typing',
        'Confidential handling: your data stays in your accounts and systems wherever possible',
      ],
      notIncluded: [
        'Collecting data from sources you are not authorised to use; scraping restricted or personal data; anything that breaks a service’s terms or the law',
        'Statistical analysis or interpretation (data preparation only, unless agreed otherwise)',
      ],
      capabilities: ['Excel & Google Sheets', 'Python (pandas, CSV/JSON tooling)', 'SQLite', 'OCR-assisted digitisation', 'Bangla Unicode data'],
      evidence: [
        { name: 'Experience', note: 'Progress Reporter (daily progress data, digitisation, structured reporting) and Computer Operator roles', url: 'https://soobujmiah.github.io/experience/' },
        { name: 'DataKhoj', note: 'Data lookup and processing tooling', url: 'https://github.com/soobujmiah/datakhoj' },
      ],
      faq: [
        { q: 'Is my data safe?', a: 'Work is carried out within your own accounts and files wherever possible, and nothing is retained after handover unless you request it. I work only with data you are authorised to use.' },
      ],
    },
  ],
};

const bn: ServicesContent = {
  eyebrow: 'সেবাসমূহ',
  heading: 'সফটওয়্যার, এআই ও ব্যবহারিক ডিজিটাল প্রযুক্তি।',
  intro:
    'ব্যক্তি, ছোট ব্যবসা ও প্রতিষ্ঠানের জন্য সফটওয়্যার ও ওয়েবসাইট, কম্পিউটার ও অ্যান্ড্রয়েড সহায়তা, এবং ডিজিটাল বা অফিসের কাজ। প্রতিটি সেবার পাতায় কাজের পরিধি, সীমা ও উদাহরণ আছে।',
  pillars: [
    { label: 'সফটওয়্যার ও ওয়েব', slugs: ['web-development', 'software-development'] },
    { label: 'কম্পিউটার, অ্যান্ড্রয়েড ও ব্যবসায়িক প্রযুক্তি', slugs: ['computer-support', 'android-support', 'business-technology'] },
    { label: 'ডিজাইন ও অফিস সহায়তা', slugs: ['graphics-design', 'office-administration', 'data-entry'] },
  ],
  hubSeoTitle: 'সেবা — সফটওয়্যার, ওয়েব, কম্পিউটার সহায়তা ও ডিজিটাল অফিসের কাজ',
  hubSeoDescription:
    'সবুজ মিয়ার সেবা: ওয়েবসাইট ও কাস্টম সফটওয়্যার, কম্পিউটার ও অ্যান্ড্রয়েড সহায়তা, ডিজাইন, প্রশাসন ও ডেটার কাজ। সাভার, ঢাকা; বিশ্বব্যাপী রিমোট।',
  labels: {
    hub: 'সেবাসমূহ',
    forWho: 'কাদের জন্য',
    problems: 'যেসব সমস্যার সমাধান',
    included: 'যা অন্তর্ভুক্ত',
    notIncluded: 'যা অন্তর্ভুক্ত নয়',
    capabilities: 'টুল ও দক্ষতা',
    evidence: 'প্রকাশ্য প্রমাণ',
    availability: 'প্রাপ্যতা',
    contact: 'যোগাযোগের উপায়',
    faq: 'সচরাচর জিজ্ঞাসা',
    related: 'সম্পর্কিত সেবা',
    backHome: 'পোর্টফোলিওতে ফিরুন',
    allServices: 'সব সেবা দেখুন',
    viewSource: 'গিটহাবে দেখুন',
    breadcrumbHome: 'সবুজ মিয়া',
    whatsapp: 'হোয়াটসঅ্যাপ',
    telegram: 'টেলিগ্রাম',
    contactPage: 'যোগাযোগ পাতা',
  },
  availability: 'সাভার, ঢাকা, বাংলাদেশে অবস্থিত · বিশ্বব্যাপী রিমোট। কাজ রিমোটে সম্পন্ন হয়; সরেজমিন পরিদর্শন নিয়মিত সেবা হিসেবে দেওয়া হয় না।',
  contactCta: 'সরাসরি যোগাযোগের জন্য হোয়াটসঅ্যাপ ও টেলিগ্রাম রয়েছে; ইমেইলও কাজ করে, আর যোগাযোগ পাতায় সব মাধ্যমের তালিকা আছে। সমস্যাটি, কাঙ্ক্ষিত ফলাফল এবং সময়সীমা থাকলে সেটি লিখে পাঠান; আমি প্রাসঙ্গিক প্রশ্ন ও একটি বাস্তব পরবর্তী ধাপ নিয়ে উত্তর দেব।',
  pages: [
    {
      slug: 'web-development',
      title: 'ওয়েবসাইট তৈরি',
      short: 'ব্যক্তি ও ছোট ব্যবসার জন্য দ্রুত, স্ট্যাটিক-ফার্স্ট ওয়েবসাইট — তৈরি, ডিপ্লয় ও সচল রাখা।',
      seoTitle: 'ওয়েবসাইট তৈরি ও রক্ষণাবেক্ষণ — ছোট ব্যবসার ওয়েবসাইট',
      seoDescription:
        'ছোট ব্যবসা ও পেশাজীবীদের ওয়েবসাইট: ডিজাইন, দ্বিভাষিক কনটেন্ট, কারিগরি সার্চ অপটিমাইজেশন ও রক্ষণাবেক্ষণ। ঢাকা থেকে বিশ্বব্যাপী রিমোট।',
      forWho: [
        'ছোট ব্যবসা, দোকান, স্কুল ও প্রতিষ্ঠান যাদের একটি স্পষ্ট, বিশ্বাসযোগ্য ওয়েব উপস্থিতি দরকার',
        'ব্যক্তি ও পেশাজীবী যাদের পোর্টফোলিও বা প্রোফাইল সাইট দরকার',
        'যাদের বিদ্যমান সাইট ধীর, ভাঙা, পুরোনো বা সার্চে অদৃশ্য',
      ],
      problems: [
        'ওয়েবসাইট নেই, অথবা টেমপ্লেট সাইট যা আর ব্যবসাকে প্রতিফলিত করে না',
        'ধীর পেজ, ফোনে ভাঙা লেআউট, এইচটিটিপিএস নেই',
        'পেজের টাইটেল, বিবরণ, সাইটম্যাপ বা স্ট্রাকচার্ড ডেটা অনুপস্থিত',
        'গ্রাহক বাংলা পড়লেও কনটেন্ট শুধু ইংরেজিতে — বা উল্টোটা',
      ],
      included: [
        'দর্শক কী খুঁজবে তার ভিত্তিতে পেজ পরিকল্পনা',
        'সাইট তৈরি (স্ট্যাটিক-ফার্স্ট: নেক্সট.জেএস, সাধারণ এইচটিএমএল/সিএসএস/জেএস, বা ডকুমেন্টেশন সাইটের জন্য জেকিল)',
        'মোবাইল-ফার্স্ট, অ্যাক্সেসযোগ্য লেআউট; প্রয়োজনে ইংরেজি/বাংলা দ্বিভাষিক কনটেন্ট',
        'টেকনিক্যাল এসইও: টাইটেল, বিবরণ, ক্যানোনিক্যাল ইউআরএল, ওপেন গ্রাফ কার্ড, সাইটম্যাপ, রোবটস, জেসন-এলডি',
        'ডিপ্লয়মেন্ট (গিটহাব পেজেস বা আপনার হোস্টিং) ও লিখিত হস্তান্তর',
        'চলমান রক্ষণাবেক্ষণ: কনটেন্ট আপডেট, সমাধান, ডিপেন্ডেন্সি ও নিরাপত্তা আপডেট',
      ],
      notIncluded: [
        'পেইড বিজ্ঞাপন ব্যবস্থাপনা বা সার্চ র‍্যাঙ্কিংয়ের নিশ্চয়তা',
        'ইংরেজি ও বাংলা ছাড়া অন্য ভাষায় কপিরাইটিং',
        'কাস্টম পেমেন্ট ইন্টিগ্রেশনসহ বড় ই-কমার্স প্ল্যাটফর্ম (ক্ষেত্রবিশেষে আলোচনা সাপেক্ষ)',
      ],
      capabilities: ['নেক্সট.জেএস / রিঅ্যাক্ট / টাইপস্ক্রিপ্ট', 'টেইলউইন্ড সিএসএস', 'জেকিল ও গিটহাব পেজেস', 'এইচটিএমএল / সিএসএস / জাভাস্ক্রিপ্ট', 'টেকনিক্যাল এসইও ও স্ট্রাকচার্ড ডেটা', 'গিটহাব অ্যাকশনস ডিপ্লয়মেন্ট'],
      evidence: [
        { name: 'soobujmiah.github.io', note: 'এই পোর্টফোলিও — নেক্সট.জেএস স্ট্যাটিক এক্সপোর্ট, সম্পূর্ণ দ্বিভাষিক, রুটভিত্তিক মেটাডেটা, বিল্ড-টাইম কনটেন্ট গেট', url: 'https://github.com/soobujmiah/soobujmiah.github.io' },
        { name: 'Ternux site', note: 'সাইটম্যাপ, এইচরেফল্যাং ও স্ট্রাকচার্ড ডেটাসহ দ্বিভাষিক জেকিল ডকুমেন্টেশন সাইট', url: 'https://soobujmiah.github.io/ternux/' },
        { name: 'ADT site', note: 'ডকুমেন্টেশন হাব ও রিলিজ প্রমাণসহ প্রজেক্ট সাইট', url: 'https://soobujmiah.github.io/adt/' },
      ],
      faq: [
        { q: 'আপনি কি ওয়ার্ডপ্রেস সাইট বানান?', a: 'বিদ্যমান ওয়ার্ডপ্রেস সাইট রক্ষণাবেক্ষণ ও মেরামত করি। নতুন সাইটের জন্য সাধারণত স্ট্যাটিক-ফার্স্ট সাইটের পরামর্শ দিই: দ্রুত, হোস্ট করা সহজ, আর দীর্ঘমেয়াদে রক্ষণাবেক্ষণ সহজতর।' },
        { q: 'সাইট কি বাংলায় হতে পারে?', a: 'হ্যাঁ — ইংরেজি, বাংলা, বা এই পোর্টফোলিওর মতো যথাযথ ভাষা সুইচসহ দুটোই।' },
      ],
    },
    {
      slug: 'software-development',
      title: 'কাস্টম সফটওয়্যার তৈরি',
      short: 'উদ্দেশ্য-নির্মিত টুল, অ্যান্ড্রয়েড অ্যাপ ও অটোমেশন — যখন তৈরি সফটওয়্যার কাজের সাথে মেলে না।',
      seoTitle: 'কাস্টম সফটওয়্যার ও অ্যান্ড্রয়েড অ্যাপ তৈরি — টুল ও অটোমেশন',
      seoDescription:
        'কোটলিন ও ফ্লাটার দিয়ে কাস্টম সফটওয়্যার, অ্যান্ড্রয়েড অ্যাপ ও কর্মপ্রবাহের অটোমেশন। ঢাকা, বাংলাদেশ থেকে বিশ্বব্যাপী রিমোট।',
      forWho: [
        'যেসব ছোট ব্যবসা স্প্রেডশিট ও চ্যাট মেসেজে চলে এবং তার বদলে একটি নির্ভরযোগ্য টুল চায়',
        'যেসব টিমের একটি অভ্যন্তরীণ ইউটিলিটি, ডেটা পাইপলাইন বা স্বয়ংক্রিয় রিপোর্ট দরকার',
        'প্রোডাক্ট মালিক যারা যত্নসহকারে তৈরি লোকাল-ফার্স্ট অ্যান্ড্রয়েড অ্যাপ্লিকেশন চান',
      ],
      problems: [
        'একটি পুনরাবৃত্ত ম্যানুয়াল প্রক্রিয়া যা স্ক্রিপ্ট বা অ্যাপ হওয়া উচিত',
        'কয়েক জায়গায় ছড়িয়ে থাকা ডেটা যার একটি অভিন্ন উৎস দরকার',
        'একটি অ্যান্ড্রয়েড অ্যাপ্লিকেশন যা শুধু এমুলেটরে নয়, আসল ডিভাইসে যাচাই করা প্রয়োজন',
        'ডকুমেন্টেশন বা রক্ষণাবেক্ষণকারী ছাড়া বিদ্যমান সফটওয়্যার',
      ],
      included: [
        'কোড লেখার আগে সহজ ভাষায় প্রয়োজনীয়তা লিখে নেওয়া',
        'কোটলিন বা ফ্লাটারে অ্যান্ড্রয়েড অ্যাপ্লিকেশন, পাইথন বা শেলে কমান্ড-লাইন টুল, ছোট ওয়েব সার্ভিস',
        'লোকাল-ফার্স্ট ও গোপনীয়তা-সম্মানকারী ডিফল্ট; শক্তিশালী যেকোনো কিছুর জন্য স্পষ্ট ব্যবহারকারী সম্মতি',
        'গিটহাব অ্যাকশনসে স্বয়ংক্রিয় বিল্ড ও টেস্ট; চেকসামসহ রিলিজ',
        'এমন ডকুমেন্টেশন যাতে অন্য কেউ সফটওয়্যারটি রক্ষণাবেক্ষণ করতে পারে',
      ],
      notIncluded: [
        'ব্যবহারকারীর অজান্তে ডেটা সংগ্রহ করে এমন সফটওয়্যার',
        'পরিমাপ করা হয়নি এমন হার্ডওয়্যার অ্যাক্সিলারেশন বা পারফরম্যান্সের দাবি',
        'পূর্ণ টিম প্রয়োজন এমন বড় এন্টারপ্রাইজ সিস্টেম',
      ],
      capabilities: ['কোটলিন ও অ্যান্ড্রয়েড এসডিকে', 'ফ্লাটার / ডার্ট', 'পাইথন ও শেল', 'সি/সি++ ও জেএনআই', 'এসকিউলাইট', 'গিটহাব অ্যাকশনস সিআই', 'লামা.সিপিপি / জিজিইউএফ (লোকাল এআই)'],
      evidence: [
        { name: 'LAI', note: 'বাংলা-ফার্স্ট লোকাল এআই ও সম্মতিভিত্তিক অ্যান্ড্রয়েড অটোমেশন রানটাইম (কোটলিন, সি++)', url: 'https://github.com/soobujmiah/lai' },
        { name: 'GGEN', note: 'অ্যান্ড্রয়েড-ফার্স্ট ক্রিয়েটিভ ও ডকুমেন্ট স্টুডিও (ফ্লাটার/ডার্ট), ৩৮০+ স্বয়ংক্রিয় টেস্ট', url: 'https://github.com/soobujmiah/ggen' },
        { name: 'Songjog', note: 'লোকাল এসকিউলাইট রেকর্ডসহ বাংলা-ফার্স্ট ব্যবসা ও প্রতিষ্ঠান পরিচালনা অ্যাপ', url: 'https://github.com/soobujmiah/songjog' },
        { name: 'ApiLoop', note: 'সহায়ক টুলিং রিপোজিটরি', url: 'https://github.com/soobujmiah/apiloop' },
      ],
      faq: [
        { q: 'আমার অ্যাপে কি এআই যোগ করতে পারবেন?', a: 'হ্যাঁ, যেখানে এটি মূল্য যোগ করে — ডিভাইসেই সম্পূর্ণ লোকাল, অফলাইন এআইসহ। যেখানে সরল নিয়মভিত্তিক সমাধানই বেশি উপযুক্ত, সেখানে সেটিরই পরামর্শ দেব।' },
      ],
    },
    {
      slug: 'computer-support',
      title: 'কম্পিউটার সেটআপ ও সমস্যা সমাধান',
      short: 'উইন্ডোজ ও লিনাক্স সেটআপ, কনফিগারেশন ও সমস্যা সমাধান — রিমোটে, স্পষ্ট ব্যাখ্যাসহ।',
      seoTitle: 'কম্পিউটার সেটআপ ও সমস্যা সমাধান — উইন্ডোজ ও লিনাক্স সহায়তা',
      seoDescription:
        'উইন্ডোজ বা লিনাক্স সেটআপ, সফটওয়্যার সমস্যা, ব্যাকআপ ও ডেভেলপমেন্ট পরিবেশে রিমোট সহায়তা। সাভার, ঢাকা থেকে বিশ্বব্যাপী।',
      forWho: [
        'বাড়ির ব্যবহারকারী ও ছোট অফিস যাদের কম্পিউটার ধীর, অস্থিতিশীল বা নতুন কেনা',
        'যারা লিনাক্সে যাচ্ছেন, বা লিনাক্স ও উইন্ডোজ পাশাপাশি চালান',
        'ছাত্র ও ডেভেলপার যাদের একটি কার্যকর ডেভেলপমেন্ট এনভায়রনমেন্ট দরকার',
      ],
      problems: [
        'ধীর স্টার্ট-আপ, পপ-আপ, অবাঞ্ছিত সফটওয়্যার, ভরা ডিস্ক',
        'অপারেটিং সিস্টেম ইনস্টল, আপগ্রেড, ড্রাইভার, ডুয়াল বুট',
        'সফটওয়্যার ইনস্টল, আপডেট বা খুলছে না',
        'ব্যাকআপ নেই, বা এমন ব্যাকআপ যা কেউ কখনো পরীক্ষা করেনি',
        'কম্পাইলার, প্যাকেজ ম্যানেজার, গিট, এসএসএইচ ও এডিটর সেটআপ',
      ],
      included: [
        'স্ক্রিন শেয়ারিং বা ধাপে ধাপে চ্যাট নির্দেশনায় রিমোট ডায়াগনসিস',
        'উইন্ডোজ ও লিনাক্স (ডেবিয়ান/উবুন্টু পরিবার) ইনস্টল, কনফিগারেশন ও ক্লিন-আপ',
        'সফটওয়্যার ইনস্টল ও কনফিগারেশন; ব্রাউজার, ইমেইল ও অফিস টুল',
        'ব্যাকআপ কৌশল সেটআপ ও যাচাই',
        'কী পরিবর্তন করা হয়েছে ও কেন — সংক্ষিপ্ত লিখিত নোট',
      ],
      notIncluded: [
        'ফিজিক্যাল হার্ডওয়্যার মেরামত (স্ক্রিন, বোর্ড, সোল্ডারিং) — এটি সফটওয়্যার ও কনফিগারেশন সহায়তা',
        'নিয়মিত সেবা হিসেবে সরেজমিন পরিদর্শন',
        'সফটওয়্যার লাইসেন্স, পাসওয়ার্ড বা অ্যাক্টিভেশন বাইপাস',
      ],
      capabilities: ['উইন্ডোজ ১০/১১', 'ডেবিয়ান / উবুন্টু লিনাক্স', 'টার্মাক্স ও পিরুট এনভায়রনমেন্ট', 'শেল স্ক্রিপ্টিং', 'ব্যাকআপ টুলিং', 'ডেভেলপার টুলচেইন'],
      evidence: [
        { name: 'Ternux', note: 'অ্যান্ড্রয়েডে জিপিইউ রুটসহ সম্পূর্ণ ডেবিয়ান ডেস্কটপ — ডায়াগনস্টিক, মেরামত ও বেঞ্চমার্ক টুলিংসহ', url: 'https://github.com/soobujmiah/ternux' },
        { name: 'ADT', note: 'লিনাক্সের জন্য নেটিভ এআরএম৬৪ অ্যান্ড্রয়েড টুলচেইন — ভাঙা অংশ চিহ্নিত করার “ডক্টর” কমান্ডসহ', url: 'https://github.com/soobujmiah/adt' },
      ],
      faq: [
        { q: 'ভাঙা ল্যাপটপ স্ক্রিন ঠিক করতে পারবেন?', a: 'না। হার্ডওয়্যার মেরামত এই সেবার বাইরে; আমি সফটওয়্যারের দিকটি দেখি — অপারেটিং সিস্টেম, ড্রাইভার, কনফিগারেশন, পারফরম্যান্স ও ডেটা।' },
        { q: 'রিমোট সহায়তা কীভাবে কাজ করে?', a: 'স্ক্রিন-শেয়ারিং সেশন বা সঠিক ধাপসহ মেসেজ থ্রেড। পুরো সময় আপনার কম্পিউটারের নিয়ন্ত্রণ আপনার হাতেই থাকে।' },
      ],
    },
    {
      slug: 'android-support',
      title: 'অ্যান্ড্রয়েড ও ফোন সফটওয়্যার সহায়তা',
      short: 'অ্যান্ড্রয়েড কনফিগারেশন, সফটওয়্যার সমস্যা সমাধান, এডিবি ও ডিভাইস সেটআপ, আর বাস্তবসম্মত পারফরম্যান্স টিউনিং।',
      seoTitle: 'অ্যান্ড্রয়েড সহায়তা — ফোন সেটআপ, সফটওয়্যার সমস্যা সমাধান ও এডিবি',
      seoDescription:
        'অ্যান্ড্রয়েড সেটআপ ও সমস্যা সমাধান, এডিবি, ওয়্যারলেস ডিবাগিং এবং টার্মাক্স কনফিগারেশন। সাভার, ঢাকা থেকে রিমোট সহায়তা।',
      forWho: [
        'যার অ্যান্ড্রয়েড ফোন ধীর, স্টোরেজ ভরা, ভুল কনফিগার করা বা অস্থিতিশীল',
        'যারা রুট ছাড়াই পরিষ্কার, গোপনীয়তা-রক্ষাকারী, সুসংগঠিত ফোন চান',
        'ডেভেলপার ও অগ্রসর ব্যবহারকারী যাদের এডিবি, ওয়্যারলেস ডিবাগিং, টার্মাক্স বা লিনাক্স এনভায়রনমেন্ট কনফিগার করা দরকার',
      ],
      problems: [
        'স্টোরেজ ভরা, ব্যাটারি দ্রুত শেষ, অ্যাপ ক্র্যাশ বা আপডেট হচ্ছে না',
        'ডেটা না হারিয়ে নতুন ফোনে স্থানান্তর',
        'এডিবি ডিভাইস শনাক্ত করছে না; পেয়ারিং ও ওয়্যারলেস ডিবাগিং',
        'ফোনে টার্মাক্স, পিরুট ডেবিয়ান বা পূর্ণ লিনাক্স ডেস্কটপ সেটআপ',
        'কোন পারমিশন ও ব্যাকগ্রাউন্ড অ্যাপ সত্যিই দরকার তা বোঝা',
      ],
      included: [
        'নির্দেশিত রিমোট সেটআপ ও ক্লিন-আপ (রুট লাগে না)',
        'এডিবি ও ডেভেলপার-অপশন কনফিগারেশন; এডিবির মাধ্যমে অ্যাপ ইনস্টল ও পরিদর্শন',
        'গোপনীয়তা-সচেতন ডিফল্ট: পারমিশন, ব্যাকআপ, অ্যাকাউন্ট পরিচ্ছন্নতা',
        'টার্মাক্স, পিরুট ও অ্যান্ড্রয়েডে লিনাক্স এনভায়রনমেন্ট',
        'কী পরিবর্তন করা হয়েছে তার সহজ ভাষায় ব্যাখ্যা',
      ],
      notIncluded: [
        'স্ক্রিন, ব্যাটারি বা বোর্ড মেরামত',
        'মালিকানার প্রমাণ ছাড়া ডিভাইস আনলক, এফআরপি বা অ্যাক্টিভেশন লক বাইপাস, এবং ওয়ারেন্টি-বাতিলকারী পরিবর্তন',
        'ডিভাইসে পরিমাপ করা হয়নি এমন পারফরম্যান্সের দাবি',
      ],
      capabilities: ['এডিবি ও ফাস্টবুট (এআরএম৬৪-এর জন্য সোর্স থেকে বিল্ড)', 'অ্যান্ড্রয়েড ডেভেলপার অপশন', 'শিজুকু ও অ্যাক্সেসিবিলিটি (সম্মতিভিত্তিক)', 'টার্মাক্স / পিরুট ডেবিয়ান', 'ডিভাইসে জিজিইউএফ লোকাল মডেল'],
      evidence: [
        { name: 'ADT', note: 'এওএসপি সোর্স থেকে কম্পাইল করা নেটিভ এআরএম৬৪ এডিবি/ফাস্টবুট ও বিল্ড-টুলস, আসল ডিভাইসে যাচাইকৃত', url: 'https://github.com/soobujmiah/adt' },
        { name: 'LAI', note: 'সম্মতিভিত্তিক অটোমেশনসহ অ্যান্ড্রয়েডে ডিভাইস-যাচাইকৃত লোকাল এআই', url: 'https://github.com/soobujmiah/lai' },
        { name: 'Ternux', note: 'পরিমাপকৃত জিপিইউ রুটসহ অ্যান্ড্রয়েডে রুট-ছাড়া লিনাক্স ডেস্কটপ', url: 'https://github.com/soobujmiah/ternux' },
      ],
      faq: [
        { q: 'আপনি কি ফোন রুট করেন?', a: 'না। আমি যা কনফিগার করি সবই রুট ছাড়া কাজ করে, ফলে ওয়ারেন্টি, ব্যাংকিং অ্যাপ্লিকেশন ও ডিভাইসের নিরাপত্তা অক্ষত থাকে।' },
      ],
    },
    {
      slug: 'business-technology',
      title: 'ছোট ব্যবসার প্রযুক্তি সহায়তা',
      short: 'ছোট ব্যবসা ও প্রতিষ্ঠানের জন্য ব্যবহারিক প্রযুক্তি — প্রথম স্প্রেডশিট থেকে আসল ওয়ার্কফ্লো টুল পর্যন্ত।',
      seoTitle: 'ছোট ব্যবসার প্রযুক্তি সহায়তা — ওয়ার্কফ্লো টুল ও অটোমেশন',
      seoDescription:
        'ছোট ব্যবসার ডিজিটাল কর্মপ্রবাহ, রেকর্ড, ব্যবহারিক সফটওয়্যার ও টুল সেটআপে প্রযুক্তি সহায়তা। সাভার, ঢাকা থেকে বিশ্বব্যাপী রিমোট।',
      forWho: [
        'দোকান, এজেন্সি, স্কুল, কোচিং সেন্টার ও পারিবারিক ব্যবসা',
        'মালিক যারা নিজেদের কার্যক্রম ভালো জানেন, কিন্তু প্রযুক্তির দায়িত্বে কেউ নেই',
        'কাগজ ও চ্যাট মেসেজ থেকে ডিজিটাল রেকর্ডে যাওয়া প্রতিষ্ঠান',
      ],
      problems: [
        'নোটবুক, ফোন ও মেসেজিং অ্যাপে ছড়িয়ে থাকা রেকর্ড',
        'হাতে জোড়া লাগাতে ঘণ্টার পর ঘণ্টা লাগে এমন দৈনিক রিপোর্ট',
        'ইনভয়েস, রেজিস্ট্রেশন, উপস্থিতি বা ইনভেন্টরির স্পষ্ট ব্যবস্থা নেই',
        'কেনা হয়েছে কিন্তু ঠিকমতো সেটআপ হয়নি এমন সফটওয়্যার',
      ],
      included: [
        'ব্যবসার প্রকৃত প্রয়োজনের স্পষ্ট মূল্যায়ন — প্রায়ই প্রত্যাশার চেয়ে কম',
        'সঠিক টুল সেটআপ ও কনফিগারেশন (গুগল ওয়ার্কস্পেস, মাইক্রোসফট ৩৬৫, স্প্রেডশিট, ফর্ম)',
        'পুনরাবৃত্ত রিপোর্টিং স্বয়ংক্রিয়করণ; যেসব অংশের পরস্পর কথা বলা উচিত সেগুলো সংযুক্ত করা',
        'তৈরি কিছু না মিললে সহজ কাস্টম সফটওয়্যার (কাস্টম সফটওয়্যার দেখুন)',
        'প্রশিক্ষণ নোট যাতে কর্মীরা নিজেরাই চালিয়ে নিতে পারেন',
      ],
      notIncluded: [
        'হিসাবরক্ষণ বা আইনি পরামর্শ',
        'এন্টারপ্রাইজ ইআরপি রোল-আউট',
        'গ্রাহককে বিভ্রান্ত করে এমন চর্চা, ভুয়া রিভিউসহ',
      ],
      capabilities: ['গুগল ওয়ার্কস্পেস ও মাইক্রোসফট ৩৬৫', 'স্প্রেডশিট সিস্টেম ও অটোমেশন', 'বাংলা-ফার্স্ট ব্যবসায়িক সফটওয়্যার', 'এসকিউলাইট-ভিত্তিক লোকাল রেকর্ড', 'ডকুমেন্টেশন ও প্রক্রিয়া নকশা'],
      evidence: [
        { name: 'Songjog', note: 'বাংলা-ফার্স্ট ব্যবসা ও প্রতিষ্ঠান পরিচালনা অ্যাপ — দ্রুত দৈনিক এন্ট্রি, লোকাল রেকর্ড, নিরীক্ষাযোগ্য সংশোধন', url: 'https://github.com/soobujmiah/songjog' },
        { name: 'DataKhoj', note: 'ডেটা অনুসন্ধান টুলিং', url: 'https://github.com/soobujmiah/datakhoj' },
      ],
      faq: [
        { q: 'আমরা খুবই ছোট ব্যবসা। এটা কি আমাদের জন্য?', a: 'হ্যাঁ। নতুন সফটওয়্যার আনার আগে সাধারণত প্রথম লক্ষ্য থাকে বিদ্যমান টুল দিয়েই ঝামেলা কমানো।' },
      ],
    },
    {
      slug: 'graphics-design',
      title: 'গ্রাফিক্স ডিজাইন',
      short: 'পরিচ্ছন্ন, ব্যবহারিক ডিজিটাল গ্রাফিক্স — দৈনন্দিন ব্যবহারের জন্য সোশ্যাল মিডিয়া পোস্ট, পোস্টার, ব্যানার ও প্রচারসামগ্রী।',
      seoTitle: 'গ্রাফিক্স ডিজাইন — সোশ্যাল মিডিয়া গ্রাফিক্স, পোস্টার ও প্রচারসামগ্রী',
      seoDescription:
        'ছোট ব্যবসা ও প্রতিষ্ঠানের জন্য বাংলা ও ইংরেজি সোশ্যাল গ্রাফিক্স, পোস্টার, ব্যানার ও নোটিশ। ঢাকা থেকে বিশ্বব্যাপী রিমোট।',
      forWho: [
        'ছোট ব্যবসা, স্কুল ও প্রতিষ্ঠান যাদের নিয়মিত, পরিপাটি ভিজ্যুয়াল সামগ্রী দরকার',
        'যার একটি পোস্টার, ব্যানার বা ঘোষণা গ্রাফিক ঠিকমতো ও দ্রুত দরকার',
      ],
      problems: [
        'সাধারণ টেক্সট বা ঝাপসা ছবি হিসেবে পোস্ট করা ঘোষণা ও অফার',
        'পোস্টজুড়ে অসামঞ্জস্যপূর্ণ ফন্ট, রং ও লোগো',
        'ডিজাইন টুলে খারাপভাবে রেন্ডার হওয়া বাংলা টেক্সট',
      ],
      included: [
        'সোশ্যাল মিডিয়া গ্রাফিক্স, পোস্টার, ব্যানার, নোটিশ, সাধারণ ফ্লায়ার ও সার্টিফিকেট',
        'বাংলা ও ইংরেজি টাইপোগ্রাফি সঠিকভাবে সামলানো',
        'আপনার বিদ্যমান লোগো ও রঙের সামঞ্জস্যপূর্ণ ব্যবহার; সহজ পুনর্ব্যবহারযোগ্য টেমপ্লেট',
        'প্রিন্ট বা প্রতিটি প্ল্যাটফর্মের জন্য সঠিক আকার ও ফরম্যাটে এক্সপোর্ট',
      ],
      notIncluded: [
        'ব্র্যান্ড আইডেন্টিটি সিস্টেম, শূন্য থেকে লোগো ডিজাইন, ইলাস্ট্রেশন বা থ্রিডি কাজ',
        'ভিডিও প্রোডাকশন (শুধু সাধারণ এডিট, ক্ষেত্রবিশেষে আলোচনা সাপেক্ষ)',
      ],
      capabilities: ['ক্যানভা ও গিম্প', 'ইঙ্কস্কেপ (ভেক্টর)', 'বাংলা/ইংরেজি টাইপোগ্রাফি', 'প্রিন্ট ও সোশ্যাল এক্সপোর্ট প্রিসেট'],
      evidence: [
        { name: 'Experience', note: 'রাবেয়া এডুকেশন ফ্যামিলিতে অফিস প্রশাসকের ভূমিকার অংশ হিসেবে প্রচার গ্রাফিক্স ও সোশ্যাল মিডিয়া (২০২৫–বর্তমান)', url: 'https://soobujmiah.github.io/experience/' },
        { name: 'GGEN', note: 'নির্মাণাধীন একটি অ্যান্ড্রয়েড-ফার্স্ট ক্রিয়েটিভ ও ডকুমেন্ট স্টুডিও (ফ্লাটার/ডার্ট)', url: 'https://github.com/soobujmiah/ggen' },
      ],
      faq: [],
    },
    {
      slug: 'office-administration',
      title: 'অফিস প্রশাসন ও পরিচালনা সহায়তা',
      short: 'বছরের পর বছরের বাস্তব অফিস ও সাইট-পরিচালনার অভিজ্ঞতায় সমর্থিত সুসংগঠিত, ডিজিটাল-প্রথম প্রশাসনিক সহায়তা।',
      seoTitle: 'অফিস প্রশাসন ও পরিচালনা সহায়তা — রিমোট প্রশাসনিক সেবা',
      seoDescription:
        'রেকর্ড, নথি, নিবন্ধন, রিপোর্টিং ও ডিজিটাল কর্মপ্রবাহে রিমোট অফিস সহায়তা। সাভার, ঢাকা থেকে বিশ্বব্যাপী কাজ।',
      forWho: [
        'নিবেদিত প্রশাসক ছাড়া ছোট অফিস, স্কুল ও প্রতিষ্ঠান',
        'ব্যবসার মালিক যাদের নির্ভরযোগ্য ব্যাক-অফিস ফলো-আপ দরকার',
        'যেসব টিমের নথি, রেকর্ড ও রুটিন গুছিয়ে দেওয়া দরকার',
      ],
      problems: [
        'দরকারের সময় খুঁজে পাওয়া যায় না এমন ডকুমেন্ট',
        'অসামঞ্জস্যপূর্ণভাবে সামলানো রেজিস্ট্রেশন, রেকর্ড ও চিঠিপত্র',
        'প্রতি সপ্তাহে কয়েকটি উৎস থেকে হাতে জোড়া লাগানো রিপোর্ট',
        'কোনো মানক প্রক্রিয়া নেই, ফলে কার্যক্রম ব্যক্তিগত স্মৃতির ওপর নির্ভরশীল',
      ],
      included: [
        'ডকুমেন্ট প্রক্রিয়াকরণ, ডিজিটাল ফাইলিং সিস্টেম ও রেকর্ড সংগঠন',
        'রেজিস্ট্রেশন, সময়সূচি, চিঠিপত্র ও ফলো-আপ',
        'কাঠামোবদ্ধ রিপোর্টিং ও সহজ ড্যাশবোর্ড',
        'লিখিত প্রক্রিয়া, যাতে অফিস ধারাবাহিকভাবে চলে',
        'টিমের জন্য গুগল ওয়ার্কস্পেস / মাইক্রোসফট অফিস সেটআপ',
      ],
      notIncluded: [
        'আইনি, এইচআর-কমপ্লায়েন্স বা হিসাবরক্ষণের দায়িত্ব',
        'নিয়মিত সেবা হিসেবে ফিজিক্যাল রিসেপশন বা সরেজমিন উপস্থিতি',
      ],
      capabilities: ['মাইক্রোসফট অফিস ও গুগল ওয়ার্কস্পেস', 'ডকুমেন্ট ব্যবস্থাপনা', 'রেকর্ড ও ফাইলিং সিস্টেম', 'কাঠামোবদ্ধ রিপোর্টিং', 'বাংলা ও ইংরেজি চিঠিপত্র'],
      evidence: [
        { name: 'Experience', note: 'অফিস প্রশাসক (রাবেয়া এডুকেশন ফ্যামিলি, ২০২৫–বর্তমান); কম্পিউটার অপারেটর; সৌদি আরবে শিল্প সাইটে সমন্বয়ক ও অগ্রগতি প্রতিবেদক', url: 'https://soobujmiah.github.io/experience/' },
      ],
      faq: [],
    },
    {
      slug: 'data-entry',
      title: 'ডেটা এন্ট্রি ও ডেটা প্রক্রিয়াকরণ',
      short: 'নির্ভুল ডেটা এন্ট্রি, পরিষ্কারকরণ ও কাঠামোবদ্ধকরণ — কাগজ ও পিডিএফ থেকে বিশ্বাসযোগ্য স্প্রেডশিট ও ডেটাবেজ পর্যন্ত।',
      seoTitle: 'ডেটা এন্ট্রি ও ডেটা প্রক্রিয়াকরণ — ক্লিনআপ, স্প্রেডশিট ও কাঠামোবদ্ধ ডেটা',
      seoDescription:
        'কাগজ, পিডিএফ বা স্ক্যান থেকে ডেটা এন্ট্রি, পরিষ্কার ও স্প্রেডশিট সাজানো। সাভার, ঢাকা থেকে বিশ্বব্যাপী রিমোট সহায়তা।',
      forWho: [
        'ব্যবসা ও প্রতিষ্ঠান যাদের কাগজের রেকর্ড, পিডিএফ বা স্ক্যান ব্যবহারযোগ্য ডেটায় পরিণত করা দরকার',
        'অগোছালো স্প্রেডশিটওয়ালা টিম: ডুপ্লিকেট, অসামঞ্জস্যপূর্ণ ফরম্যাট, অনুপস্থিত ফিল্ড',
        'গবেষক ও বিশ্লেষক যাদের বিশ্লেষণের আগে ডেটা প্রস্তুত করা দরকার',
      ],
      problems: [
        'টাইপ করার অপেক্ষায় থাকা ফর্ম, ইনভয়েস বা রেজিস্টারের স্তূপ',
        'অসামঞ্জস্যপূর্ণ বানান, তারিখ ও সংখ্যাসহ স্প্রেডশিট',
        'এক ফরম্যাটের ডেটা যা অন্য সিস্টেমে ভিন্ন ফরম্যাটে দরকার',
        'বাংলা টেক্সট ডেটা যা সঠিকভাবে (ইউনিকোডে) এন্ট্রি ও সংরক্ষণ করতে হবে',
      ],
      included: [
        'কাগজ, ছবি ও পিডিএফ থেকে বাল্ক ডেটা এন্ট্রি, যাচাই পাসসহ',
        'ক্লিনআপ: ডুপ্লিকেট অপসারণ, স্বাভাবিকীকরণ, যাচাই নিয়ম, সামঞ্জস্যপূর্ণ ফরম্যাট',
        'ফরম্যাট রূপান্তর (সিএসভি, এক্সেল, জেসন, এসকিউলাইট) ও ডেটাবেজের জন্য প্রস্তুতি',
        'বড় বা পুনরাবৃত্ত কাজের জন্য স্ক্রিপ্টেড প্রক্রিয়াকরণ (পাইথন) — হাতে পুনরায় টাইপের চেয়ে দ্রুত ও সামঞ্জস্যপূর্ণ',
        'গোপনীয় হ্যান্ডলিং: যতটা সম্ভব আপনার ডেটা আপনার অ্যাকাউন্ট ও সিস্টেমেই থাকে',
      ],
      notIncluded: [
        'আপনার ব্যবহারের অনুমতি নেই এমন উৎস থেকে ডেটা সংগ্রহ; সীমাবদ্ধ বা ব্যক্তিগত ডেটা স্ক্র্যাপিং; কোনো সেবার শর্ত বা আইন ভঙ্গ করে এমন কিছু',
        'পরিসংখ্যানগত বিশ্লেষণ বা ব্যাখ্যা (অন্যথায় সম্মত না হলে শুধু ডেটা প্রস্তুতি)',
      ],
      capabilities: ['এক্সেল ও গুগল শিটস', 'পাইথন (পান্ডাস, সিএসভি/জেসন টুলিং)', 'এসকিউলাইট', 'ওসিআর-সহায়িত ডিজিটাইজেশন', 'বাংলা ইউনিকোড ডেটা'],
      evidence: [
        { name: 'Experience', note: 'অগ্রগতি প্রতিবেদক (দৈনিক অগ্রগতি ডেটা, ডিজিটাইজেশন, কাঠামোবদ্ধ রিপোর্টিং) ও কম্পিউটার অপারেটর ভূমিকা', url: 'https://soobujmiah.github.io/experience/' },
        { name: 'DataKhoj', note: 'ডেটা অনুসন্ধান ও প্রক্রিয়াকরণ টুলিং', url: 'https://github.com/soobujmiah/datakhoj' },
      ],
      faq: [
        { q: 'আমার ডেটা কি নিরাপদ?', a: 'যতটা সম্ভব আপনার নিজের অ্যাকাউন্ট ও ফাইলের ভেতরেই কাজ করা হয়, এবং আপনি না চাইলে হস্তান্তরের পর কিছু সংরক্ষণ করা হয় না। আমি শুধু সেই ডেটা নিয়েই কাজ করি যা ব্যবহারের অনুমতি আপনার আছে।' },
      ],
    },
  ],
};

export const servicesContent: Record<Lang, ServicesContent> = { en, bn };
