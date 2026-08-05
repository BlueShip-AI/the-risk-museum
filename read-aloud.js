/* Read aloud, for The Risk Museum.
 *
 * WHY THIS AND NOT AUDIO FILES. The papers on this site get corrected. A note
 * was edited eleven times in one day this week. Pre-rendered audio would go
 * stale the moment a number changed, and a recording that disagrees with the
 * text is worse than no recording on a site whose whole claim is that its
 * numbers are traceable. This reads the DOM at press time, so the audio is
 * the page, always, with nothing to regenerate and nothing to keep in sync.
 *
 * It is also free and adds no bytes to the repo beyond this file.
 *
 * CHARTS AND TABLES ARE ANNOUNCED, NOT READ. A table read aloud is
 * unlistenable and a chart read aloud is nonsense, but silently dropping
 * either one would leave a listener with a hole they cannot see. So each is
 * spoken as "Review the visual." in its correct place in the document, and
 * the reading continues. Reference lists and the nav are skipped outright.
 *
 * Degrades to nothing at all if the browser has no speech synthesis.
 */
(function () {
  'use strict';

  if (!('speechSynthesis' in window) || !('SpeechSynthesisUtterance' in window)) return;

  var main = document.querySelector('main');
  if (!main) return;

  var RATES = [1, 1.5];
  var LS_KEY = 'rm-read-rate';

  /* ---------- what gets read ---------- */

  // Prose worth speaking, plus the visuals we announce, all in document order.
  var VISUAL = 'table, figure';
  // .byline/.affil/.meta are the masthead: author, outfit, paper number and
  // date. They are divs, not prose tags, but a listener should hear them.
  var SELECT = 'h1, h2, h3, p, li, blockquote, figcaption, ' +
               '.byline, .affil, .meta, table, figure';
  // Anything inside these is page furniture, data, or unreadable aloud.
  var SKIP_INSIDE = 'nav, footer, table, svg, figure, .tabs, .tearmark, ' +
                    '.refs, .keywords, pre, code, .ra';
  var VISUAL_CUE = 'Review the visual.';

  // textContent welds a line break's two sides together ("Speed.They"), so
  // swap <br> for a space on a clone before reading.
  function textOf(el) {
    var c = el.cloneNode(true), brs = c.querySelectorAll('br');
    for (var i = 0; i < brs.length; i++) {
      brs[i].parentNode.replaceChild(document.createTextNode(' '), brs[i]);
    }
    return (c.textContent || '').replace(/\s+/g, ' ').trim();
  }

  function collect() {
    var out = [];
    var nodes = main.querySelectorAll(SELECT);
    for (var i = 0; i < nodes.length; i++) {
      var el = nodes[i];

      // A chart or table: announce it where it sits, then carry on. Nested
      // visuals (a table inside a figure) announce once, from the outside.
      if (el.matches(VISUAL)) {
        if (el.parentElement && el.parentElement.closest(VISUAL)) continue;
        out.push({ el: el, text: VISUAL_CUE, visual: true });
        continue;
      }

      if (el.closest(SKIP_INSIDE)) continue;
      var txt = textOf(el);
      if (txt.length < 2) continue;
      out.push({ el: el, text: txt });
    }
    return out;
  }

  /* ---------- making the text speakable ---------- */

  // Only substitutions that are unambiguous on this site. A wrong expansion
  // is worse than a symbol the voice skips, so this list stays short.
  var FIX = [
    [/·/g, ', '],           // middot separators in mastheads
    [/≥|>=/g, ' at least '],
    [/≤|<=/g, ' at most '],
    [/~/g, ' about '],
    [/−/g, ' minus '],
    [/\bvs\.?\s/gi, ' versus '],
    [/\bNo\.\s*(\d)/g, 'Number $1'],
    [/(\d)\s*bn\b/g, '$1 billion'],
    [/(\d)\s*GW\b/g, '$1 gigawatts'],
    [/(\d)\s*MWh\b/g, '$1 megawatt hours'],
    [/(\d)\s*MW\b/g, '$1 megawatts'],
    [/(\d)\s*kW\b/g, '$1 kilowatts'],
    [/\bIS\/OOS\b/g, 'in sample to out of sample'],
    [/\s*&\s*/g, ' and ']
  ];

  function speakable(s) {
    for (var i = 0; i < FIX.length; i++) s = s.replace(FIX[i][0], FIX[i][1]);
    return s.replace(/\s+([,.;:])/g, '$1').replace(/\s+/g, ' ').trim();
  }

  // Chrome goes quiet on long utterances, so nothing longer than a sentence
  // or two ever gets queued in one piece.
  var MAX = 200;

  function hardWrap(s) {
    // Last resort: never hand the synthesiser more than MAX characters.
    var out = [];
    while (s.length > MAX) {
      var cut = s.lastIndexOf(' ', MAX);
      if (cut < 40) cut = MAX;
      out.push(s.slice(0, cut).trim());
      s = s.slice(cut);
    }
    if (s.trim()) out.push(s.trim());
    return out;
  }

  function split(text) {
    if (text.length <= MAX) return [text];
    var sentences = text.match(/[^.!?]+[.!?]+\s*|[^.!?]+$/g) || [text];
    var pieces = [];
    for (var i = 0; i < sentences.length; i++) {
      var s = sentences[i];
      if (s.length <= MAX) { pieces.push(s); continue; }
      // Long sentence: break at clause boundaries, then by words.
      var clauses = s.match(/[^,;:]+[,;:]\s*|[^,;:]+$/g) || [s];
      for (var c = 0; c < clauses.length; c++) {
        if (clauses[c].length <= MAX) pieces.push(clauses[c]);
        else pieces.push.apply(pieces, hardWrap(clauses[c]));
      }
    }
    var out = [], buf = '';
    for (var j = 0; j < pieces.length; j++) {
      if ((buf + pieces[j]).length > MAX && buf) { out.push(buf.trim()); buf = ''; }
      buf += pieces[j];
    }
    if (buf.trim()) out.push(buf.trim());
    return out;
  }

  /* ---------- voice ---------- */

  var voice = null;
  function pickVoice() {
    var vs = speechSynthesis.getVoices() || [];
    if (!vs.length) return null;
    var en = vs.filter(function (v) { return /^en(-|_|$)/i.test(v.lang); });
    var pool = en.length ? en : vs;
    var preferred = ['Samantha', 'Daniel', 'Karen', 'Serena',
                     'Google UK English Female', 'Google US English', 'Alex'];
    for (var i = 0; i < preferred.length; i++) {
      for (var j = 0; j < pool.length; j++) {
        if (pool[j].name === preferred[i]) return pool[j];
      }
    }
    for (var k = 0; k < pool.length; k++) if (pool[k].localService) return pool[k];
    return pool[0];
  }
  pickVoice();
  speechSynthesis.onvoiceschanged = function () { voice = pickVoice(); };
  voice = pickVoice();

  /* ---------- UI ---------- */

  var css = document.createElement('style');
  css.textContent =
    '.ra{display:flex;align-items:center;gap:.55rem;flex-wrap:wrap;' +
      'margin:0 0 1.5rem;padding:.6rem .75rem;background:var(--card,#fff);' +
      'border:1px solid var(--line,#e3e0da);border-radius:8px;' +
      'font:14px/1.4 Charter,"Bitstream Charter",Cambria,"Noto Serif",Georgia,serif}' +
    '.ra button{font:inherit;cursor:pointer;color:var(--fg,#1a1a1a);' +
      'background:transparent;border:1px solid var(--line,#e3e0da);' +
      'border-radius:6px;padding:.32rem .7rem;line-height:1.2}' +
    '.ra button:hover{border-color:var(--blue,#2a5d8b);color:var(--blue,#2a5d8b)}' +
    '.ra button:focus-visible{outline:2px solid var(--blue,#2a5d8b);outline-offset:2px}' +
    '.ra .ra-main{font-weight:600}' +
    '.ra .ra-main[data-on="1"]{color:var(--accent,#8b2e2e);' +
      'border-color:var(--accent,#8b2e2e)}' +
    '.ra .ra-rate{min-width:3.1rem}' +
    '.ra .ra-note{color:var(--muted,#6b6b6b);font-size:.8rem;margin-left:auto;' +
      'text-align:right}' +
    '.ra-now{background:color-mix(in srgb,var(--blue,#2a5d8b) 12%,transparent);' +
      'border-radius:3px;box-shadow:0 0 0 3px color-mix(in srgb,' +
      'var(--blue,#2a5d8b) 12%,transparent)}' +
    '@media print{.ra{display:none}}';
  document.head.appendChild(css);

  var bar = document.createElement('div');
  bar.className = 'ra';
  bar.setAttribute('role', 'group');
  bar.setAttribute('aria-label', 'Listen to this page');
  bar.innerHTML =
    '<button class="ra-main" type="button" data-on="0">Play audio</button>' +
    '<button class="ra-stop" type="button" hidden>Stop</button>' +
    '<button class="ra-rate" type="button" aria-label="Playback speed">1x</button>' +
    '<span class="ra-note" aria-live="polite">Read by your browser. ' +
    'Charts and tables are announced, not read.</span>';

  var nav = main.querySelector('nav.tabs');
  if (nav && nav.nextSibling) main.insertBefore(bar, nav.nextSibling);
  else main.insertBefore(bar, main.firstChild);

  var bMain = bar.querySelector('.ra-main'),
      bStop = bar.querySelector('.ra-stop'),
      bRate = bar.querySelector('.ra-rate'),
      note  = bar.querySelector('.ra-note');

  var rate = parseFloat(localStorage.getItem(LS_KEY)) || 1;
  if (RATES.indexOf(rate) === -1) rate = 1;
  bRate.textContent = rate + 'x';

  /* ---------- playback ---------- */

  var blocks = [], queue = [], idx = 0, playing = false, paused = false, marked = null;

  function build() {
    blocks = collect();
    queue = [];
    for (var i = 0; i < blocks.length; i++) {
      if (blocks[i].visual) {
        queue.push({ text: blocks[i].text, el: blocks[i].el, block: i, visual: true });
        continue;
      }
      var chunks = split(speakable(blocks[i].text));
      for (var j = 0; j < chunks.length; j++) {
        if (chunks[j]) queue.push({ text: chunks[j], el: blocks[i].el, block: i });
      }
    }
  }

  function mark(el) {
    if (marked) marked.classList.remove('ra-now');
    marked = el || null;
    if (marked) {
      marked.classList.add('ra-now');
      var r = marked.getBoundingClientRect();
      if (r.top < 60 || r.bottom > innerHeight - 40) {
        marked.scrollIntoView({ block: 'center', behavior: 'smooth' });
      }
    }
  }

  function status() {
    if (!playing) {
      note.textContent = 'Read by your browser. Charts and tables are announced, not read.';
      return;
    }
    var b = queue[idx] ? queue[idx].block + 1 : blocks.length;
    note.textContent = 'Reading ' + b + ' of ' + blocks.length + (paused ? ', paused' : '');
  }

  // Chrome silently stops long sessions. Nudging the queue keeps it alive.
  var keepalive = null;
  function startKeepalive() {
    stopKeepalive();
    keepalive = setInterval(function () {
      if (playing && !paused && speechSynthesis.speaking) {
        speechSynthesis.pause(); speechSynthesis.resume();
      }
    }, 9000);
  }
  function stopKeepalive() { if (keepalive) { clearInterval(keepalive); keepalive = null; } }

  function speakFrom(i) {
    speechSynthesis.cancel();
    idx = i;
    playing = true; paused = false;
    bMain.textContent = 'Pause'; bMain.dataset.on = '1';
    bStop.hidden = false;
    startKeepalive();
    next();
  }

  function next() {
    if (!playing) return;
    if (idx >= queue.length) { stop(); return; }
    var item = queue[idx];
    mark(item.el);
    status();
    var u = new SpeechSynthesisUtterance(item.text);
    u.rate = rate;
    u.pitch = 1;
    if (voice) { u.voice = voice; u.lang = voice.lang; }
    u.onend = function () { if (playing && !paused) { idx++; next(); } };
    u.onerror = function (e) {
      if (e && (e.error === 'canceled' || e.error === 'interrupted')) return;
      if (playing && !paused) { idx++; next(); }
    };
    speechSynthesis.speak(u);
  }

  function stop() {
    playing = false; paused = false; idx = 0;
    stopKeepalive();
    speechSynthesis.cancel();
    bMain.textContent = 'Play audio'; bMain.dataset.on = '0';
    bStop.hidden = true;
    mark(null);
    status();
  }

  bMain.addEventListener('click', function () {
    if (!playing) { build(); if (!queue.length) return; speakFrom(0); return; }
    if (paused) {
      paused = false;
      bMain.textContent = 'Pause';
      speechSynthesis.resume();
      startKeepalive();
    } else {
      paused = true;
      bMain.textContent = 'Resume';
      stopKeepalive();
      speechSynthesis.pause();
    }
    status();
  });

  bStop.addEventListener('click', stop);

  bRate.addEventListener('click', function () {
    rate = RATES[(RATES.indexOf(rate) + 1) % RATES.length];
    bRate.textContent = rate + 'x';
    try { localStorage.setItem(LS_KEY, String(rate)); } catch (e) {}
    // An utterance already speaking cannot be retuned, so restart this chunk.
    if (playing) speakFrom(idx);
  });

  // Leaving the page must not leave a voice talking over the next one.
  window.addEventListener('pagehide', function () { speechSynthesis.cancel(); });
  window.addEventListener('beforeunload', function () { speechSynthesis.cancel(); });
})();
