# Content Quality & On-Page: Pre-Launch Audit (2026-10-09)

Scope: https://develop.panelzoom.com/de/, /en/, /de/impressum/, /de/datenschutz/, /en/legal-notice/, /en/privacy/
Sources: live staging HTML (`render_page.py --mode never`), `site/content/{de,en}/*.json`, `site/content/*/pages/*.md`, `site/templates/`, briefs in `docs/SEO-PLAN.md` (sections 2, 6.1–6.4).
Staging is `noindex, nofollow` on purpose, so that is not counted as a finding. The legal pages are also `noindex` in production on purpose (frontmatter), which is fine.

Tools used: `render_page.py`, `metadata_template.py` (site-wide pairs), `content_quality.py`, plus a local readability and keyword count on `extracted_text`.

## Scores

| Score | Value |
|---|---|
| **Content score** | **68 / 100** |
| **On-Page score** | **66 / 100** |
| E-E-A-T (weighted) | 62 / 100 |
| AI citation readiness | 52 / 100 |

### E-E-A-T breakdown (this skill's internal weights, not Google's)

| Factor | Weight | Score | Evidence |
|---|---|---|---|
| Experience | 20% | 75 | A real founder story ("Die Idee kam mir im Flugzeug …"), a real photo (`/media/felipe.webp`), original product animations (detect, install-ios, install-android), and limitations stated openly in the FAQ (gutters, RTL, CBZ). The page shows no screenshots or numbers from real use (for example "tested with N comics" or one sample page with its detected panels). |
| Expertise | 25% | 55 | No explanation of *how* panel detection works (gutter analysis, runs locally), no GitHub or source link, no technical background on the developer. The brief asks for "Kurz technisch erklären" in the privacy block, and that is missing. |
| Authoritativeness | 25% | 30 | New domain, no external mentions, no `sameAs`, no `Person` or `WebApplication` schema, no links to profiles. This is normal before launch, but nothing on the page builds it yet. |
| Trustworthiness | 30% | 85 | Full Impressum (§ 5 DDG, § 18 MStV), a concrete privacy policy (7-day log retention, netcup DPA, list of every cookie and storage key), a contact email, honest FAQ answers about limits, and the line "Keine Uploads" backed up in the privacy policy. Deductions: the landing shows no visible "Stand" date, and the street name needs checking (see C-12). |

Weighted: 0.20·75 + 0.25·55 + 0.25·30 + 0.30·85 = **62**

### Measured metrics

| Page | Words (extracted_text) | Minimum / Brief | Readability | content_quality.py |
|---|---|---|---|---|
| /de/ | 808 | Homepage 500 ✓ / Brief 900–1,300 ✗ | Flesch-Amstad ≈ 72 (easy), Ø 9 words/sentence | 78, no filler or AI patterns |
| /en/ | 836 | Homepage 500 ✓ / Brief 900–1,300 ✗ | Flesch Reading Ease ≈ 79 (easy), Ø 9.6 words/sentence | 73, flag `low-density` |
| /de/datenschutz/ | 646 | n/a (legal) | Amstad ≈ 57 (fine for legal text) | 91 |
| /en/privacy/ | 714 | n/a | FRE ≈ 59 | 84 |
| /de/impressum/, /en/legal-notice/ | 47 / 61 | n/a | n/a | n/a |

Readability is very good: short sentences, second-person address, no jargon. The tool found no generic AI phrasing, filler or repeated template structure. The copy reads as hand-written.

### Templated metadata (metadata_template.py, 6 pages)

`site_risk: low`, `templated_ratio: 0.0`, `shared_cta_phrases: {}`. No `templated_metadata`, no `description_echoes_title`, no `description_duplicates_title`.
The tool flagged `brand_suffix_in_description` (low) on all four legal pages. Here that is close to a false positive: "PanelZoom" is the subject of a real sentence, not an appended suffix, and the pages are noindex. Optional fix in O-9.

### Keyword coverage (body text = extracted_text, without title/meta)

