/* =========================================================================
   Дебют юного программиста — подстановка контента из data/site.json
   Редактируйте даты, контакты и ссылки в JSON; HTML — каркас страницы.
   ========================================================================= */

(function() {
  'use strict';

  const scriptEl = document.currentScript;
  const SITE_JSON = new URL(
    'data/site.json',
    scriptEl ? scriptEl.src : window.location.href
  ).href;

  const ICON_MAIL = '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>';
  const ICON_PHONE = '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>';
  const ICON_DOC_ARROW = '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 5l7 7-7 7"/></svg>';

  function getByPath(obj, path) {
    if (!path) return undefined;
    return path.split('.').reduce((acc, key) => (acc != null ? acc[key] : undefined), obj);
  }

  function resolveTemplate(str, data) {
    if (str == null || typeof str !== 'string') return str;
    return str.replace(/\{\{([\w.]+)\}\}/g, (_, path) => {
      const val = getByPath(data, path.trim());
      return val != null ? String(val) : '';
    });
  }

  function resolveHref(data, spec) {
    if (!spec) return '#';
    const hashIndex = spec.indexOf('#');
    const path = hashIndex >= 0 ? spec.slice(0, hashIndex) : spec;
    const hash = hashIndex >= 0 ? spec.slice(hashIndex) : '';
    const resolved = getByPath(data, path);
    const base = resolved != null ? String(resolved) : spec;
    return hash ? base + hash : base;
  }

  function applyTextBindings(data) {
    // Только [data-site], без data-site-html / data-site-href и т.д.
    document.querySelectorAll('[data-site]:not([data-site-html]):not([data-site-href]):not([data-site-attr]):not([data-site-mailto]):not([data-site-tel])').forEach(el => {
      const val = getByPath(data, el.getAttribute('data-site'));
      if (val != null) el.textContent = String(val);
    });
  }

  function applyHtmlBindings(data) {
    document.querySelectorAll('[data-site-html]').forEach(el => {
      const key = el.getAttribute('data-site-html');
      const raw = getByPath(data, key);
      if (raw != null) el.innerHTML = resolveTemplate(String(raw), data);
    });
  }

  function applyHrefBindings(data) {
    document.querySelectorAll('[data-site-href]').forEach(el => {
      const spec = el.getAttribute('data-site-href');
      el.setAttribute('href', resolveHref(data, spec));
    });
  }

  function applyAttrBindings(data) {
    document.querySelectorAll('[data-site-attr]').forEach(el => {
      const specs = el.getAttribute('data-site-attr').split(';').map(s => s.trim()).filter(Boolean);
      specs.forEach(spec => {
        const colon = spec.indexOf(':');
        if (colon < 0) return;
        const attr = spec.slice(0, colon).trim();
        const path = spec.slice(colon + 1).trim();
        const raw = getByPath(data, path);
        if (raw != null) el.setAttribute(attr, resolveTemplate(String(raw), data));
      });
    });
  }

  function applyMailtoBindings(data) {
    document.querySelectorAll('[data-site-mailto]').forEach(el => {
      const email = getByPath(data, el.getAttribute('data-site-mailto'));
      if (email == null) return;
      el.href = 'mailto:' + email;
      el.textContent = email;
    });
  }

  function applyTelBindings(data) {
    document.querySelectorAll('[data-site-tel]').forEach(el => {
      const phone = getByPath(data, el.getAttribute('data-site-tel'));
      if (!phone) return;
      el.href = 'tel:' + phone.tel;
      el.textContent = phone.display;
    });
  }

  function renderCommittee(container, people) {
    if (!container || !Array.isArray(people)) return;
    container.innerHTML = people.map(person => {
      const emails = (person.emails || []).map(email =>
        `<div class="contact-line">${ICON_MAIL}<a href="mailto:${email}">${email}</a></div>`
      ).join('');
      const phones = (person.phones || []).map(p =>
        `<div class="contact-line">${ICON_PHONE}<a href="tel:${p.tel}">${p.display}</a></div>`
      ).join('');
      return `<div class="contact-person">
        <strong>${person.name}</strong>
        <p class="role">${person.role}</p>
        ${emails}
        ${phones}
      </div>`;
    }).join('');
  }

  function renderDocuments(container, docs, data) {
    if (!container || !Array.isArray(docs)) return;
    container.innerHTML = docs.map(doc => {
      const href = resolveHref(data, doc.href);
      return `<a class="doc-card reveal" href="${href}" target="_blank" rel="noopener">
        <span class="doc-icon" aria-hidden="true">PDF</span>
        <span class="doc-content">
          <strong>${doc.title}</strong>
          <span>${doc.description}</span>
        </span>
        <span class="doc-arrow">${ICON_DOC_ARROW}</span>
      </a>`;
    }).join('');
    document.querySelectorAll('#documents .doc-card.reveal').forEach(el => el.classList.add('is-visible'));
  }

  function applyStageDates(data) {
    const items = document.querySelectorAll('#stages .timeline-dates[data-site-stage]');
    const stages = data.dates && data.dates.stages;
    if (!stages) return;
    items.forEach(el => {
      const i = parseInt(el.getAttribute('data-site-stage'), 10);
      if (stages[i] && stages[i].range) el.textContent = stages[i].range;
    });
  }

  function applySite(data) {
    const committeeEl = document.getElementById('org-committee');
    const docsEl = document.getElementById('docs-grid');

    try {
      if (committeeEl && data.contacts && data.contacts.committee) {
        renderCommittee(committeeEl, data.contacts.committee);
      }
    } catch (e) {
      console.error('[content.js] Оргкомитет:', e);
    }

    try {
      if (docsEl && data.documents) {
        renderDocuments(docsEl, data.documents, data);
      }
    } catch (e) {
      console.error('[content.js] Документы:', e);
    }

    try {
      applyTextBindings(data);
      applyHtmlBindings(data);
      applyHrefBindings(data);
      applyAttrBindings(data);
      applyMailtoBindings(data);
      applyTelBindings(data);
      applyStageDates(data);
    } catch (e) {
      console.error('[content.js] Подстановка полей:', e);
    }

    document.documentElement.setAttribute('data-site-loaded', 'true');
  }

  function boot() {
    fetch(SITE_JSON)
      .then(res => {
        if (!res.ok) throw new Error('HTTP ' + res.status);
        return res.json();
      })
      .then(applySite)
      .catch(err => {
        console.warn(
          '[content.js] Не удалось загрузить data/site.json — остаётся текст из HTML. URL:',
          SITE_JSON,
          err
        );
      });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
