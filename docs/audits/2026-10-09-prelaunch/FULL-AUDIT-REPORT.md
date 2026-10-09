# SEO-Audit vor dem Launch: PanelZoom (2026-10-09)

Geprüft mit dem claude-seo-Plugin (v2.4.1) auf https://develop.panelzoom.com (Stand a6bbeae) und dem lokalen Live-Build `dist/`. Develop ist absichtlich noindex/Disallow, das zählt nicht als Befund. Typ: kostenlose Web-App/PWA (SaaS-ähnlich, ohne Bezahlmodell).

## SEO Health Score: 69 / 100

| Kategorie | Gewicht | Score | Detail |
|---|---|---|---|
| Technisches SEO | 22 % | 88 | [findings/technical.md](findings/technical.md), [sitemap.md](findings/sitemap.md) (88) |
| Content-Qualität | 23 % | 68 | [findings/content.md](findings/content.md) |
| On-Page | 20 % | 66 | [findings/content.md](findings/content.md) |
| Schema | 10 % | 0 | [findings/schema.md](findings/schema.md), fertige JSON-LD-Blöcke drin |
| Performance (CWV, Labor) | 10 % | 92 | [findings/performance.md](findings/performance.md) |
| KI-Suche | 10 % | 75 | GEO 68 [geo.md](findings/geo.md), Agentic 88 [agentic.md](findings/agentic.md) |
| Bilder | 5 % | 82 | [findings/performance.md](findings/performance.md) |

Zusätzlich, nicht im Score: SXO 53 ([sxo.md](findings/sxo.md)), Visual/Mobile 86 ([visual.md](findings/visual.md), Screenshots in `screenshots/`).

**Kein Befund blockiert den Launch.** Robots, Sitemap, hreflang, Canonicals, Redirects, 404 und Security-Header sind sauber. Der Score ist vor allem wegen fehlender Strukturdaten und weil die Hauptkeywords nicht im Text stehen so niedrig.

## Top 5 Probleme

1. **Keine Strukturdaten** (Schema 0). WebSite, WebPage, WebApplication, Person fehlen.
2. **Hauptkeywords nur im `<title>`.** „Comics auf dem Handy lesen“, „PDF Comic Reader“ und „read comics on phone“ kommen im Text 0-mal vor, die H1 ohne „auf dem Handy“ / „on your phone“.
3. **EN-Meta-Description verspricht „guided view“**, die Seite erwähnt es nirgends (comiXology-Zielgruppe aus dem Brief fehlt).
4. **Kein og:image**, `twitter:card=summary`. Geteilte Links am Launch-Tag ohne Vorschau.
5. **Vergleichstabelle aus dem Brief fehlt.** Für „comics auf dem handy lesen“ zeigt Google Listicles. Eine Vergleichstabelle würde helfen, diesen Seitentyp abzudecken.

## Top 5 Quick Wins

1. JSON-LD aus `landing.json` im Head-Template erzeugen (~1 h).
2. Dev-Icons (`app/img/pwa-dev/`) aus dem Live-Build und dem SW-Precache werfen.
3. `fetchpriority="high"` fürs Hero-Bild, Videos weiter unten erst bei Sichtbarkeit laden.
4. Cache-Control für `/media/`, `/fonts/`, `/assets/` (gehasht) in der `.htaccess`.
5. llms.txt mit Kurzbeschreibungen, Fakten/Grenzen und Autor erweitern.

## Wichtige Hinweise aus den Berichten

- **Bitte prüfen: Straßenname „Hermanstraße“** in allen vier Rechtsseiten. Gemeint ist vielleicht „Hermannstraße“. Im Impressum muss die Adresse exakt stimmen.
- **„Guided View“ ist ein comiXology-Begriff (Marke).** Beschreibend erwähnen geht („wie Guided View bei comiXology“), als eigenen Feature-Namen besser nicht verwenden.
- **SEO-Plan korrigieren:** Panel-für-Panel ist unter Android nicht einzigartig (Comic Time Reader, Bloopworm). Abheben über: im Browser, ohne Installation und Konto, Dateien bleiben auf dem Gerät.
- Laut Schema-Bericht hat Google die FAQ-Rich-Results am 7. Mai 2026 eingestellt. Das konnte ich nicht selbst prüfen. FAQPage-Markup deshalb nur optional.
- PageSpeed-API war ohne Key rate-limitiert, deshalb nur Laborwerte (Lighthouse lokal: 100/100 Desktop, 100 Mobile). Felddaten erst nach dem Launch über CrUX/GSC.

Maßnahmenplan: [ACTION-PLAN.md](ACTION-PLAN.md)