| Keyword (SEO-PLAN 2.1 / 2.2) | DE body | EN body |
|---|---|---|
| DE primary: "Comics auf dem Handy lesen" | **0** | – |
| DE/EN: "PDF Comic Reader" / "Comic-Reader" | **0** | **0** |
| "Smartphone" (DE meta) | 0 | – |
| "kostenlos" / "free" | 2 | 4 |
| "ohne Anmeldung" | 1 | – |
| "offline" | 3 | 3 |
| EN: "read comics on (your) phone" | – | **0** (only "reading comics on your phone" in the About text) |
| EN: "guided view" | – | **0** (but in the meta description) |
| EN: "DRM-free" / "Humble Bundle" / "comiXology" | – | 1 / **0** / **0** |

Nothing is stuffed. The problem goes the other way: the primary keywords appear only in `<title>`, and the H1 and body do not repeat them.

---

## Findings

Severity: **Critical** (fix before launch) · **High** · **Medium** · **Low**

### C-1 · High · The primary keyword is missing from the H1 and body (DE + EN)

**Evidence:** DE H1 = "PDF Comics lesen, Panel für Panel". Brief 6.1: "Comics als PDF auf dem Handy lesen – Panel für Panel". EN H1 = "Read PDF comics, panel by panel". Brief: "Read PDF comics on your phone, panel by panel". "Comics auf dem Handy lesen", "PDF Comic Reader" and "read comics on phone" appear 0 times in the body. The only "Comic-Reader" is the header brand tag, which is navigation chrome.
**Why it matters:** title, H1 and the first paragraph should cover the same intent. Right now the H1 drops the "Handy / phone" qualifier, which is the most specific part of the target query.

**Rewrite DE (H1, keeps the two-line layout):**
```json
"h1": ["PDF-Comics auf dem Handy lesen,", "Panel für Panel"]
```
**Rewrite DE (intro.lead, works the second keyword in):**
> PanelZoom ist ein kostenloser PDF-Comic-Reader für dein Handy. Er erkennt die Panels deiner Comics und führt dich mit einem Tipp von Bild zu Bild. Kein Zoomen, kein Scrollen, kein Upload.

**Rewrite EN (H1):**
```json
"h1": ["Read PDF comics on your phone,", "panel by panel"]
```
**Rewrite EN (intro.lead):**
> PanelZoom is a free PDF comic reader for your phone. It detects the panels in your comics and takes you from one to the next with a single tap. No pinching, no scrolling, no uploads.

### C-2 · High · The EN meta description promises "guided view", but the page never mentions it

**Evidence:** EN description: "… Automatic panel detection, guided view for your own files …". The body has 0 occurrences of "guided view" or "comiXology". The brief (Section 1, segment 3; Section 6.2 item 8) names ex-comiXology users and Humble Bundle buyers as the strongest EN segments.
**Fix:** add one sentence to the EN feature text and two items to the EN audience list.

EN `features[0].text`, new first sentence:
> If you've used comiXology's Guided View, you know the idea: PanelZoom does the same for your own PDF files.

EN `audience.items`, add:
> - Humble Bundle comics and other DRM-free downloads
> - Former comiXology readers who miss Guided View for their own files

DE (optional, the brief rates "Guided View" as a low-competition DE topic). Append to `features[0].text[0]`:
> Ähnlich wie Guided View bei comiXology, nur für deine eigenen PDFs.

### C-3 · High · The comparison table from the brief is missing (the most quotable block for AI answers)

**Evidence:** Brief 6.2 item 7 asks for "PanelZoom vs. normaler PDF-Viewer vs. native Comic-App". The page has none. No block on the page states the product's category position (browser + panel detection + your own files) as a quotable fact.
**Suggested DE section (H2 + table):**

**Wie unterscheidet sich PanelZoom von anderen Readern?**

| | PanelZoom | Normaler PDF-Viewer | Native Comic-App |
|---|---|---|---|
| Panel für Panel lesen | Ja, automatisch | Nein | Teilweise, oft nur für Store-Comics |
| Eigene PDF-Dateien | Ja | Ja | Ja, je nach App |
| Installation aus dem App Store | Nicht nötig | Meist vorinstalliert | Nötig |
| Konto nötig | Nein | Nein | Oft ja |
| Dateien verlassen das Gerät | Nie | Nein | Je nach App (Cloud-Sync) |
| Android und iPhone | Beides, im Browser | Beides | Oft nur eine Plattform |
| Kosten | Kostenlos | Kostenlos | Kostenlos bis Abo |

**EN:**

**How is PanelZoom different?**

