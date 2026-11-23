/* Site behaviour: listen-button links (with show-level fallback) and the /podcasts/ episode grid.
   Pages work without this file: buttons carry a working href and the host chips link to the channel pages. */
(function () {
  'use strict';

  var cfg = (window.AOQ_CONFIG && window.AOQ_CONFIG.shows) || {};
  function isUrl(u) { return /^https?:\/\//.test(u || ''); }

  // 1. Listen buttons: per-episode URL if present, otherwise the show-level URL from site-config.js
  Array.prototype.forEach.call(document.querySelectorAll('[data-listen]'), function (a) {
    var url = a.getAttribute('data-episode-url');
    if (!isUrl(url)) url = cfg[a.getAttribute('data-listen')];
    if (isUrl(url)) {
      a.setAttribute('href', url);
      a.hidden = false;
    } else if (a.hasAttribute('data-needs-config')) {
      a.hidden = true;
    }
  });

  // Follow buttons: social links from site-config.js
  var social = (window.AOQ_CONFIG && window.AOQ_CONFIG.social) || {};
  Array.prototype.forEach.call(document.querySelectorAll('[data-social]'), function (a) {
    var url = social[a.getAttribute('data-social')];
    if (isUrl(url)) a.setAttribute('href', url);
  });

  // 2. All-episodes grid: newest first, optional filter by host
  var grid = document.querySelector('[data-ep-grid]');
  if (!grid) return;

  var tiles = Array.prototype.slice.call(grid.querySelectorAll('.ep-tile'));
  tiles
    .map(function (t, i) { return { t: t, i: i, d: t.getAttribute('data-date') || '' }; })
    .sort(function (a, b) { return a.d < b.d ? 1 : a.d > b.d ? -1 : a.i - b.i; })
    .forEach(function (x) { grid.appendChild(x.t); });

  var chips = Array.prototype.slice.call(document.querySelectorAll('[data-filter]'));
  var countEl = document.querySelector('[data-ep-count]');
  var noteEl = document.querySelector('[data-ep-note]');
  var legacy = {
    'ep-investing': 'john-candeto',
    'ep-attention': 'william-oliver',
    'ep-systems': 'paul-higgins',
    'ep-building': 'ferdinand-bennigsen',
    'ep-others': 'all'
  };

  function isValid(host) {
    return host === 'all' || chips.some(function (c) { return c.getAttribute('data-filter') === host; });
  }

  function apply(host, updateUrl) {
    var shown = 0;
    tiles.forEach(function (t) {
      var match = host === 'all' || t.getAttribute('data-host') === host;
      t.hidden = !match;
      if (match) shown++;
    });
    var active = null;
    chips.forEach(function (c) {
      var on = c.getAttribute('data-filter') === host;
      c.classList.toggle('is-active', on);
      c.setAttribute('aria-pressed', on ? 'true' : 'false');
      if (on) active = c;
    });
    if (countEl) countEl.textContent = shown + (shown === 1 ? ' episode' : ' episodes');
    if (noteEl) {
      noteEl.textContent = '';
      if (active && host !== 'all') {
        var a = document.createElement('a');
        a.href = active.getAttribute('href');
        a.textContent = 'About ' + active.textContent.trim() + ' →';
        noteEl.appendChild(a);
      }
    }
    if (updateUrl && window.history && history.replaceState) {
      history.replaceState(null, '', host === 'all' ? location.pathname + location.search : '#' + host);
    }
  }

  function fromHash() {
    var h = location.hash.replace(/^#/, '');
    h = legacy[h] || h;
    return isValid(h) ? h : 'all';
  }

  chips.forEach(function (chip) {
    chip.addEventListener('click', function (e) {
      e.preventDefault();
      apply(chip.getAttribute('data-filter'), true);
    });
  });
  window.addEventListener('hashchange', function () { apply(fromHash(), false); });

  var initial = fromHash();
  apply(initial, location.hash.replace(/^#/, '') in legacy);
})();
