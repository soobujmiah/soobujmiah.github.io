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
    if (toggle) {
      toggle.textContent = language === 'en' ? 'বাংলা' : 'English';
      toggle.setAttribute('aria-label', language === 'en' ? 'বাংলায় দেখুন' : 'View in English');
    }
    document.title = body.dataset[language === 'en' ? 'titleEn' : 'titleBn'] || document.title;
    const description = body.dataset[language === 'en' ? 'descriptionEn' : 'descriptionBn'];
    const descriptionTag = document.querySelector('meta[name="description"]');
    const ogTitle = document.querySelector('meta[property="og:title"]');
    const ogDescription = document.querySelector('meta[property="og:description"]');
    if (description && descriptionTag) descriptionTag.setAttribute('content', description);
    if (ogTitle) ogTitle.setAttribute('content', document.title);
    if (description && ogDescription) ogDescription.setAttribute('content', description);
    if (persist) {
      try { localStorage.setItem('sobuj-portfolio-language', language); } catch (_) { /* optional preference */ }
    }
  }

  try {
    const savedLanguage = localStorage.getItem('sobuj-portfolio-language');
    if (savedLanguage === 'bn') setLanguage('bn', false);
  } catch (_) { /* content remains available without storage */ }

  if (toggle) toggle.addEventListener('click', () => setLanguage(language === 'en' ? 'bn' : 'en'));

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