| | PanelZoom | Regular PDF viewer | Native comic app |
|---|---|---|---|
| Panel-by-panel reading | Yes, automatic | No | Sometimes, often only for store-bought comics |
| Your own PDF files | Yes | Yes | Depends on the app |
| App store install | Not needed | Usually preinstalled | Required |
| Account required | No | No | Often |
| Files leave your device | Never | No | Depends (cloud sync) |
| Android and iPhone | Both, in the browser | Both | Often one platform only |
| Price | Free | Free | Free to subscription |

Keep the wording neutral and name no competitors, as the brief asks. This block also adds about 100–120 words, which helps with C-4.

### C-4 · Medium · Landing is below the brief length (808 / 836 vs. 900–1,300 words)

**Evidence:** extracted_text word count above. Commit 5ef8c5c removed the "So funktioniert's" steps and shortened the highlights. The homepage floor of 500 is met, and word count is not a ranking factor. Still, the page now lacks two topics the brief asks for: the 3-step "how it works" and the short technical explanation of privacy.
**Fix:** C-3 plus C-5 brings the page to about 950–1,000 words without bringing the steps back.

### C-5 · Medium · Privacy claim has no technical explanation (Expertise + Trust, especially for DE)

**Evidence:** "Deine Comics bleiben bei dir" says "Kein Konto! PDFs bleiben auf dem Gerät …" (12 words). The FAQ repeats it. Brief 6.2 item 5: "Kurz technisch erklären (lokaler Speicher im Browser, kein Server, kein Tracking)". The privacy policy already contains the details (OPFS, IndexedDB, service worker), but the landing does not mention them or link to them.
**DE rewrite (`highlights.items[2].text`):**
> Kein Konto, kein Upload, kein Tracking. Deine PDFs liegen im Speicher deines Browsers, und auch die Panel-Erkennung läuft auf deinem Gerät. Details stehen in der [Datenschutzerklärung](/de/datenschutz/).

**EN:**
> No account, no uploads, no tracking. Your PDFs live in your browser's storage, and panel detection runs on your device too. Details are in the [privacy policy](/en/privacy/).

(The template currently escapes everything as plain text, so the link needs a small template change. The copy works without the link too.)

### C-6 · Medium · No first-hand proof of how detection works (Experience/Expertise)

**Evidence:** the FAQ says the panel icon in the reader "shows which panels were detected", but the page shows no example. Brief 6.4: "mit Debug-Screenshot".
**Fix:** add one sentence to the feature block and later a still image of a page with its detected panel boxes.
DE:
> PanelZoom sucht dafür die hellen Zwischenräume zwischen den Bildern, die sogenannten Gutter. Das geht in Sekundenbruchteilen und komplett auf deinem Gerät.

EN:
> To do this, PanelZoom looks for the light gaps between panels, known as gutters. It takes a fraction of a second and happens entirely on your device.

### C-7 · Medium · The About section has no verifiable profile link (Authoritativeness)

**Evidence:** the name, photo and story are good. There is no link to GitHub, a personal site or a social profile, and no `Person` schema with `sameAs`. The privacy policy names "GitHub" as an example external link, but the site has no GitHub link anywhere.
**Fix:** add one line under the About text and the matching `sameAs` in the Person schema.
DE: "Den Fortschritt und geplante Funktionen findest du auf [GitHub](…)." EN: "You can follow progress and planned features on [GitHub](…)."
If no public profile is planned, change the example in Datenschutz §6 / Privacy §6 so it does not mention GitHub.

### C-8 · Medium · No visible "last updated" date on the landing

**Evidence:** `landing.json` has `"updated": "2026-10-05"`, but the date appears neither in the HTML nor in schema. `publication_date: null`. The legal pages do show "Stand:".
**Fix:** a small "Stand: 5. Oktober 2026" / "Last updated: October 5, 2026" in the footer, plus `dateModified` in the WebApplication or WebPage schema. This is a freshness signal for a product page whose features change (CBZ, RTL "geplant").

### C-9 · Low · German grammar: "das Comic" vs. "der Comic" is inconsistent

