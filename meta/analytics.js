// Lightweight analytics stub (no external calls).
// Safe to leave as-is; replace with your own implementation later.
(function () {
  const sessionId = Math.random().toString(36).slice(2);

  function log(type, detail) {
    if (location.hostname.endsWith('github.io')) {
      console.debug('[analytics]', type, detail);
    }
  }

  window.addEventListener('load', function () {
    log('pageview', { path: location.pathname, sessionId });
  });

  document.addEventListener('click', function (e) {
    const el = e.target.closest('a,button');
    if (!el) return;
    log('ui', {
      tag: el.tagName,
      text: (el.textContent || '').trim().slice(0, 40)
    });
  });
})();
