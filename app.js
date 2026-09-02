(function(){
  "use strict";

  var BN_DIGITS = ["০","১","২","৩","৪","৫","৬","৭","৮","৯"];
  function toBn(str){ return String(str).replace(/[0-9]/g, function(d){ return BN_DIGITS[+d]; }); }
  var RM = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ==========================================================
     1. CIRCUIT MESH BACKGROUND
     ========================================================== */
  var cv = document.getElementById("bg"), ctx = cv && cv.getContext("2d");
  var PAL = {};
  function readPalette(){
    var light = document.documentElement.getAttribute("data-theme") === "light";
    PAL = light ? {
      trace:"rgba(20,32,44,0.10)",
      traceLit:function(l){ return "rgba(76,122,0," + (0.10 + l * 0.55).toFixed(3) + ")"; },
      nodeLit:function(l){ return "rgba(76,122,0," + (0.30 + l * 0.70).toFixed(3) + ")"; },
      ring:function(l){ return "rgba(76,122,0," + (l * 0.30).toFixed(3) + ")"; },
      hub:"rgba(20,32,44,0.28)", dot:"rgba(20,32,44,0.16)",
      p1:"76,122,0", p2:"14,127,163"
    } : {
      trace:"rgba(255,255,255,0.045)",
      traceLit:function(l){ return "rgba(205,255,87," + (0.05 + l * 0.5).toFixed(3) + ")"; },
      nodeLit:function(l){ return "rgba(205,255,87," + (0.25 + l * 0.75).toFixed(3) + ")"; },
      ring:function(l){ return "rgba(205,255,87," + (l * 0.32).toFixed(3) + ")"; },
      hub:"rgba(255,255,255,0.20)", dot:"rgba(255,255,255,0.10)",
      p1:"205,255,87", p2:"87,232,255"
    };
  }
  readPalette();
  var nodes = [], links = [], pulses = [], W = 0, H = 0, DPR = 1;
  var ptr = { x: -9999, y: -9999, on: false };
  var RAD = 180, RAD2 = RAD * RAD;
  var rafId = null, lastW = 0;

  function build(){
    var short = Math.min(window.innerWidth, window.innerHeight);
    var step = short < 420 ? 104 : short < 620 ? 96 : short < 900 ? 100 : 112;
    var cols = Math.ceil(W / step) + 1, rows = Math.ceil(H / step) + 1;
    nodes = []; links = []; pulses = [];
    var grid = [];
    for (var r = 0; r <= rows; r++){
      grid[r] = [];
      for (var c = 0; c <= cols; c++){
        var jx = (Math.random() - .5) * step * .42,
            jy = (Math.random() - .5) * step * .42;
        var n = { hx: c * step + jx, hy: r * step + jy, x: c * step + jx, y: r * step + jy, vx: 0, vy: 0, lit: 0, hub: Math.random() < .1 };
        grid[r][c] = n; nodes.push(n);
      }
    }
    for (var r2 = 0; r2 <= rows; r2++){
      for (var c2 = 0; c2 <= cols; c2++){
        var a = grid[r2][c2];
        if (c2 < cols && Math.random() < .82) links.push({ a: a, b: grid[r2][c2 + 1], bend: Math.random() < .5 ? 0 : 1 });
        if (r2 < rows && Math.random() < .48) links.push({ a: a, b: grid[r2 + 1][c2], bend: Math.random() < .5 ? 0 : 1 });
      }
    }
    var count = Math.min(14, Math.max(6, Math.round(links.length / 70)));
    for (var i = 0; i < count; i++) pulses.push(newPulse());
  }

  function newPulse(){
    return { li: Math.floor(Math.random() * (links.length || 1)), t: Math.random(), sp: 0.0022 + Math.random() * 0.0042, cyan: Math.random() < .45 };
  }

  function size(){
    if (!cv) return;
    DPR = Math.min(window.devicePixelRatio || 1, 2);
    W = window.innerWidth; H = window.innerHeight;
    cv.width = W * DPR; cv.height = H * DPR;
    cv.style.width = W + "px"; cv.style.height = H + "px";
    if (ctx) ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  }

  function draw(){
    if (!ctx) return;
    ctx.clearRect(0, 0, W, H);
    var mx = ptr.x, my = ptr.y, mOn = ptr.on;
    for (var i = 0; i < nodes.length; i++){
      var n = nodes[i];
      if (mOn){
        var dx = n.x - mx, dy = n.y - my, d2 = dx * dx + dy * dy;
        if (d2 < RAD2 && d2 > 0.01){
          var d = Math.sqrt(d2), f = (1 - d / RAD) * 36;
          n.vx += (dx / d) * f * 0.08; n.vy += (dy / d) * f * 0.08;
          n.lit = Math.max(n.lit, 1 - d / RAD);
        }
      }
      n.vx += (n.hx - n.x) * 0.045; n.vy += (n.hy - n.y) * 0.045;
      n.vx *= 0.86; n.vy *= 0.86;
      n.x += n.vx; n.y += n.vy;
      n.lit *= 0.94;
    }

    ctx.lineWidth = 1;
    for (var j = 0; j < links.length; j++){
      var l = links[j], a = l.a, b = l.b, lit = Math.max(a.lit, b.lit);
      ctx.strokeStyle = lit > 0.02 ? PAL.traceLit(lit) : PAL.trace;
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      if (l.bend === 0){ ctx.lineTo(b.x, a.y); ctx.lineTo(b.x, b.y); }
      else { ctx.lineTo(a.x, b.y); ctx.lineTo(b.x, b.y); }
      ctx.stroke();
    }

    for (var p = 0; p < pulses.length; p++){
      var pl = pulses[p];
      if (!links[pl.li]) { pulses[p] = newPulse(); continue; }
      pl.t += pl.sp;
      if (pl.t >= 1){ pulses[p] = newPulse(); continue; }
      var lk = links[pl.li], n1 = lk.a, n2 = lk.b, px, py;
      if (lk.bend === 0){
        if (pl.t < 0.5){ var u = pl.t * 2; px = n1.x + (n2.x - n1.x) * u; py = n1.y; }
        else { var v = (pl.t - 0.5) * 2; px = n2.x; py = n1.y + (n2.y - n1.y) * v; }
      } else {
        if (pl.t < 0.5){ var u2 = pl.t * 2; px = n1.x; py = n1.y + (n2.y - n1.y) * u2; }
        else { var v2 = (pl.t - 0.5) * 2; px = n1.x + (n2.x - n1.x) * v2; py = n2.y; }
      }
      var cstr = pl.cyan ? PAL.p2 : PAL.p1;
      var g = ctx.createLinearGradient(px - 14, py, px + 14, py);
      g.addColorStop(0, "rgba(" + cstr + ",0)");
      g.addColorStop(0.5, "rgba(" + cstr + ",0.95)");
      g.addColorStop(1, "rgba(" + cstr + ",0)");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(px, py, 2.4, 0, Math.PI * 2);
      ctx.fill();
    }

    for (var k = 0; k < nodes.length; k++){
      var nd = nodes[k];
      if (nd.hub){
        ctx.fillStyle = PAL.hub;
        ctx.beginPath(); ctx.arc(nd.x, nd.y, 2.2, 0, Math.PI * 2); ctx.fill();
        if (nd.lit > 0.05){
          ctx.strokeStyle = PAL.ring(nd.lit); ctx.lineWidth = 1;
          ctx.beginPath(); ctx.arc(nd.x, nd.y, 6 + nd.lit * 5, 0, Math.PI * 2); ctx.stroke();
        }
      } else if (nd.lit > 0.08){
        ctx.fillStyle = PAL.nodeLit(nd.lit);
        ctx.beginPath(); ctx.arc(nd.x, nd.y, 1.8 + nd.lit * 1.5, 0, Math.PI * 2); ctx.fill();
      } else {
        ctx.fillStyle = PAL.dot;
        ctx.beginPath(); ctx.arc(nd.x, nd.y, 1.2, 0, Math.PI * 2); ctx.fill();
      }
    }
    rafId = requestAnimationFrame(draw);
  }

  if (cv && ctx && !RM){
    size(); build(); lastW = window.innerWidth;
    rafId = requestAnimationFrame(draw);
    window.addEventListener("resize", function(){
      var w = window.innerWidth;
      if (w === lastW) { size(); return; }
      lastW = w; size(); build();
    });
    window.addEventListener("pointermove", function(e){ ptr.x = e.clientX; ptr.y = e.clientY; ptr.on = true; }, { passive: true });
    window.addEventListener("pointerleave", function(){ ptr.on = false; ptr.x = ptr.y = -9999; });
    window.addEventListener("touchend", function(){ setTimeout(function(){ ptr.on = false; ptr.x = ptr.y = -9999; }, 400); }, { passive: true });
    window.addEventListener("pointerdown", function(e){
      ptr.x = e.clientX; ptr.y = e.clientY; ptr.on = true;
      var added = 0;
      for (var i = 0; i < links.length && added < 7; i++){
        var l = links[i];
        if (Math.abs(l.a.x - e.clientX) < 190 && Math.abs(l.a.y - e.clientY) < 190){
          pulses.push({ li: i, t: 0, sp: 0.006 + Math.random() * 0.006, cyan: Math.random() < .5 });
          added++;
        }
      }
      if (pulses.length > 60) pulses.splice(0, pulses.length - 60);
    }, { passive: true });
    document.addEventListener("visibilitychange", function(){
      if (document.hidden){ if (rafId) cancelAnimationFrame(rafId); rafId = null; }
      else if (!rafId){ rafId = requestAnimationFrame(draw); }
    });
  } else if (cv) {
    cv.style.display = "none";
  }

  /* ==========================================================
     2. CUSTOM CURSOR
     ========================================================== */
  var cur = document.getElementById("cur"), curd = document.getElementById("curd");
  if (cur && window.matchMedia && window.matchMedia("(hover:hover) and (pointer:fine)").matches && !RM){
    var cx = -100, cy = -100, tx = -100, ty = -100, curRaf = 0;
    function curLoop(){
      cx += (tx - cx) * 0.22; cy += (ty - cy) * 0.22;
      cur.style.transform = "translate(" + cx + "px," + cy + "px)";
      if (Math.abs(tx - cx) + Math.abs(ty - cy) > 0.15) curRaf = requestAnimationFrame(curLoop);
      else curRaf = 0;
    }
    window.addEventListener("pointermove", function(e){
      tx = e.clientX; ty = e.clientY;
      curd.style.transform = "translate(" + tx + "px," + ty + "px)";
      if (!curRaf) curRaf = requestAnimationFrame(curLoop);
    }, { passive: true });
    document.addEventListener("pointerover", function(e){
      var t = e.target.closest ? e.target.closest("a,button,.spot,.tag,.case-card,.focus-card") : null;
      cur.classList.toggle("hot", !!t);
    });
    document.addEventListener("pointerdown", function(){ cur.classList.add("tap"); });
    document.addEventListener("pointerup", function(){ cur.classList.remove("tap"); });
  }

  /* ==========================================================
     3. HERO INTRO + LETTER SCATTER + GLITCH
     ========================================================== */
  var hero = document.querySelector(".hero");
  function splitName(){
    if (document.documentElement.lang === "bn") return;
    document.querySelectorAll("[data-scatter]").forEach(function(el){
      if (el.querySelector(".gl")) return;
      var txt = el.textContent, frag = document.createDocumentFragment();
      for (var i = 0; i < txt.length; i++){
        var sp = document.createElement("span");
        sp.className = "gl"; sp.textContent = txt[i];
        frag.appendChild(sp);
      }
      el.textContent = ""; el.appendChild(frag);
    });
  }
  window.__splitName = splitName;
  splitName();
  if (hero){
    setTimeout(function(){ hero.classList.add("go"); }, RM ? 0 : 1150);
    setTimeout(function(){ hero.classList.add("done"); }, RM ? 0 : 2350);
  }

  var GL_LAT = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#%&$@?*<>/\\";
  var GL_BN  = "অআইঈউঊএঐওঔকখগঘঙচছজঝটঠডঢণতথদধনপফবভমযরলশষসহ০১২৩৪৫৬৭৮৯";
  function initGlitch(){
    var host = document.querySelector(".name");
    if (!host) return;
    var items = [], CHARS = GL_LAT;
    function gather(){
      var gl = host.querySelectorAll(".gl");
      return gl.length ? [].slice.call(gl) : [].slice.call(host.querySelectorAll(".ln > i"));
    }
    function clearAll(){
      items.forEach(function(it){
        clearTimeout(it.t);
        it.el.classList.remove("glitching");
        it.el.textContent = it.real;
        it.el.style.width = "";
        it.el.style.textAlign = "";
      });
      items = [];
    }
    function rebuild(){
      clearAll();
      CHARS = document.documentElement.lang === "bn" ? GL_BN : GL_LAT;
      gather().forEach(function(el){
        if (!el.textContent.trim()) return;
        items.push({ el: el, real: el.textContent, t: null });
      });
      items.forEach(schedule);
    }
    function schedule(it){
      it.t = setTimeout(function(){ fire(it); }, 1400 + Math.random() * 4200);
    }
    function fire(it){
      if (document.hidden || RM){ schedule(it); return; }
      var el = it.el, real = it.real;
      if (!el.isConnected) return;
      el.style.width = el.getBoundingClientRect().width.toFixed(2) + "px";
      el.style.textAlign = "center";
      el.classList.add("glitching");
      var frames = 3 + ((Math.random() * 5) | 0);
      var f = 0;
      function step(){
        if (f < frames){
          if (real === " ") el.textContent = " ";
          else if (CHARS === GL_BN){
            var out = "";
            for (var k = 0; k < real.length; k++){
              out += (real[k] === " " ? " " : CHARS[(Math.random() * CHARS.length) | 0]);
            }
            el.textContent = out;
          } else {
            el.textContent = CHARS[(Math.random() * CHARS.length) | 0];
          }
          f++;
          it.t = setTimeout(step, 45 + Math.random() * 45);
        } else {
          el.textContent = real;
          el.classList.remove("glitching");
          el.style.width = "";
          el.style.textAlign = "";
          schedule(it);
        }
      }
      step();
    }
    rebuild();
    window.__reglitch = rebuild;
  }
  initGlitch();

  /* ==========================================================
     4. TYPEWRITER
     ========================================================== */
  var roleEl = document.getElementById("role");
  if (roleEl){
    var ROLES_EN = [
      "Android & ARM64 Linux Systems Builder",
      "On-Device AI & llama.cpp Systems",
      "Developer Toolchains & Native Builds",
      "Real-Device Validation & Root-Cause Debugging",
      "Technical Systems & Process Automation"
    ];
    var ROLES = ROLES_EN, gen = 0, ri = 0, ci = 0, del = false;
    window.__setRoles = function(list){
      ROLES = (list && list.length) ? list : ROLES_EN;
      ri = 0; ci = 0; del = false;
      gen++;
      roleEl.textContent = "";
      if (RM){ roleEl.textContent = ROLES[0]; return; }
      startType(60);
    };
    if (RM){ roleEl.textContent = ROLES[0]; }
    function startType(delay){
      var mine = gen;
      setTimeout(function tick(){
        if (mine !== gen) return;
        if (ri >= ROLES.length) ri = 0;
        var full = ROLES[ri];
        if (ci > full.length) ci = full.length;
        ci += del ? -1 : 1;
        if (ci < 0) ci = 0;
        roleEl.textContent = full.slice(0, ci);
        var wait = del ? 24 : 50;
        if (!del && ci === full.length){ del = true; wait = 2100; }
        else if (del && ci === 0){ del = false; ri = (ri + 1) % ROLES.length; wait = 300; }
        setTimeout(tick, wait);
      }, delay);
    }
    if (!RM) startType(1500);
  }

  /* ==========================================================
     5. SPOTLIGHT PANELS
     ========================================================== */
  if (!RM){
    document.addEventListener("pointermove", function(e){
      var el = e.target.closest ? e.target.closest(".spot") : null;
      if (!el) return;
      var r = el.getBoundingClientRect();
      el.style.setProperty("--mx", (e.clientX - r.left) + "px");
      el.style.setProperty("--my", (e.clientY - r.top) + "px");
    }, { passive: true });
  }

  /* ==========================================================
     6. REVEALS + COUNT-UP
     ========================================================== */
  var revealables = document.querySelectorAll(".rv, .stg");
  if (RM || !("IntersectionObserver" in window)){
    for (var r0 = 0; r0 < revealables.length; r0++) revealables[r0].classList.add("in");
  } else {
    var io = new IntersectionObserver(function(en){
      en.forEach(function(x){ if (x.isIntersecting){ x.target.classList.add("in"); io.unobserve(x.target); } });
    }, { rootMargin: "0px 0px -10% 0px", threshold: 0.04 });
    for (var r1 = 0; r1 < revealables.length; r1++) io.observe(revealables[r1]);
  }

  function runCount(el){
    var target = parseFloat(el.getAttribute("data-count")) || 0,
        suffix = el.getAttribute("data-suffix") || "";
    function fmt(v){
      var bn = document.documentElement.lang === "bn", sx = suffix;
      if (bn && window.I18N && I18N.suffix && I18N.suffix[sx] !== undefined) sx = I18N.suffix[sx];
      return (bn ? toBn(v) : v) + sx;
    }
    if (RM){ el.textContent = fmt(target); return; }
    var dur = 1200, t0 = null;
    requestAnimationFrame(function step(ts){
      if (t0 === null) t0 = ts;
      var p = Math.min((ts - t0) / dur, 1), e = 1 - Math.pow(1 - p, 3);
      el.textContent = fmt(Math.round(target * e));
      if (p < 1) requestAnimationFrame(step);
    });
  }
  var counters = document.querySelectorAll("[data-count]");
  if (counters.length){
    if (!("IntersectionObserver" in window)){
      for (var c0 = 0; c0 < counters.length; c0++) runCount(counters[c0]);
    } else {
      var cio = new IntersectionObserver(function(en){
        en.forEach(function(x){ if (x.isIntersecting){ runCount(x.target); cio.unobserve(x.target); } });
      }, { threshold: 0.4 });
      for (var c1 = 0; c1 < counters.length; c1++) cio.observe(counters[c1]);
    }
  }

  /* ==========================================================
     7. DOCK — scrollspy + progress border
     ========================================================== */
  var dock = document.getElementById("dock"),
      dockLinks = [].slice.call(document.querySelectorAll(".dock a[data-sec]")),
      secs = [].slice.call(document.querySelectorAll("section[id], header[id]")),
      tick = false;

  function onScroll(){
    var y = window.pageYOffset || document.documentElement.scrollTop,
        max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight),
        pct = Math.min(1, Math.max(0, y / max));
    if (dock) dock.style.setProperty("--prog", (pct * 100).toFixed(2));
    var cur2 = "", probe = y + window.innerHeight * 0.35;
    for (var i = 0; i < secs.length; i++){ if (secs[i].offsetTop <= probe) cur2 = secs[i].id; }
    if (pct > 0.985) cur2 = "contact";
    for (var j = 0; j < dockLinks.length; j++){
      dockLinks[j].classList.toggle("on", dockLinks[j].getAttribute("data-sec") === cur2);
    }
    tick = false;
  }
  window.addEventListener("scroll", function(){ if (!tick){ tick = true; requestAnimationFrame(onScroll); } }, { passive: true });
  window.addEventListener("resize", onScroll);
  onScroll();

  /* ==========================================================
     8. SMOOTH ANCHORS + YEAR
     ========================================================== */
  document.addEventListener("click", function(e){
    var a = e.target.closest ? e.target.closest('a[href^="#"]') : null;
    if (!a) return;
    var id = a.getAttribute("href");
    if (!id || id === "#") return;
    var t = document.querySelector(id);
    if (!t) return;
    e.preventDefault();
    var top = id === "#top" ? 0 : t.getBoundingClientRect().top + window.pageYOffset - 30;
    window.scrollTo({ top: top, behavior: RM ? "auto" : "smooth" });
    if (history.replaceState) history.replaceState(null, "", id);
  });
  var yr = document.getElementById("yr");
  if (yr) yr.textContent = new Date().getFullYear();

  /* ==========================================================
     9. LANGUAGE — English / Bangla
     ========================================================== */
  var langBtn = document.getElementById("lang"),
      langLbl = document.getElementById("lang-lbl"),
      I18 = window.I18N || { text:{}, html:{}, roles:[] },
      snapshot = null;

  function takeSnapshot(){
    if (snapshot) return;
    snapshot = { text: [], html: [], title: document.title,
                 desc: (document.querySelector('meta[name="description"]')||{}).content };
    var walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
      acceptNode: function(n){
        if (!n.nodeValue || !n.nodeValue.trim()) return NodeFilter.FILTER_REJECT;
        var p = n.parentElement;
        if (!p) return NodeFilter.FILTER_REJECT;
        var tag = p.tagName;
        if (tag === "SCRIPT" || tag === "STYLE") return NodeFilter.FILTER_REJECT;
        if (p.closest("#role") || p.closest("#lang") || p.closest("#tgl")) return NodeFilter.FILTER_REJECT;
        return NodeFilter.FILTER_ACCEPT;
      }
    });
    var n;
    while ((n = walker.nextNode())) snapshot.text.push([n, n.nodeValue]);
    Object.keys(I18.html || {}).forEach(function(sel){
      var el = document.querySelector(sel);
      if (el) snapshot.html.push([el, el.innerHTML]);
    });
  }

  function applyLang(lang, save){
    takeSnapshot();
    var bn = lang === "bn";
    document.documentElement.lang = bn ? "bn" : "en";
    snapshot.html.forEach(function(pair){ pair[0].innerHTML = pair[1]; });
    snapshot.text.forEach(function(pair){ pair[0].nodeValue = pair[1]; });
    if (bn){
      Object.keys(I18.html || {}).forEach(function(sel){
        var el = document.querySelector(sel);
        if (el) el.innerHTML = I18.html[sel];
      });
      var walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
        acceptNode: function(n){
          if (!n.nodeValue || !n.nodeValue.trim()) return NodeFilter.FILTER_REJECT;
          var p = n.parentElement;
          if (!p) return NodeFilter.FILTER_REJECT;
          var tag = p.tagName;
          if (tag === "SCRIPT" || tag === "STYLE") return NodeFilter.FILTER_REJECT;
          if (p.closest("#role") || p.closest("#lang") || p.closest("#tgl")) return NodeFilter.FILTER_REJECT;
          return NodeFilter.FILTER_ACCEPT;
        }
      });
      var node, hits = [];
      while ((node = walker.nextNode())) hits.push(node);
      hits.forEach(function(n){
        var raw = n.nodeValue, key = raw.trim();
        if (I18.text && I18.text[key]){
          n.nodeValue = raw.replace(key, I18.text[key]);
        } else if (/^[0-9]+$/.test(key)){
          n.nodeValue = raw.replace(key, toBn(key));
        }
      });
      document.querySelectorAll(".st b, .fmi b").forEach(function(b){
        b.textContent = toBn(b.textContent);
      });
      if (I18.meta && I18.meta.title) document.title = I18.meta.title;
      var md = document.querySelector('meta[name="description"]');
      if (md && I18.meta && I18.meta.desc) md.content = I18.meta.desc;
    } else {
      document.title = snapshot.title;
      var md2 = document.querySelector('meta[name="description"]');
      if (md2 && snapshot.desc) md2.content = snapshot.desc;
    }
    if (window.__splitName) window.__splitName();
    if (window.__reglitch) window.__reglitch();
    if (window.__setRoles) window.__setRoles(bn ? I18.roles : null);
    if (hero){ hero.classList.add("go"); hero.classList.add("done"); }
    document.querySelectorAll("[data-count]").forEach(function(el){
      var t = el.getAttribute("data-count"), sfx = el.getAttribute("data-suffix") || "";
      if (bn && I18.suffix && I18.suffix[sfx] !== undefined) sfx = I18.suffix[sfx];
      el.textContent = (bn ? toBn(t) : t) + sfx;
    });
    if (langBtn){
      langBtn.setAttribute("aria-label", bn ? "ইংরেজিতে দেখুন" : "বাংলায় দেখুন");
      langBtn.setAttribute("lang", "bn");
    }
    if (langLbl) langLbl.textContent = bn ? "ইংরেজি" : "বাংলা";
    var lgS = document.querySelector(".lang .lg-s");
    if (lgS) lgS.textContent = bn ? "ইং" : "বাং";
    var lgTip = document.getElementById("lang-tip");
    if (lgTip) lgTip.textContent = bn ? "ইংরেজি" : "বাংলা";
    var tglTip = document.getElementById("tgl-tip");
    if (tglTip) tglTip.textContent = bn ? "থিম" : "Theme";
    if (save){ try { localStorage.setItem("sm-lang", lang); } catch (e) {} }
    onScroll();
  }

  var savedLang = null;
  try { savedLang = localStorage.getItem("sm-lang"); } catch (e) {}
  if (savedLang === "bn") applyLang("bn", false);
  else {
    if (langLbl) langLbl.textContent = "বাংলা";
    var lgS0 = document.querySelector(".lang .lg-s");
    if (lgS0) lgS0.textContent = "বাং";
  }
  if (langBtn){
    langBtn.addEventListener("click", function(){
      applyLang(document.documentElement.lang === "bn" ? "en" : "bn", true);
    });
  }

  /* ==========================================================
     10. THEME TOGGLE
     ========================================================== */
  var root = document.documentElement,
      tglBtn = document.getElementById("tgl"),
      metaTheme = document.getElementById("meta-theme"),
      BG = { dark: "#020306", light: "#FAFAF9" },
      stored = null;
  try { stored = localStorage.getItem("sm-theme"); } catch (e) {}
  function applyTheme(mode, animate){
    if (animate){
      root.classList.add("tswap");
      setTimeout(function(){ root.classList.remove("tswap"); }, 520);
    }
    root.setAttribute("data-theme", mode);
    if (metaTheme) metaTheme.setAttribute("content", BG[mode]);
    if (tglBtn){
      tglBtn.setAttribute("aria-label", mode === "dark" ? "Switch to light theme" : "Switch to dark theme");
      tglBtn.setAttribute("aria-pressed", mode === "light" ? "true" : "false");
    }
    readPalette();
  }
  if (!stored && window.matchMedia && window.matchMedia("(prefers-color-scheme: light)").matches){
    applyTheme("light", false);
  } else {
    applyTheme(root.getAttribute("data-theme") === "light" ? "light" : "dark", false);
  }
  if (tglBtn){
    tglBtn.addEventListener("click", function(){
      if (window.__smTglBusy) return; window.__smTglBusy = true;
      setTimeout(function(){ window.__smTglBusy = false; }, 120);
      var next = root.getAttribute("data-theme") === "dark" ? "light" : "dark";
      applyTheme(next, true);
      try { localStorage.setItem("sm-theme", next); } catch (e) {}
    });
  }
  if (window.matchMedia){
    var mq = window.matchMedia("(prefers-color-scheme: light)");
    var onPref = function(e){
      var saved = null;
      try { saved = localStorage.getItem("sm-theme"); } catch (err) {}
      if (!saved) applyTheme(e.matches ? "light" : "dark", true);
    };
    if (mq.addEventListener) mq.addEventListener("change", onPref);
    else if (mq.addListener) mq.addListener(onPref);
  }

  /* ==========================================================
     11. POLISH — terminal typing
     ========================================================== */
  if (!RM){
    var tb = document.querySelector(".term-b");
    if (tb && "IntersectionObserver" in window){
      var lines = Array.prototype.slice.call(tb.querySelectorAll(".l"));
      lines.forEach(function(l){ l.dataset.txt = l.innerHTML; l.innerHTML=""; });
      tb.classList.add("type-ready");
      var tio = new IntersectionObserver(function(es){
        es.forEach(function(e){
          if (e.isIntersecting){
            tio.unobserve(e.target);
            tb.classList.remove("type-ready");
            tb.classList.add("run");
            var i = 0;
            function step(){
              if (i >= lines.length) return;
              var line = lines[i];
              line.innerHTML = line.dataset.txt;
              line.classList.add("cur","on");
              i++;
              setTimeout(function(){ line.classList.remove("cur"); step(); }, 60);
            }
            step();
          }
        });
      }, { threshold: 0.18 });
      tio.observe(tb);
    }
  }
})();
