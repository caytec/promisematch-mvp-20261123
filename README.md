# PromiseMatch MVP

PromiseMatch is a static, rules-first ad-to-landing-page message-match checker with an optional Vercel serverless AI enhancement.

## Deployment modes

### GitHub Pages

The frontend works without an API. `js/config.js` intentionally sets:

```js
window.API_URL = "";
```

With an empty API URL, submissions use the in-browser rules-only fallback and do not attempt `/api/generate`.

Enable GitHub Pages from the repository's Pages settings. `.nojekyll` is included, and all browser asset paths are relative.

### Vercel

The repository includes:

- `api/generate.js`
- `vercel.json`
- `.env.example`
- `package.json`

Install the Vercel CLI and run:

```bash
npm install -g vercel
vercel dev
```

Deploy with:

```bash
vercel
```

For optional AI enhancement, configure the server-side Vercel environment variables:

- `AI_PROVIDER`
- `GEMINI_API_KEY`
- `GROQ_API_KEY`
- `ALLOWED_ORIGINS`

Only `AI_PROVIDER=gemini` or `AI_PROVIDER=groq` enables a provider. Leave it empty for rules-only behavior. Configure only the matching provider key.

Never use public prefixes such as `NEXT_PUBLIC_` or `VITE_` for these secrets. Never place provider keys in HTML, client JavaScript, JSON, GitHub Pages files, logs, or share URLs. Redeploy after changing Vercel environment variables.

## API URL configuration

There is one browser configuration value in `js/config.js`:

```js
window.API_URL = "";
```

The default must remain empty. For a same-origin Vercel deployment, a deployment-specific text-only override may set it to `/api/generate`. Do not hardcode a Vercel hostname or any other production API hostname.

GitHub Pages should leave it empty.

## API behavior

- `GET /api/generate` returns a no-store health response.
- `POST /api/generate` requires `application/json`.
- Arrays and invalid request bodies are rejected.
- Request body size is bounded.
- Required fields and total input length are validated.
- Invalid or empty provider configuration returns deterministic rules-only output.
- Provider calls have an eight-second timeout.
- Output is schema-checked and bounded.
- The best-effort in-memory rate limiter allows five analyses per IP identity per hour.
- `ALLOWED_ORIGINS` accepts a comma-separated origin allowlist. Empty means same-site/default deployment behavior.
- Provider keys remain server-side.

The in-memory rate limiter is instance-local and is not a substitute for a durable production abuse-prevention service.

## Local checks

Run:

```bash
npm run check
```

The project has no runtime dependencies.

## SEO

The canonical URLs, `og:url`, `og:image`, Twitter image, sitemap locations, and robots sitemap line use the required absolute GitHub Pages project URLs:

`https://caytec.github.io/promisematch-mvp-20261123/`

If the repository is deployed under a different verified origin or path, update every affected absolute URL consistently before indexing.

The accepted social image is the text-only SVG at `assets/og.svg`. A raster social-image fallback is intentionally not included because the deployment pipeline accepts text files only. Creating and testing a raster fallback is a manual later step.

## Privacy

Do not paste confidential, personal, medical, financial, customer, or unreleased campaign information.

When an AI provider is configured, normalized submitted copy may be sent to the configured Gemini or Groq provider. Verify provider retention and processing terms before public launch. Add a verified operator support address to `privacy.html` before public launch.

## Release checklist

- [ ] Run `npm run check`.
- [ ] Confirm all HTML, CSS, JS, SVG, sitemap, and robots references exist.
- [ ] Test GitHub Pages with empty `window.API_URL`.
- [ ] Test Vercel API success and rules-only fallback.
- [ ] Test invalid content type, oversized body, arrays, missing fields, 429, timeout, and malformed provider response.
- [ ] Test keyboard navigation and reduced motion.
- [ ] Test clipboard denial and manual-copy messaging.
- [ ] Verify canonical and social URLs return successfully.
- [ ] Add a verified privacy contact.
- [ ] Confirm provider model availability, quotas, and retention terms.
