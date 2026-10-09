# Technical SEO – Pre-Launch Audit PanelZoom (2026-10-09)

Scope: staging https://develop.panelzoom.com (fetched live) plus the local live build in `dist/` (robots.txt, sitemap.xml, .htaccess, HTML heads). The staging noindex (X-Robots-Tag, robots.txt Disallow, meta robots) is intentional and not counted as a finding.

**Technical score: 88/100.** No Critical issues. The live build is clean: canonical, hreflang, sitemap, redirects, 404 and security headers are all correct. The deductions are for missing social and structured-data basics, a dev-icon leak into the live PWA and a few hardening gaps.

| Category | Status |
|---|---|
| Crawlability | PASS |
| Indexability | PASS |
| Security | PASS, with hardening gaps |
| URL structure and redirects | PASS |
| Mobile | PASS |
| Core Web Vitals (source review) | PASS, with risks |
| Structured data | FAIL (none) |
| JS rendering | PASS |
| IndexNow | Not implemented (optional) |

## Critical
None.

## High
None.

## Medium

**M1. Live PWA precaches and ships the dev icon set `app/img/pwa-dev/`.**
- Evidence: `dist/app/img/pwa-dev/` exists, and `dist/app/sw.js` precaches `img/pwa-dev/*` (logo, favicons, maskable and icon PNGs).
- Impact: wasted install size and precache. Dev branding could appear if anything references those files.
- Fix: exclude `pwa-dev` from the live build or from the workbox `globPatterns`. Check the Vite/PWA config and the copy step in `scripts/build-site.mjs`. For the live build, copy only `public/img/pwa`.

**M2. No `og:image` or `twitter:image`; `twitter:card` is `summary` with no image.**
- Evidence: no `og:image` in `dist/{de,en}/index.html`.
- Impact: link shares on Messenger, Discord, Reddit and Slack show no preview. This hurts launch-day sharing.
- Fix: add a 1200x630 PNG or JPG (absolute URL `https://panelzoom.com/media/og.png`) plus `og:image:alt`, and set `twitter:card=summary_large_image` and `twitter:image`. Do this in the head template in `scripts/build-site.mjs` and `site/`.

**M3. No structured data on the landing pages.**
- Evidence: `grep ld+json` returns 0 matches in `de/index.html` and `en/index.html`.
- Fix: add JSON-LD with `WebSite`, `Organization` and `SoftwareApplication` (or `WebApplication`: free offer, `applicationCategory` Entertainment/Utilities, `operatingSystem` Any, `inLanguage`). Only add FAQPage if the visible FAQ matches. Google restricts FAQ rich results to authoritative sites, so there is little benefit.

**M4. The hero LCP element is not prioritised.**
- Evidence: the hero is `<img src=/media/hero-dark.webp loading=eager>` with a `<video autoplay>` overlay (hero-dark.mp4 478 KB, webm 467 KB). There is no `fetchpriority="high"` on the image, no `<link rel=preload as=image>`, and no `poster`/`preload` attribute on the video. The font preload runs ahead of the hero image.
- Impact: LCP risk on mobile 4G. Dimensions are set (480x600), so CLS is fine.
- Fix: add `fetchpriority="high"` to the hero img, and `preload="none"` or `metadata` on the video. Start the video after `load`. Consider whether the 467 KB hero video is worth its weight against the 47 KB webp.

## Low

**L1. `x-default` points to `/`, which is a 302 and a JS redirect page.**
- Evidence: sitemap and all heads use `hreflang="x-default" href="https://panelzoom.com/"`. `/` answers 302 to `/de/` or `/en/` (Accept-Language or cookie), with `Vary: Accept-Language, Cookie` and `Cache-Control: no-store`. Without Apache the fallback is `dist/index.html` with a JS redirect.
- Assessment: valid and common (language selector or router as x-default), and Google tolerates it. The root has no canonical, so Google may treat `/` as a duplicate of `/en/`.
- Fix (optional): keep as is. The more robust alternative is `x-default` = `/en/`. Note that `/` is not in the sitemap as its own `<url>`, which is fine.

**L2. The legal pages are in the hreflang cluster but are `noindex, follow`.**
- Evidence: `de/impressum` and `en/privacy` have `<meta name="robots" content="noindex, follow">` plus canonical and hreflang. They are correctly absent from the sitemap and not blocked in robots.
- Assessment: noindex pages in an hreflang cluster are ignored. Harmless and consistent. Both legal pages are linked in the footer. Keep it.

**L3. HSTS is minimal and there are no Permissions-Policy, COOP or CORP headers.**
- Evidence: `Strict-Transport-Security: max-age=31536000` (no `includeSubDomains`, no `preload`). Present: `X-Content-Type-Options`, `Referrer-Policy`, `X-Frame-Options`, a strict CSP (no unsafe-inline, `frame-ancestors 'self'`).
- Fix in `scripts/build-site.mjs` (the .htaccess generator): add `Permissions-Policy: camera=(), microphone=(), geolocation=()`. Add `includeSubDomains` only once all subdomains are HTTPS. `develop.panelzoom.com` is currently HTTPS. Do not add `preload` yet.