**Evidence:** "Wähle dein Comic und fang an zu lesen", "Bitte wähle ein Comic als PDF", "dort dein Comic auswählen", "Dein Comic wird geöffnet" (neuter) versus "meinen ersten Comic", "Comic auswählen" (masculine) in the same page. Duden lists "der Comic" as the standard form.
**Rewrite:**
- `dropzone.title`: "Wähle deinen Comic und fang an zu lesen"
- `dropzone.wrongType`: "Das ist keine PDF-Datei. Bitte wähle einen Comic als PDF."
- `dropzone.noscript`: "PanelZoom öffnen und dort deinen Comic auswählen"
- `dropzone.busy`: "Dein Comic wird geöffnet …" is correct for both genders and can stay.

### C-10 · Low · German compound without a hyphen in the H1

**Evidence:** H1 "PDF Comics lesen". The meta, footer and FAQ correctly use "PDF-Comics". Fixed by the rewrite in C-1.

### C-11 · Low · Absolute claim "Läuft auf jedem Gerät"

**Evidence:** highlight title. The FAQ narrows it to "aktuellen Browser". To keep the trust tone consistent:
DE: "Läuft auf Handy, Tablet und PC". EN: "Works on phone, tablet and PC".

### C-12 · Low (verify) · Street spelling in Impressum and Datenschutz

**Evidence:** "Hermanstraße 11, 70178 Stuttgart" appears in all four legal pages. The common spelling of the street in Stuttgart is "Hermannstraße" (double n). Please check this against the official address, because Impressum data must be exact. I could not verify it from here.

### C-13 · Low · First-person voice changes between pages

**Evidence:** the Impressum and About text use "ich" ("Ich bin nicht verpflichtet …"), while the privacy policy uses "wir/uns" ("unser Hosting-Anbieter", "an uns"). The landing says "kein Unternehmen und kein Team", so "wir" in the privacy policy reads like a contradiction.
**Fix (optional):** change Datenschutz/Privacy to the first person singular ("mein Hosting-Anbieter", "nicht an mich oder Dritte übertragen" / "my hosting provider", "not transferred to me or anyone else"). Legally either form is fine.

---

## On-Page Findings

### O-1 · High · No structured data at all (WebApplication, WebSite, Person, FAQPage)

**Evidence:** `structured_data.block_count: 0` on both landings. No `ld+json` anywhere in `site/templates/` or `scripts/site/`. Brief 6.3 asks for `WebApplication` (price 0, operatingSystem, featureList, inLanguage), `WebSite` and `Person`, with `FAQPage` optional (visible 1:1).
**Impact:** entity recognition for a brand-new name ("PanelZoom" as a software product, Felipe Rude as the developer) and AI citation (price, platforms, features as machine-readable facts). The schema sub-audit should own the details; it is listed here because it is the biggest lever for AI citation readiness.

### O-2 · Medium · H1 deviates from the brief

See C-1. The current H1s (DE 33 / EN 31 characters) are short and strong as a hook, but they lose the "Handy / phone" qualifier.

### O-3 · Medium · Internal links: the hub has no spokes yet, and the landing has no in-content links

**Evidence:** links on the landing are `/app/?lang=xx` (4×, from the header, hero, noscript fallback and final CTA), `/de/impressum/`, `/de/datenschutz/` and the language switcher. There are no in-text links. `site/content/de/ratgeber/` and `site/content/en/guides/` are empty, so the "Ratgeber/Guides" link in the header is hidden (`ctx.hasGuides`).
**Fixes before launch:**
- The install steps say "Öffne panelzoom.com/app in Safari." as plain text. Make it a link to `/app/?lang=de` (EN: `/app/?lang=en`). It is the most natural in-content link on the page.
- Link to the privacy policy from the privacy highlight or FAQ answer (C-5).
- After launch: publish the first 2–3 spokes from Section 9 of the plan (DE "Comics auf dem Handy lesen", "Guided View"; EN "How to read comics on your phone", "Guided View alternative") and link them from the matching landing sections (problem → phone guide, feature → Guided View, install → install guide). Without spokes, the site has one indexable URL per language, so topical authority depends on that single page.

### O-4 · Medium · Header brand link has glued anchor text and a German tag on EN pages

