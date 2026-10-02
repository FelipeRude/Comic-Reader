# SEO-Plan: PanelZoom

> Stand: 02.10.2026 · Status: **Planung, noch nichts umgesetzt**
> Neue Domain: **https://panelzoom.com** (bei netcup bestellt, Registrierung wird geprüft)
> Bisher: https://comic-reader.felipe-rude.de · Sprachen zum Start: **DE + EN** · später voraussichtlich **FR, ES, PT-BR**

---

## 0. Kurzfassung

| Thema | Entscheidung / Empfehlung |
|---|---|
| Positionierung | „Comics als PDF auf dem Handy lesen – Panel für Panel, im Browser, ohne App-Store, ohne Account, offline“ |
| Hauptkeyword DE | **„Comics auf dem Handy lesen“** + **„PDF Comic Reader“** |
| Hauptkeyword EN | **„PDF comic reader“** + **„read comics on phone“** (Nebenbegriff „panel by panel / guided view“) |
| Größte Lücke | Es gibt **keinen browserbasierten Reader mit automatischer Panel-Navigation**, der rankt. Guided View gibt es nur in nativen Apps (Panels nur für iOS) oder für gekaufte Store-Comics (Kindle/comiXology, Marvel). Auf Deutsch gibt es dazu praktisch keine guten Ratgeber. |
| Architektur | `/` → 302 nach Sprache · `/de/`, `/en/` statische Landing Pages und Ratgeber · `/app/` = PWA |
| Hreflang | Alle Sprachen aus **einer** Locale-Konfiguration erzeugt, `x-default` = `/` |
| Name & Domain | **PanelZoom** auf **panelzoom.com** (.com statt .de, damit die Seite nicht fest Deutschland zugeordnet wird). Die App liegt dort von Anfang an unter `/app/`. |
| Umzug Bestandsnutzer | Die alte Subdomain bleibt eine Übergangszeit lang mit Umzugs-Banner online. Lokale Bibliotheken lassen sich nicht automatisch übertragen (neuer Origin), Details in 4.6. |
| App-i18n | Eigener kleiner `useI18n`-Composable, JSON pro Sprache, Sprachwahl über `?lang=` → localStorage → Browser |
| Wichtigster Produkt-Hebel | **CBZ-Support.** Die meisten DRM-freien Comics kommen als CBZ/CBR, und dort liegt das größte Suchvolumen. |
| Weitere Sprachen | Wenn DE/EN indexiert sind und Impressionen haben (ca. Monat 4–6). Reihenfolge-Empfehlung: **FR → ES → PT-BR** |

> **Zu den Keyword-Daten:** Es war kein Tool für Suchvolumen angebunden (DataForSEO, Keyword Planner). Volumen sind deshalb als **relative Einschätzung** angegeben (hoch / mittel / niedrig), abgeleitet aus der Struktur der Suchergebnisse und aus Autocomplete-Mustern. Vor dem Schreiben der Ratgeber mit dem Google Keyword Planner gegenprüfen, nach dem Launch mit echten Daten aus der Search Console.

---

## 0.1 Entschieden: Name PanelZoom, Domain panelzoom.com

**Warum:** „COMIC READER“ ist ein Gattungsbegriff. Damit kann man nicht für die eigene Marke ranken, und KI-Suchen können die App nicht als eigenständiges Produkt erkennen. Eine Subdomain von `felipe-rude.de` würde Google außerdem fest Deutschland zuordnen, was die EN-Seite und spätere Sprachen bremst.

**Entscheidung (02.10.2026):**
- Marke **PanelZoom**, Domain **panelzoom.com** (Registrar und Hosting: netcup-Webhosting, statische Dateien wie bisher)
- Schreibweise: „PanelZoom“ im Text, `panelzoom.com` in URLs. „Comic Reader“ bleibt als beschreibender Zusatz im Title und in der H1 erhalten („PanelZoom – PDF Comic Reader“), weil das ein Suchbegriff ist.
- Dev-Umgebung: `develop.panelzoom.com` (noindex, siehe 7.2)
- Vor dem Launch kurz prüfen, ob „PanelZoom“ als Marke schon belegt ist (DPMA/EUIPO, Klasse 9/42)

**Später geplant (nicht Teil dieses Plans):** Premium mit Login und Cloud-Speicher. Dann `api.panelzoom.com` für das Backend und Object Storage für die Comics. Die Website und `/app/` bleiben statisch auf netcup. Lokal bleibt der Standard, die Cloud ist eine optionale Synchronisation. So gilt das Versprechen „kein Account nötig“ weiter.

---

## 1. Zielgruppe & Suchintention

### Segmente (für beide Sprachen gültig, Gewichtung unterschiedlich)

| # | Segment | Situation | Typische Suchintention | DE | EN |
|---|---|---|---|---|---|
| 1 | **Käufer DRM-freier Comics** (Humble Bundle, Kickstarter/Startnext-Backer, DriveThruComics, Image/2000 AD, Gumroad/itch.io, Kleinverlage) | hat PDFs (oder CBZ) und weiß nicht, wie man die bequem am Handy liest | „wie lese ich …“, „bester Reader für …“ | ●● | ●●● |
| 2 | **Pendler / Mobile-Leser** mit eigener PDF-Sammlung | Zoomen und Scrollen nervt, Lesestand geht verloren | Problem → Lösung | ●●● | ●●● |
| 3 | **Ehemalige comiXology-Nutzer** | vermissen Guided View, seit die eigenständige App in Kindle aufgegangen ist; Guided View gibt es dort nur für gekaufte Titel | „guided view alternative“, „guided view for own files“ | ● | ●●● |
| 4 | **Android-Nutzer** | Panels (die bekannteste Guided-View-App für eigene Dateien) gibt es nur für iOS/Mac | „panel by panel comic reader android“ | ●● | ●● |
| 5 | **Datenschutz-Bewusste / „ohne App“-Nutzer** | Dienst-Handy, kein App-Store, keine Uploads | „ohne Anmeldung“, „offline“, „ohne App“ | ●●● | ●● |
| 6 | **Indie-Zeichner und Kleinverlage** (B2B2C) | verkaufen PDFs und wollen den Lesern eine gute Leseempfehlung geben | Multiplikatoren, Backlinks | ●● | ●● |

**Bewusst ausgeschlossen:** Piraterie-nahe Suchanfragen („comics kostenlos pdf download“, „read marvel free online“). Die Intention passt nicht zum Produkt, und solche Rankings schaden der Reputation.
**Erst mit Feature:** Manga (Leserichtung rechts → links fehlt) und CBR/CBZ (nur PDF). Dafür siehe Roadmap.

### Suchintentionen nach Phase der Customer Journey

| Phase | DE-Beispiele | EN-Beispiele | Seitentyp |
|---|---|---|---|
| Problembewusst (informational) | „comics auf dem handy lesen“, „pdf comic am handy zu klein“, „cbr datei öffnen“ | „how to read comics on phone“, „what is guided view“, „cbz vs pdf“ | Ratgeber |
| Lösungssuche (commercial) | „comic reader app“, „pdf comic reader android“, „comic reader iphone kostenlos“ | „pdf comic reader“, „comic reader app android“, „best comic reader for iphone“ | Landing, Vergleich |
| Alternative (commercial) | „panels app android alternative“ | „comixology guided view alternative“, „panels comic reader alternative android“ | Vergleich / Alternativen |
| Direkt (navigational) | Markenname | Markenname | Landing |