**L4. No IndexNow.**
- Evidence: no key file or ping script. `docs/SEO-PLAN.md:539` lists it as optional.
- Assessment: 2 indexable URLs; Google ignores IndexNow, so the benefit is Bing, Yandex and Naver only. A post-deploy `curl` to `https://api.indexnow.org/indexnow` with a key file `/<key>.txt` in `scripts/deploy.sh` is enough. Alternatively submit the sitemap in Bing Webmaster Tools.

**L5. `/app/` has `meta robots noindex` and the viewport disables zoom (`user-scalable=no`, `maximum-scale=1`).**
- Assessment: noindex is intentional (SEO-Plan 4.6 a). `/app/` stays crawlable in robots, so the noindex is visible. Disabling zoom is an accessibility smell (WCAG 1.4.4), but it is deliberate for the canvas reader. The landing pages are fine. No fix needed for SEO.

**L6. `og:image` aside, the landing pages have a single `twitter:card` and no `<link rel=manifest>` on the landing.**
- Assessment: the manifest is only on `/app/`, which is correct for the SW scope.

**L7. The `sitemap.xml` `lastmod` is static (2026-10-05).**
- Fix: regenerate `lastmod` per build or per content change (it is generated in `scripts/build-site.mjs`). Not blocking.

## Verified OK (evidence)

- **robots.txt (live, `dist/robots.txt`):** `User-agent: * / Allow: /` plus `Sitemap: https://panelzoom.com/sitemap.xml`. `/app/` and the assets are not blocked. The staging robots.txt is Disallow, as intended. No leak of the staging file into dist. `grep develop` finds nothing in dist.
- **Sitemap discovery script:** `sitemap_discovery.py` on develop found `/sitemap.xml` (200, valid urlset). It is not declared in the staging robots.txt (intentional). The live robots.txt declares the live sitemap. The live sitemap lists `/de/` and `/en/` with reciprocal hreflang (de, en, x-default). The URLs are absolute and use the canonical host `panelzoom.com`.
- **Canonicals:** self-referencing and absolute on every page, pointing at the live host. On staging they point to `https://panelzoom.com/...`, which is expected and noindex anyway. `/app/` has no canonical, which is fine with noindex.
- **hreflang:** reciprocal across landing and legal pairs (de/impressum ↔ en/legal-notice, de/datenschutz ↔ en/privacy). `html lang` matches. `og:locale` plus `alternate` are set. `x-default` is consistent.
- **Status codes (staging):** `/de/`, `/en/`, legal pages and `/app/` return 200. `/nonexistent/` returns a real 404 with a helpful bilingual page and `noindex`. `/robots.txt` and `/sitemap.xml` return 200.
- **Redirects:** `http://` → 301 https. `/de` → 301 `/de/`. `/` → 302 by cookie `lang=de|en`, then Accept-Language (`fr` falls back to `/en/`; no header gives `/en/`). One hop, no chains. `www` → apex 301 in the live .htaccess. `/…/index.html` → `/…/` 301 (except `/app/`). Googlebot (no Accept-Language) lands on `/en/`.
- **Caching:** root `no-store` + `Vary`. `sw.js`, `manifest` and the app shell are `no-cache`. Hashed assets are `immutable`, 1 year. `.webmanifest` is served as `application/manifest+json`, `.mjs` as text/javascript, `.webp` as image/webp.
- **Mobile:** viewport present on all pages. Landing images and videos have width/height (no CLS). The skip link, lazy-loaded media below the fold and the `playsinline` videos are correct.
- **JS rendering:** the landing and legal pages are fully static HTML (SSG). Content, title, meta, canonical and hreflang are in the raw source. The only JS on the landing is progressive enhancement (dropzone, install tabs, `lang.js`), with a `<noscript>` link. `/app/` is a CSR Vue shell, which is acceptable because it is noindex. The SW `NavigationRoute` is bound to `/app/index.html`, with scope `/app/`. It does not intercept the landing pages.
- **Headers:** CSP, nosniff, Referrer-Policy and X-Frame-Options are present on all responses, including 404.
- **llms.txt:** present with correct live URLs.
- **Titles and descriptions:** unique per page and language, and the lengths are reasonable.

## Launch-blocker check
Nothing found that blocks launch on panelzoom.com. Before go-live, check that the live host serves the generated `.htaccess` (the staging rules were verified live), and that the live deploy replaces robots.txt and drops `X-Robots-Tag` (the live `.htaccess` contains no such header). After deploy, re-check the live responses for robots.txt, `/` (302), the `X-Robots-Tag` header (absent) and the sitemap, then submit the sitemap in Google Search Console and Bing Webmaster Tools. Fix M1 first (small), then M2 and M3.
