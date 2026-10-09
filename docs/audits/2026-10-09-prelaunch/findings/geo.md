# GEO / AI Search Readiness – PanelZoom (pre-launch)

Date: 2026-10-09
Audited: https://develop.panelzoom.com/de/ and /en/ (rendered with claude-seo `render_page.py --mode auto`), plus the live build artifacts in `dist/` (robots.txt, llms.txt, sitemap.xml, index.html files).
Staging `noindex` / `X-Robots-Tag: noindex, nofollow` is intentional and not counted.

## GEO Readiness Score: 68 / 100

| Dimension | Weight | Score | Weighted |
|---|---|---|---|
| Citability | 25% | 72 | 18.0 |
| Structural Readability | 20% | 85 | 17.0 |
| Multi-Modal Content | 15% | 65 | 9.8 |
| Authority & Brand Signals | 20% | 35 | 7.0 |
| Technical Accessibility | 20% | 80 | 16.0 |
| **Total** | | | **~68** |

The content is a good base: static HTML, a clean heading hierarchy, and a FAQ with direct answers. The score is held back by authority and entity signals. The pages have no structured data, no sameAs or profile links, no dates, no og:image, and no third-party footprint yet. That last one is expected before launch.

## AI Crawler Access (live `dist/robots.txt`)

```
User-agent: *
Allow: /
Sitemap: https://panelzoom.com/sitemap.xml
```

Every crawler is allowed. Nothing is blocked by name.

| Crawler | What it governs | Status |
|---|---|---|
| OAI-SearchBot | ChatGPT Search citations | Allowed |
| Claude-SearchBot | Claude search citations | Allowed |
| PerplexityBot | Perplexity search index | Allowed |
| Googlebot | Google Search and AI Overviews / AI Mode inclusion | Allowed |
| Bingbot | Bing and Copilot. ChatGPT Search also leans on Bing | Allowed |
| Applebot | Siri / Spotlight / Safari suggestions | Allowed |
| GPTBot | OpenAI model training only | Allowed (optional) |
| ClaudeBot | Anthropic model training only | Allowed (optional) |
| Google-Extended | Gemini/Vertex training and grounding, plus training of the models behind Search gen-AI features. Has no effect on AI Overviews inclusion | Allowed (optional) |
| Applebot-Extended | Apple Intelligence training only | Allowed (optional) |
| CCBot | Common Crawl, which feeds many training sets | Allowed (optional) |
| cohere-ai | Cohere training | Allowed (optional) |

Assessment: this works well for a new brand. Allowing the training crawlers helps models learn the name "PanelZoom" and what it is, at no real cost, since the site has no paywalled content. `/app/` can be crawled and has `<meta name="robots" content="noindex">`, which is correct.

Launch blocker (operational, not a content issue): `https://panelzoom.com/robots.txt` currently returns the hosting placeholder 404 page, and `https://panelzoom.com/` serves a placeholder. Check after deploy that robots.txt, llms.txt and sitemap.xml are served from the live root with `text/plain` / `application/xml`.

RSL 1.0 licensing: none (no `License:` line in robots.txt, no `/license.xml`). This is optional and low priority for a free tool. Add it only if you want to state AI-use terms explicitly.

## llms.txt: present, valid, thin

It follows the llmstxt.org format: H1, a blockquote summary, and an H2 link list. The summary is accurate and dense ("free, privacy-first PWA ... panel by panel ... no account, no uploads, works offline").

Gaps:
- The links have no `: description` suffix. The spec expects a short note per link.
- There is no "Key facts" or "Limitations" block. These are the facts an LLM most often gets wrong or hedges on: PDF only, CBZ planned, no right-to-left/manga mode yet, detection works best with light gutters, data lives in browser storage and Safari may evict it, price is 0, no ads.
- There is no author or contact line (Felipe Rude, solo developer, impressum link). There are also no links to the FAQ sections or the privacy policy.
- "guided-view style smart zoom": "Guided View" is a comiXology/Amazon trademark. A descriptive phrase such as "panel-by-panel view" is safer and also matches what users type. The same applies to the meta description ("guided view for your own files").

## Passage Citability

Based on trafilatura `extracted_text`, about 4.6k characters (EN) and 5.2k (DE).

Strengths:
- There are 8 FAQ items with question H3s ("Is PanelZoom free?", "Are my comics uploaded anywhere?", "Does PanelZoom work offline?", and others). Each answer opens with "Yes." or "No." and stays self-contained in 20-60 words. This is the most extractable part of the page.
- The limitations are stated honestly (gutters, dark backgrounds, no RTL, PDF only). AI answers like to quote content that states its own limits.
- The use-case list ("DRM-free comics, Kickstarter backer PDFs, indie/webcomics, own scans") maps directly to queries like "how to read Kickstarter comic PDFs on phone".