**Evidence:** `<a class="brand"><img alt=""><span>PanelZoom<span class="brand__tag">Comic-Reader</span></span></a>` produces the accessible name and anchor text "PanelZoomComic-Reader" on every page. In `layout.mjs` the tag is hard-coded as "Comic-Reader", so EN pages show the German hyphenated form.
**Fix:** move the tag into `ui.json` (DE "Comic-Reader", EN "Comic Reader" or "PDF Comic Reader") and add a space or `aria-label="PanelZoom – PDF Comic Reader"`. This also puts the "comic reader" keyword into the internal anchor to the home page in both languages.

### O-5 · Low · Titles and descriptions: good, small tweaks possible

| Page | Title (len) | Description (len) | Verdict |
|---|---|---|---|
| /de/ | Comics auf dem Handy lesen – PDF Comic Reader \| PanelZoom (57) | 140 | Matches the brief exactly, both keywords in, within limits. ✓ |
| /en/ | PDF Comic Reader – Read Comics Panel by Panel \| PanelZoom (57) | 144 | Matches the brief. "read comics on phone" is only implied. Optional: "PDF Comic Reader – Read Comics on Your Phone \| PanelZoom" (55) if the phone intent ranks better in GSC after launch. |
| Legal pages | 21–32 | 65–105 | Fine for noindex pages. |

DE description, optional sharper variant (stays ≤ 155 and puts the keyword at the start):
> Comics auf dem Handy lesen, ohne Zoomen: PanelZoom erkennt jedes Panel deiner PDF-Comics und springt weiter. Kostenlos, ohne Anmeldung, offline.

### O-6 · Low · Heading hierarchy: valid, one order question

H1 → H2 sections → H3 for highlights, platforms and FAQ questions, with no skipped levels on any of the 6 pages. "Warum es PanelZoom gibt" (About) comes before "Für wen ist PanelZoom?". Audience is a buying-decision block and fits better right after the highlights or the comparison table (C-3), before Install. This is optional.

### O-7 · Low · Trust line lacks "Keine Uploads"

**Evidence:** brief 6.2: "Kein Account · Keine Uploads · Offline · Kostenlos". Live: "Kein Account · Offline · Kostenlos". "Keine Uploads" is the claim no competitor makes (plan 3.2 item 5).
**Fix:** add `{ "icon": "lock", "text": "Keine Uploads" }` / `"No uploads"`.

### O-8 · Low · No og:image (social and AI previews)

`twitter:card = summary`, no `og:image`. A 1200×630 image (phone with a comic panel plus the H1 claim) improves link previews in messengers, which is where a free PWA gets shared. The technical or social sub-audit may also list this.

### O-9 · Info · metadata_template `brand_suffix_in_description` on legal pages

This is a heuristic hit, not real templating. If you want zero flags: DE Impressum "Anbieterkennzeichnung für panelzoom.com nach § 5 DDG." / EN "Provider identification for panelzoom.com under § 5 DDG (German Digital Services Act)." Privacy: "Kein Tracking, keine Uploads: Deine Comics bleiben auf deinem Gerät. So gehen wir mit deinen Daten um." These pages are noindex, so this has no SEO impact.

### O-10 · Info · Image alt texts

All content images have descriptive alt text ("Animation: …"), the decorative logo has `alt=""`, and the photo alt names the person and role. ✓

---

## AI Citation Readiness (52/100)

| Signal | Status |
|---|---|
| Clear H2/H3 hierarchy, Q&A-formatted FAQ (8 questions, direct "Ja./Nein." answers) | ✓ strong |
| llms.txt present on staging, matches the positioning | ✓ |
| Self-contained definition sentence ("PanelZoom ist ein …") in the first 60 words | ✗ (see C-1 lead rewrite) |
| Quotable facts and numbers | weak: only "über 1.000 Seiten" and "7 Tage" (privacy) |
| Comparison table | ✗ (C-3) |
| Structured data (WebApplication, Person) | ✗ (O-1) |
| Author entity with sameAs | ✗ (C-7) |
| Visible freshness date | ✗ (C-8) |
| Supporting articles (spokes) | ✗ (O-3) |

---

## Priority list before launch

1. C-1 / O-2: H1 + lead with the primary keyword (DE + EN). Copy-only change in `landing.json`.
2. C-2: Guided View / comiXology / Humble in the EN body, so the meta description matches the page.
3. O-1: JSON-LD WebApplication + Person + WebSite (template).
4. C-3: comparison table (new landing section).
5. C-9 / C-10 / C-12: German grammar, hyphen, check the address.
6. O-3 (link `panelzoom.com/app` in the install steps), O-4 (brand anchor), O-7 (Keine Uploads), C-5 (privacy explanation and link).
7. After launch: C-6, C-7, C-8, O-8, first spokes.

