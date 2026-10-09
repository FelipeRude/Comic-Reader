# Sitemap audit (pre-launch), 2026-10-09

Score: 88/100

Scope: dist/sitemap.xml (live build), dist/robots.txt, dist/**/*.html, staging https://develop.panelzoom.com. Plugin: sitemap_discovery.py (staging: sitemap.xml found, valid urlset, no declared sitemaps because robots is Disallow, expected).

## Checks
| Check | Result |
|---|---|
| XML well-formed, namespaces (sitemap + xhtml) | PASS |
| Size/limits (2 URLs) | PASS |
| Deprecated tags priority/changefreq | PASS (none) |
| loc: absolute https://panelzoom.com, trailing slash, matches canonical | PASS |
| hreflang de/en/x-default, reciprocal, identical on both URLs, self-referencing | PASS |
| hreflang in sitemap == hreflang in page HTML (de/, en/) | PASS |
| URL set vs dist: /de/, /en/ included | PASS |
| Excluded: impressum, datenschutz, legal-notice, privacy (noindex,follow), /app/ (noindex), 404 | PASS (correct; excluded by build filter `!p.noindex`) |
| robots.txt (live) `Allow: /` + `Sitemap: https://panelzoom.com/sitemap.xml` | PASS |
| Staging: robots Disallow / + empty urlset | PASS (intentional, not a finding) |
| lastmod W3C format | PASS (2026-10-05) |

## Findings
1. Low: lastmod is identical on both URLs (2026-10-05) and comes from frontmatter `updated`. Fine as long as it is maintained manually; it must be bumped on real content changes. Consider checking that it is not stale (today 2026-10-09, last src commit 2026-10-09).
2. Low/Info: x-default points to https://panelzoom.com/ (language chooser, JS-driven via assets/root.*.js). That URL is not in the sitemap and has no canonical or robots meta. Valid pattern, but make sure the root serves 200 (not a server redirect conflicting) and consider adding `<link rel="canonical" href="https://panelzoom.com/">` to dist/index.html. Optional: add the root URL to the sitemap with the same alternates.
3. Info: legal pages' hreflang x-default points to the EN version (not "/"), differing from landing pages. Harmless since they are noindex and not in the sitemap.
4. Info: Legal pages are noindex,follow and carry hreflang/canonical; consistent but hreflang on noindex pages is ignored by Google.
5. Info: /app/ is noindex and absent from sitemap and not blocked in robots.txt, so the noindex stays crawlable. Correct setup. Do not add a Disallow.
6. Info: Live sitemap cannot be fetched until panelzoom.com is deployed; re-run `sitemap_discovery.py https://panelzoom.com --json` after launch, then submit in Search Console/Bing.

## Recommendation
Launch-ready. No critical or high issues. Post-launch: verify live status codes of /de/, /en/, / and submit the sitemap.
