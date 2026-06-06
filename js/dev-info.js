(function () {
  "use strict";

  // ====== PASTE YOUR EMBEDDABLE JSON SHARE URLS HERE ===================
  var WAKATIME = {
    codingActivity: "https://wakatime.com/share/@doughmination/9dcc5b5c-ed3d-4896-bfa3-87737fa70930.json",
    languages: "https://wakatime.com/share/@doughmination/8354e3f8-b458-452b-aa06-839f303d4904.json",
    categories: "https://wakatime.com/share/@doughmination/c54fcd4e-91b3-46ab-8e7e-82226491ec0f.json",
    editors: "https://wakatime.com/share/@doughmination/38dba24b-d2de-4d50-9b09-83642c01c33e.json",
    operatingSystems: "https://wakatime.com/share/@doughmination/a69f00cb-e38e-4de1-aa42-eec71dc6d658.json"
  };
  // How many rows to show in each ranked list.
  var MAX_ROWS = 8;
  // =====================================================================

  // ---- JSONP loader ---------------------------------------------------
  var seq = 0;
  function jsonp(url, timeoutMs) {
    return new Promise(function (resolve, reject) {
      var cb = "__wakatime_cb_" + (++seq);
      var script = document.createElement("script");
      var timer = setTimeout(function () { cleanup(); reject(new Error("timed out")); }, timeoutMs || 12000);

      function cleanup() {
        clearTimeout(timer);
        try { delete window[cb]; } catch (e) { window[cb] = undefined; }
        if (script.parentNode) script.parentNode.removeChild(script);
      }

      window[cb] = function (data) { cleanup(); resolve(data); };
      script.onerror = function () { cleanup(); reject(new Error("failed to load")); };

      var sep = url.indexOf("?") === -1 ? "?" : "&";
      script.src = url + sep + "callback=" + cb;
      document.head.appendChild(script);
    });
  }

  // ---- helpers --------------------------------------------------------
  function fmt(seconds) {
    seconds = Math.max(0, Math.round(seconds || 0));
    var h = Math.floor(seconds / 3600);
    var m = Math.round((seconds % 3600) / 60);
    if (h && m) return h + " hr" + (h > 1 ? "s" : "") + " " + m + " min" + (m > 1 ? "s" : "");
    if (h) return h + " hr" + (h > 1 ? "s" : "");
    return m + " min" + (m === 1 ? "" : "s");
  }

  function pctLabel(p) {
    return (p < 10 ? Math.round(p * 10) / 10 : Math.round(p)) + "%";
  }

  // Value shown at the end of a bar: real time when the embed provides it,
  // otherwise the percentage share.
  function valueLabel(d, hasSeconds) {
    if (hasSeconds && (d.total_seconds || 0) > 0) return d.text || fmt(d.total_seconds);
    if (typeof d.percent === "number") return pctLabel(d.percent);
    if (d.text) return d.text;
    return fmt(d.total_seconds);
  }

  function el(id) { return document.getElementById(id); }

  function setMeta(text) {
    var m = el("waka-meta");
    if (m && text) { m.textContent = text; m.hidden = false; }
  }

  // Render a ranked list of horizontal bars into a container.
  function renderBars(containerId, items) {
    var box = el(containerId);
    if (!box) return;
    if (!items || !items.length) { failSection(box, "No data yet."); return; }

    // Share embeds for languages/categories/editors/OS often return only
    // {name, percent, color} with no seconds — so fall back to percent for
    // both the bar width and the value label when time isn't provided.
    var hasSeconds = items.some(function (d) { return d && (d.total_seconds || 0) > 0; });

    var rows = items
      .filter(function (d) { return d && ((d.total_seconds || 0) > 0 || (d.percent || 0) > 0); })
      .sort(function (a, b) {
        return hasSeconds
          ? (b.total_seconds || 0) - (a.total_seconds || 0)
          : (b.percent || 0) - (a.percent || 0);
      })
      .slice(0, MAX_ROWS);

    var max = rows.reduce(function (acc, d) {
      return Math.max(acc, hasSeconds ? (d.total_seconds || 0) : (d.percent || 0));
    }, 0) || 1;

    box.innerHTML = "";
    rows.forEach(function (d) {
      var basis = hasSeconds ? (d.total_seconds || 0) : (d.percent || 0);
      var pct = Math.max(2, Math.round((basis / max) * 100));
      var row = document.createElement("div");
      row.className = "waka-bar-row";

      var name = document.createElement("span");
      name.className = "waka-bar-name";
      name.textContent = d.name || "Unknown";
      name.title = d.name || "";

      var track = document.createElement("span");
      track.className = "waka-bar-track";
      var fill = document.createElement("span");
      fill.className = "waka-bar-fill";
      fill.style.width = pct + "%";
      if (d.color) fill.style.background = d.color;
      track.appendChild(fill);

      var val = document.createElement("span");
      val.className = "waka-bar-val";
      val.textContent = valueLabel(d, hasSeconds);

      row.appendChild(name);
      row.appendChild(track);
      row.appendChild(val);
      box.appendChild(row);
    });
    showSection(box);
  }

  // Render the 7-day vertical bar chart + headline total.
  function renderWeek(days) {
    var box = el("waka-week");
    if (!box) return;
    if (!days || !days.length) { failSection(box, "No activity data yet."); return; }

    var max = days.reduce(function (acc, d) { return Math.max(acc, d.total); }, 0) || 1;
    var total = days.reduce(function (acc, d) { return acc + d.total; }, 0);

    var headline = el("waka-total-val");
    if (headline) headline.textContent = fmt(total);
    var sub = el("waka-total-sub");
    if (sub) sub.textContent = "across the last " + days.length + " days";

    box.innerHTML = "";
    days.forEach(function (d) {
      var h = Math.max(3, Math.round((d.total / max) * 100));
      var col = document.createElement("div");
      col.className = "waka-day";

      var barWrap = document.createElement("div");
      barWrap.className = "waka-day-track";
      var bar = document.createElement("div");
      bar.className = "waka-day-fill";
      bar.style.height = h + "%";
      bar.title = d.label + ": " + fmt(d.total);
      barWrap.appendChild(bar);

      var lbl = document.createElement("span");
      lbl.className = "waka-day-label";
      lbl.textContent = d.short;

      col.appendChild(barWrap);
      col.appendChild(lbl);
      box.appendChild(col);
    });
    showSection(box);
    return total;
  }

  function showSection(box) {
    var sec = box.closest(".waka-section");
    if (sec) sec.hidden = false;
  }
  function failSection(box, msg) {
    box.innerHTML = '<p class="waka-empty">' + msg + "</p>";
    showSection(box);
  }

  // ---- shape parsers (defensive: WakaTime embed shapes vary) ----------
  // Categorical embeds (languages/categories/editors/OS) -> data:[{name,total_seconds,percent,color,text}]
  function asCategorical(json) {
    var data = json && json.data;
    if (!Array.isArray(data)) return [];
    // Some embeds nest under data.<key>; flatten the first array we find.
    if (data.length && data[0] && data[0].name === undefined && Array.isArray(data[0])) {
      data = data[0];
    }
    return data.map(function (d) {
      return {
        name: d.name,
        total_seconds: typeof d.total_seconds === "number" ? d.total_seconds : (d.seconds || 0),
        percent: d.percent,
        color: d.color,
        text: d.text
      };
    });
  }

  // Coding-activity embed -> array of {label, short, total}
  function asDays(json) {
    var data = json && json.data;
    if (!Array.isArray(data)) return [];
    var out = [];
    data.forEach(function (d) {
      var seconds = 0, dateStr = "";
      if (d.grand_total && typeof d.grand_total.total_seconds === "number") {
        seconds = d.grand_total.total_seconds;          // daily-summaries shape
      } else if (typeof d.total_seconds === "number") {
        seconds = d.total_seconds;                       // flat shape
      }
      if (d.range && (d.range.date || d.range.text)) {
        dateStr = d.range.date || d.range.text;
      } else if (d.date) {
        dateStr = d.date;
      }
      // Anchor bare YYYY-MM-DD to local noon so the weekday label doesn't
      // slip a day in timezones west of UTC (where it'd parse as UTC midnight).
      var dateForParse = /^\d{4}-\d{2}-\d{2}$/.test(dateStr) ? dateStr + "T12:00:00" : dateStr;
      var dt = dateStr ? new Date(dateForParse) : null;
      var label = dt && !isNaN(dt) ? dt.toDateString() : (dateStr || "");
      var short = dt && !isNaN(dt)
        ? dt.toLocaleDateString(undefined, { weekday: "short" })
        : (label.slice(0, 3) || "?");
      out.push({ label: label, short: short, total: seconds });
    });
    return out;
  }

  // ---- orchestration --------------------------------------------------
  function load(url, onData, fallbackBoxId) {
    if (!url) return Promise.resolve(null);
    return jsonp(url).then(function (json) {
      if (json && json.human_readable_range) setMeta("Range: " + json.human_readable_range);
      else if (json && json.range && json.range.text) setMeta("Range: " + json.range.text);
      onData(json);
      return json;
    }).catch(function (err) {
      console.warn("[wakatime] failed to load", url, err);
      if (fallbackBoxId) { var b = el(fallbackBoxId); if (b) failSection(b, "Couldn't load this chart."); }
      return null;
    });
  }

  function init() {
    var configured = Object.keys(WAKATIME).some(function (k) { return !!WAKATIME[k]; });
    var setup = el("waka-setup");
    var content = el("waka-content");

    if (!configured) {
      if (setup) setup.hidden = false;
      if (content) content.hidden = true;
      return;
    }
    if (setup) setup.hidden = true;
    if (content) content.hidden = false;

    var jobs = [];

    if (WAKATIME.codingActivity) {
      jobs.push(load(WAKATIME.codingActivity, function (json) {
        renderWeek(asDays(json));
      }, "waka-week"));
    }
    if (WAKATIME.languages) {
      jobs.push(load(WAKATIME.languages, function (json) {
        renderBars("waka-languages", asCategorical(json));
      }, "waka-languages"));
    }
    if (WAKATIME.categories) {
      jobs.push(load(WAKATIME.categories, function (json) {
        renderBars("waka-categories", asCategorical(json));
      }, "waka-categories"));
    }
    if (WAKATIME.editors) {
      jobs.push(load(WAKATIME.editors, function (json) {
        renderBars("waka-editors", asCategorical(json));
      }, "waka-editors"));
    }
    if (WAKATIME.operatingSystems) {
      jobs.push(load(WAKATIME.operatingSystems, function (json) {
        renderBars("waka-os", asCategorical(json));
      }, "waka-os"));
    }

    // If no coding-activity embed was set, hide the headline total card.
    if (!WAKATIME.codingActivity) {
      var totEl = el("waka-total");
      if (totEl) totEl.hidden = true;
    }

    Promise.all(jobs);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
