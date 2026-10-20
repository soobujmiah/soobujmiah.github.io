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
    window.dispatchEvent(new CustomEvent('portfolio:language-change', { detail: { language } }));
    if (persist) {
      try { localStorage.setItem('sobuj-portfolio-language', language); } catch (_) { /* optional preference */ }
    }
  }

  try {
    const savedLanguage = localStorage.getItem('sobuj-portfolio-language');
    if (savedLanguage === 'bn') setLanguage('bn', false);
  } catch (_) { /* content remains available without storage */ }

  if (toggle) toggle.addEventListener('click', () => setLanguage(language === 'en' ? 'bn' : 'en'));

  const projectButtons = Array.from(document.querySelectorAll('[data-project-select]'));
  const projectPanels = Array.from(document.querySelectorAll('.project-list .project'));
  const projectList = document.querySelector('.project-list');
  function selectProject(index, options = {}) {
    if (!projectButtons.length || !projectPanels.length) return;
    const selected = Math.max(0, Math.min(projectPanels.length - 1, index));
    const { focus = false, scroll = false } = options;
    projectButtons.forEach((button, i) => {
      const active = i === selected;
      button.classList.toggle('is-active', active);
      button.setAttribute('aria-pressed', String(active));
      if (active && focus) button.focus();
    });
    projectPanels.forEach((panel, i) => {
      panel.classList.toggle('is-active', i === selected);
      panel.classList.add('is-visible');
    });
    window.dispatchEvent(new CustomEvent('portfolio:project-change', { detail: { index: selected } }));
    if (scroll) projectPanels[selected]?.scrollIntoView({ behavior: motionPreference.matches ? 'auto' : 'smooth', block: 'center' });
  }
  const projectDialog = document.getElementById('project-dialog');
  const projectDialogContent = document.getElementById('project-dialog-content');
  document.querySelectorAll('[data-project-open]').forEach((button) => {
    button.addEventListener('click', () => {
      const panel = projectPanels[Number(button.dataset.projectOpen)];
      if (!panel || !projectDialog || !projectDialogContent) return;
      const report = panel.querySelector('.project-body').cloneNode(true);
      report.querySelector('[data-project-open]')?.remove();
      const heading = report.querySelector('h3');
      if (heading) heading.id = 'project-dialog-title';
      projectDialogContent.replaceChildren(report);
      if (typeof projectDialog.showModal === 'function') projectDialog.showModal();
      else projectDialog.setAttribute('open', '');
      setLanguage(language, false);
    });
  });
  projectButtons.forEach((button, index) => {
    button.addEventListener('click', () => selectProject(index, { scroll: true }));
    button.addEventListener('keydown', (event) => {
      if (event.key === 'ArrowRight' || event.key === 'ArrowDown') { event.preventDefault(); selectProject((index + 1) % projectButtons.length, { focus: true, scroll: true }); }
      if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') { event.preventDefault(); selectProject((index - 1 + projectButtons.length) % projectButtons.length, { focus: true, scroll: true }); }
    });
  });
  if (projectButtons.length) {
    if (projectList) projectList.classList.add('interactive');
    selectProject(0);
    if ('IntersectionObserver' in window) {
      const projectObserver = new IntersectionObserver((entries) => {
        const centered = entries.filter((entry) => entry.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (centered) selectProject(Number(centered.target.dataset.projectScene));
      }, { threshold: [0.1, 0.35, 0.6], rootMargin: '-22% 0px -22% 0px' });
      projectPanels.forEach((panel) => projectObserver.observe(panel));
    }
  }

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
