# Maßnahmenplan PanelZoom-Launch (2026-10-09)

## A. Vor dem Launch: Technik (ohne Textentscheidungen)
- [ ] JSON-LD (WebSite, WebPage, WebApplication, Person) aus `landing.json` erzeugen
- [ ] Dev-Icons nicht in den Live-Build / SW-Precache
- [ ] Hero-Bild `fetchpriority="high"`, Videos unterhalb des Hero mit `preload="none"` und erst bei Sichtbarkeit laden
- [ ] Cache-Control für `/media/`, `/fonts/`, gehashte `/assets/` in `.htaccess`
- [ ] Permissions-Policy-Header
- [ ] Canonical auf `/` (x-default-Seite)
- [ ] llms.txt erweitern (Linkbeschreibungen, Fakten/Grenzen, Autor)
- [ ] Header: Leerzeichen „PanelZoom Comic-Reader“, EN-Tagline übersetzen, CTA-Kontrast
- [ ] `panelzoom.com/app` in den Installationsschritten verlinken

## B. Vor dem Launch: Texte (Entscheidung User)
- [ ] H1 mit Gerätewort: „PDF-Comics auf dem Handy lesen, Panel für Panel“ / „Read PDF comics on your phone, panel by panel“
- [ ] Ein Definitionssatz „PanelZoom ist …“ und Hauptkeywords im Fließtext
- [ ] Guided View im EN-Text beschreibend erwähnen (oder aus der Meta-Description nehmen)
- [ ] Vergleichstabelle PanelZoom vs. PDF-Viewer vs. Comic-Apps
- [ ] og:image 1200×630 pro Sprache + `summary_large_image`
- [ ] Impressum-Adresse prüfen („Hermanstraße“?)

## C. Launch
- [ ] Dev-Deploy, Re-Audit mit dem Plugin
- [ ] Freigabe durch User → `npm run deploy`
- [ ] Live prüfen: robots.txt, sitemap.xml, llms.txt, `/` 302, kein X-Robots-Tag, Header, Rich Results Test

## D. Nach dem Launch
- [ ] Google Search Console: Domain-Property, DNS-TXT bei netcup, Sitemap einreichen, URL-Prüfung /de/ + /en/
- [ ] Bing Webmaster Tools (Import aus GSC), IndexNow
- [ ] Plugin mit Google-API verbinden (`/seo google setup`) → CrUX, GSC-Daten, PSI ohne Rate-Limit
- [ ] Alte Subdomain: Umzugs-Banner + canonical auf panelzoom.com
- [ ] Off-Site: GitHub-README → panelzoom.com, AlternativeTo, Reddit, Show HN/Product Hunt
- [ ] Nach 4–6 Wochen: GSC-Auswertung, erste Ratgeber (Guided View, Comics am Handy lesen)
