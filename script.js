(() => {
  const root = document.documentElement;
  const body = document.body;
  const toggle = document.getElementById('language-toggle');
  const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
  let language = 'en';

  function setLanguage(next, persist = true) {
    language = next === 'bn' ? 'bn' : 'en';
    root.lang = language;
    body.classList.toggle('lang-bn', language === 'bn');
    document.querySelectorAll('[data-en][data-bn]').forEach((node) => {
      node.textContent = node.dataset[language];
    });
    document.querySelectorAll('[data-aria-en][data-aria-bn]').forEach((node) => {
      node.setAttribute('aria-label', node.dataset[`aria${language === 'en' ? 'En' : 'Bn'}`]);
    });
    toggle.textContent = language === 'en' ? 'বাংলা' : 'English';
    toggle.setAttribute('aria-label', language === 'en' ? 'বাংলায় দেখুন' : 'View in English');
    document.title = language === 'en'
      ? 'Sobuj Miah — Field Notes to Systems'
      : 'সবুজ মিয়া — ফিল্ড নোট থেকে সিস্টেম';
    const description = language === 'en'
      ? 'Sobuj Miah — Independent Software & AI Systems Engineer. Android, ARM64 Linux, local AI and practical systems, built with evidence-first workflows.'
      : 'সবুজ মিয়া — স্বাধীন সফটওয়্যার ও এআই সিস্টেমস ইঞ্জিনিয়ার। প্রমাণভিত্তিক কর্মধারায় অ্যান্ড্রয়েড, এআরএম৬৪ লিনাক্স, স্থানীয় এআই ও ব্যবহারিক সিস্টেম তৈরি করি।';
    document.querySelector('meta[name="description"]').setAttribute('content', description);
    document.querySelector('meta[property="og:title"]').setAttribute('content', document.title);
    document.querySelector('meta[property="og:description"]').setAttribute('content', description);
    if (persist) {
      try { localStorage.setItem('sobuj-portfolio-language', language); } catch (_) { /* optional preference */ }
    }
  }

  try {
    const savedLanguage = localStorage.getItem('sobuj-portfolio-language');
    if (savedLanguage === 'bn') setLanguage('bn', false);
  } catch (_) { /* content remains available without storage */ }

  toggle.addEventListener('click', () => setLanguage(language === 'en' ? 'bn' : 'en'));

  if (!motionPreference.matches && 'IntersectionObserver' in window) {
    root.classList.add('js');
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.08, rootMargin: '0px 0px -24px 0px' });
    document.querySelectorAll('.reveal').forEach((element) => observer.observe(element));
  }
})();
