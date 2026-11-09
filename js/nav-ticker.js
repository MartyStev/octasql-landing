/**
 * Header nav ticker: the sections between the fixed "Architecture" and "MCP" links
 * cycle one at a time. Hover or focus opens the full list; the section in view
 * takes over the ticker while the page is scrolled through it.
 */
(function () {
  const TICK_MS = 2600;
  const ticker = document.getElementById('navTicker');
  const trigger = document.getElementById('navTickerTrigger');
  if (!ticker || !trigger) return;

  const slides = Array.from(ticker.querySelectorAll('.nav-ticker-slide'));
  const menuLinks = Array.from(ticker.querySelectorAll('.nav-ticker-link'));
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  let index = 0;
  let timer = null;
  let isOpen = false;
  let spiedIndex = -1;

  function show(next) {
    slides.forEach((slide, i) => {
      slide.classList.toggle('is-active', i === next);
      slide.classList.toggle('is-leaving', i === index && i !== next);
    });
    index = next;
    ticker.style.setProperty('--tick-ms', `${TICK_MS}ms`);
    ticker.classList.remove('is-ticking');
    // Restart the progress bar animation on the next frame.
    requestAnimationFrame(() => {
      if (shouldRun()) ticker.classList.add('is-ticking');
    });
  }

  function shouldRun() {
    return !reduceMotion && !isOpen && spiedIndex < 0 && !document.hidden;
  }

  function stop() {
    clearInterval(timer);
    timer = null;
    ticker.classList.remove('is-ticking');
  }

  function start() {
    stop();
    if (!shouldRun()) return;
    ticker.classList.add('is-ticking');
    timer = setInterval(() => show((index + 1) % slides.length), TICK_MS);
  }

  function setOpen(open) {
    isOpen = open;
    ticker.classList.toggle('is-open', open);
    trigger.setAttribute('aria-expanded', String(open));
    if (open) stop();
    else start();
  }

  ticker.addEventListener('mouseenter', () => setOpen(true));
  ticker.addEventListener('mouseleave', () => setOpen(false));
  ticker.addEventListener('focusin', () => setOpen(true));
  ticker.addEventListener('focusout', (event) => {
    if (!ticker.contains(event.relatedTarget)) setOpen(false);
  });
  // The visible slide is a shortcut to its section; the full list opens on hover or focus.
  trigger.addEventListener('click', () => {
    const section = document.querySelector(slides[index].dataset.target);
    if (section) section.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth' });
    setOpen(false);
    trigger.blur();
  });
  ticker.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      setOpen(false);
      trigger.focus();
    }
  });
  menuLinks.forEach((link) => link.addEventListener('click', () => {
    setOpen(false);
    link.blur();
  }));
  document.addEventListener('visibilitychange', start);

  // Scroll spy: highlight the section in view; a middle section takes over the ticker.
  const spyLinks = Array.from(document.querySelectorAll('[data-spy]'));
  const targets = new Map();
  slides.forEach((slide, i) => targets.set(slide.dataset.target, { slide: i }));
  spyLinks.forEach((link) => targets.set(link.dataset.spy, { link }));

  function markActive(id) {
    spyLinks.forEach((link) => link.classList.toggle('is-current', link.dataset.spy === id));
    const entry = targets.get(id);
    const nextSpied = entry && entry.slide !== undefined ? entry.slide : -1;
    ticker.classList.toggle('is-current', nextSpied >= 0);
    if (nextSpied === spiedIndex) return;
    spiedIndex = nextSpied;
    if (spiedIndex >= 0 && spiedIndex !== index) show(spiedIndex);
    start();
  }

  if ('IntersectionObserver' in window) {
    const visible = new Map();
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => visible.set(`#${entry.target.id}`, entry.isIntersecting ? entry.intersectionRatio : 0));
      let best = null;
      let bestRatio = 0;
      visible.forEach((ratio, id) => {
        if (ratio > bestRatio) {
          best = id;
          bestRatio = ratio;
        }
      });
      markActive(best);
    }, { rootMargin: '-35% 0px -55% 0px', threshold: [0, 0.01, 0.5, 1] });
    targets.forEach((_, id) => {
      const section = document.querySelector(id);
      if (section) observer.observe(section);
    });
  }

  show(0);
  start();
})();