Weaknesses:
- No sentence defines the entity in the form "[Name] is a [category] that [does X]". The hero says "PanelZoom detects the panels in your PDF comics...". The only "is a" sentence is "PanelZoom is a web app", and it sits in the install section. AI systems pick up a clean definition sentence first.
- No passage explains how panel detection works. The "how it works" steps were removed in 5ef8c5c. A 130-170 word block answering "How does PanelZoom detect panels?" would add a lot of citable substance: it runs locally in the browser, uses gutters, follows reading order, and can show the detected panels via the overlay.
- There is only one concrete number ("over 1,000 pages open quickly"). There are no figures that can be checked, such as detection speed per page, file size limits or browser storage quota.
- Nothing positions PanelZoom against alternatives (a generic PDF viewer, comic apps with built-in panel view for store-bought books, desktop CBR readers). "Best way to read PDF comics on iPhone" queries are answered from comparative passages.
- Section openers in the feature sections are narrative ("Comics are drawn for paper.") rather than answer-first. That is fine for people but less extractable.

## Structural Readability: strong

There is one H1, then H2 sections, then H3 sub-items. The page is fully server-rendered static HTML (`is_spa: false`, raw fetch was enough, no console errors). The FAQ uses question headings, the install steps are ordered lists, and the DE and EN versions are parallel, with hreflang in both HTML and the sitemap. Header navigation and footer chrome are minimal, so there is little boilerplate noise.

## Multi-Modal

- There are 4 product animations (webp poster plus mp4/webm), each with descriptive alt text, and the author photo has alt "Felipe Rude, developer of PanelZoom". This is good.
- The videos are `aria-hidden`, and the webp alt carries the meaning. That is fine.
- There is no `og:image`, and the Twitter card is `summary` with no image. Shared links on Reddit, Discord or chat apps will look bare, and those shares are exactly where early brand mentions come from.
- There is no YouTube demo video. YouTube mentions are the strongest signal correlated with AI citations, about 0.74. A 30-60 s screen recording ("reading a PDF comic panel by panel on iPhone") would be the cheapest high-value asset.

## Authority, Entity and Brand Signals: weakest area

- Structured data: none. The renderer found 0 JSON-LD blocks, and `dist/*.html` contains no `ld+json`. There is no `WebApplication`/`SoftwareApplication`, `WebSite`, `Person` or `Organization`. Note: a `<script type="application/ld+json">` is a data block that the browser does not execute, so the current CSP (`script-src 'self'`) does not interfere.
- Author: "Hi, I'm Felipe" appears in the text. The full name "Felipe Rude" appears only in an image alt. There are no profile links (GitHub, Mastodon/Bluesky, LinkedIn) and no `sameAs`.
- Dates: no published/updated date on the page (`publication_date: null`). The sitemap lastmod is 2026-10-05, older than the current build.
- Outbound citations: none. That is acceptable for a product page.
- Trust: the Impressum/Legal notice and the Datenschutz/Privacy pages exist, which is good for German users and for "is it safe" queries. The privacy claim ("no server that comics are sent to") is strong but can't be verified. A public source repo or a short technical note would make it citable.

Brand mention analysis (pre-launch):

| Platform | Status |
|---|---|
| Wikipedia / Wikidata | None. Not expected for a new solo project. A Wikidata item is possible later, once there is independent coverage |
| Reddit | None found or expected yet. r/comicbooks, r/digitalcomics, r/comics, r/kickstarter and r/de are relevant, but follow each sub's self-promotion rules |
| YouTube | Not verified. `youtube_search.py` needs `GOOGLE_API_KEY`, which is not configured. Presumably none |
| LinkedIn / GitHub / socials | No profile links on the site |
| Product directories (AlternativeTo, Product Hunt, Hacker News "Show HN") | None yet. These are high-leverage for ChatGPT/Perplexity "alternatives to X" answers |

Name-collision risk: "panel zoom" is a generic phrase that comic apps use for their own features. You need an unambiguous entity definition (schema plus a definition sentence plus consistent profiles) so models don't treat "PanelZoom" as a feature name.

## Technical Accessibility

- SSR/static HTML: yes. All content is visible to crawlers that do not run JavaScript, which includes most AI crawlers.
- robots.txt allows everything, the sitemap is present with hreflang, and llms.txt is present.
- Missing: JSON-LD, og:image, a page-level date, and the deploy to the live root (see the launch blocker above).
- `/` is a small language-chooser page with a JS redirect and plain links. That is fine. It has no meta description, but it isn't meant to rank.

## Top 5 Highest-Impact Changes

