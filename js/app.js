/* WINTER ARC companion — UI. Vanilla JS, no dependencies, no network.
 * Rendering rule: user text only ever goes into the DOM through textContent / input.value (never innerHTML).
 */
(function () {
  "use strict";
  var C = window.WAContent, W = window.WACore;
  var KEY = "winterarc.v1";
  var VERSION = "1.0.0";
  var S = load();
  var tickTimer = null, breakUntil = 0;

  // ================================================================ storage
  function load() {
    try { return W.normalizeState(JSON.parse(localStorage.getItem(KEY) || "null")); }
    catch (e) { return W.defaultState(); }
  }
  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(S)); }
    catch (e) { toast("Couldn't save on this device (storage full or blocked). Export a backup."); }
  }
  function today() { return W.localISO(new Date()); }
  var EMPTY_H = [0, 0, 0, 0, 0, 0, 0];
  function getDay(iso) { return S.days[iso] || { h: EMPTY_H, lines: "", journal: "", water: 0 }; }
  function ensureDay(iso) {
    if (!S.days[iso]) S.days[iso] = { h: [0, 0, 0, 0, 0, 0, 0], lines: "", journal: "", water: 0 };
    return S.days[iso];
  }
  function isFull() { return !!S.license.kind; }
  function wakeMin() { return W.parseHHMM(S.profile.wake_time); }

  // ================================================================ DOM helpers
  function h(tag, props) {
    var el = document.createElement(tag);
    if (props) Object.keys(props).forEach(function (k) {
      var v = props[k];
      if (v == null || v === false) return;
      if (k === "class") el.className = v;
      else if (k === "text") el.textContent = v;
      else if (k === "style") Object.keys(v).forEach(function (s) { if (s.slice(0, 2) === "--") el.style.setProperty(s, v[s]); else el.style[s] = v[s]; });
      else if (k.slice(0, 2) === "on") el.addEventListener(k.slice(2), v);
      else if (k === "value") el.value = v;
      else if (k === "checked") el.checked = !!v;
      else el.setAttribute(k, v === true ? "" : v);
    });
    for (var i = 2; i < arguments.length; i++) add(el, arguments[i]);
    return el;
  }
  function add(el, c) {
    if (c == null || c === false) return;
    if (Array.isArray(c)) { c.forEach(function (x) { add(el, x); }); return; }
    el.appendChild(typeof c === "string" || typeof c === "number" ? document.createTextNode(String(c)) : c);
  }
  /** Trusted static text with **bold** markers -> nodes. */
  function rich(t) {
    return String(t).split(/(\*\*[^*]+\*\*)/).map(function (p) {
      return /^\*\*[^*]+\*\*$/.test(p) ? h("b", null, p.slice(2, -2)) : p;
    });
  }
  var SVGNS = "http://www.w3.org/2000/svg";
  function svg(tag, attrs) {
    var el = document.createElementNS(SVGNS, tag);
    Object.keys(attrs || {}).forEach(function (k) { el.setAttribute(k, attrs[k]); });
    for (var i = 2; i < arguments.length; i++) if (arguments[i]) el.appendChild(arguments[i]);
    return el;
  }
  var ICONS = {
    today: "M12 3v2M12 19v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M3 12h2M19 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4M12 8a4 4 0 100 8 4 4 0 000-8z",
    body: "M12 3c3 4 6 7.5 6 11a6 6 0 11-12 0c0-3.5 3-7 6-11z",
    focus: "M12 21a9 9 0 100-18 9 9 0 000 18zM12 7v5l3 2",
    progress: "M4 20V10M10 20V4M16 20v-7M22 20H2",
    plan: "M3 20l6-12 4 7 3-5 5 10H3z",
    gear: "M12 15a3 3 0 100-6 3 3 0 000 6zM19.4 15a1.7 1.7 0 00.3 1.8l.1.1a2 2 0 11-2.8 2.8l-.1-.1a1.7 1.7 0 00-1.8-.3 1.7 1.7 0 00-1 1.5V21a2 2 0 11-4 0v-.1a1.7 1.7 0 00-1.1-1.5 1.7 1.7 0 00-1.8.3l-.1.1a2 2 0 11-2.8-2.8l.1-.1a1.7 1.7 0 00.3-1.8 1.7 1.7 0 00-1.5-1H3a2 2 0 110-4h.1a1.7 1.7 0 001.5-1.1 1.7 1.7 0 00-.3-1.8l-.1-.1a2 2 0 112.8-2.8l.1.1a1.7 1.7 0 001.8.3H9a1.7 1.7 0 001-1.5V3a2 2 0 114 0v.1a1.7 1.7 0 001 1.5 1.7 1.7 0 001.8-.3l.1-.1a2 2 0 112.8 2.8l-.1.1a1.7 1.7 0 00-.3 1.8V9a1.7 1.7 0 001.5 1H21a2 2 0 110 4h-.1a1.7 1.7 0 00-1.5 1z",
    lock: "M6 11h12v10H6zM8 11V7a4 4 0 118 0v4",
    share: "M12 3v12M7 8l5-5 5 5M5 14v6h14v-6",
    close: "M6 6l12 12M18 6L6 18"
  };
  function icon(name) {
    return svg("svg", { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", "stroke-width": "1.8", "stroke-linecap": "round", "stroke-linejoin": "round", "aria-hidden": "true" },
      svg("path", { d: ICONS[name] }));
  }
  function card(title, kids, cls) {
    return h("section", { class: "card" + (cls ? " " + cls : "") },
      title ? h("div", { class: "card-h" }, typeof title === "string" ? h("h2", { class: "card-t", text: title }) : title) : null, kids);
  }
  function toast(msg) {
    var old = document.querySelector(".toast"); if (old) old.remove();
    var t = h("div", { class: "toast", role: "status" }, msg);
    document.body.appendChild(t);
    setTimeout(function () { t.remove(); }, 2800);
  }
  function buzz() { try { if (navigator.vibrate) navigator.vibrate(12); } catch (e) { /* ignore */ } }
  function debounce(fn, ms) { var t; return function () { var a = arguments; clearTimeout(t); t = setTimeout(function () { fn.apply(null, a); }, ms); }; }

  function openSheet(title, body, opts) {
    opts = opts || {};
    var prevFocus = document.activeElement;
    var scrim = h("div", { class: "scrim", onclick: function (e) { if (e.target === scrim) close(); } });
    var titleId = "sheet-" + Date.now();
    var sheet = h("div", { class: "sheet", role: "dialog", "aria-modal": "true", "aria-labelledby": titleId },
      h("div", { class: "sheet-grab", "aria-hidden": "true" }),
      h("div", { class: "sheet-h" }, h("h2", { class: "sheet-t", id: titleId, text: title }),
        h("button", { class: "iconbtn", "aria-label": "Close", onclick: function () { close(); } }, icon("close"))),
      body);
    scrim.appendChild(sheet);
    function onKey(e) { if (e.key === "Escape") close(); }
    function close() {
      scrim.remove(); document.removeEventListener("keydown", onKey);
      if (opts.onClose) opts.onClose();
      if (prevFocus && prevFocus.focus) try { prevFocus.focus(); } catch (e) { /* ignore */ }
    }
    document.addEventListener("keydown", onKey);
    document.body.appendChild(scrim);
    var f = sheet.querySelector("input, textarea, button.btn"); if (f && opts.autofocus) f.focus(); else sheet.querySelector(".iconbtn").focus();
    return close;
  }

  function lockCard(what) {
    return card(null, h("div", { class: "lock" }, icon("lock"),
      h("div", { class: "grow" },
        h("div", { class: "card-t" }, "Full edition"),
        h("div", { class: "sm mt-s" }, what + " come with the full edition. Enter the license key from your Gumroad receipt in Settings."),
        h("a", { class: "btn sm mt-s", href: "#/settings", style: { marginTop: "10px" } }, "Unlock"))));
  }

  // ================================================================ router + shell
  var TABS = [["today", "Today"], ["body", "Body"], ["focus", "Focus"], ["progress", "Progress"], ["plan", "Plan"]];
  function route() { var r = (location.hash || "").replace(/^#\/?/, "").split("?")[0]; return r || "today"; }
  function render(keepScroll) {
    var y = window.scrollY;
    var root = document.getElementById("app");
    root.textContent = "";
    var nav = document.getElementById("nav");
    if (!S.profile) { nav.hidden = true; root.appendChild(screenOnboarding()); window.scrollTo(0, 0); return; }
    nav.hidden = false;
    var r = route();
    var screens = { today: screenToday, body: screenBody, focus: screenFocus, progress: screenProgress, plan: screenPlan, settings: screenSettings };
    var fn = screens[r] || screenToday;
    root.appendChild(topbar(r));
    root.appendChild(fn());
    nav.querySelectorAll("a").forEach(function (a) {
      if (a.getAttribute("data-r") === r) a.setAttribute("aria-current", "page"); else a.removeAttribute("aria-current");
    });
    document.title = "Winter Arc · " + (r === "settings" ? "Settings" : (TABS.filter(function (t) { return t[0] === r; })[0] || TABS[0])[1]);
    window.scrollTo(0, keepScroll ? y : 0);
    startTick();
  }
  function topbar(r) {
    return h("header", { class: "topbar" },
      h("div", { class: "brand" }, h("b", null, "WINTER ARC"), h("span", { class: "brand-sub" }, " · " + C.BRAND)),
      r === "settings" ? h("a", { class: "iconbtn", href: "#/today", "aria-label": "Close settings" }, icon("close"))
        : h("a", { class: "iconbtn", href: "#/settings", "aria-label": "Settings" }, icon("gear")));
  }
  function buildNav() {
    var nav = document.getElementById("nav");
    var ul = h("ul");
    TABS.forEach(function (t) { ul.appendChild(h("li", null, h("a", { href: "#/" + t[0], "data-r": t[0] }, icon(t[0]), t[1]))); });
    nav.appendChild(ul);
  }

  // ================================================================ onboarding / profile form
  var FIELD_MSG = {
    name: "Enter your first name (letters only, max 30).",
    start_date: null, wake_time: "Wake time as HH:MM.",
    track: "Pick a training track.", schedule: "Pick your schedule.", goal: "Pick your main focus."
  };
  function profileForm(existing, onDone) {
    var t = today();
    var v = existing ? Object.assign({}, existing) : { name: "", start_date: t, wake_time: "06:00", track: "", schedule: "", goal: "", why: "" };
    var errBox = h("div");
    function seg(field, opts, n) {
      var wrap = h("div", { class: "seg", role: "group", "aria-label": field, style: { "--n": String(n || opts.length) } });
      opts.forEach(function (o) {
        var b = h("button", { type: "button", "aria-pressed": String(v[field] === o[0]), onclick: function () {
          v[field] = o[0];
          wrap.querySelectorAll("button").forEach(function (x) { x.setAttribute("aria-pressed", String(x === b)); });
        } }, o[1]);
        wrap.appendChild(b);
      });
      return wrap;
    }
    var whyCount = h("div", { class: "counter", "aria-live": "polite" });
    function upd() { whyCount.textContent = Array.from(v.why || "").length + " / " + W.WHY_MAX; }
    upd();
    var age = h("input", { type: "checkbox", id: "age16", checked: !!existing });
    var code = h("input", { type: "text", id: "f-code", autocomplete: "off", autocapitalize: "characters", spellcheck: "false", placeholder: "XXXXXXXX-XXXXXXXX-XXXXXXXX-XXXXXXXX" });
    var form = h("form", { novalidate: true, onsubmit: function (e) {
      e.preventDefault();
      var r = W.sanitizeIntake(v, t);
      var errs = r.errors.filter(function (er) {   // editing an arc that started >14 days ago: keep the saved date
        return !(existing && er.indexOf("start_date: must be") === 0 && v.start_date === existing.start_date);
      });
      if (!existing && !age.checked) errs.push("age");
      var msgs = errs.map(function (er) {
        var f = er.split(":")[0];
        if (f === "age") return "Confirm you're 16 or older.";
        if (f === "start_date") return er.indexOf("must be") > 0 ? "Day 1 must be between " + W.fmtW(W.addDays(t, -14)) + " and " + W.fmtW(W.addDays(t, 60)) + "." : "Pick a Day 1 date.";
        return FIELD_MSG[f] || er;
      });
      errBox.textContent = "";
      if (msgs.length) {
        errBox.appendChild(h("div", { class: "errors", role: "alert" }, "Almost there:", h("ul", null, msgs.map(function (m) { return h("li", null, m); }))));
        errBox.scrollIntoView({ block: "center" });
        return;
      }
      if (code.value.trim()) {
        var lic = W.checkLicenseOffline(code.value);
        if (lic.ok) S.license = { key: lic.key, kind: lic.kind, provisional: !!lic.provisional, at: new Date().toISOString() };
        else toast(lic.reason);
      }
      onDone(r.value);
    } },
      h("label", { class: "lbl", for: "f-name" }, "First name"),
      h("input", { type: "text", id: "f-name", autocomplete: "given-name", maxlength: "40", value: v.name, oninput: function (e) { v.name = e.target.value; } }),
      h("label", { class: "lbl", for: "f-start" }, "Day 1"),
      h("input", { type: "date", id: "f-start", value: v.start_date, min: existing ? null : W.addDays(t, -14), max: W.addDays(t, 60), onchange: function (e) { v.start_date = e.target.value; } }),
      h("label", { class: "lbl", for: "f-wake" }, "Wake-up time"),
      h("input", { type: "time", id: "f-wake", value: v.wake_time, step: "300", onchange: function (e) { v.wake_time = e.target.value; } }),
      h("div", { class: "lbl" }, "Training track"),
      seg("track", [["bodyweight", "Bodyweight"], ["gym", "Gym"]]),
      h("div", { class: "lbl" }, "Your schedule"),
      seg("schedule", [["student", "Student"], ["9-5", "9–5 job"], ["shifts", "Shift work"]]),
      h("div", { class: "lbl" }, "Main focus"),
      seg("goal", [["physique", "Physique"], ["discipline", "Discipline"], ["money", "Money"], ["mental", "Mental clarity"]], 2),
      h("label", { class: "lbl", for: "f-why" }, "Your why (optional)"),
      h("textarea", { id: "f-why", rows: "2", maxlength: "200", placeholder: "One sentence. Read it on the bad days.", value: v.why, oninput: function (e) { v.why = e.target.value; upd(); } }),
      whyCount,
      existing ? null : h("label", { class: "lbl", for: "f-code" }, "Unlock code (optional)"),
      existing ? null : code,
      existing ? null : h("div", { class: "xs mute mt-s" }, "From your Gumroad receipt. Without it you get the free edition: day counter, the Seven, quote and prompt."),
      existing ? null : h("label", { class: "check" }, age, h("span", null, "I'm 16 or older. I understand this is general education, not medical advice.")),
      errBox,
      h("button", { class: "btn primary block mt", type: "submit" }, existing ? "Save" : "Start the Arc"));
    return form;
  }
  function screenOnboarding() {
    return h("div", null,
      h("div", { class: "onb-hero" },
        h("h1", { class: "h-display" }, "Winter", h("br"), h("span", { class: "arc" }, "Arc")),
        h("div", { class: "tag" }, "ONE WEEK AT A TIME · 13 WEEKS · 7 NON-NEGOTIABLES"),
        h("p", { class: "sub mt" }, "Don't think about 90 days. Think about this week: seven habits, a floor for the bad days, and one focus. Set up your Arc. Everything stays on this phone.")),
      card("Make it yours", profileForm(null, function (val) {
        S.profile = val; save();
        try { if (navigator.storage && navigator.storage.persist) navigator.storage.persist(); } catch (e) { /* ignore */ }
        location.hash = "#/today"; render();
      })),
      h("p", { class: "xs mute mt" }, C.DISCLAIMER));
  }

  // ================================================================ TODAY
  function phaseName(p) { return p >= 1 && p <= 3 ? "Phase " + C.PHASES[p - 1].num + " · " + C.PHASES[p - 1].name : ""; }
  function screenToday() {
    var t = today(), P = S.profile, st = W.arcStatus(P.start_date, t);
    var scores = W.scoresUpTo(S, t), sk = W.computeStreak(scores, st.state === "done");
    var out = h("div");
    // hero: one week at a time
    if (st.state === "pre") {
      out.appendChild(h("div", { class: "hero" },
        h("div", { class: "hero-lbl" }, "WEEK 1 STARTS IN"),
        h("div", { class: "hero-day" }, h("div", { class: "hero-n" }, String(st.daysToStart)), h("div", { class: "hero-of" }, st.daysToStart === 1 ? "DAY" : "DAYS")),
        h("div", { class: "hero-phase" }, W.fmtLong(P.start_date)),
        h("div", { class: "wk-name" }, C.WEEKS[0].name),
        h("p", { class: "wk-focus" }, C.WEEKS[0].focus)));
      out.appendChild(card("Before Day 1", h("ul", { class: "tight" },
        h("li", null, "Pick a wake time you can keep on Saturdays too. Yours: " + P.wake_time + "."),
        h("li", null, "Buy a cheap alarm clock. The phone charges outside the bedroom."),
        h("li", null, "Day 1: take the baseline test (Progress → Baseline)."),
        h("li", null, "Define The Build: one project you'll ship at the end."),
        h("li", null, "Don't think about 90 days. Think about this week."))));
      out.appendChild(sevenRef());
    } else if (st.state === "done") {
      out.appendChild(h("div", { class: "hero" },
        h("div", { class: "hero-lbl" }, "ARC COMPLETE"),
        h("div", { class: "hero-day" }, h("div", { class: "hero-n" }, "13"), h("div", { class: "hero-of" }, "/13 WEEKS")),
        h("div", { class: "hero-phase" }, W.fmtShort(P.start_date) + " – " + W.fmtLong(st.day90)),
        h("div", { class: "bar" }, h("i", { style: { width: "100%" } }))));
      out.appendChild(card("Graduation", [
        h("p", { class: "sm" }, "Nobody saw the work. Everyone sees the result. Retest the baseline, read your first journal entry, and decide what stays for Day 91."),
        h("div", { class: "btns" }, isFull() ? h("button", { class: "btn primary", onclick: function () { shareImage("certificate"); } }, "Graduation certificate") : h("a", { class: "btn", href: "#/settings" }, "Unlock certificate"),
          h("a", { class: "btn", href: "#/progress" }, "See progress"))], "accent"));
    } else {
      var n = st.day, wi = W.weekInfo(n), wk = wi.week;
      var head = weekHeader(t, st, sk);
      out.appendChild(head);
      if (sk.atRisk) {
        out.appendChild(card(null, [h("div", { class: "card-t" }, h("b", null, "Never miss twice")),
          h("p", { class: "sm", style: { margin: "8px 0 0" } }, "Yesterday slipped. That's noise. Today decides it: hit at least 5 of 7, floors count. Your streak is still alive.")], "warn"));
      }
      out.appendChild(habitsCard(t, function () { var nh = weekHeader(t, st, W.computeStreak(W.scoresUpTo(S, t))); head.replaceWith(nh); head = nh; renderWeekMoment(); }));
      var momentSlot = h("div");
      out.appendChild(momentSlot);
      function renderWeekMoment() {
        momentSlot.textContent = "";
        if (!wi.isLastDay) return;
        var heldToday = W.habitScore(getDay(t).h) >= W.HELD_MIN, rev = S.reviews[wk];
        if (heldToday) {
          momentSlot.appendChild(card(null, [h("div", { class: "card-t" }, h("b", null, "Week " + wk + " complete")),
            h("div", { class: "h-display", style: { fontSize: "34px", margin: "8px 0 4px" } }, wk === 13 ? "The Arc is done." : "One week down."),
            h("p", { class: "sm dim", style: { margin: 0 } }, "Close it properly: ten honest minutes of review." + (wk < 13 ? " Next week's focus is revealed when you finish." : "")),
            h("div", { class: "btns" },
              h("button", { class: "btn primary", onclick: function () { openReview(wk); } }, rev && rev.done ? "Edit review" : "Weekly review"),
              isFull() ? h("button", { class: "btn", onclick: function () { shareImage("week"); } }, icon("share"), "Share week") : null)], "accent"));
        } else {
          momentSlot.appendChild(card(null, [h("div", { class: "card-t" }, h("b", null, "Last day of week " + wk)),
            h("p", { class: "sm" }, "Hold today (5 of 7) to close the week. Then the weekly review: ten honest minutes."),
            h("button", { class: "btn sm", onclick: function () { openReview(wk); } }, "Weekly review")], "accent"));
        }
        if (rev && rev.done && wk < 13) momentSlot.appendChild(nextWeekCard(wk + 1));
      }
      renderWeekMoment();
      if (W.isCheckpoint(n)) out.appendChild(card(null, [h("div", { class: "card-t" }, h("b", null, n === 1 ? "Baseline day" : "Checkpoint")),
        h("p", { class: "sm" }, n === 1 ? "Take your baseline today. You'll retest at the checkpoints." : "Retest the baseline under the same conditions as your first test."),
        h("a", { class: "btn sm", href: "#/progress?baseline" }, "Open baseline test")], "accent"));
      out.appendChild(isFull() ? workoutCard(n) : lockCard("Workout of the day, your personal plan and share cards"));
    }
    // quote + prompt (free)
    var q = W.quoteFor(st.day, t);
    out.appendChild(card("Quote of the day", [h("blockquote", { class: "quote", style: { margin: 0 } }, q.text), h("div", { class: "quote-src" }, "— " + q.src)]));
    var pn = st.state === "active" ? st.day : st.state === "pre" ? 1 : 90;
    out.appendChild(journalCard(t, pn, st.state));
    if (st.state === "active") {
      out.appendChild(h("div", { class: "btns" },
        isFull() ? h("button", { class: "btn", onclick: function () { shareImage("story"); } }, icon("share"), "Share card") : null,
        h("a", { class: "btn", href: "#/focus" }, "Start a deep block")));
    }
    return out;
  }

  /** Points this week so far vs. possible for the whole week (floors count). */
  function weekPoints(w) {
    var P = S.profile, r = W.weekRange(w), pts = 0;
    for (var d = r[0]; d <= r[1]; d++) { var e = S.days[W.dateOfDay(P.start_date, d)]; if (e) pts += W.habitScore(e.h); }
    return { pts: pts, max: (r[1] - r[0] + 1) * 7 };
  }
  function weekHeader(t, st, sk) {
    var P = S.profile, n = st.day, wi = W.weekInfo(n), wk = wi.week, info = C.WEEKS[wk - 1], wp = weekPoints(wk);
    var pct = Math.round(wp.pts / wp.max * 100);
    var strip = h("ol", { class: "wstrip", "aria-label": "This week" });
    for (var d = wi.first; d <= wi.last; d++) {
      var iso = W.dateOfDay(P.start_date, d), sc = W.habitScore(getDay(iso).h), cls;
      if (d > n) cls = "future";
      else if (d === n) cls = "today" + (sc >= 7 ? " full" : sc >= W.HELD_MIN ? " held" : "");
      else cls = sk.states[d - 1] || "miss";
      var lbl = d > n ? "upcoming" : d === n ? "today, " + sc + " of 7" : { full: "7 of 7", held: "held, " + sc + " of 7", slip: "slip, survived", miss: "missed" }[cls] || "";
      strip.appendChild(h("li", { class: "wd " + cls, "aria-label": W.weekdayLong(iso) + ": " + lbl },
        h("span", { class: "wd-l", "aria-hidden": "true" }, "MTWTFSS"[W.weekday(iso)]),
        h("span", { class: "wd-dot", "aria-hidden": "true" }, d < n || (d === n && sc >= W.HELD_MIN) ? (cls.indexOf("slip") >= 0 ? "–" : cls.indexOf("miss") >= 0 ? "×" : "✓") : String(+iso.slice(8)))));
    }
    return h("div", { class: "hero" },
      h("div", { class: "row between" }, h("div", { class: "hero-phase", style: { marginTop: 0 } }, phaseName(st.phase)),
        h("div", { class: "chips", style: { marginTop: 0 } }, h("span", { class: "chip ice" }, "STREAK ", h("b", null, String(sk.current))))),
      h("div", { class: "hero-day mt-s" }, h("div", { class: "hero-n", "aria-label": "Week " + wk + " of 13" }, "WEEK " + wk), h("div", { class: "hero-of", "aria-hidden": "true" }, "/13")),
      h("div", { class: "hero-sub" }, "Day " + wi.dayInWeek + " of " + wi.daysInWeek + " · " + W.fmtW(t)),
      h("div", { class: "wk-name" }, info.name),
      h("p", { class: "wk-focus" }, info.focus),
      h("div", { class: "wbar-h" }, h("span", null, "This week"), h("span", null, h("b", null, wp.pts + " / " + wp.max), " habits · " + pct + "%")),
      h("div", { class: "bar wbar", role: "progressbar", "aria-label": "This week's habits", "aria-valuemin": "0", "aria-valuemax": String(wp.max), "aria-valuenow": String(wp.pts) },
        h("i", { style: { width: pct + "%" } }),
        h("span", { class: "wbar-t", style: { left: C.PHASES[st.phase - 1].target + "%" }, "aria-hidden": "true" })),
      strip,
      h("div", { class: "arcbar", "aria-label": "Whole arc " + Math.round(st.pct * 100) + " percent" },
        h("span", null, "Arc"), h("div", { class: "bar thin" }, h("i", { style: { width: (st.pct * 100).toFixed(1) + "%" } })), h("span", null, Math.round(st.pct * 100) + "%")));
  }
  function nextWeekCard(w) {
    var r = W.weekRange(w), info = C.WEEKS[w - 1];
    return card(null, [h("div", { class: "card-t" }, "Up next · ", h("b", null, "Week " + w)),
      h("div", { class: "h-display", style: { fontSize: "30px", margin: "8px 0 4px" } }, info.name),
      h("p", { class: "sm", style: { margin: 0 } }, info.focus),
      h("p", { class: "xs mute", style: { margin: "8px 0 0" } }, "Starts " + W.fmtW(W.dateOfDay(S.profile.start_date, r[0])) + ". One week at a time.")]);
  }

  function habitsCard(iso, onAnyChange) {
    var d = getDay(iso), score = W.habitScore(d.h);
    var scoreEl = h("div", { class: "score", "aria-live": "polite" }, String(score), h("small", null, "/7"));
    var list = h("ul", { class: "habits" });
    C.SEVEN.forEach(function (hb, i) {
      list.appendChild(habitRow(iso, i, hb, function () {
        var s = W.habitScore(getDay(iso).h);
        scoreEl.firstChild.textContent = String(s);
        if (onAnyChange) onAnyChange();
      }));
    });
    return card(h("div", { class: "row between grow" }, h("h2", { class: "card-t" }, "The Seven"), scoreEl),
      [list, h("p", { class: "hint" }, "Tap = standard. Long-press or FLOOR = the minimum (still counts). 5+ holds the day.")]);
  }
  function habitRow(iso, i, hb, onChange) {
    var li = h("li", { class: "habit", "data-v": String(getDay(iso).h[i]) });
    var desc = h("span", { class: "h-desc" });
    var main = h("button", { class: "h-main", type: "button" }, h("span", { class: "h-mark", "aria-hidden": "true" }),
      h("span", { class: "h-txt" }, h("span", { class: "h-name" }, hb.name), desc));
    var floorBtn = h("button", { class: "h-floor", type: "button" }, "Floor");
    function paint() {
      var v = getDay(iso).h[i];
      li.setAttribute("data-v", String(v));
      desc.textContent = v === 1 ? "Floor: " + hb.floor : hb.std;
      main.setAttribute("aria-label", hb.name + ": " + (v === 2 ? "standard done" : v === 1 ? "floor done" : "not done") + ". Tap to toggle standard.");
      floorBtn.setAttribute("aria-pressed", String(v === 1));
      floorBtn.setAttribute("aria-label", hb.name + " floor: " + hb.floor);
    }
    function set(v) {
      var d = ensureDay(iso); d.h[i] = v; save(); buzz(); paint(); onChange();
    }
    // long-press = floor
    var timer = null, longFired = false, sx = 0, sy = 0;
    main.addEventListener("pointerdown", function (e) {
      longFired = false; sx = e.clientX; sy = e.clientY;
      clearTimeout(timer);
      timer = setTimeout(function () { longFired = true; set(getDay(iso).h[i] === 1 ? 0 : 1); }, 480);
    });
    ["pointerup", "pointercancel", "pointerleave"].forEach(function (ev) { main.addEventListener(ev, function () { clearTimeout(timer); }); });
    main.addEventListener("pointermove", function (e) { if (Math.abs(e.clientX - sx) > 10 || Math.abs(e.clientY - sy) > 10) clearTimeout(timer); });
    main.addEventListener("contextmenu", function (e) { e.preventDefault(); });
    main.addEventListener("click", function (e) {
      if (longFired) { e.preventDefault(); longFired = false; return; }
      set(getDay(iso).h[i] === 2 ? 0 : 2);
    });
    floorBtn.addEventListener("click", function () { set(getDay(iso).h[i] === 1 ? 0 : 1); });
    paint();
    li.appendChild(main); li.appendChild(floorBtn);
    return li;
  }

  function journalCard(iso, n, state) {
    var d = getDay(iso);
    var saved = h("div", { class: "saved", "aria-live": "polite" });
    var persist = debounce(function (field, val) { ensureDay(iso)[field] = val; save(); saved.textContent = "Saved on this device"; }, 400);
    var prompt = W.promptFor(n, wakeMin());
    return card(h("h2", { class: "card-t" }, state === "pre" ? "First prompt · preview" : "Today's prompt"), [
      h("p", { class: "prompt", style: { margin: "0 0 12px" } }, prompt),
      state === "pre" ? null : h("label", { class: "lbl", for: "j-ans", style: { marginTop: 0 } }, "Your answer"),
      state === "pre" ? null : h("textarea", { id: "j-ans", rows: "4", value: d.journal, placeholder: "Five lines at most.", oninput: function (e) { persist("journal", e.target.value); } }),
      state === "pre" ? null : h("label", { class: "lbl", for: "j-lines" }, "3 lines · Done / Didn't / Tomorrow's first move"),
      state === "pre" ? null : h("textarea", { id: "j-lines", rows: "3", value: d.lines, placeholder: "Done:\nDidn't:\nTomorrow's first move:", oninput: function (e) { persist("lines", e.target.value); } }),
      saved]);
  }

  function workoutCard(n) {
    var wo = W.workoutFor(S.profile.track, S.profile.start_date, n);
    if (!wo) return h("div");
    return card(h("h2", { class: "card-t" }, "Workout · ", h("b", null, C.TRACK_LABEL[S.profile.track]), " · " + wo.weekday), [
      h("div", { class: "h-display", style: { fontSize: "30px", marginBottom: "8px" } }, wo.title),
      h("div", null, wo.ex.map(function (e) { return h("div", { class: "ex" }, h("span", null, e[0]), h("span", null, e[1])); })),
      h("details", { class: "mt-s" }, h("summary", null, "Notes, warm-up & safety"),
        h("ul", { class: "tight" }, wo.notes.concat([C.PAIN_RULE]).map(function (x) { return h("li", null, x); })))]);
  }

  function sevenRef() {
    return card("The Seven · standard / floor", h("div", { class: "seven-ref" }, C.SEVEN.map(function (s) {
      return h("div", { class: "s" }, h("div", { class: "h-name" }, s.n + " " + s.name), h("div", { class: "sm" }, s.std), h("div", { class: "sm dim" }, "Floor: " + s.floor));
    })));
  }

  // ================================================================ BODY
  function screenBody() {
    var t = today(), d = getDay(t), out = h("div");
    out.appendChild(h("h1", { class: "screen-title" }, "Body"));
    out.appendChild(h("p", { class: "sub" }, "Water, sleep and cold. Simple numbers, logged honestly."));
    // water
    var target = S.settings.waterMl, glasses = Math.round(target / 250);
    var w = d.water || 0;
    var gl = h("div", { class: "glasses", "aria-hidden": "true" });
    for (var i = 0; i < Math.max(glasses, Math.ceil(w / 250)); i++) gl.appendChild(h("i", { class: "glass" + (i < w / 250 ? " on" : "") }));
    function water(delta) { var x = ensureDay(t); x.water = Math.max(0, Math.min(10000, (x.water || 0) + delta)); save(); buzz(); render(true); }
    out.appendChild(card("Water", [
      h("div", { class: "big-num" }, (w / 1000).toFixed(w % 1000 ? 2 : 1).replace(/0$/, ""), h("small", null, " / " + (target / 1000) + " L")), gl,
      h("div", { class: "btns" }, h("button", { class: "btn", onclick: function () { water(-250); }, "aria-label": "Remove 250 millilitres" }, "−250 ml"),
        h("button", { class: "btn primary", onclick: function () { water(250); }, "aria-label": "Add a 250 millilitre glass" }, "+ Glass 250 ml"))]));
    // sleep
    var sl = d.sleep || {};
    var bed = h("input", { type: "time", id: "s-bed", value: sl.bed || W.hhmm(W.bedtime(wakeMin())) });
    var wk = h("input", { type: "time", id: "s-wake", value: sl.wake || S.profile.wake_time });
    var hrs = W.sleepHours(sl.bed, sl.wake);
    var avg = avgSleep(t, 7);
    out.appendChild(card("Sleep · last night", [
      h("div", { class: "row between" }, h("div", { class: "big-num" }, hrs == null ? "—" : String(hrs), h("small", null, " h")),
        h("div", { class: "sm dim", style: { textAlign: "right" } }, "7-day avg", h("br"), h("b", { style: { color: "var(--text)" } }, avg == null ? "—" : avg.toFixed(1) + " h"))),
      h("div", { class: "grid2" }, h("div", null, h("label", { class: "lbl", for: "s-bed" }, "Lights out"), bed), h("div", null, h("label", { class: "lbl", for: "s-wake" }, "Woke up"), wk)),
      h("button", { class: "btn block mt", onclick: function () {
        var b = W.parseWake(bed.value), k = W.parseWake(wk.value);
        if (!b || !k) { toast("Enter both times."); return; }
        ensureDay(t).sleep = { bed: b, wake: k }; save(); toast("Sleep logged: " + W.sleepHours(b, k) + " h"); render(true);
      } }, sl.bed ? "Update" : "Log sleep"),
      h("p", { class: "note" }, "7–9 hours. Anchor the wake time; bedtime follows. Yours: lights out " + W.hhmm(W.bedtime(wakeMin())) + ".")]));
    // cold
    var cold = d.cold || { done: false, sec: 0 };
    function setCold(sec) { ensureDay(t).cold = { done: sec > 0, sec: sec }; save(); buzz(); render(true); }
    out.appendChild(card(h("h2", { class: "card-t" }, "Cold exposure · ", h("b", null, "optional, not scored")), [
      h("div", { class: "row between" }, h("div", { class: "big-num" }, cold.done ? fmtSec(cold.sec) : "—"), cold.done ? h("button", { class: "btn sm ghost", onclick: function () { setCold(0); } }, "Clear") : null),
      h("div", { class: "seg mt-s", style: { "--n": "4" } }, [15, 30, 60, 120].map(function (s) {
        return h("button", { type: "button", "aria-pressed": String(cold.sec === s), onclick: function () { setCold(s); } }, fmtSec(s));
      })),
      h("p", { class: "xs dim mt-s" }, "Cold finish on your shower. Weeks 1–2: 15–30 s · 3–4: 60 s · 5–8: 2 min. Calm breathing is the skill."),
      h("details", null, h("summary", null, "Safety. Read before you try any cold."), h("p", { class: "sm dim" }, C.COLD_SAFETY))]));
    // food
    out.appendChild(S.settings.food ? foodCard(t) : card("Food counter", [
      h("p", { class: "sm dim", style: { marginTop: 0 } }, "Optional and off. The protocol works without counting anything: protein at every meal, plants twice a day, 2–3 L of water."),
      h("a", { class: "btn sm", href: "#/settings" }, "Settings")]));
    return out;
  }
  function fmtSec(s) { return s < 60 ? s + " s" : (s / 60) + " min"; }
  function avgSleep(iso, n) {
    var tot = 0, c = 0;
    for (var i = 0; i < n; i++) { var d = S.days[W.addDays(iso, -i)]; if (d && d.sleep) { tot += W.sleepHours(d.sleep.bed, d.sleep.wake); c++; } }
    return c ? tot / c : null;
  }

  function allFoods() { return S.customFoods.concat(C.FOODS); }
  function foodCard(iso) {
    var d = getDay(iso), entries = d.food || [], tot = W.sumFood(entries);
    var pt = W.proteinTarget(S.settings.weightKg);
    var list = h("div", { class: "food-list", role: "list" });
    var search = h("input", { type: "search", placeholder: "Search " + allFoods().length + " foods", "aria-label": "Search foods", oninput: fill });
    function fill() {
      var q = search.value.trim().toLowerCase();
      list.textContent = "";
      allFoods().filter(function (f) { return !q || f.name.toLowerCase().indexOf(q) >= 0; }).slice(0, 80).forEach(function (f) {
        list.appendChild(h("button", { class: "food-btn", role: "listitem", onclick: function () { openFood(iso, f); } },
          h("span", null, f.name, f.custom ? h("span", { class: "xs mute" }, " · yours") : null, h("br"), h("span", { class: "xs dim" }, f.portion + " · " + f.portionG + " g")),
          h("span", { class: "xs mono dim", style: { textAlign: "right", whiteSpace: "nowrap" } }, f.kcal100 + " kcal", h("br"), f.p100 + " g P /100 g")));
      });
    }
    fill();
    return card(h("h2", { class: "card-t" }, "Food · ", h("b", null, "neutral log")), [
      h("div", { class: "grid2" },
        h("div", { class: "stat" }, h("div", { class: "stat-n" }, String(tot.kcal)), h("div", { class: "stat-l" }, "kcal logged")),
        h("div", { class: "stat" }, h("div", { class: "stat-n" }, String(tot.p), h("small", null, pt ? " / " + pt + " g" : " g")), h("div", { class: "stat-l" }, pt ? "protein · 1.6 g/kg" : "protein"))),
      entries.length ? h("ul", { class: "list mt-s" }, entries.map(function (e, i) {
        return h("li", null, h("div", { class: "grow sm" }, e.name, h("div", { class: "xs dim" }, e.g + " g · " + e.kcal + " kcal · " + e.p + " g protein")),
          h("button", { class: "x-btn", "aria-label": "Remove " + e.name, onclick: function () { var x = ensureDay(iso); x.food.splice(i, 1); save(); render(true); } }, "×"));
      })) : h("p", { class: "sm dim" }, "Nothing logged today."),
      h("label", { class: "lbl" }, "Quick add"), search, list,
      h("div", { class: "btns" }, h("button", { class: "btn sm", onclick: openCustomFood }, "+ Custom food")),
      h("p", { class: "xs mute mt-s" }, "Values per 100 g: USDA FoodData Central (public domain), rounded. Your pack's label wins."),
      h("details", null, h("summary", null, "If tracking food doesn't feel good"), h("p", { class: "sm dim" }, C.ED_NOTE))]);
  }
  function openFood(iso, f) {
    var grams = h("input", { type: "number", inputmode: "decimal", min: "1", max: "5000", value: String(f.portionG), id: "fd-g" });
    var prev = h("div", { class: "sm dim mt-s", "aria-live": "polite" });
    function upd() { var n = W.portionNutrition(f, grams.value); prev.textContent = n ? n.kcal + " kcal · " + n.p + " g protein" : "Enter grams (1–5000)."; }
    grams.addEventListener("input", upd); upd();
    var close = openSheet(f.name, h("div", null,
      h("p", { class: "sm dim" }, "Per 100 g: " + f.kcal100 + " kcal · " + f.p100 + " g protein"),
      h("div", { class: "seg", style: { "--n": "3" } },
        [[f.portionG, "1 × " + f.portion], [f.portionG * 2, "2 ×"], [100, "100 g"]].map(function (o) {
          return h("button", { type: "button", onclick: function () { grams.value = String(o[0]); upd(); } }, o[1]);
        })),
      h("label", { class: "lbl", for: "fd-g" }, "Grams"), grams, prev,
      h("button", { class: "btn primary block mt", onclick: function () {
        var n = W.portionNutrition(f, grams.value);
        if (!n) { toast("Enter grams (1–5000)."); return; }
        var d = ensureDay(iso); d.food = d.food || [];
        d.food.push({ name: f.name, g: Math.round(Number(grams.value)), kcal: n.kcal, p: n.p }); save(); close(); render(true);
      } }, "Add")));
  }
  function openCustomFood() {
    var v = {};
    function inp(id, label, type, ph) {
      return [h("label", { class: "lbl", for: id }, label), h("input", { id: id, type: type, inputmode: type === "number" ? "decimal" : null, placeholder: ph || "", oninput: function (e) { v[id] = e.target.value; } })];
    }
    var close = openSheet("Custom food", h("div", null,
      inp("cf-name", "Name", "text", "e.g. Mum's lasagne"), inp("cf-k", "kcal per 100 g", "number", "from the label"),
      inp("cf-p", "Protein per 100 g (g)", "number"), inp("cf-g", "Typical portion (g)", "number", "100"),
      h("button", { class: "btn primary block mt", onclick: function () {
        var name = W.cleanText(v["cf-name"] || "").slice(0, 60), k = Number(v["cf-k"]), p = Number(v["cf-p"] || 0), g = Number(v["cf-g"] || 100);
        if (!name || !(k >= 0 && k <= 1000) || !(p >= 0 && p <= 100) || !(g >= 1 && g <= 2000)) { toast("Check the name and numbers (kcal 0–1000, protein 0–100 per 100 g)."); return; }
        S.customFoods.unshift({ id: "c_" + Date.now().toString(36), name: name, kcal100: k, p100: p, portionG: g, portion: g + " g", custom: true });
        save(); close(); render(true);
      } }, "Save food")), { autofocus: true });
  }

  // ================================================================ FOCUS
  var PRESETS = [
    { id: "p25", t: "Pomodoro", s: "25 min · 5 break", m: 25, brk: 5 },
    { id: "p50", t: "Long pomodoro", s: "50 min · 10 break", m: 50, brk: 10 },
    { id: "d90", t: "Deep block", s: "90 min · the standard", m: 90, brk: 0 },
    { id: "open", t: "Open", s: "counts up", m: null, brk: 0 }
  ];
  var focusSel = { k: "deep", preset: "d90" };
  function elapsedMs(a) { return a.accum + (a.paused ? 0 : Date.now() - a.startedAt); }
  function fmtClock(ms) {
    var s = Math.max(0, Math.round(ms / 1000)), hh = Math.floor(s / 3600), mm = Math.floor(s % 3600 / 60), ss = s % 60;
    return (hh ? hh + ":" + String(mm).padStart(2, "0") : String(mm).padStart(2, "0")) + ":" + String(ss).padStart(2, "0");
  }
  function totalHours(k) { return S.focus.sessions.filter(function (x) { return x.k === k; }).reduce(function (a, x) { return a + x.m; }, 0) / 60; }
  function logSession(k, minutes) {
    var t = today();
    S.focus.sessions.push({ d: t, k: k, m: minutes, at: Date.now() });
    if (k === "deep") {                                     // FOCUS habit: 25 min = floor, 60 min = standard
      var mins = S.focus.sessions.filter(function (x) { return x.d === t && x.k === "deep"; }).reduce(function (a, x) { return a + x.m; }, 0);
      var d = ensureDay(t), want = mins >= 60 ? 2 : mins >= 25 ? 1 : 0;
      if (want > d.h[2]) d.h[2] = want;
    }
    save();
  }
  function beep() {
    try {
      var A = window.AudioContext || window.webkitAudioContext; if (!A) return;
      var ctx = new A(), o = ctx.createOscillator(), g = ctx.createGain();
      o.frequency.value = 660; g.gain.value = 0.08; o.connect(g); g.connect(ctx.destination); o.start(); o.stop(ctx.currentTime + 0.35);
    } catch (e) { /* ignore */ }
    try { if (navigator.vibrate) navigator.vibrate([120, 80, 120]); } catch (e) { /* ignore */ }
  }
  function screenFocus() {
    var out = h("div"), a = S.focus.active;
    var deepH = totalHours("deep"), freeH = totalHours("free");
    var st = W.arcStatus(S.profile.start_date, today());
    var pace = st.state === "active" ? 100 * st.day / 90 : st.state === "done" ? 100 : 0;
    out.appendChild(h("h1", { class: "screen-title" }, "Focus"));
    out.appendChild(h("p", { class: "sub" }, "Phone in another room. One task, written on paper. A timer."));
    out.appendChild(card(h("h2", { class: "card-t" }, "Deep work · ", h("b", null, "100+ hours by Day 90")), [
      h("div", { class: "row between" }, h("div", { class: "big-num" }, deepH.toFixed(1), h("small", null, " / 100 h")),
        h("div", { class: "sm dim", style: { textAlign: "right" } }, "Phone-free", h("br"), h("b", { style: { color: "var(--text)" } }, freeH.toFixed(1) + " h"))),
      h("div", { class: "bar" }, h("i", { style: { width: Math.min(100, deepH) + "%" } })),
      h("div", { class: "countdown" }, h("span", null, "Pace for 100 h: ", h("b", null, pace.toFixed(0) + " h")), h("span", null, deepH >= pace ? "On pace" : (pace - deepH).toFixed(1) + " h behind"))]));

    // timer
    var timerCard;
    if (a) {
      var planned = a.planned ? a.planned * 60000 : null;
      timerCard = card(null, [
        h("div", { class: "timer-lbl" }, (a.k === "deep" ? "Deep work" : "Phone-free") + (a.label ? " · " + a.label : "") + (a.paused ? " · paused" : "")),
        h("div", { class: "timer", "data-timer": "1", role: "timer", "aria-live": "off" }, fmtClock(planned ? planned - elapsedMs(a) : elapsedMs(a))),
        planned ? h("div", { class: "bar" }, h("i", { "data-timerbar": "1", style: { width: Math.min(100, elapsedMs(a) / planned * 100) + "%" } })) : null,
        h("div", { class: "btns" },
          h("button", { class: "btn", onclick: function () {
            if (a.paused) { a.startedAt = Date.now(); a.paused = false; } else { a.accum = elapsedMs(a); a.paused = true; }
            save(); render(true);
          } }, a.paused ? "Resume" : "Pause"),
          h("button", { class: "btn primary", onclick: function () { finishTimer(false); } }, "Stop & log")),
        h("button", { class: "btn ghost block mt-s", onclick: function () { if (confirm("Discard this timer without logging it?")) { S.focus.active = null; save(); render(true); } } }, "Discard")], "accent");
    } else if (breakUntil > Date.now()) {
      timerCard = card(null, [h("div", { class: "timer-lbl" }, "Break"), h("div", { class: "timer", "data-break": "1" }, fmtClock(breakUntil - Date.now())),
        h("p", { class: "sm dim", style: { textAlign: "center" } }, "Stand up. Water. Look out of a window. No feeds."),
        h("button", { class: "btn block", onclick: function () { breakUntil = 0; render(true); } }, "Skip break")], "accent");
    } else {
      var kseg = h("div", { class: "seg", style: { "--n": "2" } }, [["deep", "Deep work"], ["free", "Phone-free"]].map(function (o) {
        return h("button", { type: "button", "aria-pressed": String(focusSel.k === o[0]), onclick: function () { focusSel.k = o[0]; render(true); } }, o[1]);
      }));
      var pre = h("div", { class: "presets mt-s" }, PRESETS.map(function (p) {
        return h("button", { type: "button", "aria-pressed": String(focusSel.preset === p.id), onclick: function () { focusSel.preset = p.id; render(true); } }, h("b", null, p.t), h("span", null, p.s));
      }));
      timerCard = card("Timer", [kseg, pre,
        h("button", { class: "btn primary block mt", onclick: function () {
          var p = PRESETS.filter(function (x) { return x.id === focusSel.preset; })[0];
          S.focus.active = { k: focusSel.k, planned: p.m, startedAt: Date.now(), accum: 0, paused: false, label: p.t, brk: p.brk };
          save(); render(true);
        } }, "Start"),
        h("p", { class: "xs mute mt-s" }, "The timer keeps running if you lock the phone or switch apps. Logging 25 min of deep work ticks FOCUS at floor level, 60 min at standard.")]);
    }
    out.appendChild(timerCard);

    // today's sessions + manual add
    var t = today(), todays = S.focus.sessions.filter(function (x) { return x.d === t; });
    var mins = h("input", { type: "number", inputmode: "numeric", min: "1", max: "600", placeholder: "minutes", "aria-label": "Minutes", id: "m-min" });
    out.appendChild(card("Today", [
      todays.length ? h("ul", { class: "list" }, todays.map(function (x) {
        return h("li", null, h("span", { class: "grow sm" }, x.k === "deep" ? "Deep work" : "Phone-free"), h("span", { class: "mono sm" }, x.m + " min"));
      })) : h("p", { class: "sm dim", style: { marginTop: 0 } }, "No blocks yet. Output before input."),
      h("div", { class: "row mt-s" }, h("div", { class: "grow" }, mins),
        h("button", { class: "btn sm", onclick: function () {
          var m = Math.round(Number(mins.value)); if (!(m >= 1 && m <= 600)) { toast("1–600 minutes."); return; }
          logSession(focusSel.k, m); toast("Logged " + m + " min."); render(true);
        } }, "+ Log " + (focusSel.k === "deep" ? "deep" : "phone-free")))]));
    out.appendChild(card("Block protocol", h("ul", { class: "tight" },
      h("li", null, "Before: write the single outcome of this block. \"Write the pricing page\", not \"work on the site\"."),
      h("li", null, "Phone in another room. One app full screen."),
      h("li", null, "Mind drifts? Write the thought on a \"later\" list and go back. Returning is the skill."),
      h("li", null, "Shutdown ritual: tomorrow's Block 1 outcome on paper, close every tab."))));
    return out;
  }
  function finishTimer(auto) {
    var a = S.focus.active; if (!a) return;
    var ms = elapsedMs(a), m = a.planned && auto ? a.planned : Math.round(ms / 60000);
    S.focus.active = null;
    if (m >= 1) { logSession(a.k, m); toast("Logged " + m + " min of " + (a.k === "deep" ? "deep work" : "phone-free time") + "."); }
    else { save(); toast("Under a minute, not logged."); }
    if (auto && a.brk) breakUntil = Date.now() + a.brk * 60000;
    if (auto) beep();
    if (route() === "focus" || route() === "today") render(true);
  }
  function startTick() {
    clearInterval(tickTimer);
    if (!S.focus.active && !(breakUntil > Date.now())) return;
    tickTimer = setInterval(function () {
      var a = S.focus.active;
      if (a) {
        if (a.planned && !a.paused && elapsedMs(a) >= a.planned * 60000) { finishTimer(true); return; }
        var el = document.querySelector("[data-timer]");
        if (el) el.textContent = fmtClock(a.planned ? a.planned * 60000 - elapsedMs(a) : elapsedMs(a));
        var bar = document.querySelector("[data-timerbar]");
        if (bar && a.planned) bar.style.width = Math.min(100, elapsedMs(a) / (a.planned * 60000) * 100) + "%";
      } else if (breakUntil) {
        var b = document.querySelector("[data-break]");
        if (Date.now() >= breakUntil) { breakUntil = 0; beep(); toast("Break over. Next block."); if (route() === "focus") render(true); clearInterval(tickTimer); }
        else if (b) b.textContent = fmtClock(breakUntil - Date.now());
      } else clearInterval(tickTimer);
    }, 1000);
  }

  // ================================================================ PROGRESS
  function screenProgress() {
    var t = today(), P = S.profile, st = W.arcStatus(P.start_date, t);
    var scores = W.scoresUpTo(S, t), sk = W.computeStreak(scores, st.state === "done");
    var out = h("div");
    out.appendChild(h("h1", { class: "screen-title" }, "Progress"));
    out.appendChild(h("p", { class: "sub" }, "Track it or it didn't happen. An honest 4/7 beats an imagined 7/7."));
    var finals = st.state === "done" ? scores : scores.slice(0, -1);   // today is still in progress
    var held = finals.filter(function (s) { return s >= W.HELD_MIN; }).length;
    var pts = scores.reduce(function (a, b) { return a + b; }, 0);
    out.appendChild(h("div", { class: "stats" },
      stat(String(sk.current), "current streak"), stat(String(sk.best), "best streak"),
      stat(scores.length ? Math.round(pts / (scores.length * 7) * 100) + "%" : "—", "habit score"),
      stat(totalHours("deep").toFixed(0), "deep-work h")));
    // calendar
    var cal = h("div", { class: "cal", role: "grid", "aria-label": "90-day calendar" });
    for (var w = 1; w <= 13; w++) {
      cal.appendChild(h("div", { class: "cal-w", "aria-hidden": "true" }, "W" + String(w).padStart(2, "0")));
      for (var c = 0; c < 7; c++) {
        var n = (w - 1) * 7 + c + 1;
        if (n > 90) { cal.appendChild(h("div")); continue; }
        var cls = "cell", label;
        if (n > scores.length) { cls += " future"; label = "upcoming"; }
        else {
          var s = sk.states[n - 1];
          cls += " " + (s === "today" ? "today" : s);
          label = { full: "7/7", held: "held", slip: "slip, survived", miss: "missed", today: "today, in progress" }[s] + " (" + scores[n - 1] + "/7)";
        }
        cal.appendChild(h("div", { class: cls, role: "gridcell", "aria-label": "Day " + n + " " + W.fmtShort(W.dateOfDay(P.start_date, n)) + ": " + label, title: "Day " + n + " · " + W.fmtW(W.dateOfDay(P.start_date, n)) }, String(n)));
      }
    }
    out.appendChild(card(h("h2", { class: "card-t" }, "90 days · ", h("b", null, held + " held")), [cal,
      h("div", { class: "legend" }, legend("var(--ice)", "7/7"), legend("var(--ice-dim)", "5–6 held"), legend("transparent", "slip (survived)", "1px dashed var(--warn)"),
        legend("#1a1014", "missed twice", "1px solid #3a2228")),
      h("p", { class: "note" }, "Never miss twice: one bad day (4/7 or less) is a slip and your streak survives it. Two in a row resets it.")]));
    // charts
    var weeks = [];
    for (var wk = 1; wk <= Math.min(13, Math.ceil(Math.max(scores.length, 1) / 7)); wk++) {
      var ws = W.weekScore(scores, wk);
      var r = W.weekRange(wk), daysIn = Math.max(0, Math.min(r[1], scores.length) - r[0] + 1);
      weeks.push({ label: "W" + wk, v: daysIn ? Math.round(ws.points / (daysIn * 7) * 100) : 0 });
    }
    out.appendChild(card("Habits · weekly %", barChart(weeks, 100, "%", st.phase >= 1 && st.phase <= 3 ? C.PHASES[st.phase - 1].target : 80)));
    var deepW = [];
    for (var k = 1; k <= Math.max(1, weeks.length); k++) {
      var rg = W.weekRange(k), sum = 0;
      S.focus.sessions.forEach(function (x) { var dn = W.dayNumber(P.start_date, x.d); if (x.k === "deep" && dn >= rg[0] && dn <= rg[1]) sum += x.m; });
      deepW.push({ label: "W" + k, v: Math.round(sum / 6) / 10 });
    }
    out.appendChild(card("Deep work · hours per week", barChart(deepW, Math.max(12, Math.ceil(Math.max.apply(null, deepW.map(function (x) { return x.v; })) / 2) * 2), " h", null)));
    var sleepPts = [];
    for (var i = 27; i >= 0; i--) {
      var iso = W.addDays(t, -i), dd = S.days[iso];
      sleepPts.push({ label: W.fmtShort(iso), v: dd && dd.sleep ? W.sleepHours(dd.sleep.bed, dd.sleep.wake) : null });
    }
    out.appendChild(card("Sleep · last 28 days", sleepChart(sleepPts)));
    // reviews
    var curWeek = st.state === "pre" ? 0 : st.state === "done" ? 13 : st.week;
    var rl = h("ul", { class: "list" });
    for (var rw = 1; rw <= curWeek; rw++) (function (rw) {
      var rr = W.weekRange(rw), ws2 = W.weekScore(scores, rw), rev = S.reviews[rw];
      rl.appendChild(h("li", null, h("div", { class: "grow" }, h("div", { class: "h-name" }, "WEEK " + String(rw).padStart(2, "0")),
        h("div", { class: "xs dim" }, "Days " + rr[0] + "–" + rr[1] + " · " + W.fmtShort(W.dateOfDay(P.start_date, rr[0])) + " – " + W.fmtShort(W.dateOfDay(P.start_date, rr[1])) + " · " + ws2.points + "/" + ws2.max)),
        h("button", { class: "btn sm" + (rev && rev.done ? " ghost" : ""), onclick: function () { openReview(rw); } }, rev && rev.done ? "Edit" : "Review")));
    })(rw);
    out.appendChild(card("Weekly reviews", curWeek ? rl : h("p", { class: "sm dim", style: { margin: 0 } }, "Your first review is on Day 7.")));
    out.appendChild(baselineCard(st));
    out.appendChild(card("Share", isFull() ? h("div", { class: "btns", style: { marginTop: 0 } },
      h("button", { class: "btn", disabled: st.state !== "active" ? true : null, onclick: function () { shareImage("story"); } }, icon("share"), "Story card"),
      h("button", { class: "btn", disabled: st.day < 90 ? true : null, onclick: function () { shareImage("certificate"); } }, st.day < 90 ? "Certificate · Day 90" : "Certificate"))
      : h("p", { class: "sm dim", style: { margin: 0 } }, "Story cards and the Day-90 certificate come with the full edition.")));
    if (location.hash.indexOf("baseline") > 0) setTimeout(function () { var b = document.getElementById("baseline"); if (b) b.scrollIntoView(); }, 0);
    return out;
  }
  function stat(n, l) { return h("div", { class: "stat" }, h("div", { class: "stat-n" }, n), h("div", { class: "stat-l" }, l)); }
  function legend(bg, label, border) { return h("span", null, h("i", { style: { background: bg, border: border || "0" } }), label); }

  function barChart(data, max, unit, target) {
    var Wd = 340, Ht = 150, pl = 26, pb = 18, pt = 14, n = Math.max(data.length, 1);
    var bw = Math.min(22, (Wd - pl) / n - 4), step = (Wd - pl) / n;
    var tip = h("div", { class: "chart-tip", "aria-live": "polite" }, "Tap a bar for the value.");
    var g = svg("svg", { class: "chart", viewBox: "0 0 " + Wd + " " + Ht, role: "img", "aria-label": "Bar chart" });
    [0, 0.5, 1].forEach(function (f) {
      var y = pt + (Ht - pb - pt) * (1 - f);
      g.appendChild(svg("line", { x1: pl, x2: Wd, y1: y, y2: y, stroke: "#1f2731", "stroke-width": "1" }));
      var tx = svg("text", { x: 0, y: y + 3 }); tx.textContent = Math.round(max * f) + (f === 1 ? unit.trim() : ""); g.appendChild(tx);
    });
    if (target) {
      var ty = pt + (Ht - pb - pt) * (1 - target / max);
      g.appendChild(svg("line", { x1: pl, x2: Wd, y1: ty, y2: ty, stroke: "#cfe3f3", "stroke-width": "1", "stroke-dasharray": "3 4", opacity: ".6" }));
      var tt = svg("text", { x: Wd, y: ty - 4, "text-anchor": "end" }); tt.textContent = "target " + target + unit; g.appendChild(tt);
    }
    data.forEach(function (d, i) {
      var x = pl + i * step + (step - bw) / 2, hgt = Math.max(0, (Ht - pb - pt) * Math.min(d.v, max) / max), y = Ht - pb - hgt;
      var r = Math.min(4, hgt / 2, bw / 2);
      var path = hgt > 0 ? "M" + x + "," + (Ht - pb) + "V" + (y + r) + "Q" + x + "," + y + " " + (x + r) + "," + y + "H" + (x + bw - r) + "Q" + (x + bw) + "," + y + " " + (x + bw) + "," + (y + r) + "V" + (Ht - pb) + "Z" : "";
      var grp = svg("g", { tabindex: "0", role: "button", "aria-label": d.label + ": " + d.v + unit });
      grp.appendChild(svg("rect", { x: pl + i * step, y: pt, width: step, height: Ht - pb - pt, fill: "transparent" }));   // hit target
      if (path) grp.appendChild(svg("path", { d: path, fill: "#a9d4f5", opacity: i === data.length - 1 ? "1" : ".78" }));
      var lb = svg("text", { x: x + bw / 2, y: Ht - 4, "text-anchor": "middle" }); lb.textContent = d.label; grp.appendChild(lb);
      function show() { tip.textContent = d.label + " · " + d.v + unit; }
      grp.addEventListener("click", show); grp.addEventListener("mouseenter", show); grp.addEventListener("focus", show);
      g.appendChild(grp);
    });
    if (data.length) { var last = data[data.length - 1]; tip.textContent = "Latest: " + last.label + " · " + last.v + unit; }
    return [g, tip, dataTable(data, unit)];
  }
  function sleepChart(pts) {
    var Wd = 340, Ht = 150, pl = 26, pb = 18, pt = 10, lo = 4, hi = 10;
    var tip = h("div", { class: "chart-tip", "aria-live": "polite" });
    var g = svg("svg", { class: "chart", viewBox: "0 0 " + Wd + " " + Ht, role: "img", "aria-label": "Sleep hours, last 28 days" });
    function Y(v) { return pt + (Ht - pb - pt) * (1 - (Math.max(lo, Math.min(hi, v)) - lo) / (hi - lo)); }
    function X(i) { return pl + (Wd - pl - 6) * i / (pts.length - 1); }
    g.appendChild(svg("rect", { x: pl, y: Y(9), width: Wd - pl, height: Y(7) - Y(9), fill: "#a9d4f5", opacity: ".08" }));
    [4, 7, 9, 10].forEach(function (v) {
      g.appendChild(svg("line", { x1: pl, x2: Wd, y1: Y(v), y2: Y(v), stroke: "#1f2731" }));
      var tx = svg("text", { x: 0, y: Y(v) + 3 }); tx.textContent = v + (v === 10 ? "h" : ""); g.appendChild(tx);
    });
    var d = "", seg = false, logged = 0;
    pts.forEach(function (p, i) {
      if (p.v == null) { seg = false; return; }
      d += (seg ? "L" : "M") + X(i).toFixed(1) + "," + Y(p.v).toFixed(1); seg = true; logged++;
    });
    if (d) g.appendChild(svg("path", { d: d, fill: "none", stroke: "#a9d4f5", "stroke-width": "2", "stroke-linejoin": "round", "stroke-linecap": "round" }));
    pts.forEach(function (p, i) {
      if (p.v == null) return;
      var grp = svg("g", { tabindex: "0", role: "button", "aria-label": p.label + ": " + p.v + " h" });
      grp.appendChild(svg("rect", { x: X(i) - 6, y: pt, width: 12, height: Ht - pb - pt, fill: "transparent" }));
      grp.appendChild(svg("circle", { cx: X(i), cy: Y(p.v), r: "4", fill: "#a9d4f5", stroke: "#0b0f14", "stroke-width": "2" }));
      function show() { tip.textContent = p.label + " · " + p.v + " h"; }
      grp.addEventListener("click", show); grp.addEventListener("mouseenter", show); grp.addEventListener("focus", show);
      g.appendChild(grp);
    });
    [0, pts.length - 1].forEach(function (i) { var tx = svg("text", { x: X(i), y: Ht - 4, "text-anchor": i ? "end" : "start" }); tx.textContent = pts[i].label; g.appendChild(tx); });
    tip.textContent = logged ? "Band = 7–9 h. Tap a dot for the value." : "Log sleep on the Body tab to see the trend.";
    return [g, tip, dataTable(pts.filter(function (p) { return p.v != null; }), " h")];
  }
  function dataTable(data, unit) {
    return h("details", null, h("summary", null, "Show as table"),
      h("table", { class: "tbl" }, h("tbody", null, data.map(function (d) { return h("tr", null, h("td", null, d.label), h("td", { class: "mono" }, d.v + unit)); }))));
  }

  function openReview(w) {
    var t = today(), P = S.profile, rg = W.weekRange(w), scores = W.scoresUpTo(S, t), ws = W.weekScore(scores, w);
    var rev = Object.assign({ wins: "", brk: "", next: "", screen: "", energy: "" }, S.reviews[w] || {});
    var deep = 0, sessions = 0, sl = 0, sc = 0;
    S.focus.sessions.forEach(function (x) { var dn = W.dayNumber(P.start_date, x.d); if (x.k === "deep" && dn >= rg[0] && dn <= rg[1]) deep += x.m; });
    for (var d = rg[0]; d <= rg[1]; d++) {
      var rec = S.days[W.dateOfDay(P.start_date, d)];
      if (rec && rec.h[1] === 2) sessions++;
      if (rec && rec.sleep) { sl += W.sleepHours(rec.sleep.bed, rec.sleep.wake); sc++; }
    }
    function ta(id, label, field) {
      return [h("label", { class: "lbl", for: id }, label), h("textarea", { id: id, rows: "3", value: rev[field], oninput: function (e) { rev[field] = e.target.value; } })];
    }
    var body = h("div");
    var close = openSheet("Week " + String(w).padStart(2, "0") + " review", body, { onClose: function () { render(true); } });
    add(body, [
      h("p", { class: "wk-name", style: { marginTop: 0 } }, C.WEEKS[w - 1].name),
      h("p", { class: "sm dim", style: { marginTop: "4px" } }, "Days " + rg[0] + "–" + rg[1] + " · " + W.fmtShort(W.dateOfDay(P.start_date, rg[0])) + " – " + W.fmtShort(W.dateOfDay(P.start_date, rg[1]))),
      h("div", { class: "stats" }, stat(ws.points + "/" + ws.max, Math.round(ws.pct * 100) + "% score"), stat(String(sessions), "MOVE standard days"),
        stat((deep / 60).toFixed(1), "deep-work h"), stat(sc ? (sl / sc).toFixed(1) : "—", "avg sleep h")),
      h("div", { class: "grid2" },
        h("div", null, h("label", { class: "lbl", for: "rv-screen" }, "Screen time / day"), h("input", { id: "rv-screen", type: "text", placeholder: "2:45", value: rev.screen, oninput: function (e) { rev.screen = e.target.value; } })),
        h("div", null, h("label", { class: "lbl", for: "rv-energy" }, "Energy /10"), h("input", { id: "rv-energy", type: "number", inputmode: "numeric", min: "1", max: "10", value: rev.energy, oninput: function (e) { rev.energy = e.target.value; } }))),
      ta("rv-wins", "3 wins", "wins"), ta("rv-brk", "Where did I break? Trigger → what I did → fix", "brk"), ta("rv-next", "Next week: one priority · Hard Thing · one adjustment", "next"),
      h("button", { class: "btn primary block mt", onclick: function () {
        rev.done = true; S.reviews[w] = W.normalizeState({ reviews: (function () { var o = {}; o[w] = rev; return o; })() }).reviews[w];
        save(); buzz();
        body.textContent = "";                               // reveal: next week's focus (one week at a time)
        add(body, [h("div", { class: "card-t", style: { marginTop: "6px" } }, h("b", null, "Week " + w + " closed")),
          h("p", { class: "sm dim" }, w < 13 ? "Saved on this device. Here is what's next. Nothing further ahead matters yet." : "Saved. Thirteen weeks. Built in silence."),
          w < 13 ? nextWeekCard(w + 1) : null,
          h("button", { class: "btn primary block mt", onclick: function () { close(); } }, w < 13 ? "Got it" : "Close")]);
      } }, "Save review")]);
  }

  function baselineCard(st) {
    var tb = h("table", { class: "tbl base-tbl" },
      h("thead", null, h("tr", null, h("th", null, "Test"), C.CHECKPOINTS.map(function (cp) {
        return h("th", { style: { textAlign: "center" } }, "D" + cp, h("br"), h("span", { class: "mute" }, W.fmtShort(W.dateOfDay(S.profile.start_date, cp))));
      }))),
      h("tbody", null, C.BASELINE.map(function (t) {
        return h("tr", null, h("td", null, h("b", null, t.name), h("div", { class: "xs dim" }, t.unit)),
          C.CHECKPOINTS.map(function (cp) {
            var cur = (S.baseline[t.id] || {})[cp] || "";
            return h("td", null, h("input", { type: "text", inputmode: t.unit === "min:sec" || t.unit === "h:min" ? "text" : "decimal", value: cur, maxlength: "12",
              "aria-label": t.name + " Day " + cp, disabled: st.day < cp && st.state !== "done" ? true : null,
              onchange: function (e) { S.baseline[t.id] = S.baseline[t.id] || {}; S.baseline[t.id][cp] = W.cleanText(e.target.value).slice(0, 12); save(); toast("Saved."); } }));
          }));
      })));
    return h("section", { class: "card", id: "baseline" }, h("div", { class: "card-h" }, h("h2", { class: "card-t" }, "Baseline · Days 1 / 30 / 60 / 90")),
      h("p", { class: "sm dim", style: { marginTop: 0 } }, "Same time of day, same route, same shoes. One number is information, not a verdict. Every test is optional."),
      h("div", { style: { overflowX: "auto" } }, tb));
  }

  // ================================================================ PLAN
  function screenPlan() {
    var out = h("div"), P = S.profile, sd = P.start_date;
    out.appendChild(h("h1", { class: "screen-title" }, "Plan"));
    out.appendChild(h("p", { class: "sub" }, isFull() ? "Built around your dates, your wake time and your training." : "The protocol. Your personal plan comes with the full edition."));
    if (!isFull()) {
      out.appendChild(sevenRef());
      out.appendChild(codeCard());
      out.appendChild(lockCard("Your contract, personal day plan, dated phases, workouts"));
      return out;
    }
    var wake = wakeMin(), reviewDay = W.weekdayLong(W.dateOfDay(sd, 7));
    var st = W.arcStatus(sd, today()), n = st.state === "pre" ? 0 : st.state === "done" ? 90 : st.day;
    var curW = n ? W.arcWeek(n) : 1;
    out.appendChild(card("The contract", [
      h("div", { class: "contract-t" }, "I, " + P.name + ", commit to the next 13 weeks. One week at a time."),
      h("p", { class: "sm" }, "I will keep the Seven. On bad days I will keep the minimums. If I miss a day, I will not miss two. I will track honestly, even when the numbers are ugly. I will not announce this. I will let the work speak."),
      P.why ? h("p", { class: "why" }, "\u201C" + P.why + "\u201D") : null,
      h("div", { class: "kv mt" }, h("div", null, "Week 1 starts"), h("div", null, W.fmtLong(sd))),
      h("div", { class: "kv" }, h("div", null, "Week 13 ends"), h("div", null, W.fmtLong(W.dateOfDay(sd, 90))))], "accent"));
    // weeks: only reached weeks (+ next one once this week's review is done) are shown
    var showUpTo = curW + (S.reviews[curW] && S.reviews[curW].done && curW < 13 ? 1 : 0);
    var wl = h("div");
    for (var w = 1; w <= showUpTo; w++) (function (w) {
      var r = W.weekRange(w), info = C.WEEKS[w - 1], wp = weekPoints(w);
      var tag = w < curW || st.state === "done" ? Math.round(wp.pts / wp.max * 100) + "%" : w === curW ? "now" : "next";
      wl.appendChild(h("div", { class: "wk" + (w === curW && st.state === "active" ? " cur" : "") }, h("div", null, "W" + w),
        h("div", null, h("div", { class: "row between" }, h("b", null, info.name), h("span", { class: "xs mono " + (tag === "now" ? "" : "dim") }, tag)),
          h("div", { class: "xs mono dim" }, W.fmtShort(W.dateOfDay(sd, r[0])) + " – " + W.fmtShort(W.dateOfDay(sd, r[1]))),
          w >= curW ? h("div", { class: "sm dim" }, info.focus) : null)));
    })(w);
    if (showUpTo < 13) wl.appendChild(h("div", { class: "wk locked" }, h("div", null, "W" + (showUpTo + 1) + (showUpTo + 1 < 13 ? "+" : "")),
      h("div", { class: "sm mute" }, "Revealed one week at a time, after your weekly review.")));
    out.appendChild(card("Your weeks", wl));
    out.appendChild(card("Your setup", [
      kv("Wake / lights out", P.wake_time + " / " + W.hhmm(W.bedtime(wake))), kv("Training", C.TRACK_LABEL[P.track] + " track"),
      kv("Schedule", C.SCHEDULE_LABEL[P.schedule]), kv("Emphasis", C.GOAL_LABEL[P.goal]), kv("Weekly review", "every " + reviewDay),
      kv("Next checkpoint", (function () { var c = C.CHECKPOINTS.filter(function (x) { return x >= Math.max(n, 1); })[0]; return c ? W.fmtW(W.dateOfDay(sd, c)) + " · retest the baseline" : "all done"; })())]));
    out.appendChild(card("Your emphasis · " + C.GOAL_LABEL[P.goal], h("p", { class: "sm", style: { margin: 0 } }, C.GOAL_NOTES[P.goal])));
    out.appendChild(card("Your schedule · " + C.SCHEDULE_LABEL[P.schedule], h("p", { class: "sm", style: { margin: 0 } }, C.SCHEDULE_NOTES[P.schedule])));
    out.appendChild(card("Your day · " + P.wake_time + " wake-up", [h("div", { class: "timeline" }, W.dayRows(wake, P.schedule).map(function (r) {
      return h("div", { class: "t-row" }, h("div", { class: "t-time" }, r[0]), h("div", null, h("div", { class: "t-name" }, r[1]), h("div", { class: "t-d" }, r[2])));
    })), h("p", { class: "note" }, "A template, not a cage. Keep the order: wake, output before input, move, fuel, shut down, sleep.")]));
    // phases: current (and past) in full, future ones only as a date
    C.PHASES.forEach(function (ph, i) {
      var reached = n >= ph.from || (i === 0);
      if (!reached) {
        out.appendChild(card(null, h("div", { class: "lock" }, icon("lock"), h("div", null, h("div", { class: "card-t" }, "Phase " + ph.num),
          h("div", { class: "sm dim" }, "Unlocks " + W.fmtW(W.dateOfDay(sd, ph.from)) + ". Stay in this week.")))));
        return;
      }
      var past = n > ph.to;
      var body = [h("div", { class: "h-display", style: { fontSize: "28px" } }, ph.tagline), h("p", { class: "sm dim" }, ph.intro),
        h("ul", { class: "tight" }, ph.rules.map(function (r) { return h("li", null, r); })), h("p", { class: "note" }, ph.check)];
      var title = h("h2", { class: "card-t" }, "Phase " + ph.num + " · ", h("b", null, ph.name), " · " + W.fmtShort(W.dateOfDay(sd, ph.from)) + " – " + W.fmtShort(W.dateOfDay(sd, ph.to)));
      out.appendChild(past ? card(null, h("details", null, h("summary", null, "Phase " + ph.num + " · " + ph.name + " · done"), body)) : card(title, body));
    });
    out.appendChild(sevenRef());
    out.appendChild(codeCard());
    out.appendChild(card("When it breaks", C.BREAKS.map(function (b) { return kv(b[0], b[1]); })));
    out.appendChild(card("Training · " + C.TRACK_LABEL[P.track], h("ul", { class: "tight" },
      h("li", null, "Double progression: hit the top of the rep range on every set, then add load or move up the ladder."),
      h("li", null, "Reps in reserve: Phase I 2–3, Phases II–III 1–2."), h("li", null, "Form before load. Log every session; beat one number."),
      P.track === "bodyweight" ? h("li", null, C.BW.ladders) : h("li", null, "Bench and squat in a rack with safeties set, or with a spotter."),
      h("li", null, C.WARMUP), h("li", null, C.MOBILITY), h("li", null, C.PAIN_RULE))));
    return out;
  }
  function kv(k, v) { return h("div", { class: "kv" }, h("div", null, k), h("div", null, v)); }
  function codeCard() {
    return card("The Code", C.CODE.map(function (c) { return h("div", { class: "kv" }, h("div", null, c[0]), h("div", null, h("b", null, c[1]), h("div", { class: "sm dim" }, c[2]))); }));
  }

  // ================================================================ SETTINGS
  function screenSettings() {
    var out = h("div"), P = S.profile;
    out.appendChild(h("h1", { class: "screen-title" }, "Settings"));
    out.appendChild(card("Your Arc", [kv("Name", P.name), kv("Day 1", W.fmtLong(P.start_date)), kv("Wake", P.wake_time),
      kv("Track", C.TRACK_LABEL[P.track]), kv("Schedule", C.SCHEDULE_LABEL[P.schedule]), kv("Focus", C.GOAL_LABEL[P.goal]),
      h("button", { class: "btn block mt", onclick: function () {
        var close = openSheet("Edit your Arc", profileForm(P, function (val) { S.profile = val; save(); close(); toast("Saved."); render(true); }));
      } }, "Edit")]));
    // edition
    var codeIn = h("input", { type: "text", id: "lic", autocomplete: "off", autocapitalize: "characters", spellcheck: "false", placeholder: "XXXXXXXX-XXXXXXXX-XXXXXXXX-XXXXXXXX" });
    var msg = h("div", { class: "sm mt-s", "aria-live": "polite" });
    out.appendChild(card("Edition", isFull() ? [
      h("p", { class: "sm", style: { marginTop: 0 } }, h("b", null, "Full edition"), " · unlocked on this device" + (S.license.provisional ? " (key format checked offline)." : ".")),
      h("p", { class: "xs mute mono" }, maskKey(S.license.key)),
      h("button", { class: "btn sm ghost", onclick: function () { if (confirm("Remove the license from this device?")) { S.license = W.defaultState().license; save(); render(true); } } }, "Remove license")
    ] : [
      h("p", { class: "sm", style: { marginTop: 0 } }, "Free edition: day counter, the Seven, streaks, quote, prompt, body, focus and progress. The full edition adds your personal plan, workout of the day, share cards and the Day-90 certificate."),
      h("label", { class: "lbl", for: "lic" }, "License key or ARC code"), codeIn, msg,
      h("button", { class: "btn primary block mt", onclick: function () {
        var ids = C.GUMROAD_PRODUCT_IDS || [];
        W.verifyLicense(codeIn.value, ids.length ? { serverCheck: W.gumroadCheck(ids, fetch.bind(window)) } : {}).then(function (r) {
          msg.textContent = r.reason;
          if (r.ok) { S.license = { key: r.key, kind: r.kind, provisional: !!r.provisional, at: new Date().toISOString() }; save(); toast("Full edition unlocked."); render(true); }
        });
      } }, "Unlock")]));
    // food
    var wIn = h("input", { type: "number", inputmode: "decimal", id: "bw", min: "30", max: "300", placeholder: "optional", value: S.settings.weightKg == null ? "" : String(S.settings.weightKg) });
    out.appendChild(card("Food counter", [
      h("label", { class: "check", style: { marginTop: 0 } }, h("input", { type: "checkbox", checked: S.settings.food, onchange: function (e) {
        S.settings.food = e.target.checked; save(); render(true);
      } }), h("span", null, h("b", { style: { color: "var(--text)" } }, "Show the calorie + protein counter"), h("br"), "Off by default. Neutral log only: no targets for calories, no weight goals, no judgement.")),
      S.settings.food ? [h("label", { class: "lbl", for: "bw" }, "Bodyweight in kg (optional, for a protein suggestion)"), wIn,
        h("button", { class: "btn sm mt-s", onclick: function () {
          var v = wIn.value.trim() === "" ? null : Number(wIn.value);
          if (v != null && !(v >= 30 && v <= 300)) { toast("30–300 kg, or leave it empty."); return; }
          S.settings.weightKg = v; save(); toast(v ? "Protein suggestion: " + W.proteinTarget(v) + " g/day (1.6 g/kg)." : "Cleared."); render(true);
        } }, "Save")] : null,
      h("p", { class: "note" }, C.ED_NOTE)]));
    out.appendChild(card("Water target", h("div", { class: "seg", style: { "--n": "3" } }, [2000, 2500, 3000].map(function (ml) {
      return h("button", { type: "button", "aria-pressed": String(S.settings.waterMl === ml), onclick: function () { S.settings.waterMl = ml; save(); render(true); } }, (ml / 1000) + " L");
    }))));
    // backup
    var file = h("input", { type: "file", accept: "application/json,.json", class: "sr-only", id: "imp", onchange: function (e) { importFile(e.target.files[0]); e.target.value = ""; } });
    out.appendChild(card("Backup", [
      h("p", { class: "sm dim", style: { marginTop: 0 } }, "Your data lives only on this device. Export a backup file now and then (and before switching phones)."),
      h("div", { class: "btns" }, h("button", { class: "btn", onclick: exportData }, "Export JSON"), h("label", { class: "btn", for: "imp" }, "Import JSON")), file]));
    out.appendChild(card("Privacy", h("p", { class: "sm", style: { margin: 0 } }, C.PRIVACY)));
    out.appendChild(card("Safety", h("p", { class: "sm dim", style: { margin: 0 } }, C.DISCLAIMER)));
    out.appendChild(card("Credits", h("ul", { class: "tight xs dim" },
      h("li", null, "Quotes: original Built in Silence lines; Marcus Aurelius and Epictetus in George Long's public-domain translations; Seneca lines are this app's own rendering of the Latin. Each quote names its source."),
      h("li", null, "Food values: USDA FoodData Central (public domain), rounded."),
      h("li", null, "Display font: Anton, SIL Open Font License 1.1 (fonts/OFL.txt)."),
      h("li", null, "Version " + VERSION + ". Works offline. No accounts, no analytics."))));
    out.appendChild(card("Reset", [h("p", { class: "sm dim", style: { marginTop: 0 } }, "Deletes everything on this device: profile, habits, journal, timers, tests. Export first if you want to keep it."),
      h("button", { class: "btn danger block", onclick: openReset }, "Reset all data")]));
    return out;
  }
  function maskKey(k) { return k ? k.slice(0, 4) + "…" + k.slice(-4) : ""; }
  function exportData() {
    var payload = JSON.stringify({ app: "winter-arc", v: 1, exportedAt: new Date().toISOString(), data: S }, null, 1);
    var name = "winter-arc-backup-" + today() + ".json";
    var blob = new Blob([payload], { type: "application/json" });
    try {
      var f = new File([blob], name, { type: "application/json" });
      if (navigator.canShare && navigator.canShare({ files: [f] }) && /iPhone|iPad|Android/i.test(navigator.userAgent)) {
        navigator.share({ files: [f], title: "Winter Arc backup" }).catch(function () { /* cancelled */ });
        return;
      }
    } catch (e) { /* fall through to download */ }
    var a = h("a", { href: URL.createObjectURL(blob), download: name });
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 4000);
    toast("Backup saved: " + name);
  }
  function importFile(f) {
    if (!f) return;
    if (f.size > 8 * 1024 * 1024) { toast("That file is too big to be a Winter Arc backup."); return; }
    var r = new FileReader();
    r.onload = function () {
      var obj;
      try { obj = JSON.parse(r.result); } catch (e) { toast("Not a valid JSON file."); return; }
      if (!obj || obj.app !== "winter-arc") { toast("That isn't a Winter Arc backup."); return; }
      var ns = W.normalizeState(obj);
      if (!ns.profile) { toast("The backup has no valid profile."); return; }
      if (!confirm("Replace the data on this device with the backup from " + String(obj.exportedAt || "").slice(0, 10) + "?")) return;
      S = ns; save(); toast("Backup restored."); location.hash = "#/today"; render();
    };
    r.readAsText(f);
  }
  function openReset() {
    var inp = h("input", { type: "text", id: "rst", autocomplete: "off", autocapitalize: "characters", placeholder: "RESET" });
    var close = openSheet("Reset", h("div", null, h("p", { class: "sm" }, "This permanently deletes all Winter Arc data on this device. Type RESET to confirm."),
      inp, h("button", { class: "btn danger block mt", onclick: function () {
        if (inp.value.trim().toUpperCase() !== "RESET") { toast("Type RESET to confirm."); return; }
        try { localStorage.removeItem(KEY); } catch (e) { /* ignore */ }
        S = W.defaultState(); close(); location.hash = "#/today"; render();
      } }, "Delete everything")), { autofocus: true });
  }

  // ================================================================ SHARE IMAGES (canvas, local only)
  function mountains(ctx, Wd, base, scale) {
    var layers = [
      { c: "#0f161e", pts: [[0, 0.62], [0.12, 0.5], [0.22, 0.58], [0.36, 0.38], [0.5, 0.55], [0.62, 0.44], [0.78, 0.6], [0.9, 0.47], [1, 0.56]] },
      { c: "#141d27", pts: [[0, 0.8], [0.18, 0.62], [0.3, 0.72], [0.46, 0.55], [0.6, 0.7], [0.74, 0.6], [0.88, 0.74], [1, 0.66]] }
    ];
    layers.forEach(function (L, li) {
      ctx.beginPath(); ctx.moveTo(0, base + scale);
      L.pts.forEach(function (p) { ctx.lineTo(p[0] * Wd, base + p[1] * scale - scale * 0.5); });
      ctx.lineTo(Wd, base + scale); ctx.closePath(); ctx.fillStyle = L.c; ctx.fill();
      if (li === 0) {                                     // frosted peaks
        ctx.strokeStyle = "rgba(207,227,243,.35)"; ctx.lineWidth = 3; ctx.beginPath();
        L.pts.forEach(function (p, i) { var x = p[0] * Wd, y = base + p[1] * scale - scale * 0.5; if (i) ctx.lineTo(x, y); else ctx.moveTo(x, y); });
        ctx.stroke();
      }
    });
  }
  function bg(ctx, Wd, Ht) {
    var g = ctx.createLinearGradient(0, 0, 0, Ht); g.addColorStop(0, "#07090c"); g.addColorStop(1, "#0b1118");
    ctx.fillStyle = g; ctx.fillRect(0, 0, Wd, Ht);
    var r = ctx.createRadialGradient(Wd * 0.9, Ht * 0.05, 10, Wd * 0.9, Ht * 0.05, Wd * 1.1);
    r.addColorStop(0, "rgba(169,212,245,.22)"); r.addColorStop(1, "rgba(169,212,245,0)");
    ctx.fillStyle = r; ctx.fillRect(0, 0, Wd, Ht);
  }
  function spaced(ctx, text, x, y, spacing, align) {
    var w = 0, chars = Array.from(text);
    chars.forEach(function (ch) { w += ctx.measureText(ch).width + spacing; }); w -= spacing;
    var cx = align === "center" ? x - w / 2 : x;
    ctx.textAlign = "left";
    chars.forEach(function (ch) { ctx.fillText(ch, cx, y); cx += ctx.measureText(ch).width + spacing; });
  }
  var DISPLAY = "Anton, Impact, 'Arial Narrow', sans-serif";
  var MONO = "ui-monospace, Menlo, Consolas, monospace";
  function drawStory(done) {
    var t = today(), P = S.profile, st = W.arcStatus(P.start_date, t), n = Math.max(1, Math.min(90, st.day));
    var wi = W.weekInfo(n), wk = wi.week, info = C.WEEKS[wk - 1];
    var sk = W.computeStreak(W.scoresUpTo(S, t), st.state === "done");
    var cv = document.createElement("canvas"); cv.width = 1080; cv.height = 1920;
    var x = cv.getContext("2d");
    bg(x, 1080, 1920); mountains(x, 1080, 1500, 520);
    x.fillStyle = "#95a3b3"; x.font = "600 30px " + MONO; spaced(x, "WINTER ARC", 540, 200, 14, "center");
    x.fillStyle = "#a9d4f5"; x.font = "600 34px " + MONO; spaced(x, "WEEK", 540, 470, 22, "center");
    x.fillStyle = "#e8eef4"; x.font = "400 420px " + DISPLAY; x.textAlign = "center"; x.fillText(String(wk), 540, 870);
    x.fillStyle = "#4f7590"; x.font = "400 110px " + DISPLAY; x.fillText("/ 13", 540, 1010);
    if (done) {
      x.lineWidth = 4; x.strokeStyle = "#cfe3f3"; x.font = "400 150px " + DISPLAY; x.strokeText("DONE", 540, 1185);
    } else {
      x.fillStyle = "#cfe3f3"; x.font = "400 76px " + DISPLAY; x.fillText(info.name.toUpperCase(), 540, 1130, 940);
      x.fillStyle = "#a9d4f5"; x.font = "600 30px " + MONO; spaced(x, "DAY " + wi.dayInWeek + " OF " + wi.daysInWeek, 540, 1190, 10, "center");
    }
    // the week's days as 7 blocks
    var bw = 96, gap = 18, tot = wi.daysInWeek * bw + (wi.daysInWeek - 1) * gap, x0 = 540 - tot / 2;
    for (var d = wi.first; d <= wi.last; d++) {
      var sc = W.habitScore(getDay(W.dateOfDay(P.start_date, d)).h), bx = x0 + (d - wi.first) * (bw + gap);
      x.fillStyle = d > n ? "#151b23" : sc >= 7 ? "#a9d4f5" : sc >= W.HELD_MIN ? "#4f7590" : "#1f2731";
      x.fillRect(bx, 1250, bw, 64);
    }
    x.fillStyle = "#e8eef4"; x.font = "600 34px " + MONO;
    spaced(x, "STREAK " + sk.current + " · ONE WEEK AT A TIME", 540, 1390, 5, "center");
    x.fillStyle = "#cfe3f3"; x.font = "400 92px " + DISPLAY; x.textAlign = "center"; x.fillText("BUILT IN SILENCE", 540, 1760);
    return { canvas: cv, name: "winter-arc-week-" + wk + (done ? "-done" : "") + ".png", title: "Week " + wk + "/13" + (done ? " done" : "") };
  }
  function drawCertificate() {
    var t = today(), P = S.profile, st = W.arcStatus(P.start_date, t), scores = W.scoresUpTo(S, t);
    var sk = W.computeStreak(scores, true), held = scores.filter(function (s) { return s >= W.HELD_MIN; }).length;
    var cv = document.createElement("canvas"); cv.width = 1080; cv.height = 1350;
    var x = cv.getContext("2d");
    bg(x, 1080, 1350); mountains(x, 1080, 1110, 360);
    x.strokeStyle = "rgba(169,212,245,.35)"; x.lineWidth = 2; x.strokeRect(48, 48, 984, 1254);
    x.fillStyle = "#a9d4f5"; x.font = "600 28px " + MONO; spaced(x, "CERTIFICATE OF COMPLETION", 540, 170, 10, "center");
    x.fillStyle = "#e8eef4"; x.font = "400 150px " + DISPLAY; x.textAlign = "center"; x.fillText("WINTER", 540, 340);
    x.lineWidth = 4; x.strokeStyle = "#cfe3f3"; x.strokeText("ARC", 540, 490);
    x.fillStyle = "#95a3b3"; x.font = "500 30px " + MONO; spaced(x, "THIS CERTIFIES THAT", 540, 600, 6, "center");
    var nm = P.name.toUpperCase(), size = 120;
    x.font = "400 " + size + "px " + DISPLAY;
    while (x.measureText(nm).width > 880 && size > 50) { size -= 6; x.font = "400 " + size + "px " + DISPLAY; }
    x.fillStyle = "#e8eef4"; x.textAlign = "center"; x.fillText(nm, 540, 730);
    x.fillStyle = "#cfe3f3"; x.font = "500 34px " + "-apple-system, system-ui, sans-serif";
    x.fillText("completed the 90-day Winter Arc protocol", 540, 800);
    x.fillStyle = "#a9d4f5"; x.font = "600 28px " + MONO;
    spaced(x, (W.fmtLong(P.start_date) + "  →  " + W.fmtLong(st.day90)).toUpperCase(), 540, 870, 3, "center");
    x.fillStyle = "#95a3b3"; x.font = "600 26px " + MONO;
    spaced(x, held + " DAYS HELD · BEST STREAK " + sk.best + " · " + totalHours("deep").toFixed(0) + " H DEEP WORK", 540, 930, 3, "center");
    x.fillStyle = "#cfe3f3"; x.font = "400 64px " + DISPLAY; x.textAlign = "center"; x.fillText("BUILT IN SILENCE", 540, 1240);
    return { canvas: cv, name: "winter-arc-certificate.png", title: "Winter Arc certificate" };
  }
  function shareImage(kind) {
    if (!isFull()) { location.hash = "#/settings"; return; }
    var ready = document.fonts && document.fonts.load ? document.fonts.load("400 100px Anton") : Promise.resolve();
    ready.catch(function () { /* fall back to system font */ }).then(function () {
      var r = kind === "certificate" ? drawCertificate() : drawStory(kind === "week");
      r.canvas.toBlob(function (blob) {
        if (!blob) { toast("Couldn't create the image."); return; }
        var url = URL.createObjectURL(blob);
        var file = null; try { file = new File([blob], r.name, { type: "image/png" }); } catch (e) { /* old Safari */ }
        var canShare = file && navigator.canShare && navigator.canShare({ files: [file] });
        openSheet(r.title, h("div", null,
          h("img", { class: "share-img", src: url, alt: r.title + " image, " + r.canvas.width + " by " + r.canvas.height }),
          h("div", { class: "btns" },
            canShare ? h("button", { class: "btn primary", onclick: function () { navigator.share({ files: [file], title: r.title }).catch(function () { /* cancelled */ }); } }, icon("share"), "Share") : null,
            h("a", { class: "btn" + (canShare ? "" : " primary"), href: url, download: r.name }, "Save PNG")),
          h("p", { class: "xs mute mt-s" }, "Made on your phone. Nothing is uploaded. On iPhone you can also long-press the image → Save to Photos.")),
          { onClose: function () { setTimeout(function () { URL.revokeObjectURL(url); }, 1000); } });
      }, "image/png");
    });
  }

  // ================================================================ boot
  window.addEventListener("hashchange", function () { render(); });
  document.addEventListener("visibilitychange", function () { if (document.visibilityState === "visible" && !document.querySelector(".scrim") && !(document.activeElement && /TEXTAREA|INPUT/.test(document.activeElement.tagName))) render(true); });
  try { history.scrollRestoration = "manual"; } catch (e) { /* ignore */ }
  buildNav();
  render();
  if ("serviceWorker" in navigator && (location.protocol === "https:" || location.hostname === "localhost" || location.hostname === "127.0.0.1")) {
    window.addEventListener("load", function () { navigator.serviceWorker.register("sw.js").catch(function () { /* offline cache unavailable */ }); });
  }
})();
