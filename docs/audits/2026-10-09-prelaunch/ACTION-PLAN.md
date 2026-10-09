# Maßnahmenplan PanelZoom-Launch (2026-10-09)

## A. Vor dem Launch: Technik (ohne Textentscheidungen)
- [x] JSON-LD (WebSite, WebPage, WebApplication, Person) aus `landing.json` erzeugen
- [x] Dev-Icons nicht in den Live-Build / SW-Precache
- [x] Hero-Bild `fetchpriority="high"`, Videos unterhalb des Hero mit `preload="none"` und erst bei Sichtbarkeit laden
- [x] Cache-Control für `/media/`, `/fonts/`, gehashte `/assets/` in `.htaccess`
- [x] Permissions-Policy-Header
- [ ] Canonical auf `/` (x-default-Seite)
- [x] llms.txt erweitern (Linkbeschreibungen, Fakten/Grenzen, Autor)
- [x] Header: Leerzeichen, EN-Tagline übersetzt, Button-Rot #C62833 (5,5:1)
- [ ] `panelzoom.com/app` in den Installationsschritten verlinken

## B. Vor dem Launch: Texte (Entscheidung User)
- [x] H1 mit Gerätewort: „PDF-Comics auf dem Handy lesen, Panel für Panel“ / „Read PDF comics on your phone, panel by panel“
- [x] Ein Definitionssatz „PanelZoom ist …“ und Hauptkeywords im Fließtext
- [x] Guided View im EN-Text beschreibend erwähnen (oder aus der Meta-Description nehmen)
- [ ] (später) Vergleichstabelle PanelZoom vs. PDF-Viewer vs. Comic-Apps
- [ ] og:image 1200×630 pro Sprache + `summary_large_image` → nach dem Launch (User will das Hero-Video vorher ändern)
- [ ] Impressum-Adresse prüfen („Hermanstraße“?)

## C. Launch
- [x] Dev-Deploy, Re-Audit mit dem Plugin
- [ ] Freigabe durch User → `npm run deploy`
- [ ] Live prüfen: robots.txt, sitemap.xml, llms.txt, `/` 302, kein X-Robots-Tag, Header, Rich Results Test

## D. Nach dem Launch
- [ ] Google Search Console: Domain-Property, DNS-TXT bei netcup, Sitemap einreichen, URL-Prüfung /de/ + /en/
- [ ] Bing Webmaster Tools (Import aus GSC), IndexNow
- [ ] Plugin mit Google-API verbinden (`/seo google setup`) → CrUX, GSC-Daten, PSI ohne Rate-Limit
- [ ] Alte Subdomain: Umzugs-Banner + canonical auf panelzoom.com
- [ ] Off-Site: GitHub-README → panelzoom.com, AlternativeTo, Reddit, Show HN/Product Hunt
- [ ] Nach 4–6 Wochen: GSC-Auswertung, erste Ratgeber (Guided View, Comics am Handy lesen)
