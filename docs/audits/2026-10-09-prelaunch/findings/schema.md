# Schema.org Audit: PanelZoom (Pre-Launch, 2026-10-09)

Scope: https://panelzoom.com (live domain) and staging https://develop.panelzoom.com/de/ + /en/ (noindex is intentional, not a finding). Content source: `site/content/{de,en}/landing.json`.

## Score: 0 / 100 now, about 90 / 100 after implementing the blocks below

Current 0 because no structured data exists. The last points are held back on purpose: no `aggregateRating` (no real ratings), no `screenshot` (no assets yet), no `sameAs` (no profile URL confirmed). Google offers no dedicated rich result for a free WebApplication without ratings, so the value is entity clarity (and AI/GEO understanding), not a SERP feature.

## 1. Detection

- Source: `render-dev.json` (rendered dev page), plugin `structured_data`: `block_count: 0`.
- JSON-LD none, Microdata none, RDFa none.

## 2. Recommended types

| Type | Verdict | Reason |
|---|---|---|
| WebSite | Add | Sitewide entity, `inLanguage` de + en, same `@id` on both pages. |
| WebPage | Add | Per-language page node, `mainEntity` = the app. |
| WebApplication | Add | Core entity. Free (`offers.price` "0" EUR, `isAccessibleForFree`). |
| Person (Felipe Rude) | Add | Matches the visible "Warum es PanelZoom gibt" section and photo `/media/felipe.webp`. Used as author, creator, publisher. |
| Organization | Do NOT add | The page says "no company and no team". Organization would contradict visible content. |
| FAQPage | Skip by default (Info) | Google retired FAQ rich results for all sites on 7 May 2026. No SERP benefit, AI/GEO benefit unconfirmed. The visible FAQ stays as plain HTML. Optional block in section 6. |
| HowTo (install steps) | Never | Deprecated, rich results removed Sept 2023. |
| AggregateRating / Review | Do not add | No real ratings exist; fabricated ones violate Google guidelines. |

## 3. Design decisions

- `@context` `https://schema.org`, all URLs absolute on `https://panelzoom.com` (canonical: https, no www, per `site.config.mjs`).
- Shared `@id`s across languages: `https://panelzoom.com/#website`, `https://panelzoom.com/#person-felipe-rude`, `https://panelzoom.com/#founder-photo`. Per-language: `https://panelzoom.com/{de|en}/#webpage`, `https://panelzoom.com/#webapp-{de|en}`.
- `description` = `meta.description`, WebPage `name` = `meta.title`, `jobTitle` = `about.role`, image `caption` = `about.photoAlt`; `featureList` derived from the features/highlights/trust text of the same language.
- `WebApplication.url` = `/app/`; the landing page links to it via `mainEntityOfPage`.
- Omitted deliberately: `address` (not visible on page), `sameAs`, `screenshot`, `aggregateRating`, `dateModified` (optional: `updated` 2026-10-05 from landing.json could feed `WebPage.dateModified` as ISO 8601).
- `about.photoPlaceholder` ("[[Foto von Felipe]]") is not used anywhere in the markup.

## 4. Validation

Both blocks were wrapped in `<script type="application/ld+json">` and run through the plugin's `parse_html.py`. Result for DE and EN: JSON valid, 4 nodes detected (WebSite, WebPage, WebApplication, Person).

| Check | DE | EN |
|---|---|---|
| @context https | pass | pass |
| Types valid, none deprecated | pass | pass |
| WebApplication name, offers, applicationCategory, operatingSystem | pass | pass |
| No placeholders | pass | pass |
| URLs absolute | pass | pass |
| All `@id` references resolve within the graph | pass | pass |
| Text matches visible content | pass | pass |

Limit: the plugin has no WebApplication-specific validator (`schema_ecommerce_validate.py` is e-commerce only), so required properties were checked manually. After deploy, run Google Rich Results Test and validator.schema.org on https://panelzoom.com/de/ and /en/.

## 5. Findings

