# Performance and Images – PanelZoom staging (2026-10-09)

Scores: **Performance 92/100**, **Images 82/100**

Method: PSI API was rate-limited (HTTP quota error on all 4 runs, no key), so the local Lighthouse 13.5.0 CLI was used (lab only, simulated throttling). No CrUX field data exists for the staging host. Staging noindex is intentional and not a finding.

## Lab results
| URL | Strategy | Perf | LCP | TBT | CLS | FCP | TTFB (root doc) |
|---|---|---|---|---|---|---|---|
| /de/ | mobile | 100 (runs: 86, 100, 100) | 1.3 s | 0 ms (one outlier 550 ms) | 0 | 0.9 s | 50 ms |
| /de/ | desktop | 100 | 0.4 s | 0 | 0 | 0.3 s | 30 ms |
| /en/ | mobile | 100 | 1.3 s | 0 | 0 | 0.9 s | 60 ms |
| /en/ | desktop | 100 | 0.4 s | 0 | 0 | 0.3 s | 40 ms |
| /app/ | mobile | 99 | 1.7 s | 0 | 0.003 | - | - |

CWV status (lab): LCP pass, CLS pass, INP not measurable in lab (TBT 0 ms is a good proxy; no heavy JS). Accessibility 97 and Best Practices 100 on both pages.
Transfer: landing about 1.2 MB, /app/ about 203 KiB.

## Findings
1. (Medium) No Cache-Control/ETag-based caching headers seen on /media/*.webp or /fonts/*.woff2 (curl returned no cache header). Hashed /assets/* should be `max-age=31536000, immutable`; fonts too; media at least a long max-age. Affects repeat visits only, not lab scores.
2. (Low) LCP image (hero-dark.webp, `loading=eager`) lacks `fetchpriority="high"` (Lighthouse lcp-discovery-insight). Add it; also consider `<link rel=preload as=image>`. Image is discoverable in HTML, so gain is small.
3. (Low) Single TBT outlier of 550 ms (perf 86) on 1 of 3 /de/ mobile runs; unreproducible, likely lab noise (autoplaying video decode/unattributable CPU). Re-check with field data after launch.
4. (Low) CSS to lang.js chain is 305 ms (network-dependency-tree); acceptable. Could inline critical CSS, optional.
5. (Low, a11y) color-contrast fails on header CTA `a.btn.btn--small` ("Comic öffnen & lesen" / EN equivalent). Both languages. Pass to accessibility owner.
6. (Low) /app/ CLS 0.003, LCP 1.7 s: fine.

## Images
Files in dist/media: hero-dark.webp 46.8 KB, detect.webp 53.5 KB, install-ios.webp 12.3 KB, install-android.webp 10.6 KB, felipe.webp 26.7 KB (640x640). All WebP, all small. Fonts: Bangers latin 23.5 KB + latin-ext 17.2 KB woff2 (latin preloaded, with crossorigin; good; font-display not verified).
- Good: width/height set on all imgs (CLS 0), hero eager, below-fold lazy, descriptive localized alt (DE and EN) on content images, decorative logo uses alt="" correctly, served as image/webp.
- The 4 animated assets are delivered as `<video>` (webm + mp4) with a static WebP img fallback inside. Video weight is notable: hero-dark.webm 467 KB / mp4 478 KB; install-ios 310 KB; install-android 243-268 KB; detect 101-132 KB. Total video about 1.2 MB, which is nearly all of the page weight. Check that below-fold videos do not download before scroll: they use autoplay and no `preload="none"`/lazy handling visible in markup, so below-fold videos likely load eagerly. (Medium) Add `preload="none"` or IntersectionObserver-based src loading for detect/install videos; add `poster` for hero video.
- (Low) felipe.webp is 640x640; check it is displayed at much smaller size (not verified; could use 320 px or srcset).
- (Low) hero img is 480x600 on a 334 px-wide mobile slot: acceptable, but 2x variant not needed.
- Not verified: whether videos actually autoplay lazily; felipe.webp usage on the page (not in the /de/ or /en/ first 25 tags).

## Score rationale
Performance 92: lab near-perfect; deductions for missing cache headers, no fetchpriority, unverified field/INP, one noisy run, heavy video payload. Images 82: formats, dimensions, alt are excellent; deductions for eager-loaded below-fold video weight and no cache headers.