---

## Structured findings (for audit-data.json, category "Content Quality")

```json
{
  "category": "Content Quality",
  "scores": { "content": 68, "on_page": 66, "eeat": 62, "ai_citation_readiness": 52,
    "eeat_breakdown": { "experience": 75, "expertise": 55, "authoritativeness": 30, "trustworthiness": 85 } },
  "metrics": {
    "/de/": { "words": 808, "flesch_amstad": 72, "content_quality": 78 },
    "/en/": { "words": 836, "flesch_reading_ease": 79, "content_quality": 73 },
    "metadata_template": { "site_risk": "low", "templated_ratio": 0.0, "shared_cta_phrases": {} }
  },
  "findings": [
    { "id": "C-1", "severity": "high", "title": "Primary keyword missing from H1 and body (DE+EN)", "pages": ["/de/", "/en/"] },
    { "id": "C-2", "severity": "high", "title": "EN meta promises 'guided view', body never mentions it; comiXology/Humble segments missing", "pages": ["/en/"] },
    { "id": "C-3", "severity": "high", "title": "Comparison table from brief missing", "pages": ["/de/", "/en/"] },
    { "id": "O-1", "severity": "high", "title": "No JSON-LD (WebApplication, WebSite, Person)", "pages": ["/de/", "/en/"] },
    { "id": "C-4", "severity": "medium", "title": "Landing below brief length (808/836 vs 900-1300)", "pages": ["/de/", "/en/"] },
    { "id": "C-5", "severity": "medium", "title": "Privacy claim lacks technical explanation/link", "pages": ["/de/", "/en/"] },
    { "id": "C-6", "severity": "medium", "title": "No first-hand proof of how detection works", "pages": ["/de/", "/en/"] },
    { "id": "C-7", "severity": "medium", "title": "About section lacks verifiable profile link; privacy policy names GitHub link that does not exist", "pages": ["/de/", "/en/", "/de/datenschutz/", "/en/privacy/"] },
    { "id": "C-8", "severity": "medium", "title": "No visible last-updated date on landing", "pages": ["/de/", "/en/"] },
    { "id": "O-2", "severity": "medium", "title": "H1 deviates from brief", "pages": ["/de/", "/en/"] },
    { "id": "O-3", "severity": "medium", "title": "No in-content internal links; no spokes yet; panelzoom.com/app unlinked in install steps", "pages": ["/de/", "/en/"] },
    { "id": "O-4", "severity": "medium", "title": "Brand anchor text 'PanelZoomComic-Reader', German tag on EN", "pages": ["all"] },
    { "id": "C-9", "severity": "low", "title": "DE grammar: 'dein Comic' vs 'deinen Comic' inconsistent", "pages": ["/de/"] },
    { "id": "C-10", "severity": "low", "title": "DE H1 'PDF Comics' missing hyphen", "pages": ["/de/"] },
    { "id": "C-11", "severity": "low", "title": "Absolute claim 'Läuft auf jedem Gerät'", "pages": ["/de/", "/en/"] },
    { "id": "C-12", "severity": "low", "title": "Verify street spelling 'Hermanstraße' in legal pages", "pages": ["/de/impressum/", "/de/datenschutz/", "/en/legal-notice/", "/en/privacy/"] },
    { "id": "C-13", "severity": "low", "title": "Voice inconsistency ich vs wir across legal/landing", "pages": ["/de/datenschutz/", "/en/privacy/"] },
    { "id": "O-5", "severity": "low", "title": "Titles/descriptions good; optional variants", "pages": ["/de/", "/en/"] },
    { "id": "O-6", "severity": "low", "title": "Section order: audience after about", "pages": ["/de/", "/en/"] },
    { "id": "O-7", "severity": "low", "title": "Trust line lacks 'Keine Uploads'", "pages": ["/de/", "/en/"] },
    { "id": "O-8", "severity": "low", "title": "No og:image", "pages": ["all"] },
    { "id": "O-9", "severity": "info", "title": "brand_suffix_in_description heuristic on noindex legal pages", "pages": ["legal"] }
  ]
}
```
