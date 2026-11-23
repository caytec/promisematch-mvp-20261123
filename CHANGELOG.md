# Changelog

## QA issue mapping

### P0-001 — GitHub Pages cannot serve the Vercel API

Fixed by adding `js/config.js` with an empty default API URL and changing the client flow to render a rules-only report without attempting a request when `window.API_URL` is empty. `README.md` documents GitHub Pages and Vercel behavior.

### P0-002 — Hardcoded default API hostname risk

Fixed by using exactly one configurable `window.API_URL` value in `js/config.js`, whose default is `""`. No Vercel hostname or other API hostname is hardcoded in browser code.

### P0-003 — SEO URLs are not valid production URLs

Fixed by using absolute `https://caytec.github.io/promisematch-mvp-20261123/` URLs for canonical tags, `og:url`, `og:image`, Twitter image, `sitemap.xml`, and the `robots.txt` Sitemap line.

### P0-004 — Missing production-domain configuration

Fixed by adding self-referencing absolute canonical tags and absolute `og:url` metadata to every indexable HTML page.

### P1-001 / P1-002 — Incomplete and relative social metadata

Fixed by adding page-specific Open Graph and Twitter metadata to every HTML page and referencing `assets/og.svg` through its required absolute URL.

### P1-003 / P1-004 — Sitemap and robots path safety

Fixed with absolute sitemap locations and the project-path-aware robots rules.

### P1-005 — Incomplete JSON-LD

Fixed with truthful WebApplication identity, URL, image, category, operating system, browser requirement, and offer fields on the homepage.

### P1-006 — API content type, body size, and object validation

Fixed with JSON content-type enforcement, array rejection, content-length enforcement, normalized field limits, and total input validation.

### P1-007 — Rate limiter identity

Improved by avoiding arbitrary `x-forwarded-for` as the primary identity and preferring platform-provided `x-vercel-forwarded-for` or `x-real-ip`. The in-memory limiter remains best-effort and is documented as unsuitable for durable production abuse protection.

### P1-008 — Unknown provider fallthrough

Fixed by explicitly accepting only `gemini` or `groq`; empty or invalid values return rules-only output.

### P1-009 — Provider data disclosure

Improved in `privacy.html` and `README.md`: provider processing, server-side keys, user-data warning, and verification requirements are disclosed. A verified operator contact remains a deployment-owner task before public launch.

### P1-010 — CSP deployment requirements

Fixed with restrictive same-origin CSP plus explicit cross-origin isolation headers. `README.md` documents that any separate API origin requires a deliberate CSP update.

### P1-011 — Clipboard failures

Fixed with a shared clipboard helper that checks secure context and Clipboard API availability and provides manual-copy fallback messaging.

### P1-012 — Result mode ambiguity

Fixed with `#result-mode`, which distinguishes rules-only diagnostics from rules plus optional AI analysis.

### P1-013 — HTTP and validation error handling

Fixed by distinguishing rate-limit failures from general request, response, and schema failures without exposing sensitive server details.

### P1-014 — Unbounded nested output

Fixed with bounded item, fix, variant, array, string, score, and dimension validation on the API and bounded top-level validation in the browser.

### P1-015 — Defensive provider parsing

Fixed with `providerText`, which safely reads Gemini and Groq response structures without assuming nested arrays exist.

### P1-016 — Rules-only `.env.example`

Fixed by leaving `AI_PROVIDER` empty by default and documenting optional provider configuration.

### P1-017 — Secret handling documentation

Fixed in `.env.example` and `README.md`; only the four approved environment variable names are used.

### P1-018 — Missing CTA styling

Fixed by defining `.button-link`, including hover and focus styling.

### P1-019 — Mobile navigation hiding links

Fixed by removing the mobile second-link hide rule and allowing navigation wrapping.

### P1-020 — Accessibility labels and result feedback

Fixed with required-field explanation, hidden decorative required markers, explicit optional-control IDs, score interpretation, result mode, and live status messaging.

### P1-021 — Draft persistence

Not implemented intentionally. This MVP does not store submitted copy in browser session storage, avoiding unexpected persistence of potentially sensitive marketing text.

### P1-022 — Substring matching false positives

Improved with token-aware regular-expression matching in client and server fallback logic.

### P1-023 — Unsupported AI evidence

Partially mitigated by strict bounded output validation and deterministic fallback. Provider evidence-grounding verification remains a follow-up before treating AI output as authoritative; deterministic rules remain the resilience path.

### P1-024 — Origin policy

Fixed with configurable `ALLOWED_ORIGINS` validation in `api/generate.js`. No permissive wildcard CORS header is emitted.

### P2-001 — Raster OG image

Not included. `assets/og.svg` is the accepted text-only asset. A raster social-image fallback is a manual later step and no `.png` or `.jpg` file is referenced or listed.

### P2-002 / P2-003 — Legal and supporting-page SEO

Fixed by adding absolute canonical, Open Graph, Twitter, and `og:url` metadata to every supplied HTML page.

### P2-004 — Content depth

Improved through methodology, platform-specific, examples, privacy, and terms pages with internal links and limitations.

### P2-005 / P2-006 — Field help and autocomplete

Fixed with field help for key fields and `autocomplete="off"` on copy inputs.

### P2-007 — Reduced motion

Fixed in CSS and JavaScript.

### P2-008 — API health indexing

Fixed with `Cache-Control: no-store` and `X-Robots-Tag: noindex, nofollow` on API responses.

### P2-009 / P2-010 — Automated and browser QA

Documented in `README.md` as release checks. Live deployment and browser acceptance testing remain operational follow-up work.

## Pipeline note

No binary files are included or referenced. The SVG social asset satisfies the text-only deployment constraint. A raster OG image is intentionally deferred as a manual later step.
