/* Portal: reads registry.json, then each project's manifest.json (or, until it exists,
   a fallback file with a timestamp field) and shows data freshness. No build step. */
(function () {
  "use strict";

  var GRACE_MIN = 15;            // Pages cache (600 s) + run/deploy time
  var REFRESH_MS = 60 * 1000;    // re-read manifests every minute
  var LS_LANG = "portal.lang";   // same origin for all projects: prefix every key

  var I18N = {
    bg: {
      title: "Nowcasting България", subtitle: "Общ вход към личните прогностични проекти",
      projects: "Проекти", openNew: "Отвори в нов прозорец", cadence: "Обновяване", run: "Рън",
      sources: "Източници", files: "Файлове", code: "Код", freshTitle: "Свежест на данните",
      lg1: "до cadence + 15 мин", lg2: "до 2 × cadence + 15 мин", lg3: "по-старо или няма данни", lg4: "чернова",
      freshNote: "Времето се чете от самия файл. Pages пази копие до 10 мин, затова прагът има 15 мин резерв.",
      disclaimer: "Личен проект, не е официален продукт на сертифициран доставчик.", about: "За портала",
      green: "Свежо", yellow: "Закъснява", red: "Старо", gray: "Чернова", loading: "Зареждане…", nodata: "Няма данни",
      updated: "Обновено", ago: "преди", min: "мин", h: "ч", d: "дни", every: "на всеки", daily: "веднъж дневно в",
      next: "следващо около", gated: "Страницата има парола.", noEmbed: "Проектът още няма страница.",
      noEmbedSub: "Засега се публикуват само данни. Файловете са в подробностите за проекта.", fromFallback: "без manifest.json, времето е от",
      notConfirmed: "не е потвърдено"
    },
    en: {
      title: "Nowcasting Bulgaria", subtitle: "One entry point to personal forecasting projects",
      projects: "Projects", openNew: "Open in a new window", cadence: "Updates", run: "Run",
      sources: "Sources", files: "Files", code: "Code", freshTitle: "Data freshness",
      lg1: "within cadence + 15 min", lg2: "within 2 × cadence + 15 min", lg3: "older, or no data", lg4: "draft",
      freshNote: "The time is read from the file itself. Pages keeps a copy for up to 10 min, so the limits allow 15 min.",
      disclaimer: "Personal project, not an official product of a certified provider.", about: "About",
      green: "Fresh", yellow: "Late", red: "Stale", gray: "Draft", loading: "Loading…", nodata: "No data",
      updated: "Updated", ago: "", min: "min", h: "h", d: "days", every: "every", daily: "once a day at",
      next: "next around", gated: "This page has a password.", noEmbed: "This project has no page yet.",
      noEmbedSub: "Only data is published for now. The files are listed in the project details.", fromFallback: "no manifest.json, time taken from",
      notConfirmed: "not confirmed"
    }
  };

  var state = { lang: "bg", projects: [], info: {}, sel: null, embedded: null };

  function t(k) { return (I18N[state.lang] || I18N.bg)[k] || k; }
  function loc(v) { return v && typeof v === "object" ? (v[state.lang] || v.bg || "") : (v || ""); }
  function el(tag, attrs, kids) {
    var n = document.createElement(tag);
    if (attrs) Object.keys(attrs).forEach(function (k) {
      if (k === "text") n.textContent = attrs[k];
      else if (k === "class") n.className = attrs[k];
      else n.setAttribute(k, attrs[k]);
    });
    (kids || []).forEach(function (c) { if (c) n.appendChild(c); });
    return n;
  }
  function abs(path) { return new URL(path, window.location.origin).href; }
  function bust(url) { return url + (url.indexOf("?") < 0 ? "?" : "&") + "t=" + Math.floor(Date.now() / 60000); }

  // ISO 8601 → Date. Accepts "…Z", "…+00:00", minutes-only and microseconds.
  function parseTime(s) {
    if (!s || typeof s !== "string") return null;
    var x = s.trim().replace(" UTC", "Z").replace(" ", "T").replace(/(\.\d{3})\d+/, "$1");
    if (/^\d{4}-\d\d-\d\dT\d\d:\d\d(:\d\d(\.\d+)?)?$/.test(x)) x += "Z";
    var d = new Date(x);
    return isNaN(d.getTime()) ? null : d;
  }
  function hhmm(d) { return String(d.getUTCHours()).padStart(2, "0") + ":" + String(d.getUTCMinutes()).padStart(2, "0") + "Z"; }
  function fmtDate(d) { return String(d.getUTCDate()).padStart(2, "0") + "." + String(d.getUTCMonth() + 1).padStart(2, "0") + " " + hhmm(d); }
  function fmtAge(min) {
    min = Math.max(0, Math.round(min));
    var s;
    if (min < 60) s = min + " " + t("min");
    else if (min < 48 * 60) s = Math.floor(min / 60) + " " + t("h") + (min % 60 ? " " + (min % 60) + " " + t("min") : "");
    else s = Math.round(min / 1440) + " " + t("d");
    return state.lang === "bg" ? t("ago") + " " + s : s + " ago";
  }
  function fmtCadence(p) {
    if (p.daily_at_utc) return t("daily") + " " + p.daily_at_utc + "Z";
    var c = p.cadence_min, s = c < 60 ? c + " " + t("min") : (c / 60) + " " + t("h");
    return t("every") + " " + s + (p.cadence_confirmed === false ? " (" + t("notConfirmed") + ")" : "");
  }

  // Next scheduled run after `from` for a daily HH:MM UTC schedule.
  function nextDaily(from, hm) {
    var parts = hm.split(":"), n = new Date(from.getTime());
    n.setUTCHours(+parts[0], +parts[1], 0, 0);
    if (n <= from) n.setUTCDate(n.getUTCDate() + 1);
    return n;
  }

  function freshness(p, info, now) {
    if (p.status === "draft") return "gray";
    if (!info || !info.generated) return info && info.loading ? "wait" : "red";
    var ageMin = (now - info.generated) / 60000;
    if (p.daily_at_utc) {
      var due = nextDaily(info.generated, p.daily_at_utc);
      var late = (now - due) / 60000;
      return late <= GRACE_MIN ? "green" : late <= 120 ? "yellow" : "red";
    }
    var c = p.cadence_min;
    return ageMin <= c + GRACE_MIN ? "green" : ageMin <= 2 * c + GRACE_MIN ? "yellow" : "red";
  }

  function load(p) {
    var info = state.info[p.id] || (state.info[p.id] = { loading: true });
    function getJson(path) {
      return fetch(bust(abs(path)), { cache: "no-store" }).then(function (r) {
        if (!r.ok) throw new Error(r.status);
        return r.json();
      });
    }
    function fromObj(obj, timeKey, runKey, srcLabel) {
      var g = parseTime(obj[timeKey]);
      var run = runKey ? obj[runKey] : null;
      if (run && typeof run === "object") run = Object.keys(run).map(function (k) { return k + " " + run[k]; }).join(", ");
      return { loading: false, generated: g, run: run || null, via: srcLabel };
    }
    var manifest = p.manifest ? getJson(p.manifest).then(function (m) {
      var r = fromObj(m, "generated_at", "run", null);
      if (!r.generated) throw new Error("no generated_at");
      return r;
    }) : Promise.reject(new Error("no manifest"));
    return manifest.catch(function () {
      if (!p.fallback) throw new Error("no fallback");
      return getJson(p.fallback.path).then(function (o) {
        return fromObj(o, p.fallback.time, p.fallback.run, p.fallback.path.split("/").pop());
      });
    }).then(function (r) { state.info[p.id] = r; }, function () {
      state.info[p.id] = { loading: false, generated: null };
    }).then(render);
  }

  function statusLine(p, info, f, now) {
    if (!info || info.loading) return t("loading");
    if (!info.generated) return t("nodata");
    var sameDay = info.generated.getUTCDate() === now.getUTCDate() && (now - info.generated) < 864e5;
    var s = t("updated") + " " + (sameDay ? hhmm(info.generated) : fmtDate(info.generated)) + ", " + fmtAge((now - info.generated) / 60000);
    if (p.daily_at_utc && f !== "red") s += " · " + t("next") + " " + hhmm(nextDaily(info.generated, p.daily_at_utc));
    return s;
  }

  function renderTiles(now) {
    var box = document.getElementById("tiles");
    box.textContent = "";
    state.projects.forEach(function (p) {
      var info = state.info[p.id], f = freshness(p, info, now);
      var age = info && info.generated ? fmtAge((now - info.generated) / 60000) : (info && info.loading ? t("loading") : t("nodata"));
      var b = el("button", { type: "button", class: "tile", "aria-pressed": String(p.id === state.sel) }, [
        el("span", { class: "tile-head" }, [
          el("span", { class: "tile-name", text: loc(p.name) }),
          el("span", { class: "mark " + f, role: "img", "aria-label": t(f === "wait" ? "loading" : f) })
        ]),
        el("span", { class: "tile-short", text: loc(p.short) }),
        el("span", { class: "tile-age", text: p.status === "draft" ? t("gray") + " · " + age : age })
      ]);
      b.addEventListener("click", function () { select(p.id); });
      box.appendChild(b);
    });
  }

  function renderStage() {
    var p = current();
    if (!p) return;
    document.getElementById("cur-name").textContent = loc(p.name);
    document.getElementById("cur-short").textContent = loc(p.short);
    var open = document.getElementById("cur-open");
    open.href = abs(p.url);
    if (state.embedded === p.id + state.lang) return;   // keep the iframe, do not reload it
    state.embedded = p.id + state.lang;
    var body = document.getElementById("stage-body");
    body.textContent = "";
    if (p.embed) {
      var src = abs(p.embed);
      src += (src.indexOf("?") < 0 ? "?" : "&") + "embed=1&lang=" + state.lang;
      body.appendChild(el("iframe", { src: src, title: loc(p.name), loading: "lazy", referrerpolicy: "same-origin" }));
    } else {
      body.appendChild(el("div", { class: "placeholder" }, [
        el("h2", { text: t("noEmbed") }),
        el("p", { text: t("noEmbedSub") })
      ]));
    }
  }

  function renderSide(now) {
    var p = current();
    if (!p) return;
    var info = state.info[p.id], f = freshness(p, info, now);
    var st = document.getElementById("cur-status");
    st.className = "status " + (f === "wait" ? "gray" : f);
    st.textContent = "";
    var lines = [el("b", { text: t(f === "wait" ? "loading" : f) }), el("span", { text: statusLine(p, info, f, now) })];
    if (info && info.via) lines.push(el("span", { class: "small", text: t("fromFallback") + " " + info.via }));
    if (p.gated) lines.push(el("span", { class: "small", text: t("gated") }));
    st.appendChild(el("span", { class: "mark " + f, "aria-hidden": "true" }));
    st.appendChild(el("span", { class: "status-text" }, lines));
    document.getElementById("cur-desc").textContent = loc(p.description);
    document.getElementById("cur-cadence").textContent = fmtCadence(p);
    var run = info && info.run ? (parseTime(info.run) ? fmtDate(parseTime(info.run)) : String(info.run)) : "—";
    document.getElementById("cur-run").textContent = run;
    document.getElementById("cur-sources").textContent = loc(p.sources);
    var files = document.getElementById("cur-files");
    files.textContent = "";
    (p.files || []).forEach(function (fp) {
      files.appendChild(el("a", { href: abs(fp), target: "_blank", rel: "noopener", text: fp.split("/").slice(2).join("/") }));
    });
    var repo = document.getElementById("cur-repo");
    repo.href = p.repo;
    repo.textContent = p.repo.replace("https://github.com/", "");
  }

  function renderChrome() {
    document.documentElement.lang = state.lang;
    document.title = t("title");
    Array.prototype.forEach.call(document.querySelectorAll("[data-i18n]"), function (n) { n.textContent = t(n.getAttribute("data-i18n")); });
    Array.prototype.forEach.call(document.querySelectorAll("[data-lang]"), function (b) {
      b.setAttribute("aria-pressed", String(b.getAttribute("data-lang") === state.lang));
    });
  }

  function render() {
    var now = new Date();
    document.getElementById("clock").textContent = fmtDate(now).replace(/Z$/, "") + " UTC";
    renderTiles(now);
    renderStage();
    renderSide(now);
  }

  function current() {
    for (var i = 0; i < state.projects.length; i++) if (state.projects[i].id === state.sel) return state.projects[i];
    return state.projects[0];
  }

  function select(id) {
    state.sel = id;
    try { history.replaceState(null, "", "#p=" + encodeURIComponent(id)); } catch (e) { /* ignore */ }
    render();
    if (window.innerWidth < 720) {
      var st = document.querySelector(".stage");
      if (st && st.scrollIntoView) st.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  function setLang(l) {
    state.lang = I18N[l] ? l : "bg";
    try { localStorage.setItem(LS_LANG, state.lang); } catch (e) { /* private mode */ }
    renderChrome();
    render();
  }

  function init() {
    var q = new URLSearchParams(window.location.search);
    var saved = null;
    try { saved = localStorage.getItem(LS_LANG); } catch (e) { /* ignore */ }
    state.lang = I18N[q.get("lang")] ? q.get("lang") : (I18N[saved] ? saved : "bg");
    Array.prototype.forEach.call(document.querySelectorAll("[data-lang]"), function (b) {
      b.addEventListener("click", function () { setLang(b.getAttribute("data-lang")); });
    });
    renderChrome();
    fetch(bust("registry.json"), { cache: "no-store" }).then(function (r) { return r.json(); }).then(function (reg) {
      state.projects = reg.projects || [];
      var m = /p=([^&]+)/.exec(window.location.hash);
      state.sel = m ? decodeURIComponent(m[1]) : (state.projects[0] && state.projects[0].id);
      render();
      var all = function () { state.projects.forEach(load); };
      all();
      setInterval(all, REFRESH_MS);
      setInterval(render, 30 * 1000);
    }).catch(function () {
      document.getElementById("tiles").textContent = t("nodata");
    });
  }

  init();
})();