| # | Priority | Finding | Fix |
|---|---|---|---|
| 1 | High | No structured data at all | Emit the blocks below in `site/templates/partials/head.mjs`, server-rendered per language. |
| 2 | Medium | Person image must be served at `https://panelzoom.com/media/felipe.webp` as `image/webp` | Verify after deploy (content-type fix is in commit 31c6b9a). |
| 3 | Medium | No `sameAs` for Person | Add GitHub or other profile URL once confirmed and also linked visibly (footer/about). |
| 4 | Low | No `screenshot` | Add absolute screenshot URLs once real screenshots exist in `site/public/media`. |
| 5 | Info | Visible FAQ without FAQPage markup | Intentional, see section 2. |
| 6 | Info | Avoid drift | Generate the graph in `head.mjs` from `landing.json` and `SITE.origin`. `featureList` has no source field yet; add e.g. `schema.featureList` to landing.json. |
| 7 | Info | Canonical match | `WebPage.url` must equal the page canonical exactly (`https://panelzoom.com/de/`, trailing slash). Staging: either keep production origin in markup (page is noindex) or switch by environment. |

## 6. JSON-LD

One `<script type="application/ld+json">` per page in `<head>`.

### /de/ (DE)

```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      "@id": "https://panelzoom.com/#website",
      "url": "https://panelzoom.com/",
      "name": "PanelZoom",
      "inLanguage": [
        "de",
        "en"
      ],
      "publisher": {
        "@id": "https://panelzoom.com/#person-felipe-rude"
      }
    },
    {
      "@type": "WebPage",
      "@id": "https://panelzoom.com/de/#webpage",
      "url": "https://panelzoom.com/de/",
      "name": "Comics auf dem Handy lesen – PDF Comic Reader | PanelZoom",
      "description": "PDF-Comics am Smartphone lesen, ohne Zoomen: Die App erkennt jedes Panel und springt automatisch weiter. Kostenlos, ohne Anmeldung, offline.",
      "inLanguage": "de",
      "isPartOf": {
        "@id": "https://panelzoom.com/#website"
      },
      "about": {
        "@id": "https://panelzoom.com/#webapp-de"
      },
      "mainEntity": {
        "@id": "https://panelzoom.com/#webapp-de"
      }
    },
    {
      "@type": "WebApplication",
      "@id": "https://panelzoom.com/#webapp-de",
      "name": "PanelZoom",
      "url": "https://panelzoom.com/app/",
      "mainEntityOfPage": {
        "@id": "https://panelzoom.com/de/#webpage"
      },
      "description": "PDF-Comics am Smartphone lesen, ohne Zoomen: Die App erkennt jedes Panel und springt automatisch weiter. Kostenlos, ohne Anmeldung, offline.",
      "inLanguage": "de",
      "applicationCategory": "MultimediaApplication",
      "operatingSystem": "Any (Browser), iOS, Android",
      "browserRequirements": "Requires JavaScript and a current browser (Safari, Chrome)",
      "isAccessibleForFree": true,
      "offers": {
        "@type": "Offer",
        "price": "0",
        "priceCurrency": "EUR"
      },
      "featureList": [
        "Automatische Panel-Erkennung direkt im Browser",
        "Panel-für-Panel-Führung in Leserichtung",
        "Weicher Kameraschwenk oder direkter Sprung",
        "Einstellbarer Abstand zum Bildschirmrand",
        "Lesestand pro Panel",
        "Offline nutzbar",
        "Installierbar auf dem Home-Bildschirm",
        "Ohne Konto, PDFs bleiben auf dem Gerät"
      ],
      "author": {
        "@id": "https://panelzoom.com/#person-felipe-rude"
      },
      "creator": {
        "@id": "https://panelzoom.com/#person-felipe-rude"
      }
    },
    {
      "@type": "Person",
      "@id": "https://panelzoom.com/#person-felipe-rude",
      "name": "Felipe Rude",
      "jobTitle": "Entwickler von PanelZoom",
      "image": {
        "@type": "ImageObject",
        "@id": "https://panelzoom.com/#founder-photo",
        "url": "https://panelzoom.com/media/felipe.webp",
        "caption": "Felipe Rude, Entwickler von PanelZoom"
      },
      "url": "https://panelzoom.com/de/"
    }
  ]
}
</script>
```