**DE vs. EN, die wichtigsten Unterschiede:**
- DE nutzt viele Anglizismen („Comic Reader“, „Guided View“), aber Problem-Formulierungen auf Deutsch („auf dem Handy lesen“, „Datei öffnen“). „Panel für Panel“ wird kaum gesucht, eignet sich aber gut als Texthook.
- DE reagiert stark auf **„kostenlos“, „ohne Anmeldung“, „ohne Werbung“, „Datenschutz“**.
- EN reagiert stark auf **„guided view“, „comiXology alternative“, „DRM-free“, „Humble Bundle“**.

---

## 2. Keyword-Recherche & Clustering

Die Cluster sind nach Suchintention und Themennähe gebildet. Ein Cluster entspricht einer URL. Die Keywords sind **pro Sprache eigenständig** gewählt, die Listen sind keine Übersetzungen voneinander.

### 2.1 Deutsch

| Cluster / URL | Haupt-Keyword | Neben-Keywords | Intention | Vol.* | Konkurrenz |
|---|---|---|---|---|---|
| **Landing** `/de/` | comics auf dem handy lesen | pdf comic reader, comic reader app, comic reader online, comics offline lesen, comic reader ohne anmeldung, comic reader android / iphone kostenlos | commercial | mittel | mittel (App-Store-Seiten, netzwelt) |
| Ratgeber `/de/ratgeber/comics-auf-dem-handy-lesen/` | comics am handy lesen anleitung | comic pdf am handy zu klein, comics auf dem smartphone lesen tipps, comic lesen iphone | informational | mittel | **niedrig** (kaum DE-Ratgeber) |
| Ratgeber `/de/ratgeber/guided-view/` | guided view comics | panel für panel lesen, comic panel zoom, comixology guided view | informational | niedrig | **sehr niedrig** |
| Ratgeber `/de/ratgeber/cbr-cbz-pdf/` | cbr datei öffnen | cbz datei öffnen, was ist eine cbr datei, cbz vs pdf | informational | **hoch** | mittel |
| Vergleich `/de/ratgeber/comic-reader-apps-vergleich/` | comic reader app vergleich | beste comic reader app, comic reader android, comic reader ipad | commercial | mittel | niedrig–mittel |
| Support `/de/ratgeber/web-app-installieren/` | web app zum home-bildschirm hinzufügen | pwa installieren iphone, web app android installieren | informational | mittel | mittel (Support-Seiten anderer) |
| *Später, mit CBZ* `/de/cbz-reader/` | cbz reader | cbr reader online, cbz datei lesen handy | commercial | hoch | mittel |
| *Später, mit RTL* `/de/manga-reader/` | manga pdf lesen | manga reader app, manga am handy lesen | commercial | hoch | hoch |

### 2.2 Englisch

