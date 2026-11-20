/* =========================================================================
   Дебют юного программиста 2026 — клиентские скрипты
   - бургер-меню
   - FAQ-аккордеоны
   - sticky-shadow по скроллу
   - IntersectionObserver-анимации появления
   - плавный скролл к якорям с учётом смещения шапки
   - панель «Версия для слабовидящих»

   ВАЖНО: состояние версии для слабовидящих хранится только в JS
   (in-memory). НЕ используется localStorage / sessionStorage —
   так требует среда, в которой может тестироваться артефакт.

   TODO (для продакшена на debutprog.ru): заменить in-memory state
   на cookies или localStorage, чтобы настройки переживали
   перезагрузку страницы. Для этого:
   1) при загрузке — прочитать сохранённое состояние и вызвать applyState();
   2) при изменении любой настройки — сохранять обновлённый state;
   3) cookies предпочтительны (работают и без JS-доступа к storage).
   ========================================================================= */

(function() {
  'use strict';

  // ===== Sticky header shadow on scroll =====
  const header = document.querySelector('.site-header');
  if (header) {
    const onScroll = () => {
      if (window.scrollY > 4) {
        header.classList.add('is-scrolled');
      } else {
        header.classList.remove('is-scrolled');
      }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  // ===== Burger menu =====
  const burger = document.querySelector('.burger');
  const mobileNav = document.querySelector('.mobile-nav');
  if (burger && mobileNav) {
    const openNav = () => {
      burger.setAttribute('aria-expanded', 'true');
      mobileNav.classList.add('is-open');
      document.body.style.overflow = 'hidden';
    };
    const closeNav = () => {
      burger.setAttribute('aria-expanded', 'false');
      mobileNav.classList.remove('is-open');
      document.body.style.overflow = '';
    };
    burger.addEventListener('click', () => {
      const isOpen = burger.getAttribute('aria-expanded') === 'true';
      if (isOpen) closeNav(); else openNav();
    });
    // Закрывать при клике на пункт меню
    mobileNav.querySelectorAll('a').forEach(a => {
      a.addEventListener('click', closeNav);
    });
    // Esc закрывает
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && burger.getAttribute('aria-expanded') === 'true') {
        closeNav();
        burger.focus();
      }
    });
  }

  // ===== Smooth scroll with header offset =====
  document.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener('click', (e) => {
      const href = link.getAttribute('href');
      if (!href || href === '#') return;
      const target = document.querySelector(href);
      if (!target) return;
      e.preventDefault();
      const headerOffset = header ? header.offsetHeight + 16 : 0;
      const targetPosition = target.getBoundingClientRect().top + window.scrollY - headerOffset;
      window.scrollTo({ top: targetPosition, behavior: 'smooth' });
      // Move focus for accessibility
      target.setAttribute('tabindex', '-1');
      target.focus({ preventScroll: true });
    });
  });

  // ===== FAQ accordions =====
  document.querySelectorAll('.faq-item').forEach(item => {
    const button = item.querySelector('.faq-question');
    const answer = item.querySelector('.faq-answer');
    if (!button || !answer) return;
    button.addEventListener('click', () => {
      const isOpen = item.classList.toggle('is-open');
      button.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    });
  });

  // ===== Scroll reveal =====
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!reduceMotion && 'IntersectionObserver' in window) {
    const reveals = document.querySelectorAll('.reveal');
    const io = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    reveals.forEach(r => io.observe(r));
  } else {
    document.querySelectorAll('.reveal').forEach(r => r.classList.add('is-visible'));
  }

  // ===== A11y panel (Версия для слабовидящих) =====
  // In-memory state. См. TODO в начале файла.
  const a11yState = {
    fontScale: 1,        // 1 | 1.25 | 1.5
    theme: 'default',    // default | bw | wb | beige
    images: true,        // декоративные картинки
    letterSpacing: 'normal', // normal | medium | large
    fontSystem: false    // false | true (Verdana/Arial)
  };

  const a11yToggle = document.querySelector('.a11y-toggle');
  const a11yPanel = document.querySelector('.a11y-panel');

  if (a11yToggle && a11yPanel) {
    const a11yClose = a11yPanel.querySelector('.a11y-panel-close');
    const a11yCloseBtn = a11yPanel.querySelector('.a11y-close-btn');
    const a11yReset = a11yPanel.querySelector('.a11y-reset');

    const openPanel = () => {
      a11yPanel.classList.add('is-open');
      a11yToggle.setAttribute('aria-expanded', 'true');
      // Focus first interactive in panel for keyboard users
      const firstFocusable = a11yPanel.querySelector('button');
      if (firstFocusable) firstFocusable.focus();
    };
    const closePanel = () => {
      a11yPanel.classList.remove('is-open');
      a11yToggle.setAttribute('aria-expanded', 'false');
    };

    a11yToggle.addEventListener('click', (e) => {
      e.stopPropagation();
      const isOpen = a11yPanel.classList.contains('is-open');
      if (isOpen) closePanel(); else openPanel();
    });
    if (a11yClose) a11yClose.addEventListener('click', () => { closePanel(); a11yToggle.focus(); });
    if (a11yCloseBtn) a11yCloseBtn.addEventListener('click', () => { closePanel(); a11yToggle.focus(); });

    // Close on outside click
    document.addEventListener('click', (e) => {
      if (!a11yPanel.classList.contains('is-open')) return;
      if (a11yPanel.contains(e.target) || a11yToggle.contains(e.target)) return;
      closePanel();
    });
    // Esc closes
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && a11yPanel.classList.contains('is-open')) {
        closePanel();
        a11yToggle.focus();
      }
    });

    // Apply state to DOM
    const applyState = () => {
      const root = document.documentElement;
      const body = document.body;

      // Font scale
      root.style.setProperty('--font-scale', String(a11yState.fontScale));

      // Theme
      body.classList.remove('theme-bw', 'theme-wb', 'theme-beige');
      if (a11yState.theme === 'bw') body.classList.add('theme-bw');
      else if (a11yState.theme === 'wb') body.classList.add('theme-wb');
      else if (a11yState.theme === 'beige') body.classList.add('theme-beige');

      // Images
      body.classList.toggle('images-hidden', !a11yState.images);

      // Letter spacing
      body.classList.remove('letter-spacing-medium', 'letter-spacing-large');
      if (a11yState.letterSpacing === 'medium') body.classList.add('letter-spacing-medium');
      else if (a11yState.letterSpacing === 'large') body.classList.add('letter-spacing-large');

      // Font system
      body.classList.toggle('font-system', a11yState.fontSystem);

      // Update aria-pressed of all panel controls
      a11yPanel.querySelectorAll('[data-fontscale]').forEach(b => {
        b.setAttribute('aria-pressed', String(parseFloat(b.dataset.fontscale) === a11yState.fontScale));
      });
      a11yPanel.querySelectorAll('[data-theme]').forEach(b => {
        b.setAttribute('aria-pressed', String(b.dataset.theme === a11yState.theme));
      });
      a11yPanel.querySelectorAll('[data-spacing]').forEach(b => {
        b.setAttribute('aria-pressed', String(b.dataset.spacing === a11yState.letterSpacing));
      });
      const imgToggle = a11yPanel.querySelector('[data-images-toggle]');
      if (imgToggle) imgToggle.setAttribute('aria-pressed', String(!a11yState.images));
      const fontToggle = a11yPanel.querySelector('[data-font-toggle]');
      if (fontToggle) fontToggle.setAttribute('aria-pressed', String(a11yState.fontSystem));
    };

    // Wire up controls
    a11yPanel.querySelectorAll('[data-fontscale]').forEach(btn => {
      btn.addEventListener('click', () => {
        a11yState.fontScale = parseFloat(btn.dataset.fontscale);
        applyState();
      });
    });
    a11yPanel.querySelectorAll('[data-theme]').forEach(btn => {
      btn.addEventListener('click', () => {
        a11yState.theme = btn.dataset.theme;
        applyState();
      });
    });
    a11yPanel.querySelectorAll('[data-spacing]').forEach(btn => {
      btn.addEventListener('click', () => {
        a11yState.letterSpacing = btn.dataset.spacing;
        applyState();
      });
    });
    const imagesBtn = a11yPanel.querySelector('[data-images-toggle]');
    if (imagesBtn) {
      imagesBtn.addEventListener('click', () => {
        a11yState.images = !a11yState.images;
        applyState();
      });
    }
    const fontBtn = a11yPanel.querySelector('[data-font-toggle]');
    if (fontBtn) {
      fontBtn.addEventListener('click', () => {
        a11yState.fontSystem = !a11yState.fontSystem;
        applyState();
      });
    }
    if (a11yReset) {
      a11yReset.addEventListener('click', () => {
        a11yState.fontScale = 1;
        a11yState.theme = 'default';
        a11yState.images = true;
        a11yState.letterSpacing = 'normal';
        a11yState.fontSystem = false;
        applyState();
      });
    }

    // Initial apply
    applyState();
  }

})();
