# SXO Findings – PanelZoom Landing Pages (Pre-Launch)

> Date: 2026-10-09 · Scope: https://develop.panelzoom.com/de/ and https://develop.panelzoom.com/en/
> Method: claude-seo `render_page.py --mode always` (Playwright, rendered DOM) + `parse_html.py`, WebSearch SERP sampling (7 queries), seo-sxo references (page-type taxonomy, user-story framework, persona scoring).
> Staging `noindex, nofollow` (meta + X-Robots-Tag) is intentional and is **not** a finding.

## SXO Gap Score: 53 / 100 (Needs Work)

| Page | SXO Gap Score |
|---|---|
| `/de/` | **51 / 100** |
| `/en/` | **55 / 100** |

This score is separate from the SEO Health Score. It measures how well the page matches what Google currently rewards for the target keywords, not how well it is built. The pages are clean, honest, fast and well written. The gap comes from SERP fit (keyword vs. page type), missing structured data, missing comparison and trust content, and a format gap (PDF only) in a SERP where every competitor lists CBZ/CBR.

---

## 1. Key finding: keyword-to-page-type mismatch

| Keyword | SERP dominant type (sample) | Consensus | Target page type | Severity |
|---|---|---|---|---|
| **pdf comic reader** (EN, landing primary) | Software destination pages: App Store / Play Store / Chrome Web Store listings, vendor sites (CDisplayEx, Sumatra PDF, ACBR on itch.io, BDReader on SourceForge) | ~80% product/landing, 20% listicle (Icecream Apps, AlternativeTo) | Landing (software) | **ALIGNED** (feature-parity gap, see 1.3) |
| **read comics on phone** (EN, secondary) | Listicles + how-to (androidayuda, Softonic, freeappsforme, PhoneArena, iLounge how-to, Tom's Guide forum) | ~67% comparison/how-to, ~33% app-store listings | Landing | **HIGH** |
| **comics auf dem handy lesen** (DE, landing primary + title lead) | Listicles (showmetech, Softonic, malavida), 1 App Store listing, **your own GitHub repo** (FelipeRude/Comic-Reader), several off-topic Wikipedia entries | ~60% comparison/listicle of the relevant results | Landing | **HIGH** |
| **pdf comic reader app kostenlos android iphone** (DE secondary) | Download portals (netzwelt), PDF-tool vendor content (UPDF), PC-Welt, AlternativeTo | mixed portal/listicle | Landing | MEDIUM |
| **guided view (comics)** (EN secondary) | Pure informational: Book Riot, Full Stop essay, USC Scalar, GoCollect news | 100% informational / blog | Landing | **CRITICAL** for the landing (needs a guide) |
| **guided view comic reader own files** | Listicles (Rigorous Themes, Slant), Play Store (Bloopworm), AlternativeTo, Wikipedia | ~70% comparison | Landing | HIGH |

### 1.1 What this means

- **EN landing is correctly aimed.** "PDF comic reader" rewards a single-software page with a clear format list, platform list and install action. `/en/` fits that model. Keep it as the landing primary.
- **DE landing leads with the wrong keyword for its page type.** The title starts with "Comics auf dem Handy lesen", but Google answers that query with "best apps" listicles. A pure product landing will struggle against them. The German SERP is weak, though: off-topic Wikipedia pages, an old showmetech translation, and the PanelZoom GitHub repo all appear. A **hybrid** landing (product page plus a short, honest "3 ways to read comics on your phone" comparison) can win here with little effort. A pure product landing probably cannot.
- **"Guided view" must not be a landing target.** The SERP is entirely informational: definitions, history, critique. It belongs to the planned guide `/en/guides/guided-view/`. On the landing, the term only needs to appear once as a visible label. Right now it is missing from the body (see 3).

### 1.2 The DE SERP already shows the product, via GitHub

`github.com/FelipeRude/Comic-Reader` appears in the "comics auf dem handy lesen" results and is summarised as a browser-based panel-detecting PDF reader. This is the strongest pre-launch asset. The README should name **PanelZoom** and link to `https://panelzoom.com/de/` and `/en/` so this ranking passes users and entity signals to the new domain. Check whether the repo description still says "Comic Reader" only.

### 1.3 Competitive reality vs. SEO-PLAN assumptions

SEO-PLAN §3.2 says Android has "hardly a good answer" for panel-by-panel reading of your own files. The SERP disagrees in part:
- **Comic Time Reader** (Android): "Guided View borders computed on-device ... on any of your own files"
- **Bloopworm** (Play Store): guided view, automatic panel and text detection, LTR/RTL/auto
- **BDReader** (Windows): automatic panel detection, CBR/CBZ/PDF
- **YACReader iOS**, **Smart Comic Reader**, **Panels** (iOS): panel-by-panel modes

What remains defensible and unique is the combination: **browser/PWA, no install, no account, files never leave the device, works on Android and iOS alike.** Positioning copy and future guides should lead with that. Avoid "the only reader with panel detection" claims.

Every result in the "pdf comic reader" SERP lists **CBR/CBZ** next to PDF. PDF-only is the single biggest SXO weakness for the commercial keyword. It is a product issue, not a copy issue. The FAQ handles it honestly, which is right.

---

## 2. Target page inventory (rendered DOM)

| Element | `/de/` | `/en/` |
|---|---|---|
| Title | Comics auf dem Handy lesen – PDF Comic Reader \| PanelZoom | PDF Comic Reader – Read Comics Panel by Panel \| PanelZoom |
| H1 | PDF Comics lesen, Panel für Panel | Read PDF comics, panel by panel |
| Meta description | contains "PDF-Comics am Smartphone lesen ... kostenlos, ohne Anmeldung, offline" | contains "guided view for your own files" |
| Word count | 911 | 952 |
| Structure | Hero > trust bar (Kein Account / Offline / Kostenlos) > Problem > Panel-Erkennung > 3 feature cards > Install (iOS/Android) > FAQ (8) > Founder story > Für wen > Final CTA | same |
| CTAs | 4 × `/app/?lang=de` ("Comic öffnen & lesen") | 4 × `/app/?lang=en` ("Open comic & start reading") |
| Media | 2 looping demo videos (webm/mp4 + webp poster), 2 install animations, founder photo | same |
| JSON-LD | **none** | **none** |
| og:image | **missing** (`twitter:card=summary` without image) | **missing** |
| Internal links | 8 (no guides yet; only app, legal, language switch) | 8 |
| "Guided View" in visible body | n/a | **0** (only meta + og:description) |
| Primary keyword in H1 | "Handy" missing | "phone" / "reader" missing |

Mobile above-the-fold (375 px screenshot): header CTA, roughly 50% dark hero animation, then H1, CTA and trust bar. The value-prop sentence ("PanelZoom erkennt die Panels ...") sits **below** the fold. On EN, the header CTA wraps to two lines, and the brand tag reads "Comic-Reader" (German hyphenation) on the English page. On both, the trust bar's first item ("KEIN ACCOUNT" / "NO ACCOUNT") touches or clips the left viewport edge.

---

## 3. User stories (SERP-derived)

1. **Awareness.** *As a phone reader with comic PDFs, I want to know the best way to read them on my phone, because full pages are unreadable, but I'm blocked by comparison fatigue: every result is a "15 best apps" list that mixes stores, webtoon platforms and file readers.*
   Source: listicle dominance for "read comics on phone" / "comics auf dem handy lesen" (Softonic, androidayuda, freeappsforme, showmetech, malavida); iLounge "How to read comics on your cell phone".
2. **Consideration.** *As a former comiXology reader, I want Guided View for comics I own, because panel-by-panel is the only comfortable way to read on a small screen, but I'm blocked by an information gap: Guided View is tied to store purchases, and I don't know which readers do it for my files.*
   Source: "guided view comics" SERP (Book Riot on legibility on phones, comiXology Guided View Native); "guided view comic reader own files" results (Comic Time, Bloopworm, listicles).
3. **Consideration.** *As an Android user, I want an automatic panel-by-panel reader, because Panels and Smart Comic Reader are iOS-only, but I'm blocked by trust: Play Store alternatives are old, ad-supported or unclear about panel detection.*
   Source: "pdf comic reader" Play Store listings; Slant/Rigorous Themes Android roundups; "Panels" App Store listing (iOS 15+).
4. **Decision.** *As someone choosing a PDF comic reader, I want to confirm formats, platforms and price at a glance, because every result shows "CBR, CBZ, PDF" and "free", but I'm blocked by a feature check: if my collection is CBZ, PanelZoom is out.*
   Source: format lists in every "pdf comic reader" result (CDisplayEx, Sumatra, ACBR, Challenger, Chrome Web Store reader).
5. **Decision (DE).** *As a German reader, I want a free comic reader without ads or sign-up, because download portals bundle ads and paid full versions, but I'm blocked by distrust of unknown apps.*
   Source: "kostenlos" query results (netzwelt download portal, ComicRack "Vollversion 5,99 €", UPDF sales banner).

---

## 4. Gap analysis (7 dimensions)

| Dimension | Max | `/de/` | `/en/` | Evidence |
|---|---|---|---|---|
| Page Type | 15 | 8 | 12 | EN primary "pdf comic reader" matches software-landing SERP. DE title leads with a listicle-SERP keyword, and the page has no comparison or hybrid section. |
| Content Depth | 15 | 10 | 10 | Problem/solution, 3 features, install guide, 8-question FAQ with honest limits (gutters, manga, CBZ). Missing: how to get a PDF onto the phone (Files app / Downloads / cloud), a comparison with other approaches, a definition of the Guided View term. |
| UX Signals | 15 | 11 | 10 | Strong: CTA above the fold, trust bar, demo animation, device install guides. Weak: value-prop sentence below the fold on mobile; no way to try without your own PDF (no sample comic); EN header CTA wraps; trust bar clipped at left edge. |
| Schema | 15 | 1 | 1 | No JSON-LD at all (raw and rendered). Software-landing SERP peers expose SoftwareApplication data through store listings. OG tags present, og:image missing. |
| Media | 15 | 11 | 11 | Good: 2 looping demo videos with alt-text posters, install animations, real founder photo. Missing: proof on a real comic page (all visuals are stylised), og:image for social and AI previews. |
| Authority | 15 | 6 | 6 | Founder story with name and photo, Impressum/Datenschutz. No ratings, testimonials, press or community mentions, no link to the public GitHub repo, no "detected X panels" proof. SERP competitors show star ratings and download counts. |
| Freshness | 10 | 4 | 5 | No visible "updated"/version/changelog. "CBZ planned" / "RTL planned" with no timeline or changelog link. |
| **Total** | **100** | **51** | **55** | |

---

## 5. Persona scoring

Weights reflect SERP share: product-type intent ("pdf comic reader") and listicle intent ("read comics on phone" / DE primary) dominate.

| Persona (SERP evidence) | Weight | Relevance | Clarity | Trust | Action | Total | Rating |
|---|---|---|---|---|---|---|---|
| **Catalogue seeker**: wants comics to read, not a reader (Marvel, WEBTOON, Tapas, comiXology in "read comics on phone") | low | 4 | 14 | 12 | 5 | **35** | Critical Mismatch |
| **CBZ/CBR owner** (CBR/CBZ in every "pdf comic reader" result) | high | 6 | 18 | 16 | 6 | **46** | Needs Work |
| **Listicle comparer / "best app" evaluator** (listicle majority for phone queries, DE + EN) | high | 12 | 12 | 12 | 15 | **51** | Needs Work |
| **Guided View refugee** (guided view SERP, Comic Time / Bloopworm) | medium | 16 | 10 | 13 | 20 | **59** | Needs Work |
| **Android panel-by-panel seeker** (Play Store listings, Android roundups) | medium | 18 | 15 | 13 | 20 | **66** | Good |
| **PDF owner ready to read** (core "pdf comic reader" intent) | high | 22 | 20 | 15 | 21 | **78** | Good |
| **"Kostenlos / ohne Anmeldung" DE reader** (netzwelt, ComicRack paid, UPDF ads) | medium (DE) | 22 | 22 | 18 | 22 | **84** | Excellent |

### Weakest high-weight persona: CBZ/CBR owner (46)
- **Top issue:** this persona leaves on discovering "PDF only", and the page gives them no next step.
- **Fix:** in FAQ "Welche Dateiformate ... / Which file formats ...", add a concrete next step: (a) link to a public roadmap/changelog page ("CBZ-Support: in Arbeit – Stand im Changelog"), (b) a "watch releases" link to the GitHub repo as a no-account notification path that fits the privacy promise, and (c) optionally a one-line tip on converting CBZ to PDF with a free desktop tool. Long-term: ship CBZ (SEO-PLAN already ranks it as the #1 product lever, and the SERP confirms it).

### Next: Listicle comparer (51)
- **Top issue:** the SERP trains this user to compare, and the page offers no comparison, so they go back to Softonic.
- **Fix:** add a section after "Automatische Panel-Erkennung", headed **"PanelZoom im Vergleich" / "How PanelZoom compares"**: a small honest table. Rows: Normaler PDF-Viewer, Panels (iOS), Perfect Viewer / ComicScreen (Android), Kindle/comiXology Guided View, PanelZoom. Columns: Panel-für-Panel, eigene Dateien, Android, iPhone, ohne Installation, ohne Konto, CBZ, Preis. Mark PanelZoom's CBZ as "geplant". This also makes the DE page a **hybrid**, which fixes the HIGH mismatch for "comics auf dem handy lesen".

### Next: Guided View refugee (59)
- **Top issue:** the term users search for is invisible on the page.
- **Fix (EN):** rename H2 "Automatic panel detection" to **"Guided View for your own PDF comics"**, and open it with "Like comiXology's Guided View, but for comics you already own, detected automatically on your device." **Fix (DE):** H2 "Automatische Panel-Erkennung (Guided View)", plus one sentence explaining the term. Link both to the planned guided-view guide when it exists.

### Catalogue seeker (35, low weight, intentional non-fit)
- **Fix:** qualify early instead of late. Add a hero subline such as "Für Comics, die du schon als PDF hast" / "For comics you already own as PDF". Later, in "Für wen ist PanelZoom?", link to a guide on where to buy DRM-free comics (Humble Bundle, DriveThruComics, Image, Kickstarter backer PDFs). This is already planned in SEO-PLAN as `/en/guides/read-humble-bundle-comics/`. It turns a bounce into a useful exit and a future link target.

### Systemic issues
- **Trust is the lowest dimension across all personas (avg 14/25).** Add: (1) a "Mit Beispiel-Comic ausprobieren / Try with a sample comic" secondary CTA that opens a public-domain comic (for example, a Golden Age title from Digital Comic Museum) in the app. This proves detection on real art and serves users who don't have a PDF on the phone right now. (2) A screenshot or video of detection on a real comic page. (3) A "Quellcode auf GitHub" link, if the repo stays public. (4) User quotes once beta feedback exists.
- **Clarity of keyword promise:** neither H1 contains the device term the SERP is about.

---

## 6. Concrete fix list (priority order)

| # | Fix | Page | Effort | Persona / gap |
|---|---|---|---|---|
| 1 | Add "PanelZoom im Vergleich / How PanelZoom compares" table (see 5) | both | M | Listicle comparer, DE page-type mismatch |
| 2 | Make Guided View visible: H2 rename + one explanatory sentence | both (EN priority) | S | Guided View refugee |
| 3 | H1 with device term: DE "PDF-Comics auf dem Handy lesen, Panel für Panel" (also fixes missing hyphen in "PDF Comics"); EN "Read PDF comics on your phone, panel by panel" (matches existing og:title) | both | S | Clarity, keyword alignment |
| 4 | Add JSON-LD: `WebApplication` (name, url, applicationCategory, operatingSystem "Any (web browser)", offers price 0, featureList, inLanguage), `FAQPage` mirroring the 8 FAQs, `Person` (Felipe Rude) + `WebSite`/`Organization` → run `/seo schema` | both | S | Schema 1/15 |
| 5 | Add og:image (1200×630, hero frame plus claim per language) and `twitter:card=summary_large_image` | both | S | Media, social/AI previews |
| 6 | Move the value-prop subline into the hero directly under the H1 so it is above the fold on mobile; consider shrinking the hero animation height on small viewports | both | S | UX, Clarity |
| 7 | Secondary CTA "Mit Beispiel-Comic ausprobieren / Try a sample comic" (public-domain PDF) | both | M | Trust, Action |
| 8 | CBZ FAQ next step (changelog/roadmap link, GitHub watch, conversion tip) | both | S | CBZ owner |
| 9 | Short "So kommt dein PDF aufs Handy / Getting your PDF onto your phone" (Files app, Downloads, Drive/iCloud) inside or after the install section | both | S | Content depth, Story 1 |
| 10 | Launch with at least 2 spokes linked from the landing: DE `/de/ratgeber/comics-auf-dem-handy-lesen/`, EN `/en/guides/read-comics-on-your-phone/` + `/en/guides/guided-view/`. These take the informational intents the landing cannot win. | site | L | HIGH/CRITICAL mismatches |
| 11 | Update the GitHub README/description to "PanelZoom" plus links to panelzoom.com/de/ and /en/ (it already ranks for the DE primary keyword) | repo | S | Authority, entity |
| 12 | EN polish: brand tag "Comic-Reader" → "Comic Reader" on `/en/`; prevent header CTA wrap (shorter label "Open a comic", or hide header CTA while the hero CTA is visible); fix trust-bar left-edge clipping at 375 px | both | S | UX |
| 13 | Positioning copy: lead with "im Browser, ohne Installation, ohne Konto, Dateien bleiben auf dem Gerät". Do not claim uniqueness of panel detection (Comic Time, Bloopworm, BDReader, Smart Comic Reader exist). | both + guides | S | Trust, accuracy |

### Optional DE title decision
- **Option A (recommended):** keep "Comics auf dem Handy lesen – PDF Comic Reader | PanelZoom" **and** ship fixes 1 + 3 so the page is a hybrid that fits the listicle-leaning SERP.
- **Option B:** lead the title with the product-SERP keyword ("PDF Comic Reader fürs Handy – Panel für Panel | PanelZoom") and give "comics auf dem handy lesen" fully to the Ratgeber. Pick B if the comparison section is not shipped by launch.

---

## 7. SOLL structure (recommended order, both languages)

1. Hero: H1 with device term, subline ("Für Comics, die du schon als PDF hast"), primary CTA "Comic öffnen & lesen" `/app/?lang=de`, secondary CTA "Beispiel-Comic ausprobieren"
2. Trust bar: Kein Account · Offline · Kostenlos · (new) Dateien bleiben auf dem Gerät
3. Problem: "Eine Comicseite ist fürs Handy zu groß" (keep)
4. "Automatische Panel-Erkennung (Guided View)" with a real-comic demo
5. **New:** "PanelZoom im Vergleich" table
6. Feature cards (keep)
7. Install + "So kommt dein PDF aufs Handy"
8. FAQ (keep, plus CBZ next step) + FAQPage schema
9. Founder story (keep) + GitHub link
10. Für wen + link to DRM-free sources guide
11. Ratgeber/Guides teaser (3 spokes)
12. Final CTA

---

## 8. Limitations

- **SERP data is approximate.** WebSearch returns about 9-10 organic URLs per query without positions, ads, PAA boxes, AI Overview citations or related searches. Ads/PAA-based story signals could not be used. No localisation (google.de vs google.com) or device control. Verify with a live SERP check or DataForSEO before final copy decisions.
- **No search volumes.** Same limitation as SEO-PLAN. Persona weights are qualitative.
- **Staging only.** No Search Console, CTR, dwell or engagement data. UX signals are inferred from the rendered DOM and existing 375 px screenshots (`screenshots/de|en/develop_panelzoom_com_mobile.png`), not from user behaviour.
- **App (`/app/`) was not evaluated.** The first-run experience after the CTA (file picker, empty state) strongly affects SXO but was out of scope.
- **Competitor claims** (Comic Time, Bloopworm etc.) come from search snippets and store listings and were not tested hands-on.

## 9. Cross-skill follow-ups

- `/seo schema`: generate WebApplication + FAQPage + Person/WebSite JSON-LD (fix 4)
- `/seo content`: E-E-A-T pass on the founder section and planned guides
- `/seo page`: re-audit after the comparison section and H1 changes
- Generate a PDF report? Use `/seo google report`

---

## 10. Structured findings (audit-data.json, category "Search Experience")

```json
{
  "category": "Search Experience",
  "sxo_gap_score": 53,
  "pages": {
    "https://develop.panelzoom.com/de/": {"sxo_gap_score": 51, "page_type": "Landing", "dimensions": {"page_type": 8, "content_depth": 10, "ux": 11, "schema": 1, "media": 11, "authority": 6, "freshness": 4}},
    "https://develop.panelzoom.com/en/": {"sxo_gap_score": 55, "page_type": "Landing", "dimensions": {"page_type": 12, "content_depth": 10, "ux": 10, "schema": 1, "media": 11, "authority": 6, "freshness": 5}}
  },
  "mismatches": [
    {"keyword": "pdf comic reader", "serp_type": "Product/Landing (software)", "consensus": 0.8, "severity": "ALIGNED"},
    {"keyword": "read comics on phone", "serp_type": "Comparison/How-to", "consensus": 0.67, "severity": "HIGH"},
    {"keyword": "comics auf dem handy lesen", "serp_type": "Comparison/Listicle", "consensus": 0.6, "severity": "HIGH"},
    {"keyword": "guided view comics", "serp_type": "Blog/Informational", "consensus": 1.0, "severity": "CRITICAL"}
  ],
  "findings": [
    {"id": "sxo-01", "severity": "high", "title": "DE landing leads with listicle-SERP keyword without comparison/hybrid content", "fix": "Add 'PanelZoom im Vergleich' table; ship DE Ratgeber"},
    {"id": "sxo-02", "severity": "high", "title": "No JSON-LD (WebApplication, FAQPage, Person)", "fix": "Run /seo schema"},
    {"id": "sxo-03", "severity": "medium", "title": "'Guided View' absent from visible EN/DE body", "fix": "Rename H2 + explanatory sentence"},
    {"id": "sxo-04", "severity": "medium", "title": "H1 lacks device term (Handy/phone)", "fix": "H1: 'PDF-Comics auf dem Handy lesen, Panel für Panel' / 'Read PDF comics on your phone, panel by panel'"},
    {"id": "sxo-05", "severity": "medium", "title": "CBZ/CBR owners hit dead end", "fix": "Roadmap/changelog link, GitHub watch, conversion tip; ship CBZ"},
    {"id": "sxo-06", "severity": "medium", "title": "Low trust proof (no real-comic demo, no sample, no ratings)", "fix": "Sample-comic CTA, real-page demo, GitHub link"},
    {"id": "sxo-07", "severity": "medium", "title": "Missing og:image", "fix": "1200x630 per language, summary_large_image"},
    {"id": "sxo-08", "severity": "low", "title": "Mobile: value-prop below fold, EN header CTA wraps, trust bar clipped, EN brand tag 'Comic-Reader'", "fix": "Move subline into hero, shorten header CTA, fix overflow"},
    {"id": "sxo-09", "severity": "low", "title": "GitHub repo ranks for DE primary keyword but is not tied to PanelZoom domain", "fix": "Update README/description with panelzoom.com links"},
    {"id": "sxo-10", "severity": "info", "title": "SEO-PLAN uniqueness claim partly outdated (Comic Time, Bloopworm, BDReader have panel detection)", "fix": "Position on browser/no-install/no-account/local files"}
  ]
}
```

### SERP sources sampled
- pdf comic reader: play.google.com (Comic Reader CBR/CBZ/PDF), binarynonsense.itch.io/comic-book-reader, chromewebstore.google.com (Comic Book Reader), cdisplayex.com, sourceforge.net/projects/bdreader, sumatrapdfreader.org, apps.apple.com (Panels), icecreamapps.com/learn/best-comic-book-readers.html, play.google.com (Challenger Comics Viewer), alternativeto.net (Panels alternatives)
- read comics on phone: ilounge.com, en.androidayuda.com, play.google.com (dylix comic_reader), en.softonic.com, freeappsforme.com, forums.tomsguide.com, apps.apple.com (Comic Book Reader Offline), phonearena.com
- comics auf dem handy lesen: github.com/FelipeRude/Comic-Reader, de.showmetech.com.br, de.softonic.com, malavida.com, apps.apple.com/de (Comics), plus off-topic Wikipedia entries
- pdf comic reader app kostenlos android iphone: netzwelt.de, updf.com, pcwelt.de, alternativeto.net, similarweb.com
- guided view comics: bookriot.com, full-stop.net, scalar.usc.edu, gocollect.com
- guided view comic reader own files: wikipedia (ComiXology), play.google.com (Bloopworm), rigorousthemes.com, slant.co, alternativeto.net
- how to read pdf comics on iphone panel by panel: apps.apple.com (Panels, Smart Comic Reader), yacreader.com, hackingwithswift.com forums