### /en/ (EN)

```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      "@id": "https://panelzoom.com/#website",
      "url": "https://panelzoom.com/",
      "name": "PanelZoom",
      "inLanguage": [
        "de",
        "en"
      ],
      "publisher": {
        "@id": "https://panelzoom.com/#person-felipe-rude"
      }
    },
    {
      "@type": "WebPage",
      "@id": "https://panelzoom.com/en/#webpage",
      "url": "https://panelzoom.com/en/",
      "name": "PDF Comic Reader – Read Comics Panel by Panel | PanelZoom",
      "description": "Read PDF comics on your phone without pinching and scrolling. Automatic panel detection, guided view for your own files. Free, private, offline.",
      "inLanguage": "en",
      "isPartOf": {
        "@id": "https://panelzoom.com/#website"
      },
      "about": {
        "@id": "https://panelzoom.com/#webapp-en"
      },
      "mainEntity": {
        "@id": "https://panelzoom.com/#webapp-en"
      }
    },
    {
      "@type": "WebApplication",
      "@id": "https://panelzoom.com/#webapp-en",
      "name": "PanelZoom",
      "url": "https://panelzoom.com/app/",
      "mainEntityOfPage": {
        "@id": "https://panelzoom.com/en/#webpage"
      },
      "description": "Read PDF comics on your phone without pinching and scrolling. Automatic panel detection, guided view for your own files. Free, private, offline.",
      "inLanguage": "en",
      "applicationCategory": "MultimediaApplication",
      "operatingSystem": "Any (Browser), iOS, Android",
      "browserRequirements": "Requires JavaScript and a current browser (Safari, Chrome)",
      "isAccessibleForFree": true,
      "offers": {
        "@type": "Offer",
        "price": "0",
        "priceCurrency": "EUR"
      },
      "featureList": [
        "Automatic panel detection in the browser",
        "Panel-by-panel guided reading in reading order",
        "Smooth camera pan or instant jump",
        "Adjustable margin to the screen edge",
        "Reading progress saved per panel",
        "Works offline",
        "Installable to the home screen",
        "No account, PDFs stay on your device"
      ],
      "author": {
        "@id": "https://panelzoom.com/#person-felipe-rude"
      },
      "creator": {
        "@id": "https://panelzoom.com/#person-felipe-rude"
      }
    },
    {
      "@type": "Person",
      "@id": "https://panelzoom.com/#person-felipe-rude",
      "name": "Felipe Rude",
      "jobTitle": "Developer of PanelZoom",
      "image": {
        "@type": "ImageObject",
        "@id": "https://panelzoom.com/#founder-photo",
        "url": "https://panelzoom.com/media/felipe.webp",
        "caption": "Felipe Rude, developer of PanelZoom"
      },
      "url": "https://panelzoom.com/en/"
    }
  ]
}
</script>
```

### Optional: FAQPage (not recommended, Info priority)

Only if you accept that there is no Google SERP benefit and that AI/GEO benefit is unconfirmed. Add as a further node in the `@graph` and make sure the text equals the visible FAQ exactly (shown here: first two DE questions as pattern; extend to all 8 from `faq.items`, joining array answers with a space).

```json
{
  "@type": "FAQPage",
  "@id": "https://panelzoom.com/de/#faq",
  "inLanguage": "de",
  "isPartOf": { "@id": "https://panelzoom.com/de/#webpage" },
  "mainEntity": [
    {
      "@type": "Question",
      "name": "Ist PanelZoom kostenlos?",
      "acceptedAnswer": { "@type": "Answer", "text": "Ja. PanelZoom ist kostenlos und werbefrei. Du brauchst kein Konto und musst nichts aus einem App Store laden." }
    },
    {
      "@type": "Question",
      "name": "Werden meine Comics hochgeladen?",
      "acceptedAnswer": { "@type": "Answer", "text": "Nein. Deine PDFs bleiben auf deinem Gerät, im Speicher deines Browsers. Auch die Panel-Erkennung läuft dort. PanelZoom hat keinen Server, an den Comics geschickt werden." }
    }
  ]
}
```