| Cluster / URL | Haupt-Keyword | Neben-Keywords | Intention | Vol.* | Konkurrenz |
|---|---|---|---|---|---|
| **Landing** `/en/` | pdf comic reader | read comics on phone, panel by panel comic reader, comic reader online, browser comic reader, offline comic reader, comic reader no install | commercial | mittel–hoch | mittel–hoch (Listicles, App Stores) |
| Guide `/en/guides/read-comics-on-your-phone/` | how to read comics on phone | read pdf comics on iphone, read comics on android, comics too small on phone | informational | mittel | mittel |
| Guide `/en/guides/guided-view/` | what is guided view | guided view comics, panel by panel reading, comixology guided view for own files | informational | niedrig–mittel | **niedrig** |
| Alternative `/en/comixology-guided-view-alternative/` | comixology guided view alternative | comixology alternative for own comics, guided view for pdf | commercial | niedrig–mittel | **niedrig** (starke Lücke) |
| Guide `/en/guides/read-humble-bundle-comics/` | how to read humble bundle comics | read drm-free comics, kickstarter comic pdf read on phone | informational | niedrig | **sehr niedrig** |
| Guide `/en/guides/cbz-vs-cbr-vs-pdf/` | cbz vs pdf | what is a cbr file, how to open cbz files | informational | **hoch** | mittel–hoch |
| Comparison `/en/guides/best-comic-reader-apps/` | best comic reader app | comic reader for android, panels app alternative android | commercial | hoch | **hoch** (Tom's Guide, GamesRadar) |
| *Später, mit CBZ* `/en/cbz-reader/` | cbz reader online | cbr reader, open cbz in browser | commercial | hoch | mittel |
| *Später, mit RTL* `/en/manga-reader/` | read manga pdf on phone | manga reader app own files | commercial | hoch | hoch |

\* Relative Einschätzung, gegenprüfen (siehe Hinweis oben).

### 2.3 Hub-and-Spoke-Struktur (pro Sprache)

```
                  ┌──────── Landing /xx/ (Hub, CTA → /app/) ────────┐
                  │                     │                           │
   Handy-Ratgeber (Problem)   Guided View (Konzept)   Vergleich / Alternative (commercial)
                  │                     │                           │
   Web-App installieren        CBZ/CBR/PDF (Formate)     DRM-free / Humble (nur EN)
```

**Interne Verlinkung:**
- Jede Spoke-Seite verlinkt mit beschreibendem Ankertext auf die Landing (Hub) und hat einen CTA zur App.
- Die Landing verlinkt auf die 3 stärksten Spokes.
- Die Spokes untereinander: Handy-Ratgeber ↔ Guided View ↔ Vergleich ↔ Installieren.
- Der Sprachumschalter verlinkt immer auf die **äquivalente Seite**, nie pauschal auf die Startseite.

---

## 3. Wettbewerber

### 3.1 Wer heute rankt

Die Suchergebnisse für beide Sprachen bestehen fast nur aus **App-Store-Seiten**, **Listicles** (Tom's Guide, GamesRadar, ifun.de) und **Download-Portalen** (netzwelt.de). Eigenständige Produkt-Landing-Pages mit gutem Inhalt sind selten.

| Wettbewerber | Plattform | Guided View / Panel | Eigene Dateien | Browser / ohne Install | Kosten | Relevanz |
|---|---|---|---|---|---|---|
| **Panels – Comic Reader** | iOS, iPadOS, Mac | ✅ Guided View | ✅ PDF/CBZ/CBR | ❌ | Freemium | Hauptkonkurrent (iOS) |
| **Smart Comic Reader** | iOS | ✅ (Doppeltipp-Erkennung) | ✅ | ❌ | einmalig | Nischenkonkurrent |
| **Kindle / comiXology** | iOS, Android, Web | ✅ Guided View | ❌ nur gekaufte | teilweise | Store | Ursprung des Begriffs „Guided View“ |
| **Marvel Unlimited** (SmartTrak) | iOS, Android | ✅ | ❌ | ❌ | Abo | nur Marvel-Katalog |
| **YACReader** | Desktop, iOS | ✅ Panel-Modus | ✅ | ❌ | frei / iOS kostenpflichtig | Technik-Nutzer |
| **Perfect Viewer, Astonishing, ComicScreen, Chunky** | Android / iOS | ❌ oder eingeschränkt | ✅ | ❌ | frei / Freemium | Standard-Empfehlungen in Listicles |
| **Guttr, Web Comic Reader, „Comic CBR CBZ Viewer“** | Browser / PWA | ❌ | ✅ CBZ/CBR | ✅ | frei | direkte Web-Konkurrenz, **ohne Panel-Erkennung** |

### 3.2 Lücken

1. **Kategorielücke:** *Browser oder PWA* **plus** *automatische Panel-Navigation* **plus** *eigene Dateien*. Diese Kombination hat derzeit niemand mit sichtbaren Rankings. Das ist die Kernbotschaft.
2. **Android:** Panels gibt es nur für Apple-Geräte, Android-Listicles empfehlen Viewer ohne Guided View. „Panel by panel comic reader Android“ hat kaum eine gute Antwort. Die PWA läuft auf Android.
3. **comiXology-Erbe (EN):** „Guided View für die eigenen Dateien“ ist ein klar formulierbares Bedürfnis, für das es kaum dedizierten Content gibt.
4. **Deutsch:** Es gibt fast keine redaktionellen deutschen Ratgeber zu „Comics am Handy lesen“ oder „Guided View“. Mit gutem Content lässt sich hier mit wenig Aufwand ranken.
5. **Vertrauen und Datenschutz:** Kein Konkurrent kommuniziert offensiv „deine Dateien verlassen nie dein Gerät“. Für DE ist das ein starker Hebel.

### 3.3 Schwächen, die ehrlich adressiert werden sollten

- **Nur PDF.** CBZ/CBR fehlen, dabei liegen viele DRM-freie Comics in diesen Formaten vor. → Roadmap Phase 4.
- **Nur westliche Leserichtung.** Manga ist damit raus. → Roadmap Phase 5.
- **Panel-Erkennung arbeitet über die Gutter (Weißräume).** Bei randlosen Layouts oder farbigen Hintergründen funktioniert sie schlechter. In den FAQ offen ansprechen; das schafft Vertrauen und senkt Absprungraten.

---

## 4. Seitenarchitektur

### 4.1 URL-Struktur

```
/                                   → 302 auf /de/ oder /en/ (x-default)
/de/                                Landing DE
/de/ratgeber/                       Ratgeber-Übersicht DE
/de/ratgeber/<slug>/                lokalisierte Slugs
/de/ueber/                          Über das Projekt (E-E-A-T)
/en/                                Landing EN
/en/guides/                         Guides-Übersicht EN
/en/guides/<slug>/
/en/about/
/app/                               PWA (noindex)
/impressum/  /datenschutz/          eigene Seiten (Pflicht für DE), einsprachig DE + EN-Hinweis
/sitemap.xml  /robots.txt  /llms.txt
/img/…  /og/…                       gemeinsame Assets
```

**Regeln:**
- Immer mit abschließendem Slash. `/de` → 301 → `/de/`.
- **Lokalisierte Slugs** (`/de/ratgeber/comics-auf-dem-handy-lesen/`, `/en/guides/read-comics-on-your-phone/`). Die Zuordnung der Sprachversionen läuft über einen gemeinsamen `translationKey` im Frontmatter.
- Sprachordner in Kleinbuchstaben; Regionalvarianten nur, wo nötig: `/pt-br/`.

### 4.2 Root-URL `/`

**Empfehlung: serverseitiger 302 nach Sprache, `/` ist `x-default`.**

Das ist das von Google beschriebene Muster: Eine automatisch weiterleitende Startseite wird als `x-default` ausgezeichnet. Googlebot crawlt ohne `Accept-Language` und landet dadurch auf `/en/`, die DE-Seite wird über hreflang und die Sitemap gefunden.

Reihenfolge der Sprachwahl:
1. Cookie `lang` (wird vom Sprachumschalter gesetzt, damit eine bewusste Wahl Vorrang vor dem Browser hat)
2. `Accept-Language` (erste passende Sprache aus der Liste der Live-Sprachen)
3. Fallback `en`

Skizze für `.htaccess` (wird aus der Locale-Konfiguration generiert, siehe 4.4):

```apache
RewriteEngine On
# Bewusste Sprachwahl hat Vorrang
RewriteCond %{HTTP_COOKIE} (?:^|;\s*)lang=(de|en)(?:;|$)
RewriteRule ^$ /%1/ [R=302,L]
# Browsersprache
RewriteCond %{HTTP:Accept-Language} ^de [NC]
RewriteRule ^$ /de/ [R=302,L]
# Default
RewriteRule ^$ /en/ [R=302,L]
<If "%{REQUEST_URI} == '/'">
  Header always set Vary "Accept-Language, Cookie"
  Header always set Cache-Control "no-store"
</If>
```

> Der Server ist nginx vor Apache (`.htaccess` liefert 403, `/icons/` ist ein Apache-Alias). Rewrite und Header müssen auf **develop.panelzoom.com** getestet werden (netcup-Webhosting, gleiche Server-Konfiguration wie bisher), bevor live deployt wird. Prüfen, ob nginx die 302-Antwort cacht.

**Nie** automatisch weiterleiten auf `/de/` oder `/en/` selbst, nur auf `/`. Wer eine Sprach-URL aufruft, bekommt genau diese Seite. Höchstens ein dezentes Banner „This page is also available in English“, ohne Redirect.

### 4.3 Hreflang

Auf jeder Seite, die es in mehreren Sprachen gibt, im `<head>`, **inklusive Selbstreferenz**:

```html
<link rel="canonical" href="https://panelzoom.com/de/">
<link rel="alternate" hreflang="de" href="https://panelzoom.com/de/">
<link rel="alternate" hreflang="en" href="https://panelzoom.com/en/">
<link rel="alternate" hreflang="x-default" href="https://panelzoom.com/">
```

- Für Ratgeber: `x-default` → EN-Version (es gibt keine weiterleitende Root-Variante pro Artikel).
- **Nur Sprachen ausgeben, für die die Seite wirklich existiert.** Ein Artikel, den es nur auf Deutsch gibt, bekommt keine hreflang-Annotationen.
- Sprachcodes: `de`, `en`, später `fr`, `es`, `pt-BR` (ohne Regionalcodes für de/en/fr/es, solange es keine Länderinhalte gibt).
- Zusätzlich in `sitemap.xml` (siehe 7.1). Doppelt hält besser, beides wird aus derselben Quelle erzeugt.

### 4.4 Erweiterbarkeit: eine Locale-Konfiguration für alles

```js
// locales.config.mjs (Repo-Root), von Landing-Build, App, Sitemap und .htaccess-Generator genutzt
export const LOCALES = [
  { code: 'de', hreflang: 'de', path: '/de/', ogLocale: 'de_DE', nativeName: 'Deutsch', guidesPath: 'ratgeber', status: 'live' },
  { code: 'en', hreflang: 'en', path: '/en/', ogLocale: 'en_US', nativeName: 'English', guidesPath: 'guides',   status: 'live' },
  // { code: 'fr',    hreflang: 'fr',    path: '/fr/',    ogLocale: 'fr_FR', nativeName: 'Français',  guidesPath: 'guides', status: 'draft' },
  // { code: 'pt-BR', hreflang: 'pt-BR', path: '/pt-br/', ogLocale: 'pt_BR', nativeName: 'Português', guidesPath: 'guias',  status: 'draft' },
]
export const DEFAULT_LOCALE = 'en'
```

Eine neue Sprache anzulegen heißt dann: Eintrag hinzufügen, Texte übersetzen (`site/content/<code>/`, `src/locales/<code>.json`), Status `live`. Hreflang, Sitemap, Redirect-Regeln, Sprachumschalter und die App-Sprachauswahl ziehen automatisch nach. `draft`-Sprachen werden gebaut (Vorschau auf develop.), aber nicht verlinkt und nicht in hreflang/Sitemap aufgenommen.

### 4.5 Technik für die Landing Pages: eigenes Build-Skript

**Entschieden (02.10.2026):** kein Astro, kein Static-Site-Framework. Ein schlankes Node-Skript erzeugt die statischen Seiten. Das passt zur Linie des Projekts (keine UI-Frameworks, möglichst wenige Abhängigkeiten).

**Abhängigkeiten:** nur `markdown-it` (Markdown → HTML) als neue devDependency. `sass` ist schon da und kompiliert das CSS der Landing. Frontmatter (`key: value`) parst das Skript selbst; Bilder werden einmalig von Hand optimiert (AVIF/WebP, z. B. mit Squoosh). `sharp` kommt erst dazu, falls das lästig wird.

**Ordnerstruktur:**

```
locales.config.mjs                 gemeinsame Sprachkonfiguration (4.4), von Skript UND App importiert
site/
  content/
    de/landing.json                strukturierte Texte: hero, features[], steps[], faq[], meta
    de/ratgeber/*.md               Frontmatter: title, description, slug, translationKey, published, updated
    en/landing.json
    en/guides/*.md
  templates/
    layout.mjs                     export (page) => `<!doctype html>…` (head, header, footer, Sprachumschalter)
    landing.mjs                    Sektionen der Landing (Abschnitt 6.2)
    article.mjs                    Ratgeber-Seite mit Autorenkasten, Breadcrumbs, CTA
    partials/head.mjs              title, description, canonical, hreflang, OG, JSON-LD
  styles/site.scss
  public/                          wird 1:1 kopiert (Bilder, OG-Bilder, Fonts, favicon)
scripts/build-site.mjs             das Build-Skript (geschätzt 300–400 Zeilen)
```

`.mjs`, weil `package.json` kein `"type": "module"` hat (das bestehende Icon-Skript nutzt `require`).

**Was `build-site.mjs` macht:**
1. Locale-Konfiguration laden; nur Sprachen mit Status `live` (bzw. auch `draft`, wenn `DEPLOY_TARGET=dev`)
2. Pro Sprache `landing.json` und alle Markdown-Dateien einlesen, Frontmatter parsen
3. Übersetzungen über `translationKey` zusammenführen → daraus hreflang-Links und Sprachumschalter-Ziele
4. Seiten über die Template-Funktionen rendern → `dist/<lang>/index.html`, `dist/<lang>/<guidesPath>/<slug>/index.html`, Übersichtsseiten
5. `site.scss` → `dist/assets/site.css` (mit Hash im Dateinamen für Caching)
6. Generieren: `sitemap.xml` (mit hreflang, 7.1), `robots.txt` (live vs. dev, 7.2), `llms.txt` (7.4), `.htaccess` (Root-Redirect aus den Live-Sprachen, 4.2)
7. **Prüfungen, die den Build abbrechen:** fehlender title/description, description > 160 Zeichen, doppelte Slugs, `translationKey` ohne Gegenstück in einer Live-Sprache (Warnung), interne Links auf nicht existierende Seiten

**Build-Reihenfolge** in `package.json`:
```json
"build":     "rm -rf dist && vite build && node scripts/build-site.mjs",
"dev:site":  "node --watch-path=site --watch-path=scripts scripts/build-site.mjs --serve"
```
Die App baut nach `dist/app/` (Vite `build.outDir: 'dist/app'`), danach schreibt das Skript den Rest nach `dist/`, ohne `dist/app/` anzufassen. `--serve` startet einen Mini-Server (`node:http`, ca. 30 Zeilen) für die lokale Vorschau. Das Deploy-Skript (`mirror --delete dist/ /`) bleibt unverändert.

**Grenzen, die bewusst in Kauf genommen werden:** keine Hot-Reload-Vorschau im Browser (die Seite muss neu geladen werden) und keine automatische Bildoptimierung. Wenn das bei 5 Sprachen stört, lassen sich beide Punkte nachrüsten, ohne die Struktur zu ändern.

### 4.6 App unter `/app/` und Umzug von der alten Subdomain

#### a) Neue App-Konfiguration auf panelzoom.com

Auf der neuen Domain gibt es **keinen alten Service Worker**. Die App kann direkt sauber unter `/app/` starten:

- `vite.config.js`: `base: '/app/'`
- VitePWA: `scope: '/app/'`, SW unter `/app/sw.js`, Workbox `navigateFallbackAllowlist: [/^\/app\//]`. Damit fängt der SW nur App-Navigationen ab und nie die Landing Pages.
- Manifest: `id: '/app/'`, `start_url: '/app/'`, `scope: '/app/'`, `name: 'PanelZoom'`, `short_name: 'PanelZoom'`, Beschreibung auf Englisch (Default)
- Absolute Pfade im Code auf `import.meta.env.BASE_URL` umstellen (`/pdf.worker.min.mjs`, `/UI-Icons/…`, `/img/icon.png` im `transformIndexHtml`-Plugin). Gemeinsame Assets wie das Logo können bewusst an der Root (`/img/`) liegen und von Landing und App genutzt werden.
- **`/app/` nicht indexieren:** `<meta name="robots" content="noindex">` in `app/index.html`, **nicht** per robots.txt sperren (sonst sieht Google das noindex nicht), nicht in die Sitemap aufnehmen. `/app` → 301 → `/app/`.

#### b) Bestandsnutzer der alten Subdomain

**Ausgangslage:** IndexedDB, OPFS und localStorage sind an den Origin gebunden. Die Bibliotheken auf `comic-reader.felipe-rude.de` sind von `panelzoom.com` aus **nicht lesbar**. Eine sofortige 301-Weiterleitung der ganzen Subdomain würde den Nutzern den Zugang zu ihren importierten Comics und Leseständen nehmen.

**SEO-seitig gibt es auf der alten Subdomain nichts zu retten:** Sie hat nur eine SPA-Seite ohne Inhalt und keine nennenswerten Rankings. Der Umzug darf also nutzerfreundlich und langsam ablaufen.

**Ablauf:**

1. **Übergangsphase (ca. 3 Monate ab Launch von panelzoom.com):**
   - Letztes Update der alten App mit **Umzugs-Banner**: „Comic Reader heißt jetzt PanelZoom → panelzoom.com. Deine Comics hier bleiben erhalten, auf der neuen Seite bitte die PDFs neu importieren.“ Mit Button zur neuen App.
   - **Optional, Lesestand mitnehmen:** Der Button übergibt die Lesestände als kleines JSON im URL-Fragment (`https://panelzoom.com/app/#migrate=<base64>`; das Fragment geht nicht an den Server). Gespeichert werden Titel, Dateigröße, Seitenzahl, Seite und Panel. Importiert der Nutzer auf der neuen Seite dieselbe PDF, wird der Lesestand anhand von Dateigröße + Seitenzahl wiederhergestellt. Die PDFs selbst sind zu groß für diesen Weg; die hat der Nutzer aber ohnehin noch.
   - `index.html` der alten Seite: `<link rel="canonical" href="https://panelzoom.com/">` und `noindex`.
2. **Danach:** Die alte Subdomain leitet per 301 auf `https://panelzoom.com/` weiter (`.htaccess` mit `RewriteRule ^ https://panelzoom.com/ [R=301,L]`). Die alte `sw.js` wird durch einen Kill-Switch ersetzt, damit installierte alte PWAs nicht ewig die gecachte Version zeigen:
   ```js
   // sw.js auf comic-reader.felipe-rude.de: alten SW abmelden, Caches leeren, neu laden (→ 301)
   self.addEventListener('install', () => self.skipWaiting())
   self.addEventListener('activate', (event) => {
     event.waitUntil((async () => {
       const keys = await caches.keys()
       await Promise.all(keys.map((k) => caches.delete(k)))
       await self.registration.unregister()
       const clients = await self.clients.matchAll({ type: 'window' })
       clients.forEach((c) => c.navigate(c.url))
     })())
   })
   ```
   `sw.js` ist von der 301-Regel auszunehmen und mit `Cache-Control: no-cache` auszuliefern.
3. Links aktualisieren: GitHub-README, eigene Website, Profile.
4. Optional in der Search Console das Tool „Adressänderung“ für die alte Property nutzen, sobald die 301 aktiv sind.

> **Lehre für die Zukunft:** Eine Export/Import-Funktion für die Bibliothek (Lesestände + optional PDFs als ZIP) macht jeden späteren Umzug und auch Gerätewechsel schmerzfrei. Für Premium/Cloud wird sie sowieso gebraucht.

#### c) Testplan auf develop.panelzoom.com (Pflicht vor Live)
- [ ] Neue Installation von `/app/` (iOS + Android): Start-URL und Scope korrekt, offline nutzbar
- [ ] `/de/` und `/en/` werden nie vom App-SW abgefangen (DevTools → Network: „from ServiceWorker“ darf dort nicht stehen)
- [ ] Umzugs-Banner auf einer Kopie der alten App testen, inklusive `#migrate=`-Übergabe
- [ ] Kill-Switch auf einem Gerät mit alter installierter PWA testen: alter SW verschwindet, Weiterleitung greift

---

## 5. Lokalisierung der App

### 5.1 Ansatz

**Eigener, kleiner `useI18n`-Composable** statt `vue-i18n`. Das passt zur Philosophie ohne schwere Libraries; die App hat 6 Komponenten und keinen Router. Falls die Texte später komplex werden (ICU-Plurale mit Formatierung, viele Sprachen), ist ein Wechsel zu `vue-i18n` einfach, weil die Keys gleich bleiben.

```
src/locales/de.json
src/locales/en.json
src/i18n.js            → locale (ref), t(key, params), plural via Intl.PluralRules,
                         n() via Intl.NumberFormat, d() via Intl.DateTimeFormat
```

- Alle Sprach-JSONs sind klein → alle in den Precache, damit das Umschalten offline funktioniert.
- Fehlender Key → Fallback `en`, im Dev-Modus eine Konsolenwarnung.
- `npm run i18n:check`: Skript, das Key-Parität zwischen allen Sprachdateien prüft (läuft vor jedem Build).

### 5.2 Sprachermittlung in der App

Reihenfolge:
1. `?lang=xx` (die CTAs der Landing verlinken auf `/app/?lang=de` bzw. `/app/?lang=en`). Wird übernommen, gespeichert und per `history.replaceState` aus der URL entfernt.
2. `localStorage['cr-lang']`. **Landing und App teilen sich diesen Key** (gleicher Origin). Wer auf der Landing die Sprache wechselt, hat sie auch in der App.
3. `navigator.languages`: erste Sprache mit Status `live`
4. Fallback `en`

Zusätzlich:
- **Sprachauswahl im Einstellungs-Modal** (Muttersprachliche Namen aus `locales.config.mjs`)
- `document.documentElement.lang` bei jedem Wechsel setzen
- Sprachwechsel auf der Landing setzt auch das Cookie `lang` (für den Root-Redirect)

### 5.3 Was übersetzt werden muss (Inventar)

| Bereich | Dateien | Besonderheiten |
|---|---|---|
| Dashboard, Leerzustand, Import | `DashboardView.vue`, `ComicCard.vue`, `useComicImport.js` | Plural „1 Comic / 2 Comics“ |
| Reader, HUD, Seitensprung | `ReaderView.vue`, `PageJumpModal.vue` | „Panel 3/12 – Seite 1/24“ als Template mit Parametern |
| Analyse-Overlay, Erfolgsmeldung | (in Views/Komponenten) | Zahlen mit `Intl.NumberFormat` („1.150“ vs. „1,150“) |
| Einstellungen, Build-Zeit | `SettingsModal.vue`, `vite.config.js` | `BUILD_TIME` als ISO-String übergeben und in der App lokal formatieren (aktuell fest `de-DE`) |
| Fehler und Bestätigungen | `storage/errors.js`, `ConfirmModal.vue` | Quota-Meldung, Lösch-Dialog |
| Installieren | `useInstallPrompt.js` | iOS-Anleitung („Teilen → Zum Home-Bildschirm“) |
| `index.html`, Manifest | `<html lang>`, `description` | Das Manifest bleibt einsprachig (der Name ist sprachneutral). Die Beschreibung auf Englisch setzen, weil sie als Default dient |

**Layout:** Deutsche, französische und portugiesische Texte sind 20–35 % länger als englische. Buttons und HUD sollten keine festen Breiten haben.

---

## 6. Content-Brief: Landing Page (DE + EN)

### 6.1 Meta

| | DE | EN |
|---|---|---|
| `<title>` (≤ 60 Zeichen) | Comics auf dem Handy lesen – PDF Comic Reader \| PanelZoom | PDF Comic Reader – Read Comics Panel by Panel \| PanelZoom |
| Meta-Description (≤ 155) | PDF-Comics am Smartphone lesen, ohne Zoomen: Die App erkennt jedes Panel und springt automatisch weiter. Kostenlos, ohne Anmeldung, offline. | Read PDF comics on your phone without pinching and scrolling. Automatic panel detection, guided view for your own files. Free, private, offline. |
| H1 | Comics als PDF auf dem Handy lesen – Panel für Panel | Read PDF comics on your phone, panel by panel |
| Ziel-Länge | 900–1.300 Wörter | 900–1.300 words |

### 6.2 Gliederung (für beide Sprachen gleich, Texte eigenständig schreiben)

1. **Hero**
   - H1 + ein Satz Nutzenversprechen
   - Primärer CTA: „Jetzt kostenlos im Browser öffnen“ / „Open free in your browser“ → `/app/?lang=xx`
   - Sekundärer CTA: „Mit Beispiel-Comic ausprobieren“. Ein Demo-Comic halbiert die Hürde für den ersten Test. Nur mit geklärten Rechten: ein eigenes Werk oder z. B. *Pepper&Carrot* von David Revoy (CC BY 4.0, in DE/EN/FR/ES/PT vorhanden). Die Lizenz vor der Verwendung prüfen.
   - **Kurzes Loop-Video (MP4/WebM, ≤ 1 MB, mit Poster-Bild)** der Smart-Zoom-Kamerafahrt am Handy. Das ist das stärkste Verkaufsargument.
   - Trust-Zeile: „Kein Account · Keine Uploads · Offline · Kostenlos“
2. **Das Problem** (2–3 Sätze): Zoomen, Scrollen, Lesestand weg
3. **So funktioniert's** (3 Schritte mit Screenshots): PDF importieren → Panels werden erkannt → antippen und weiterlesen
4. **Features** (Kacheln): automatische Panel-Erkennung · Smart-Zoom mit einstellbarer Kamerafahrt · Lesestand pro Panel · große PDFs (1.000+ Seiten) · Pinch-to-Zoom-Fallback · Light/Dark · installierbar
5. **Datenschutz & Offline:** „Deine Comics verlassen nie dein Gerät.“ Kurz technisch erklären (lokaler Speicher im Browser, kein Server, kein Tracking). Für DE besonders wichtig.
6. **Installieren:** iPhone (Safari → Teilen → Zum Home-Bildschirm) / Android (Chrome → Installieren). Link auf den Installations-Ratgeber.
7. **Vergleich** (Tabelle): PanelZoom vs. „normaler PDF-Viewer“ vs. „native Comic-App“. Neutral formuliert, ohne Konkurrenten schlechtzumachen. Gut zitierbar für KI-Suchen.
8. **Für wen?** DRM-freie Käufe, Kickstarter-PDFs, eigene Scans, Indie-Comics. **EN** zusätzlich: Humble-Bundle-Comics und ehemalige comiXology-Nutzer.
9. **FAQ** (6–8 Fragen, sichtbar auf der Seite):
   - Ist der Comic Reader kostenlos? / Is it free?
   - Brauche ich ein Konto? Werden meine Comics hochgeladen?
   - Funktioniert er offline?
   - Läuft er auf iPhone und Android?
   - Welche Formate werden unterstützt? (PDF; CBZ geplant)
   - Wie groß dürfen die Dateien sein / wo wird gespeichert / was passiert beim Löschen der Browserdaten?
   - Funktioniert die Panel-Erkennung bei jedem Comic? (ehrlich: am besten bei klaren weißen Rändern zwischen den Panels)
   - Manga / Leserichtung rechts → links? (noch nicht, geplant)
10. **Footer:** Sprachumschalter (auf die äquivalente Seite), Ratgeber-Links, Über das Projekt, GitHub, **Impressum + Datenschutz** (für ein deutsches Angebot Pflicht nach § 5 DDG bzw. DSGVO)

### 6.3 Schema-Markup (JSON-LD)

| Seite | Typen |
|---|---|
| Landing `/de/`, `/en/` | `WebApplication` (`applicationCategory: "MultimediaApplication"`, `operatingSystem: "Any (Browser), iOS, Android"`, `offers: { price: 0, priceCurrency: "EUR" }`, `inLanguage`, `featureList`, `screenshot`, `browserRequirements`), dazu `WebSite` und `Person` (Autor/Entwickler) |
| Ratgeber | `Article` (mit `author` → Person, `datePublished`, `dateModified`, `inLanguage`) + `BreadcrumbList` |
| Über-Seite | `AboutPage` + `Person` (`sameAs`: GitHub, Website) |
| FAQ-Sektion | `FAQPage` **optional**. Google zeigt FAQ-Rich-Results für normale Websites nicht mehr an. Nur einsetzen, wenn das Markup den sichtbaren Inhalt 1:1 abbildet; es schadet nicht und hilft beim semantischen Verständnis. |

**Nicht verwenden:** `AggregateRating` ohne echte, sichtbare Bewertungen; `HowTo` (keine Rich Results mehr). Bei Anleitungen genügt ein sauberes `Article` mit nummerierten Schritten.

### 6.4 Brief für die ersten Ratgeber (Kurzform)

| Seite | Kernfrage, die oben beantwortet wird (40–60 Wörter, gut zitierbar) | Länge |
|---|---|---|
| DE: Comics auf dem Handy lesen | Welche 3 Wege gibt es (PDF-Viewer, Comic-App, Guided View im Browser) und welcher passt wann? | 1.200–1.600 |
| DE: Was ist Guided View? | Definition, Herkunft (comiXology), wie die Panel-Erkennung funktioniert (mit Debug-Screenshot), Grenzen | 1.000–1.400 |
| DE: CBR/CBZ/PDF – Unterschied und Datei öffnen | Was steckt in den Formaten, wie öffne ich sie am Handy | 1.200–1.500 |
| EN: How to read comics on your phone | dto., mit DRM-free-Quellen (Humble, Kickstarter, DriveThru) | 1.400–1.800 |
| EN: Guided View for your own comics (comiXology alternative) | Was nach comiXology geblieben ist, welche Optionen es für eigene Dateien gibt | 1.200–1.600 |
| EN: How to read Humble Bundle comics on your phone | Download → Format → Reader. Konkreter Ablauf | 900–1.200 |

Jeder Ratgeber enthält: eigene Screenshots/GIFs (Original-Material = E-E-A-T), einen Autorenkasten, Datum und „zuletzt aktualisiert“, einen CTA zur App und 2–3 interne Links.

---

## 7. Technische Basics

### 7.1 `sitemap.xml` mit hreflang

Wird beim Build aus der Locale-Konfiguration und den Content-Dateien erzeugt. Nur Seiten mit Status `live`, ohne `/app/` und ohne `/`:

```xml
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
  <url>
    <loc>https://panelzoom.com/de/</loc>
    <lastmod>2026-10-15</lastmod>
    <xhtml:link rel="alternate" hreflang="de" href="https://panelzoom.com/de/"/>
    <xhtml:link rel="alternate" hreflang="en" href="https://panelzoom.com/en/"/>
    <xhtml:link rel="alternate" hreflang="x-default" href="https://panelzoom.com/"/>
  </url>
  <url>
    <loc>https://panelzoom.com/en/</loc>
    <!-- dieselben drei xhtml:link-Einträge -->
  </url>
</urlset>
```

`lastmod` nur bei echter inhaltlicher Änderung setzen (aus dem Frontmatter `updated`), nicht bei jedem Build.

### 7.2 `robots.txt`

**Live:**
```
User-agent: *
Allow: /

Sitemap: https://panelzoom.com/sitemap.xml
```
KI-Crawler (GPTBot, OAI-SearchBot, ChatGPT-User, PerplexityBot, ClaudeBot) werden bewusst **nicht** gesperrt, weil Sichtbarkeit in KI-Suchen ein Ziel ist. `Google-Extended` (KI-Training) ist eine eigene Entscheidung und beeinflusst das Ranking nicht.

**develop.panelzoom.com:** muss komplett aus dem Index bleiben, sonst entsteht Duplicate Content:
- eigene `robots.txt` mit `Disallow: /` **und**
- `Header set X-Robots-Tag "noindex, nofollow"` in der `.htaccess` des Dev-Builds
- Umsetzung über `DEPLOY_TARGET` im Build (wie heute schon beim Icon)

### 7.3 Open Graph / Social pro Sprache

```html
<meta property="og:type" content="website">
<meta property="og:site_name" content="PanelZoom">
<meta property="og:title" content="Comics auf dem Handy lesen – Panel für Panel">
<meta property="og:description" content="…">
<meta property="og:url" content="https://panelzoom.com/de/">
<meta property="og:locale" content="de_DE">
<meta property="og:locale:alternate" content="en_US">
<meta property="og:image" content="https://panelzoom.com/og/de-landing.png">
<meta property="og:image:width" content="1200"><meta property="og:image:height" content="630">
<meta property="og:image:alt" content="…">
<meta name="twitter:card" content="summary_large_image">
```
- **Ein OG-Bild pro Sprache** (1200×630, lokalisierte Tagline + Handy-Mockup mit Panel-Zoom). Für Ratgeber eine Vorlage mit Titel, beim Build generiert.
- `og:locale` aus der Locale-Konfiguration, `og:locale:alternate` für alle anderen Live-Sprachen.

### 7.4 `llms.txt`

Optional (Google ignoriert die Datei), kostet aber nur ein paar Minuten und hilft manchen KI-Agenten. Liegt an der Root, auf Englisch, mit Links auf beide Sprachen:

```markdown
# PanelZoom – PDF Comic Reader

> Free, privacy-first web app (PWA) that reads PDF comics on phones panel by panel.
> Automatic panel detection, guided-view style smart zoom, reading progress saved per panel.
> Runs entirely in the browser: no account, no uploads, works offline. Available in English and German.

## Pages
- [Landing (EN)](https://panelzoom.com/en/)
- [Landing (DE)](https://panelzoom.com/de/)
- [Open the app](https://panelzoom.com/app/)

## Guides
- [How to read comics on your phone](…)
- [What is Guided View?](…)
```

### 7.5 Search Console & Co.

1. **Google Search Console:** Domain-Property für `panelzoom.com` per DNS-TXT-Eintrag (im netcup-CCP unter DNS). Sie deckt `www.` und `develop.` mit ab. Die alte Subdomain bleibt als eigene Property bestehen, um den Umzug zu beobachten.
2. Sitemap einreichen, `/de/` und `/en/` per URL-Prüfung zur Indexierung anmelden.
3. **Bing Webmaster Tools** (Import aus GSC). Bing ist die Datenbasis für ChatGPT-Suche und Copilot, also **wichtig für GEO**.
4. **IndexNow** (optional): Ping bei neuen Ratgebern, per Deploy-Skript.
5. Nach 2–4 Wochen prüfen: Bericht „Internationale Ausrichtung“ bzw. hreflang-Fehler, Indexierungsstatus, Seiten „Gecrawlt – zurzeit nicht indexiert“.

### 7.6 Performance & Datenschutz

| Ziel (Landing, mobil) | Wert |
|---|---|
| LCP | < 2,0 s |
| INP | < 200 ms |
| CLS | < 0,05 |
| JS auf Landing | nur der Sprachumschalter (< 2 KB) |

- **Bangers-Font selbst hosten** statt über Google Fonts. Schneller, und in DE datenschutzrechtlich sauberer (Urteil LG München I, 2022, zur dynamischen Einbindung von Google Fonts). Gilt auch für die App.
- Bilder als AVIF/WebP mit `width`/`height`, das Hero-Video mit `preload="none"` und Poster-Bild.
- Analytics, falls gewünscht: cookielos (z. B. selbst gehostetes Plausible/Umami) oder ausschließlich Search Console. Das passt zur Botschaft „kein Tracking“; wenn Tracking eingesetzt wird, darf die Landing nicht „kein Tracking“ versprechen.

---

## 8. Priorisierte Roadmap

### Phase 0: Entscheidungen (vor Woche 1)
- [x] Name/Domain festlegen: **PanelZoom / panelzoom.com** (bestellt am 02.10.2026)
- [ ] Markenrecherche „PanelZoom“ (DPMA/EUIPO)
- [x] Landing-Technik: **eigenes Build-Skript** `scripts/build-site.mjs`, kein Astro (4.5)
- [x] Impressum + Datenschutz: **eigene Seiten auf panelzoom.com** (umgesetzt in Phase 2)
- [x] Demo-Comic: kommt **zum Schluss** (Phase 3), Rechte dann klären

### Phase 1: Fundament (Woche 1–3) · *höchste Priorität*
- [ ] `locales.config.mjs` anlegen
- [ ] `scripts/build-site.mjs` + `site/`-Struktur aufsetzen (Layout, Head-Partial, Sitemap-/robots-/.htaccess-Generator, Prüfungen)
- [ ] panelzoom.com im netcup-Webhosting einrichten: Let's-Encrypt-Zertifikat, Subdomain `develop.`, FTP-Zugänge; `scripts/deploy.sh` + `.env.deploy` auf die neuen Ziele umstellen
- [ ] App-Branding auf PanelZoom umstellen (Manifest, `<title>`, Icons)
- [ ] App unter `/app/` bauen (Vite `base`, PWA-Scope, Manifest `id: '/app/'`, Pfade, siehe 4.6 a)
- [ ] `www.panelzoom.com` → 301 → `panelzoom.com` (oder umgekehrt, Hauptsache eine Variante), HTTPS erzwingen
- [ ] `.htaccess`: Root-Redirect, Trailing-Slash-301, `/app` → `/app/`, no-cache für `/app/sw.js`
- [ ] Dev-Build: robots `Disallow` + `X-Robots-Tag: noindex`
- [ ] Bangers-Font selbst hosten
- [ ] **Auf develop.panelzoom.com komplett testen** (Testplan 4.6 c) → dann live
- [ ] Search Console + Bing Webmaster einrichten
- [ ] Alte Subdomain: letztes Update mit Umzugs-Banner (+ optional `#migrate=`), canonical/noindex auf panelzoom.com (4.6 b)
- [ ] Ca. 3 Monate später: 301 + Kill-Switch-SW auf der alten Subdomain

### Phase 2: Landing DE + EN und App-i18n (Woche 2–5, parallel möglich)
- [ ] App-i18n: `useI18n`, `de.json`/`en.json`, Strings extrahieren, Sprachwahl in den Einstellungen, `i18n:check`
- [ ] Landing DE + EN nach Brief (6.1–6.3), Loop-Video, Screenshots
- [ ] Schema (`WebApplication`, `WebSite`, `Person`), OG-Bilder pro Sprache
- [ ] `sitemap.xml` mit hreflang, `robots.txt`, `llms.txt`
- [ ] **Impressum + Datenschutzerklärung** als eigene Seiten (Datenschutz: kein Tracking, lokale Speicherung, Hosting netcup, selbst gehostete Fonts) und im Footer jeder Seite verlinkt
- [ ] Über-Seite (Projektgeschichte: DIN-A5-Comics, eigener Algorithmus, das schafft Vertrauen und Glaubwürdigkeit)
- [ ] Sitemap einreichen, URL-Prüfung

### Phase 3: Content & Sichtbarkeit (Woche 5–12)
- [ ] 3 Ratgeber pro Sprache (siehe Content-Kalender)
- [ ] **Demo-Comic** (zum Schluss): Rechte klären, Button „Mit Beispiel-Comic ausprobieren“ auf der Landing + Import in der App
- [ ] Vergleichsseite DE + Alternativen-Seite EN (comiXology Guided View)
- [ ] **Backlinks & Erwähnungen:**
  - alternativeto.net-Eintrag (rankt selbst für „X alternative“; als Alternative zu Panels, comiXology, Perfect Viewer eintragen)
  - Show HN / Product Hunt (EN)
  - Dev-Artikel „Panel-Erkennung in Vanilla JS ohne OpenCV“ (dev.to EN, eigener Blog DE). Technik-Content zieht Links an und stärkt E-E-A-T
  - GitHub-README → Landing verlinken
  - Comic-Communities, wo es die Regeln erlauben (Reddit r/comicbooks / r/digitalcomics, Comicforum.de)
  - Indie-Zeichner und Kleinverlage, die PDFs verkaufen, ansprechen: „Lies das PDF am Handy mit …“
  - PWA-Verzeichnisse
- [ ] GSC nach 4–6 Wochen auswerten: Für welche Suchanfragen gibt es Impressionen? Seiten an echte Begriffe anpassen.

### Phase 4: Produkt-Hebel und erste neue Sprache (Monat 4–6)
- [ ] **CBZ-Support** (ZIP mit Bildern, leicht umsetzbar z. B. mit `fflate`). Erschließt die Cluster „cbz reader“ und „cbz datei öffnen“ und die meisten DRM-freien Käufe. CBR (RAR) ist aufwendiger (WASM-Unrar), das kommt danach.
- [ ] Landing-Seiten `/de/cbz-reader/`, `/en/cbz-reader/`, Format-Ratgeber aktualisieren
- [ ] **Entscheidung über die erste weitere Sprache** (Kriterien unten)
- [ ] Ratgeber Nr. 4–6 pro Sprache

### Phase 5: Skalieren (Monat 6–12)
- [ ] Weitere Sprachen nach Kriterien
- [ ] **Leserichtung rechts → links** → Manga-Cluster (sehr hohes Volumen, besonders ES/PT-BR/FR)
- [ ] Ratgeber aktualisieren (dateModified), Vergleichsdaten jährlich prüfen
- [ ] KI-Sichtbarkeit testen: In ChatGPT, Perplexity und Google AI Overviews die Kernfragen stellen („how to read pdf comics panel by panel on android“) und prüfen, ob die Seite zitiert wird

### Wann sich weitere Sprachen lohnen

**Eine neue Sprache starten, wenn alle Bedingungen erfüllt sind:**
1. DE und EN sind indexiert und haben stabile Impressionen (GSC, ca. 8–12 Wochen nach dem Launch).
2. Die App-i18n läuft ohne fest eingebaute Strings (`i18n:check` grün). Eine neue Sprache bedeutet dann nur noch Übersetzungsarbeit.
3. Es gibt **Nachfrage-Signale:** GSC zeigt Impressionen aus FR/ES/BR-Ländern für EN-Seiten, oder ein spürbarer Anteil der App-Nutzer hat `navigator.language` fr/es/pt.
4. Jemand mit muttersprachlichem Niveau kann die Texte prüfen. Unredigierte Maschinenübersetzung ist für die Landing zu riskant; für die App-UI ist sie mit Review in Ordnung.

**Empfohlene Reihenfolge, bei Bedarf anhand der GSC-Daten anpassen:**
1. **FR**: Frankreich und Belgien sind die größten BD-Märkte Europas; „lire des BD sur smartphone“ und „lecteur BD PDF“ sind eigene Suchräume mit wenig Web-App-Konkurrenz.
2. **ES**: große Reichweite (Spanien + Lateinamerika), stark manga-getrieben, profitiert also vom RTL-Feature.
3. **PT-BR**: großer Comic- und Manga-Markt in Brasilien; als `pt-BR` unter `/pt-br/`.

Pro neuer Sprache: Landing + 3 Ratgeber + App-UI zum Start. Die Keywords **pro Sprache neu recherchieren** (z. B. FR „BD“ statt „comic“, ES „cómics“/„historietas“, PT-BR „HQ“/„quadrinhos“).

---

## 9. Content-Kalender (erste 12 Wochen nach dem Launch der Landing)

| Woche | DE | EN |
|---|---|---|
| L+0 | Landing `/de/`, Über-Seite | Landing `/en/`, About |
| L+1 | Ratgeber: Comics auf dem Handy lesen | Guide: How to read comics on your phone |
| L+2 | Ratgeber: Web-App installieren (iPhone/Android) | Guide: What is Guided View? |
| L+4 | Ratgeber: Was ist Guided View? | Alternative: comiXology Guided View for your own files |
| L+6 | Vergleich: Comic-Reader-Apps | Guide: Read Humble Bundle / Kickstarter comics on your phone |
| L+8 | Ratgeber: CBR/CBZ/PDF | Guide: CBZ vs CBR vs PDF |
| L+10 | Dev-Artikel: Panel-Erkennung (Blog) | Dev article: Panel detection without OpenCV (dev.to) |
| L+12 | Auswertung GSC, Updates | Comparison: Best comic reader apps (erst wenn Autorität da ist) |

---

## 10. KPIs

Realistische Ziele für eine neue Seite ohne bestehende Autorität:

| Kennzahl | Ausgangslage | 3 Monate | 6 Monate | 12 Monate |
|---|---|---|---|---|
| Indexierte Seiten | 0–1 | 10–14 | 18–25 | 30+ (inkl. neuer Sprache) |
| Impressionen/Monat (GSC) | ~0 | 1–3 Tsd. | 5–15 Tsd. | 20–50 Tsd. |
| Organische Klicks/Monat | ~0 | 30–100 | 200–600 | 1.000+ |
| Top-10-Rankings (Nischen-Keywords) | 0 | 3–5 (DE-Ratgeber zuerst) | 10–20 | 30+ |
| Referring Domains | ? | 5–10 | 15–25 | 30+ |
| Core Web Vitals (Landing) | – | alle „gut“ | alle „gut“ | alle „gut“ |
| App-Starts aus Landing-CTA | – | messen | +50 % vs. M3 | – |
| KI-Zitate (manuelle Stichprobe, 10 Kernfragen) | 0 | 0–1 | 2–3 | 5+ |

Erwartung: Deutsche Long-Tail-Ratgeber und „guided view“-Begriffe ranken zuerst. Kurze kommerzielle Begriffe („best comic reader app“) frühestens nach 6–12 Monaten.

---

## 11. Risiken

| Risiko | Gegenmaßnahme |
|---|---|
| Bestandsnutzer verlieren beim Domainwechsel ihre lokale Bibliothek | alte Subdomain bleibt ca. 3 Monate mit Umzugs-Banner online, Lesestand per `#migrate=` übertragbar, erst danach 301 + Kill-Switch-SW (4.6 b) |
| Markenkonflikt „PanelZoom“ | vor dem Launch DPMA/EUIPO-Recherche |
| develop.panelzoom.com wird indexiert (Duplicate Content) | robots `Disallow` + `X-Robots-Tag: noindex` im Dev-Build |
| Root-Redirect falsch (Googlebot sieht nur EN, DE wird nicht gefunden) | hreflang auf allen Seiten + Sitemap-Alternates, DE per URL-Prüfung einreichen |
| nginx cacht die 302-Antwort sprachunabhängig | `Vary`/`no-store` auf `/`, auf develop.panelzoom.com mit unterschiedlichem `Accept-Language` testen |
| Panel-Erkennung enttäuscht bei randlosen Comics → Absprung | ehrliche FAQ, Demo-Comic mit klaren Gutters, Pinch-Fallback betonen |
| Format-Lücke (nur PDF) begrenzt die Reichweite | CBZ in Phase 4 priorisieren |
| Übersetzungsqualität neuer Sprachen | Muttersprachlicher Review als Startbedingung |
| Rechtliches (Impressum, Fonts, Tracking) | Impressum/Datenschutz verlinken, Fonts selbst hosten, cookielose oder keine Analytics |

---

## Quellen der Wettbewerbsrecherche

- [Panels – Comic Reader (App Store)](https://apps.apple.com/app/panels-comic-reader/id1236567663) · [ifun.de: Panels für den Mac](https://www.ifun.de/comic-reader-panels-jetzt-auch-fuer-den-mac-verfuegbar-254413/)
- [Smart Comic Reader (App Store)](https://apps.apple.com/us/app/app/id1511175212)
- [Tom's Guide: Best comic readers for mobile](https://tomsguide.com/round-up/best-comic-reader-mobile) · [GamesRadar: Best digital comic readers](https://gamesradar.com/best-comic-book-readers)
- [YACReader: Guided reading](https://yacreader.com/60-guided-reading-has-landed)
- [Comic CBR CBZ Viewer (Google Workspace Marketplace)](https://workspace.google.com/marketplace/app/comic_cbr_cbz_viewer/324255369131)
- [Guttr (PWA, CBZ/CBR)](https://gitblind.noratr.app/alejandroSuch/guttr) · [Web Comic Reader](https://root.packagist.org/packages/mikespub/web-comic-reader) · [Panelizer (archiviert)](https://github.com/hummat/panelizer)
- [netzwelt.de: ComicScreen](https://www.netzwelt.de/download/26675-comicscreenpdf-comicreader.html) · [Comics (App Store DE)](https://apps.apple.com/de/app/comics/id957475715)
- [Android Authority: Bubble Zoom](https://www.androidauthority.com/bubble-zoom-read-phone-comics-more-easily-705038/)
