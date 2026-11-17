/* Site enhancements and read-aloud loader for The Risk Museum. */
(function () {
  'use strict';

  function latestResearchNote() {
    var path = window.location.pathname.replace(/\/+$/, '/');
    if (!/\/notes\/$/.test(path)) return;

    var href = 'the-agent-is-not-the-decision.html';
    var grid = document.querySelector('.tile-grid');

    if (grid && !grid.querySelector('a[href="' + href + '"]')) {
      var tile = document.createElement('a');
      tile.className = 'mtile';
      tile.href = href;
      tile.setAttribute('data-cat', 'ai');
      tile.innerHTML =
        '<svg class="mtile-icon" width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' +
        '<rect x="8" y="12" width="20" height="12" rx="2" stroke="var(--muted)" stroke-width="2"/>' +
        '<rect x="36" y="12" width="20" height="12" rx="2" stroke="var(--muted)" stroke-width="2"/>' +
        '<rect x="22" y="40" width="20" height="12" rx="2" stroke="var(--accent)" stroke-width="2"/>' +
        '<path d="M18 24v8h14v8M46 24v8H32" stroke="var(--blue)" stroke-width="2" fill="none"/>' +
        '<circle cx="32" cy="32" r="3" fill="var(--blue)"/>' +
        '</svg>' +
        '<span class="mtile-meta">WP 52 &middot; AI &amp; PROCESS</span>' +
        '<span class="mtile-t">The Agent Is Not the Decision</span>' +
        '<span class="mtile-s">7 systems, 1 human gate</span>';
      grid.insertBefore(tile, grid.firstChild);
    }

    if (!document.querySelector('.note-card[href="' + href + '"]')) {
      var headings = document.querySelectorAll('h2.sect-h');
      var heading = null;
      for (var i = 0; i < headings.length; i++) {
        if (/Every paper/i.test(headings[i].textContent || '')) { heading = headings[i]; break; }
      }
      if (heading) {
        var card = document.createElement('a');
        card.className = 'note-card';
        card.href = href;
        card.innerHTML =
          '<svg class="tile" width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' +
          '<rect x="8" y="12" width="20" height="12" rx="2" stroke="var(--muted)" stroke-width="2"/>' +
          '<rect x="36" y="12" width="20" height="12" rx="2" stroke="var(--muted)" stroke-width="2"/>' +
          '<rect x="22" y="40" width="20" height="12" rx="2" stroke="var(--accent)" stroke-width="2"/>' +
          '<path d="M18 24v8h14v8M46 24v8H32" stroke="var(--blue)" stroke-width="2" fill="none"/>' +
          '<circle cx="32" cy="32" r="3" fill="var(--blue)"/>' +
          '</svg>' +
          '<div class="note-body"><h2>The Agent Is Not the Decision</h2>' +
          '<p>V. Dimopoulos &middot; Working Paper No. 52 &middot; Nov 17, 2026 &middot; Seven public investment-research agent systems point to the same operating design: models are evaluated, tools are permissioned, evidence stays traceable, and a named human retains the capital-allocation decision.</p></div>';
        heading.insertAdjacentElement('afterend', card);
      }
    }

    var count = document.querySelector('.glance-count');
    if (count && grid) {
      count.textContent = grid.querySelectorAll('.mtile').length + ' in all, newest first';
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', latestResearchNote);
  } else {
    latestResearchNote();
  }

  var core = document.createElement('script');
  core.src = '/read-aloud-core.js?v=2c0227296dfa';
  core.defer = true;
  document.head.appendChild(core);
})();
