(function () {
  "use strict";

  var API_URL = window.API_URL || "";
  var form = document.getElementById("audit-form");
  var submitButton = document.getElementById("submit-button");
  var clearButton = document.getElementById("clear-button");
  var status = document.getElementById("status");
  var results = document.getElementById("results");
  var busy = false;
  var latestReport = null;
  var latestMode = "Rules-only diagnostic.";

  function clean(value, max) {
    return String(value || "").replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim().slice(0, max);
  }

  function readInput() {
    var data = new FormData(form);
    return {
      ad_headline: clean(data.get("ad_headline"), 100),
      ad_body: clean(data.get("ad_body"), 2500),
      ad_cta: clean(data.get("ad_cta"), 80),
      page_headline: clean(data.get("page_headline"), 120),
      page_subheadline: clean(data.get("page_subheadline"), 2500),
      page_cta: clean(data.get("page_cta"), 80),
      traffic_source: clean(data.get("traffic_source"), 40),
      audience: clean(data.get("audience"), 180),
      offer: clean(data.get("offer"), 180),
      conversion_goal: clean(data.get("conversion_goal"), 40)
    };
  }

  function words(text) {
    return clean(text, 3000).toLowerCase().match(/[a-z0-9][a-z0-9'-]{2,}/g) || [];
  }

  function overlap(a, b) {
    var set = {};
    words(a).forEach(function (word) { set[word] = true; });
    return words(b).filter(function (word, index, list) {
      return set[word] && list.indexOf(word) === index && !/^(the|and|for|with|your|that|this|from|you|are|our|can)$/.test(word);
    });
  }

  function hasTerm(text, terms) {
    var value = String(text || "").toLowerCase();
    return terms.some(function (term) {
      var escaped = String(term).toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      return new RegExp("\\b" + escaped + "\\b").test(value);
    });
  }

  function ctaScore(adCta, pageCta) {
    var a = words(adCta).slice(0, 3).join(" ");
    var b = words(pageCta).slice(0, 3).join(" ");
    if (!a || !b) return 45;
    if (a === b || a.indexOf(b) !== -1 || b.indexOf(a) !== -1) return 92;
    if (hasTerm(a, ["start", "try", "get", "download", "buy", "book", "learn", "see"]) &&
        hasTerm(b, ["start", "try", "get", "download", "buy", "book", "learn", "see"])) return 68;
    return 38;
  }

  function level(score) {
    if (score < 40) return "Major mismatch";
    if (score < 60) return "Weak alignment";
    if (score < 75) return "Partial alignment";
    if (score < 90) return "Strong alignment";
    return "Very strong alignment";
  }

  function item(title, body, severity, evidence) {
    return { title: title, body: body, severity: severity || "medium", evidence: evidence || "" };
  }

  function fallback(input) {
    var adText = input.ad_headline + " " + input.ad_body;
    var pageText = input.page_headline + " " + input.page_subheadline;
    var common = overlap(adText, pageText);
    var promise = Math.min(100, 48 + common.length * 8);
    var offer = hasTerm(adText, ["free", "trial", "demo", "download", "price", "save"]) ===
      hasTerm(pageText, ["free", "trial", "demo", "download", "price", "save"]) ? 78 : 42;
    var audience = input.audience ? (hasTerm(pageText, words(input.audience)) ? 82 : 52) : 58;
    var cta = ctaScore(input.ad_cta, input.page_cta);
    var clarity = Math.min(92, 45 + Math.min(5, common.length) * 8 + (input.page_headline.length > 18 ? 10 : 0));
    var trust = hasTerm(adText, ["guarantee", "proven", "trusted", "results"]) &&
      !hasTerm(pageText, ["guarantee", "proven", "trusted", "results"]) ? 35 : 65;
    var overall = Math.round(promise * .25 + offer * .2 + audience * .15 + cta * .15 + clarity * .1 + trust * .1 + 68 * .05);
    var missing = [];
    var contradictions = [];
    var warnings = [];
    var fixes = [];

    if (hasTerm(adText, ["free", "trial", "no credit card"]) && !hasTerm(pageText, ["free", "trial", "no credit card"])) {
      contradictions.push(item("Offer terms are not confirmed", "The ad uses a free or trial promise that the page hero does not visibly confirm.", "critical", input.ad_headline + " / " + input.ad_body));
      fixes.push({ rank: 1, title: "Confirm the offer immediately", reason: "Visitors should see the same free or trial expectation after clicking.", action: "Add the exact offer and any conditions to the page hero." });
    }
    if (cta < 55) {
      contradictions.push(item("CTA continuity is weak", "The next step changes between the ad and the page.", "high", input.ad_cta + " → " + input.page_cta));
      fixes.push({ rank: 2, title: "Make the next step feel continuous", reason: "A different CTA can create hesitation.", action: "Use the ad CTA or explain the transition before asking for a larger commitment." });
    }
    if (common.length < 2) {
      missing.push(item("Core promise is hard to confirm", "The page shares few meaningful terms with the ad, so the promised benefit may be difficult to recognize.", "high", input.ad_headline + " / " + input.page_headline));
      fixes.push({ rank: 3, title: "Repeat the central benefit", reason: "The first screen should confirm why the visitor clicked.", action: "Bring the ad's clearest benefit into the page headline or subheadline." });
    }
    if (input.audience && !hasTerm(pageText, words(input.audience))) {
      missing.push(item("Audience is not visible", "The supplied audience does not appear clearly in the page hero.", "medium", input.audience));
      fixes.push({ rank: 4, title: "Name the intended audience", reason: "Specific relevance helps visitors self-identify.", action: "Add the audience qualifier without inventing a new segment." });
    }
    if (hasTerm(adText, ["guarantee", "best", "#1", "proven", "results"]) && !hasTerm(pageText, ["guarantee", "best", "proven", "results"])) {
      warnings.push(item("Claim needs supporting proof", "A strong claim appears in the ad but supporting confirmation is not visible in the hero.", "medium", input.ad_headline + " / " + input.ad_body));
    }
    if (!fixes.length) fixes.push({ rank: 1, title: "Add specific confirmation", reason: "The match is promising, but the page can make the expected outcome easier to verify.", action: "Use one concrete benefit from the ad in the hero and supporting proof below it." });

    var shared = common.length ? [item("Shared language suggests a related promise", "Both assets reference: " + common.slice(0, 6).join(", ") + ".", "low", input.ad_headline + " / " + input.page_headline)] : [];
    var confidence = (adText.length < 35 || pageText.length < 35) ? "low" : (common.length < 3 ? "medium" : "high");
    var baseVariant = input.ad_headline || input.page_headline;

    return {
      overall_score: Math.max(0, Math.min(100, overall)),
      confidence: confidence,
      dimensions: { promise_alignment: promise, offer_alignment: offer, audience_alignment: audience, cta_alignment: cta, clarity: clarity, trust_continuity: trust },
      shared_promises: shared,
      missing_confirmations: missing,
      contradictions: contradictions,
      claim_warnings: warnings,
      priority_fixes: fixes.slice(0, 5),
      revised_hero_variants: [
        { headline: baseVariant, subheadline: input.ad_body.slice(0, 150), cta: input.ad_cta, grounding_note: "Uses supplied ad language only." },
        { headline: input.page_headline, subheadline: "Make the advertised benefit unmistakable before asking visitors to continue.", cta: input.ad_cta, grounding_note: "Keeps the supplied headline and CTA." }
      ]
    };
  }

  function validReport(report) {
    var dimensions = report && report.dimensions;
    return report && Number.isFinite(report.overall_score) && report.overall_score >= 0 && report.overall_score <= 100 &&
      ["low", "medium", "high"].indexOf(String(report.confidence).toLowerCase()) !== -1 &&
      dimensions && ["promise_alignment", "offer_alignment", "audience_alignment", "cta_alignment", "clarity", "trust_continuity"].every(function (key) {
        return Number.isFinite(dimensions[key]) && dimensions[key] >= 0 && dimensions[key] <= 100;
      }) &&
      Array.isArray(report.shared_promises) && report.shared_promises.length <= 10 &&
      Array.isArray(report.missing_confirmations) && report.missing_confirmations.length <= 10 &&
      Array.isArray(report.contradictions) && report.contradictions.length <= 10 &&
      Array.isArray(report.claim_warnings) && report.claim_warnings.length <= 10 &&
      Array.isArray(report.priority_fixes) && report.priority_fixes.length <= 10 &&
      Array.isArray(report.revised_hero_variants) && report.revised_hero_variants.length <= 5;
  }

  function requestReport(input) {
    return fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input)
    }).then(function (response) {
      if (response.status === 429) throw new Error("rate-limited");
      if (!response.ok) throw new Error("request-failed");
      return response.json();
    }).then(function (data) {
      if (!validReport(data)) throw new Error("invalid-report");
      return data;
    });
  }

  function copyText(text, successMessage) {
    if (!navigator.clipboard || !window.isSecureContext) {
      status.textContent = "Copy is unavailable. Select and copy the text manually.";
      return Promise.resolve(false);
    }
    return navigator.clipboard.writeText(text).then(function () {
      status.textContent = successMessage;
      return true;
    }).catch(function () {
      status.textContent = "Copy failed. Select and copy the text manually.";
      return false;
    });
  }

  function safeText(value) {
    return document.createTextNode(String(value || ""));
  }

  function renderItems(container, list) {
    container.textContent = "";
    if (!list.length) {
      var empty = document.createElement("p");
      empty.className = "item";
      empty.appendChild(safeText("No major issue detected in this category."));
      container.appendChild(empty);
      return;
    }
    list.slice(0, 6).forEach(function (entry) {
      var box = document.createElement("div");
      box.className = "item " + String(entry.severity || "medium").toLowerCase();
      var title = document.createElement("b");
      title.appendChild(safeText(entry.title || entry.issue || entry.summary || "Observation"));
      var body = document.createElement("div");
      body.appendChild(safeText(entry.body || entry.reason || entry.recommendation || ""));
      box.appendChild(title);
      box.appendChild(body);
      if (entry.evidence) {
        var evidence = document.createElement("small");
        evidence.appendChild(safeText("Evidence: “" + String(entry.evidence).slice(0, 220) + "”"));
        box.appendChild(evidence);
      }
      container.appendChild(box);
    });
  }

  function render(report, mode) {
    latestReport = report;
    latestMode = mode;
    results.hidden = false;
    document.getElementById("score").textContent = report.overall_score + "/100";
    document.getElementById("score").setAttribute("aria-label", "Overall score " + report.overall_score + " out of 100, " + level(report.overall_score));
    document.getElementById("score-description").textContent = level(report.overall_score);
    document.getElementById("result-mode").textContent = mode;

    var dimensionLabels = { promise_alignment: "Core promise", offer_alignment: "Offer and benefit", audience_alignment: "Audience", cta_alignment: "CTA continuity", clarity: "Specificity and clarity", trust_continuity: "Trust and proof" };
    var dimensionBox = document.getElementById("dimensions");
    dimensionBox.textContent = "";
    Object.keys(dimensionLabels).forEach(function (key) {
      var box = document.createElement("div");
      box.className = "dimension";
      var value = document.createElement("b");
      value.appendChild(safeText(report.dimensions[key] + "/100"));
      var label = document.createElement("small");
      label.appendChild(safeText(dimensionLabels[key]));
      box.appendChild(value);
      box.appendChild(label);
      dimensionBox.appendChild(box);
    });

    renderItems(document.getElementById("shared"), report.shared_promises);
    renderItems(document.getElementById("missing"), report.missing_confirmations);
    renderItems(document.getElementById("contradictions"), report.contradictions);
    renderItems(document.getElementById("warnings"), report.claim_warnings);

    var fixes = document.getElementById("fixes");
    fixes.textContent = "";
    report.priority_fixes.slice(0, 5).forEach(function (fix) {
      var li = document.createElement("li");
      var strong = document.createElement("b");
      var text = document.createElement("span");
      strong.appendChild(safeText(fix.title));
      text.appendChild(safeText(" — " + (fix.reason || "") + " " + (fix.action || "")));
      li.appendChild(strong);
      li.appendChild(text);
      fixes.appendChild(li);
    });

    var variants = document.getElementById("variants");
    variants.textContent = "";
    report.revised_hero_variants.slice(0, 3).forEach(function (variant) {
      var card = document.createElement("div");
      var title = document.createElement("b");
      var copy = document.createElement("p");
      var button = document.createElement("button");
      card.className = "variant";
      button.className = "secondary";
      button.type = "button";
      button.textContent = "Copy variant";
      title.appendChild(safeText(variant.headline));
      copy.appendChild(safeText(variant.subheadline + " " + variant.cta));
      card.appendChild(title);
      card.appendChild(copy);
      card.appendChild(button);
      button.addEventListener("click", function () {
        copyText(variant.headline + "\n" + variant.subheadline + "\nCTA: " + variant.cta, "Variant copied.");
      });
      variants.appendChild(card);
    });

    var reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    results.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
  }

  function summary() {
    var top = latestReport.priority_fixes[0] || {};
    return "PromiseMatch score: " + latestReport.overall_score + "/100 (" + level(latestReport.overall_score) + "). Top issue: " + (top.title || "Review alignment") + ". Recommended fix: " + (top.action || "Confirm the ad promise on the page.") + " Confidence: " + latestReport.confidence + ".";
  }

  form.addEventListener("submit", function (event) {
    event.preventDefault();
    if (busy || !form.reportValidity()) return;

    busy = true;
    submitButton.disabled = true;
    status.textContent = "Checking promise, offer, audience, and CTA continuity…";

    var input = readInput();
    var local = fallback(input);
    render(local, "Rules-only diagnostic.");

    if (!API_URL) {
      status.textContent = "Rules-only audit complete.";
      busy = false;
      submitButton.disabled = false;
      return;
    }

    requestReport(input).then(function (remote) {
      render(remote, "Rules plus optional AI analysis.");
      status.textContent = "Audit complete.";
    }).catch(function (error) {
      if (error.message === "rate-limited") {
        status.textContent = "Rules-only audit ready. The enhanced service is temporarily rate-limited.";
      } else {
        status.textContent = "Rules-only audit ready. Enhanced analysis was unavailable.";
      }
    }).finally(function () {
      busy = false;
      submitButton.disabled = false;
    });
  });

  clearButton.addEventListener("click", function () {
    form.reset();
    results.hidden = true;
    status.textContent = "Form cleared.";
    form.querySelector("input").focus();
  });

  document.getElementById("copy-button").addEventListener("click", function () {
    if (latestReport) copyText(summary(), "Report summary copied.");
  });

  document.getElementById("share-button").addEventListener("click", function () {
    if (!latestReport) return;
    var card = document.getElementById("share-card");
    var top = latestReport.priority_fixes[0] || {};
    card.hidden = false;
    card.textContent = "";

    var eyebrow = document.createElement("p");
    var score = document.createElement("strong");
    var issue = document.createElement("p");
    var fix = document.createElement("p");
    var date = document.createElement("small");

    eyebrow.className = "eyebrow";
    eyebrow.appendChild(safeText("PromiseMatch scorecard"));
    score.appendChild(safeText(latestReport.overall_score + "/100"));
    issue.appendChild(safeText("Top issue: " + (top.title || "Review alignment")));
    fix.appendChild(safeText("Top fix: " + (top.action || "Confirm the ad promise on the page.")));
    date.appendChild(safeText(new Date().toLocaleDateString() + " · PromiseMatch"));

    card.appendChild(eyebrow);
    card.appendChild(score);
    card.appendChild(issue);
    card.appendChild(fix);
    card.appendChild(date);
    status.textContent = "Privacy-safe share card created. Full copy is not included.";
    card.scrollIntoView({ behavior: "smooth", block: "center" });
  });
}());
