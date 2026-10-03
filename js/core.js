/* WINTER ARC companion — pure logic (no DOM). Loaded by the app and by the Node test suite.
 * Dates are ISO "YYYY-MM-DD" strings in the user's local calendar. All arithmetic is done on
 * whole UTC days so DST changes and time zones can't shift a day number.
 */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory(require("./content.js"));
  else root.WACore = factory(root.WAContent);
})(typeof self !== "undefined" ? self : this, function (C) {
  "use strict";

  var DAY_MS = 86400000;
  var ARC_DAYS = 90;
  var HELD_MIN = 5;          // a day with >= 5 of 7 habits (standard or floor) is "held"; <= 4 is a miss
  var MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  var WD = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  var WD_LONG = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

  // ------------------------------------------------------------ dates
  function pad2(n) { return (n < 10 ? "0" : "") + n; }

  /** ISO date -> integer day count since 1970-01-01, or NaN if invalid (rejects 2026-02-30). */
  function isoToDays(iso) {
    var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(iso || ""));
    if (!m) return NaN;
    var y = +m[1], mo = +m[2], d = +m[3];
    var t = Date.UTC(y, mo - 1, d);
    var back = new Date(t);
    if (back.getUTCFullYear() !== y || back.getUTCMonth() !== mo - 1 || back.getUTCDate() !== d) return NaN;
    return Math.round(t / DAY_MS);
  }
  function daysToIso(n) {
    var d = new Date(n * DAY_MS);
    return d.getUTCFullYear() + "-" + pad2(d.getUTCMonth() + 1) + "-" + pad2(d.getUTCDate());
  }
  function addDays(iso, n) { return daysToIso(isoToDays(iso) + n); }
  function diffDays(a, b) { return isoToDays(b) - isoToDays(a); }        // b - a
  /** Local calendar date of a JS Date (default: now). */
  function localISO(date) {
    var d = date || new Date();
    return d.getFullYear() + "-" + pad2(d.getMonth() + 1) + "-" + pad2(d.getDate());
  }
  function weekday(iso) { return ((isoToDays(iso) % 7) + 7 + 3) % 7; }  // 1970-01-01 was a Thursday -> Mon=0
  function fmtShort(iso) { var p = iso.split("-"); return (+p[2]) + " " + MON[+p[1] - 1]; }
  function fmtW(iso) { return WD[weekday(iso)] + " " + fmtShort(iso); }
  function fmtLong(iso) { return fmtW(iso) + " " + iso.slice(0, 4); }
  function weekdayLong(iso) { return WD_LONG[weekday(iso)]; }

  /** Day number of `today` in an arc starting `start` (Day 1 = start). Can be <1 (not started) or >90. */
  function dayNumber(start, today) { return diffDays(start, today) + 1; }
  function dateOfDay(start, n) { return addDays(start, n - 1); }
  function phaseOf(n) { return n < 1 ? 0 : n <= 30 ? 1 : n <= 60 ? 2 : n <= 90 ? 3 : 4; }
  function arcWeek(n) { return Math.min(13, Math.max(1, Math.ceil(n / 7))); }
  /** Weekly review = last day of each arc-week; week 13 (Days 85–90) ends on Day 90. */
  function isReviewDay(n) { return n >= 1 && n <= ARC_DAYS && (n % 7 === 0 || n === ARC_DAYS); }
  function reviewDayOfWeek(w) { return Math.min(w * 7, ARC_DAYS); }
  function weekRange(w) { return [(w - 1) * 7 + 1, Math.min(w * 7, ARC_DAYS)]; }
  function isCheckpoint(n) { return C.CHECKPOINTS.indexOf(n) >= 0; }
  /** Where Day n sits in its arc-week: { week, dayInWeek, daysInWeek, first, last, isLastDay }. */
  function weekInfo(n) {
    var w = arcWeek(n), r = weekRange(w);
    return { week: w, dayInWeek: n - r[0] + 1, daysInWeek: r[1] - r[0] + 1, first: r[0], last: r[1], isLastDay: n === r[1] };
  }

  function arcStatus(start, today) {
    var n = dayNumber(start, today);
    var day90 = dateOfDay(start, ARC_DAYS);
    var state = n < 1 ? "pre" : n > ARC_DAYS ? "done" : "active";
    return {
      day: n, state: state, phase: phaseOf(n), week: n >= 1 ? arcWeek(Math.min(n, 90)) : 0,
      day90: day90, day91: dateOfDay(start, 91),
      daysToStart: state === "pre" ? 1 - n : 0,
      daysLeft: Math.max(0, ARC_DAYS - Math.max(n, 0)),       // days after today until Day 90
      pct: Math.max(0, Math.min(1, n / ARC_DAYS))
    };
  }

  // ------------------------------------------------------------ habits + streak
  /** habits: array of 7 values, 0 = not done, 1 = floor, 2 = standard. Returns points (floor counts). */
  function habitScore(h) {
    var s = 0;
    for (var i = 0; i < 7; i++) if (h && h[i] > 0) s++;
    return s;
  }
  function dayClass(score) { return score >= 7 ? "full" : score >= HELD_MIN ? "held" : "miss"; }

  /**
   * "Never miss twice" streak.
   * scores: points (0..7) for Day 1..Day T, where the last element is TODAY (still in progress).
   * - a held day (>= HELD_MIN) extends the streak;
   * - a single missed day is a "slip": the streak survives (the slip itself doesn't add);
   * - a second consecutive miss resets the streak to 0;
   * - today only counts once it is held; an unfinished today is never a miss.
   * Returns { current, best, slips, resets, atRisk, states[] } where states are
   * "full" | "held" | "slip" (survived single miss) | "miss" | "today".
   */
  function computeStreak(scores, final) {   // final=true: the arc is over, no day is pending
    var cur = 0, best = 0, slips = 0, resets = 0, prevMiss = false, states = [];
    var T = scores.length;
    for (var i = 0; i < T; i++) {
      var s = scores[i] || 0, isToday = !final && i === T - 1;
      if (s >= HELD_MIN) {
        cur++; prevMiss = false;
        states.push(s >= 7 ? "full" : "held");
      } else if (isToday) {
        states.push("today");
      } else if (prevMiss) {
        // second consecutive miss: the streak breaks. The earlier slip was not survived after all.
        if (cur > 0) resets++;
        if (states[i - 1] === "slip") { states[i - 1] = "miss"; slips--; }
        cur = 0; states.push("miss");
      } else {
        prevMiss = true; slips++; states.push("slip");
      }
      if (cur > best) best = cur;
    }
    var todayHeld = T > 0 && (scores[T - 1] || 0) >= HELD_MIN;
    return { current: cur, best: best, slips: slips, resets: resets, atRisk: !final && prevMiss && !todayHeld, states: states };
  }

  /** Sum of points in arc-week w (max 49) given scores for Day 1..T. */
  function weekScore(scores, w) {
    var r = weekRange(w), s = 0;
    for (var d = r[0]; d <= r[1] && d <= scores.length; d++) s += scores[d - 1] || 0;
    return { points: s, max: (r[1] - r[0] + 1) * 7, pct: s / ((r[1] - r[0] + 1) * 7) };
  }

  // ------------------------------------------------------------ body
  function parseHHMM(s) {
    var m = /^\s*(\d{1,2})[:.h](\d{2})\s*$/.exec(String(s == null ? "" : s));
    if (!m) return null;
    var h = +m[1], mi = +m[2];
    if (h > 23 || mi > 59) return null;
    return h * 60 + mi;
  }
  function hhmm(mins) { mins = ((mins % 1440) + 1440) % 1440; return pad2(Math.floor(mins / 60)) + ":" + pad2(mins % 60); }
  /** Hours slept between bed time and wake time (crosses midnight). null if invalid. */
  function sleepHours(bed, wake) {
    var b = parseHHMM(bed), w = parseHHMM(wake);
    if (b == null || w == null) return null;
    var m = (w - b + 1440) % 1440;
    return Math.round(m / 6) / 10;
  }
  function bedtime(wakeMin) { return ((wakeMin - 8 * 60) % 1440 + 1440) % 1440; }

  // ------------------------------------------------------------ food (neutral tracking only)
  function round1(x) { return Math.round(x * 10) / 10; }
  /** Nutrition for `grams` of a food defined per 100 g. */
  function portionNutrition(food, grams) {
    var g = Number(grams);
    if (!(g > 0) || g > 5000) return null;
    return { kcal: Math.round(food.kcal100 * g / 100), p: round1(food.p100 * g / 100) };
  }
  /** entries: [{kcal, p}] -> totals. Ignores malformed entries. */
  function sumFood(entries) {
    var k = 0, p = 0;
    (entries || []).forEach(function (e) {
      var ek = Number(e && e.kcal), ep = Number(e && e.p);
      if (isFinite(ek) && ek >= 0) k += ek;
      if (isFinite(ep) && ep >= 0) p += ep;
    });
    return { kcal: Math.round(k), p: round1(p) };
  }
  /** 1.6 g protein per kg bodyweight (the protocol's number). Only when a plausible weight is given. */
  function proteinTarget(kg) {
    var w = Number(kg);
    if (!(w >= 30 && w <= 300)) return null;
    return Math.round(w * 1.6);
  }

  // ------------------------------------------------------------ intake validation (mirrors src/personalize.py)
  var NAME_MAX = 30, WHY_MAX = 140, START_MIN = -14, START_MAX = 60;
  var ALIASES = {
    track: { "gym": "gym", "track b": "gym", "track b: gym": "gym", "bodyweight": "bodyweight", "body weight": "bodyweight", "home": "bodyweight", "track a": "bodyweight", "track a: bodyweight": "bodyweight", "no equipment": "bodyweight", "bodyweight (no equipment)": "bodyweight" },
    schedule: { "student": "student", "school": "student", "9-5": "9-5", "9to5": "9-5", "9 to 5": "9-5", "9–5": "9-5", "office": "9-5", "9-5 job": "9-5", "9–5 job": "9-5", "shifts": "shifts", "shift": "shifts", "shift work": "shifts", "shift-work": "shifts" },
    goal: { "physique": "physique", "body": "physique", "discipline": "discipline", "money": "money", "mental": "mental", "mental clarity": "mental", "mind": "mental" }
  };
  var CTRL_RE = /[\p{Cc}\p{Cf}\p{Cs}\p{Co}\p{Cn}\p{Zl}\p{Zp}]/gu;
  function cleanText(s) {
    s = String(s == null ? "" : s).normalize("NFC").replace(/[\t\n\r]/g, " ").replace(CTRL_RE, "");
    return s.replace(/\s+/g, " ").trim();
  }
  function stripEdges(s) { return s.replace(/^[ \-'’.]+|[ \-'’.]+$/g, ""); }
  function cleanName(raw) {
    var s = cleanText(raw).replace(/[^\p{L}\p{M} \-'’.]/gu, "");
    s = stripEdges(s.replace(/\s+/g, " "));
    var chars = Array.from(s);
    if (chars.length > NAME_MAX) s = chars.slice(0, NAME_MAX).join("").replace(/[ \-'’.]+$/, "");
    return s;
  }
  function cleanWhy(raw) {
    var s = cleanText(raw || "");
    var chars = Array.from(s);
    if (chars.length > WHY_MAX) {
      var cut = chars.slice(0, WHY_MAX - 1).join("");
      var half = Array.from(cut).slice(Math.floor(WHY_MAX / 2)).join("");
      if (half.indexOf(" ") >= 0) cut = cut.slice(0, cut.lastIndexOf(" "));
      s = cut.replace(/[ ,.;:\-]+$/, "") + "…";
    }
    return s;
  }
  function cleanChoice(field, raw) {
    var v = cleanText(raw || "").toLowerCase();
    return v ? (ALIASES[field][v] || "") : "";
  }
  function parseWake(raw) { var m = parseHHMM(raw); return m == null ? null : hhmm(m); }

  /** Returns { ok, value, errors } — value is the normalized profile. */
  function sanitizeIntake(data, today) {
    var errors = [], out = {};
    if (!data || typeof data !== "object") return { ok: false, value: null, errors: ["intake must be an object"] };
    out.name = cleanName(data.name);
    if (!out.name || !/\p{L}/u.test(out.name)) errors.push("name: required (letters only, max " + NAME_MAX + ")");
    var sd = String(data.start_date || "").trim().slice(0, 10);
    if (isNaN(isoToDays(sd))) errors.push("start_date: YYYY-MM-DD required");
    else {
      var delta = diffDays(today, sd);
      if (delta < START_MIN || delta > START_MAX) errors.push("start_date: must be between " + addDays(today, START_MIN) + " and " + addDays(today, START_MAX));
      out.start_date = sd;
    }
    out.wake_time = parseWake(data.wake_time || "06:00");
    if (!out.wake_time) errors.push("wake_time: HH:MM required");
    ["track", "schedule", "goal"].forEach(function (f) {
      out[f] = cleanChoice(f, data[f]);
      if (!out[f]) errors.push(f + ": required");
    });
    out.why = cleanWhy(data.why || "");
    return { ok: errors.length === 0, value: out, errors: errors };
  }

  // ------------------------------------------------------------ license (pluggable)
  // Gumroad license keys look like "A1B2C3D4-E5F6A7B8-C9D0E1F2-A3B4C5D6" (4 × 8). They are random, so
  // they can't be checked offline: the offline step only checks the format and marks the unlock as
  // "provisional". verifyLicense() is the hook for the real server check later.
  // "ARC codes" (ARC-XXXX-XXXX-C) are codes Thomas can issue himself (review copies, giveaways); their
  // last character is a check character, so typos are caught offline. NOTE: any offline check can be
  // bypassed by someone reading this file; the server check is the real gate.
  var ARC_ALPHA = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";      // 32 chars, no 0/1/I/O
  var GUMROAD_RE = /^[A-Z0-9]{8}(-[A-Z0-9]{8}){3}$/;
  var ARC_RE = /^ARC-([2-9A-HJ-NP-Z]{4})-([2-9A-HJ-NP-Z]{4})-([2-9A-HJ-NP-Z])$/;
  function normalizeKey(raw) { return cleanText(raw).replace(/\s+/g, "").toUpperCase(); }
  function arcCheckChar(body8) {
    var sum = 0;
    for (var i = 0; i < body8.length; i++) sum += (i + 1) * ARC_ALPHA.indexOf(body8[i]) * (i % 2 ? 3 : 1);
    return ARC_ALPHA[sum % 32];
  }
  function makeArcCode(rand) {
    rand = rand || Math.random;
    var b = "";
    for (var i = 0; i < 8; i++) b += ARC_ALPHA[Math.floor(rand() * 32)];
    return "ARC-" + b.slice(0, 4) + "-" + b.slice(4) + "-" + arcCheckChar(b);
  }
  /** Offline step. Returns { ok, kind: "gumroad"|"arc"|null, provisional, reason }. */
  function checkLicenseOffline(raw) {
    var k = normalizeKey(raw);
    if (!k) return { ok: false, kind: null, reason: "Enter your code." };
    var m = ARC_RE.exec(k);
    if (m) {
      return arcCheckChar(m[1] + m[2]) === m[3]
        ? { ok: true, kind: "arc", key: k, provisional: false, reason: "ARC code accepted." }
        : { ok: false, kind: "arc", reason: "That code has a typo. Check it and try again." };
    }
    if (GUMROAD_RE.test(k)) return { ok: true, kind: "gumroad", key: k, provisional: true, reason: "License key format OK. Unlocked on this device." };
    return { ok: false, kind: null, reason: "That doesn't look like a license key. It's in your Gumroad receipt (4 groups of 8 characters)." };
  }
  /**
   * Real check against Gumroad's public license API (CORS-enabled, no secret needed):
   * POST https://api.gumroad.com/v2/licenses/verify { product_id, license_key, increment_uses_count=false }.
   * Tries each configured product. Refunded / charged-back / disputed purchases are rejected.
   * Returns a serverCheck(key) → Promise<{ ok, reason, offline? }>.
   */
  function sha256Hex(text) {
    var c = (typeof crypto !== "undefined" && crypto.subtle) ? crypto : null;
    if (!c) return Promise.reject(new Error("no webcrypto"));
    return c.subtle.digest("SHA-256", new TextEncoder().encode(text)).then(function (buf) {
      return Array.prototype.map.call(new Uint8Array(buf), function (b) { return (b < 16 ? "0" : "") + b.toString(16); }).join("");
    });
  }
  var GUMROAD_VERIFY = "https://api.gumroad.com/v2/licenses/verify";
  function gumroadCheck(productIds, fetchFn) {
    return function (key) {
      var ids = (productIds || []).slice();
      function next() {
        if (!ids.length) return Promise.resolve({ ok: false, reason: "That key isn't valid for Winter Arc. Check your Gumroad receipt." });
        var body = "product_id=" + encodeURIComponent(ids.shift()) + "&license_key=" + encodeURIComponent(key) + "&increment_uses_count=false";
        return fetchFn(GUMROAD_VERIFY, { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: body })
          .then(function (res) { return res.json().catch(function () { return {}; }); })
          .then(function (j) {
            var p = (j && j.purchase) || {};
            if (j && j.success && !p.refunded && !p.chargebacked && !p.disputed) return { ok: true };
            if (j && j.success) return { ok: false, reason: "This purchase was refunded, so the key no longer unlocks." };
            return next();
          });
      }
      return next();
    };
  }
  /**
   * Offline step first, then (for Gumroad keys) the real check.
   * - No product configured yet → Gumroad keys are not accepted (ARC codes still work).
   * - Network down → provisional unlock, so a paying user is never locked out offline.
   */
  function verifyLicense(raw, opts) {
    opts = opts || {};
    var off = checkLicenseOffline(raw);
    if (off.ok && off.kind === "arc") {
      var issued = opts.arcHashes || C.ARC_CODE_SHA256 || [];
      return sha256Hex(off.key).then(function (hx) {
        return issued.indexOf(hx) >= 0 ? off : { ok: false, kind: "arc", reason: "That code isn't one we issued. Check it and try again." };
      }, function () { return { ok: false, kind: "arc", reason: "This browser can't check codes. Try another browser." }; });
    }
    if (!off.ok || off.kind !== "gumroad") return Promise.resolve(off);
    if (!opts.serverCheck) return Promise.resolve({ ok: false, kind: "gumroad", reason: "Key unlocks open at launch. Your key will work then." });
    return Promise.resolve()
      .then(function () { return opts.serverCheck(off.key); })
      .then(function (r) {
        return r && r.ok ? { ok: true, kind: "gumroad", key: off.key, provisional: false, reason: "License verified." }
          : { ok: false, kind: "gumroad", reason: (r && r.reason) || "License not valid for this product." };
      }, function () { return { ok: true, kind: "gumroad", key: off.key, provisional: true, reason: "No connection, so the key was only format-checked. Unlocked on this device." }; });
  }

  // ------------------------------------------------------------ "The Day" (port of content.day_rows)
  function dayRows(wake, schedule) {
    if (wake == null) wake = 360;
    var delta = wake - 360;
    var rows = C.GENERIC_DAY.map(function (r) { return r.slice(); });
    if (C.WORK_ROW[schedule]) { rows[4][1] = C.WORK_ROW[schedule][0]; rows[4][2] = C.WORK_ROW[schedule][1]; }
    var anchored = (schedule === "9-5" || schedule === "student") && wake >= 240 && wake <= 510;
    if (!anchored) return rows.map(function (r) { return [hhmm(r[0] + delta), r[1], r[2]]; });
    var sleep = wake + 960, shut = sleep - 30;
    var fuel = Math.max(Math.min(wake + 150, 510), wake + 15);
    var blockStart = wake + 45;
    if (fuel - 15 - blockStart < 45) blockStart = wake + 30;
    var blockLen = Math.min(90, fuel - 15 - blockStart);
    var out = [[wake, "WAKE", rows[0][2]]];
    if (wake + 15 < fuel) out.push([wake + 15, "PRIME", rows[1][2]]);
    var morning = blockLen >= 45;
    if (morning) {
      out.push([blockStart, "DEEP BLOCK 1", blockLen === 90 ? rows[2][2] : blockLen + " min on The Build before any messages. No inputs before outputs."]);
    } else if (out.length > 1) {
      out[1] = [wake + 15, "PRIME", "No phone. 5 min of mobility. Write tonight's Block 1 outcome on paper."];
    }
    out.push([fuel, "FUEL", rows[3][2]]);
    out.push([540, rows[4][1], rows[4][2]], [750, "MOVE", rows[5][2]]);
    var deepT = Math.min(1230, shut - 60);
    if (deepT >= 1170) {
      out.push([1050, "TRAIN", rows[6][2]], [1140, "FUEL + LIFE", rows[7][2]]);
      out.push(morning ? [deepT, "DEEP BLOCK 2", rows[8][2]]
        : [deepT, "DEEP BLOCK 1", "60–90 min on The Build, phone in another room. Phase II–III: a second block at lunch or the weekend Siege."]);
    } else {
      out.push([1050, "TRAIN", "Session per plan (45–60 min), or a 30–45 min walk. Phase II–III: Block 2 goes straight after work, before training."]);
      out.push([1140, "FUEL + LIFE", rows[7][2]]);
    }
    out.push([shut, "SHUT DOWN", rows[9][2]], [sleep, "SLEEP", rows[10][2]]);
    return out.map(function (r) { return [hhmm(r[0]), r[1], r[2]]; });
  }

  // ------------------------------------------------------------ workout of the day
  function workoutFor(track, start, n) {
    if (n < 1 || n > ARC_DAYS) return null;
    var iso = dateOfDay(start, n), wd = weekday(iso), ph = phaseOf(n), w = arcWeek(n);
    var rest = { kind: "rest", title: "Rest day · walk", ex: [["Walk", "30–45 min"], ["Mobility reset", "10 min"]], notes: [C.MOBILITY, "Rest days are part of the protocol. The walk is your MOVE habit."] };
    var zone2 = { kind: "cond", title: "Zone 2", ex: [["Easy cardio: brisk walk, incline treadmill, bike or easy jog", "30–45 min"]], notes: ["Easy enough to talk in full sentences."] };
    var iv = C.INTERVALS[(w - 1) % C.INTERVALS.length];
    var intervals = { kind: "cond", title: "Intervals · " + iv[0], ex: [[iv[1], "~25 min"]], notes: ["Hard but controlled."] };
    function strength(t, extra) {
      return { kind: "strength", title: t.title, ex: t.ex.map(function (e) { return e.slice(); }), notes: [t.note].concat(extra || [], [C.WARMUP]) };
    }
    var plan;
    if (ph === 1) {
      if (wd === 0 || wd === 2 || wd === 4) {
        if (track === "gym") {
          var idx = 0;                                   // alternate A/B across sessions: A-B-A, B-A-B …
          for (var d = 1; d < n; d++) { var x = weekday(dateOfDay(start, d)); if (x === 0 || x === 2 || x === 4) idx++; }
          plan = strength(idx % 2 === 0 ? C.GYM.A : C.GYM.B);
        } else plan = strength(C.BW.full, [C.BW.ladders]);
      } else if (wd === 5) plan = zone2;
      else plan = rest;
    } else {
      var map = track === "gym" ? { 0: C.GYM.UA, 1: C.GYM.LA, 3: C.GYM.UB, 4: C.GYM.LB } : { 0: C.BW.upper, 1: C.BW.lower, 3: C.BW.upper, 4: C.BW.lower };
      if (map[wd]) plan = strength(map[wd], track === "gym" ? [] : [C.BW.ladders]);
      else if (wd === 2) plan = intervals;
      else if (wd === 5) plan = (ph === 3 && track !== "gym" && n >= 68) ? strength(C.BW.arc) : zone2;
      else plan = rest;
    }
    if (ph === 3 && plan.kind === "strength") {
      if (n <= 67) plan.notes.unshift("Deload week (Days 61–67): same exercises, ~60% of the sets, 1–2 reps further from failure.");
      else if (n >= 85) plan.notes.unshift(track === "gym" ? "Test week (Days 85–90): estimate your 5-rep max on squat, bench and deadlift, with spotter or safety pins." : "Test week (Days 85–90): push your top sets and retest the baseline.");
      else if (track === "gym") plan.notes.unshift("Days 68–84: one heavy top set (RIR 1) on the first lift, then 2–3 back-off sets at −10%.");
    }
    if (n === 90) plan = { kind: "test", title: "Day 90 · Final test", ex: C.BASELINE.slice(0, 5).map(function (t) { return [t.name, t.unit]; }), notes: ["Retest the baseline under Day 1 conditions. Then put Day 1 and Day 90 side by side."] };
    plan.weekday = WD_LONG[wd];
    plan.phase = ph;
    return plan;
  }

  // ------------------------------------------------------------ daily content
  function promptFor(n, wakeMin) {
    if (n < 1 || n > ARC_DAYS) return null;
    var w = wakeMin == null ? 360 : wakeMin;
    return C.PROMPTS[n - 1].replace("{BED}", hhmm(bedtime(w))).replace("{WAKE}", hhmm(w));
  }
  /** Quote for a calendar date: day-of-arc when active, otherwise a stable index from the date. */
  function quoteFor(n, iso) {
    var L = C.QUOTES.length;
    var i = n >= 1 && n <= ARC_DAYS ? n - 1 : ((isoToDays(iso) % L) + L) % L;
    return { text: C.QUOTES[i % L][0], src: C.QUOTES[i % L][1] };
  }

  // ------------------------------------------------------------ app state (load / import)
  function defaultState() {
    return {
      v: 1, profile: null,
      license: { key: "", kind: null, provisional: false, at: "" },
      settings: { food: false, weightKg: null, waterMl: 2500 },
      days: {}, focus: { sessions: [], active: null }, reviews: {}, baseline: {}, customFoods: []
    };
  }
  function str(x, max) { return typeof x === "string" ? x.slice(0, max) : ""; }
  function num(x, lo, hi) { var n = Number(x); return isFinite(n) && n >= lo && n <= hi ? n : null; }
  function isIso(x) { return typeof x === "string" && !isNaN(isoToDays(x)); }
  /** Sanitize anything (localStorage, an imported backup) into a well-formed state. Unknown keys are dropped. */
  function normalizeState(raw) {
    var s = defaultState();
    if (!raw || typeof raw !== "object") return s;
    if (raw.app === "winter-arc" && raw.data) raw = raw.data;             // export envelope
    var p = raw.profile;
    if (p && typeof p === "object") {
      var prof = {
        name: cleanName(p.name), start_date: isIso(p.start_date) ? p.start_date : "",
        wake_time: parseWake(p.wake_time) || "", track: cleanChoice("track", p.track),
        schedule: cleanChoice("schedule", p.schedule), goal: cleanChoice("goal", p.goal), why: cleanWhy(p.why || "")
      };
      if (prof.name && prof.start_date && prof.wake_time && prof.track && prof.schedule && prof.goal) s.profile = prof;
    }
    if (raw.license && typeof raw.license === "object") {
      var off = checkLicenseOffline(str(raw.license.key, 80));
      if (off.ok) s.license = { key: off.key, kind: off.kind, provisional: raw.license.provisional !== false && off.provisional, at: str(raw.license.at, 30) };
    }
    if (raw.settings && typeof raw.settings === "object") {
      s.settings.food = raw.settings.food === true;
      s.settings.weightKg = num(raw.settings.weightKg, 30, 300);
      s.settings.waterMl = num(raw.settings.waterMl, 1000, 5000) || 2500;
    }
    if (raw.days && typeof raw.days === "object") {
      Object.keys(raw.days).forEach(function (iso) {
        var d = raw.days[iso];
        if (!isIso(iso) || !d || typeof d !== "object") return;
        var h = [0, 0, 0, 0, 0, 0, 0];
        if (Array.isArray(d.h)) for (var i = 0; i < 7; i++) h[i] = [0, 1, 2].indexOf(d.h[i]) >= 0 ? d.h[i] : 0;
        var o = { h: h, lines: str(d.lines, 4000), journal: str(d.journal, 10000), water: num(d.water, 0, 10000) || 0 };
        if (d.sleep && typeof d.sleep === "object") {
          var b = parseWake(d.sleep.bed), w = parseWake(d.sleep.wake);
          if (b && w) o.sleep = { bed: b, wake: w };
        }
        if (d.cold && typeof d.cold === "object") o.cold = { done: d.cold.done === true, sec: num(d.cold.sec, 0, 3600) || 0 };
        if (Array.isArray(d.food)) {
          o.food = d.food.slice(0, 200).map(function (e) {
            return e && typeof e === "object" ? { name: cleanText(str(e.name, 60)), g: num(e.g, 0, 5000) || 0, kcal: num(e.kcal, 0, 20000) || 0, p: num(e.p, 0, 1000) || 0 } : null;
          }).filter(function (e) { return e && e.name; });
        }
        s.days[iso] = o;
      });
    }
    if (raw.focus && typeof raw.focus === "object") {
      if (Array.isArray(raw.focus.sessions)) {
        s.focus.sessions = raw.focus.sessions.slice(0, 5000).map(function (x) {
          return x && isIso(x.d) && (x.k === "deep" || x.k === "free") && num(x.m, 1, 1440) ? { d: x.d, k: x.k, m: Math.round(x.m), at: num(x.at, 0, 1e14) || 0 } : null;
        }).filter(Boolean);
      }
      var a = raw.focus.active;
      if (a && (a.k === "deep" || a.k === "free") && num(a.startedAt, 0, 1e14) != null) {
        s.focus.active = { k: a.k, planned: num(a.planned, 1, 600), startedAt: Number(a.startedAt), accum: num(a.accum, 0, 1e9) || 0, paused: a.paused === true, label: str(a.label, 30), brk: num(a.brk, 0, 60) || 0 };
      }
    }
    if (raw.reviews && typeof raw.reviews === "object") {
      for (var w = 1; w <= 13; w++) {
        var r = raw.reviews[w];
        if (r && typeof r === "object") s.reviews[w] = { wins: str(r.wins, 2000), brk: str(r.brk, 2000), next: str(r.next, 2000), screen: str(r.screen, 20), energy: str(r.energy, 4), done: r.done === true };
      }
    }
    if (raw.baseline && typeof raw.baseline === "object") {
      C.BASELINE.forEach(function (t) {
        var b = raw.baseline[t.id];
        if (!b || typeof b !== "object") return;
        s.baseline[t.id] = {};
        C.CHECKPOINTS.forEach(function (cp) { if (typeof b[cp] === "string" && b[cp]) s.baseline[t.id][cp] = b[cp].slice(0, 20); });
      });
    }
    if (Array.isArray(raw.customFoods)) {
      s.customFoods = raw.customFoods.slice(0, 200).map(function (f) {
        if (!f || typeof f !== "object") return null;
        var name = cleanText(str(f.name, 60)), k = num(f.kcal100, 0, 1000), pr = num(f.p100, 0, 100), pg = num(f.portionG, 1, 2000);
        return name && k != null && pr != null ? { id: "c_" + str(String(f.id || ""), 40).replace(/^c_/, "").replace(/[^a-z0-9_]/gi, "") , name: name, kcal100: k, p100: pr, portionG: pg || 100, portion: cleanText(str(f.portion, 30)) || (pg || 100) + " g", custom: true } : null;
      }).filter(Boolean);
    }
    return s;
  }

  /** Points per day for Day 1..min(today, 90) — the input for computeStreak / weekScore. */
  function scoresUpTo(state, today) {
    if (!state.profile) return [];
    var n = Math.min(dayNumber(state.profile.start_date, today), ARC_DAYS), out = [];
    for (var d = 1; d <= n; d++) {
      var e = state.days[dateOfDay(state.profile.start_date, d)];
      out.push(e ? habitScore(e.h) : 0);
    }
    return out;
  }

  return {
    defaultState: defaultState, normalizeState: normalizeState, scoresUpTo: scoresUpTo,
    ARC_DAYS: ARC_DAYS, HELD_MIN: HELD_MIN,
    isoToDays: isoToDays, daysToIso: daysToIso, addDays: addDays, diffDays: diffDays, localISO: localISO,
    weekday: weekday, fmtShort: fmtShort, fmtW: fmtW, fmtLong: fmtLong, weekdayLong: weekdayLong,
    dayNumber: dayNumber, dateOfDay: dateOfDay, phaseOf: phaseOf, arcWeek: arcWeek, isReviewDay: isReviewDay,
    reviewDayOfWeek: reviewDayOfWeek, weekRange: weekRange, isCheckpoint: isCheckpoint, weekInfo: weekInfo, arcStatus: arcStatus,
    habitScore: habitScore, dayClass: dayClass, computeStreak: computeStreak, weekScore: weekScore,
    parseHHMM: parseHHMM, hhmm: hhmm, sleepHours: sleepHours, bedtime: bedtime,
    portionNutrition: portionNutrition, sumFood: sumFood, proteinTarget: proteinTarget,
    cleanText: cleanText, cleanName: cleanName, cleanWhy: cleanWhy, cleanChoice: cleanChoice, parseWake: parseWake,
    sanitizeIntake: sanitizeIntake, NAME_MAX: NAME_MAX, WHY_MAX: WHY_MAX,
    normalizeKey: normalizeKey, arcCheckChar: arcCheckChar, makeArcCode: makeArcCode,
    checkLicenseOffline: checkLicenseOffline, verifyLicense: verifyLicense, gumroadCheck: gumroadCheck, sha256Hex: sha256Hex,
    dayRows: dayRows, workoutFor: workoutFor, promptFor: promptFor, quoteFor: quoteFor
  };
});