1. **Add JSON-LD entity markup (effort: 1-2 h).** Add `WebApplication` (or `SoftwareApplication`) with name, `applicationCategory: "MultimediaApplication"` (or a reader/utility category), `operatingSystem: "Any (web browser), iOS, Android"`, `offers` with `price: 0`, `featureList`, `inLanguage`, `url`, `image`, and `author` → `Person` "Felipe Rude" with `sameAs`. Also add a `WebSite` node. Optionally add `FAQPage`: Google no longer shows a FAQ rich result for it, but it still gives other engines clean Q/A pairs. Do this on both /de/ and /en/.
2. **Add a definition sentence and a "How does panel detection work?" passage (effort: 1 h).** Put this right under the H1: "PanelZoom is a free, browser-based PDF comic reader (PWA) for phones that automatically detects comic panels and shows them one at a time." Add a 130-170 word answer-first block on how detection works: local, in-browser, gutter-based, reading order, overlay to check. Optionally add a short "PanelZoom vs. a regular PDF viewer" comparison.
3. **Create off-site entity signals at launch (effort: ongoing, start with about 4 h).** Record a 30-60 s YouTube demo (and embed it, or link it with `VideoObject`). Submit to AlternativeTo, Product Hunt and Show HN. Make genuine Reddit posts. Create one consistent profile set (GitHub/Bluesky/Mastodon) and reference it in `sameAs`. Use the same one-line description everywhere.
4. **Expand llms.txt (effort: 30 min).** Add descriptions to the links, plus a "Key facts" block (price 0, no ads, no account, local processing, offline, PDF only, CBZ planned, no RTL yet, best with light gutters, storage caveat on iOS Safari), an author/contact line, and links to the privacy policy and FAQ anchors. Replace the "guided-view" wording.
5. **Add og:image, a visible "Last updated" date, and dateModified (effort: 1 h).** Use a 1200x630 image showing the panel-detection overlay, switch to `twitter:card summary_large_image`, and add `dateModified` in the schema plus a small "Updated: <date>" line. Keep the sitemap lastmod in step with real changes.

Launch checklist items that also matter for GEO: deploy robots.txt, llms.txt and sitemap.xml to the live root (currently 404). Verify the site in Bing Webmaster Tools and send IndexNow pings, because ChatGPT Search and Copilot depend heavily on the Bing index. Submit the sitemap in Google Search Console.

## Platform-Specific Readiness

| Platform | Score | Notes |
|---|---|---|
| Google AI Overviews / AI Mode | 60 | Clean SSR and a FAQ structure. Needs indexing first, which follows Googlebot, plus entity schema and some backlinks/mentions |
| ChatGPT (Search) | 55 | OAI-SearchBot is allowed. Visibility depends on the Bing index and third-party mentions (Reddit, directories). Currently zero |
| Perplexity | 60 | PerplexityBot is allowed. The FAQ answers suit it well. It weights Reddit/YouTube heavily, so it needs community presence |
| Bing Copilot | 55 | Needs Bing Webmaster verification and IndexNow. Schema helps |

## Structured findings (for audit-data.json, category "AI Search Readiness")

```json
{
  "category": "AI Search Readiness",
  "score": 68,
  "dimensions": {"citability": 72, "structural_readability": 85, "multimodal": 65, "authority_brand": 35, "technical_accessibility": 80},
  "platform_scores": {"google_aio": 60, "chatgpt": 55, "perplexity": 60, "bing_copilot": 55},
  "crawler_access": {"OAI-SearchBot": "allowed", "Claude-SearchBot": "allowed", "PerplexityBot": "allowed", "Googlebot": "allowed", "Bingbot": "allowed", "Applebot": "allowed", "GPTBot": "allowed", "ClaudeBot": "allowed", "Google-Extended": "allowed", "Applebot-Extended": "allowed", "CCBot": "allowed", "cohere-ai": "allowed"},
  "llms_txt": "present_valid_thin",
  "rsl": "absent",
  "findings": [
    {"id": "geo-no-jsonld", "severity": "high", "title": "No JSON-LD structured data (no WebApplication/Person/WebSite entity)", "effort": "1-2h"},
    {"id": "geo-no-definition", "severity": "medium", "title": "No explicit 'PanelZoom is a ...' definition sentence near the top; no how-detection-works passage", "effort": "1h"},
    {"id": "geo-no-offsite", "severity": "high", "title": "No brand footprint (YouTube, Reddit, directories, profiles/sameAs) - expected pre-launch", "effort": "ongoing"},
    {"id": "geo-llms-thin", "severity": "low", "title": "llms.txt lacks link descriptions, key facts/limitations, author/contact; uses 'guided-view' trademark wording", "effort": "30min"},
    {"id": "geo-no-ogimage-date", "severity": "medium", "title": "No og:image, twitter card without image, no visible/updated date", "effort": "1h"},
    {"id": "geo-live-robots-404", "severity": "high", "title": "Live panelzoom.com/robots.txt currently returns hosting 404 placeholder (deploy pending)", "effort": "deploy"},
    {"id": "geo-trademark-guided-view", "severity": "low", "title": "'guided view' wording in meta description and llms.txt references a comiXology trademark", "effort": "10min"}
  ]
}
```
