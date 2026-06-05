# Masterplan: Offline PWA Comic Reader (Vue 3 / Smart-Zoom)

## Stack-Entscheidungen

| Bereich | Technologie | Begründung |
|---|---|---|
| Build-Tool | **Vite** | Schnell, Vue-Plugin, PWA-Plugin |
| Framework | **Vue 3** + Composition API | Reaktivität, Komponenten, kein Overhead durch Class-API |
| Styling | **SCSS** (Custom, kein UI-Framework) | Vollständige Kontrolle, CSS Custom Properties für Theming |
| PDF-Rendering | **PDF.js** (Mozilla) | De-facto-Standard, 100 % client-seitig |
| Storage | **idb** (Jake Archibald) | Dünner Promise-Wrapper über IndexedDB |
| PWA | **vite-plugin-pwa** (Workbox) | Automatischer Service Worker + Manifest |
| Panel-Erkennung | **Canvas API + Vanilla-JS-Algorithmus** | Gutter-Analyse (Projection-Profile) auf ImageData |
| Smart-Zoom | **CSS transform** (translate + scale) | Kein Bild-Zerschneiden, reiner Viewport-Shift |

---

## Phase 1: Projekt-Reset & Vue 3 Setup

> Ziel: Sauberes Vue 3 Projekt auf der bestehenden PWA-Infrastruktur. SCSS und Theming laufen, bevor App-Logik entsteht.

- [x] **1.1** `src/` leeren, `package.json` auf Vue 3 + SCSS + idb aktualisieren
- [x] **1.2** `vite.config.js` erweitern: `@vitejs/plugin-vue` hinzufügen (PWA-Config bleibt)
- [x] **1.3** `index.html` anpassen: Vue-Mount-Point `<div id="app">`
- [x] **1.4** `src/main.js`: `createApp(App).mount('#app')`
- [x] **1.5** `src/App.vue`: Shell-Komponente, lädt zunächst nur `<DashboardView />`
- [x] **1.6** SCSS-Grundgerüst: `_variables.scss` (CSS Custom Properties Light/Dark), `_reset.scss`, `main.scss`
- [ ] **1.7** Verifyout: App lädt, "Comic Reader" sichtbar, Dark Mode greift automatisch ← **du bist dran**

---

## Phase 2: IndexedDB Schema & Storage Layer

> Ziel: Ein typsicheres Storage-Modul das alle CRUD-Operationen kapselt, bevor irgendein UI darauf zugreift.

- [x] **2.1** `idb` installieren und DB-Schema definieren (`src/storage/db.js`):
  - DB-Name: `comic-reader-db`, Version: `1`
  - Object Store `comics`: `{ id (auto), title, blob, coverDataUrl, pageCount, addedAt }`
  - Object Store `panels`: `{ id (auto), comicId, pageIndex, panels: [{x,y,w,h}] }` — Index auf `comicId`
  - Object Store `progress`: `{ comicId (keyPath), pageIndex, panelIndex, updatedAt }`
- [x] **2.2** `src/storage/comics.js`: `addComic(file)`, `getAllComics()`, `getComic(id)`, `deleteComic(id)`
- [x] **2.3** `src/storage/panels.js`: `savePanels(comicId, pageIndex, panels)`, `getPanels(comicId, pageIndex)`, `deletePanelsForComic(comicId)` (+ `getAllPanelsForComic`)
- [x] **2.4** `src/storage/progress.js`: `saveProgress(comicId, pageIndex, panelIndex)`, `getProgress(comicId)`, `deleteProgress(comicId)`
- [x] **2.5** Zentraler `QuotaExceededError`-Handler (`src/storage/errors.js`): `QuotaError` + `wrapQuota`, genutzt von `addComic` und `savePanels`
- [x] **2.6** Verifyout: In DevTools → Application → IndexedDB die Stores sichtbar ✓

---

## Phase 3: Dashboard & Bibliothek

> Ziel: Vollständige Comic-Verwaltung — Import, Anzeige mit Cover, Löschen, Einstellungen.

- [x] **3.1** `src/views/DashboardView.vue`: Grid-Layout der Comic-Karten + "Neuen Comic hinzufügen"-Button
- [x] **3.2** `src/components/ComicCard.vue`: Cover-Thumbnail, Titel, Mülleimer-Icon, Lesefortschritt-Badge
- [x] **3.3** Import-Flow (`src/pdf-loader.js` + `src/composables/useComicImport.js`):
  - `<input type="file" accept=".pdf">` → `addComic(file)` → PDF-Blob in IndexedDB
  - Cover generieren: Seite 1 auf kleinem Canvas rendern (max. 300px Breite) → als `dataURL` in `comics`-Store
  - `QuotaError` abfangen → Modal anzeigen
- [x] **3.4** Löschen: Confirm-Dialog → `deleteComic` + `deletePanelsForComic` + `deleteProgress`
- [x] **3.5** `src/components/SettingsModal.vue`: Zahnrad-Icon im Dashboard-Header → modales Overlay
  - Toggle: "Weiche Kamerafahrt" / "Instantan" (`localStorage`, via `useSettings.js`)
- [x] **3.6** Leerer Zustand: Wenn keine Comics → Onboarding-Hinweis ("Noch keine Comics. Füge dein erstes hinzu.")
- [x] **3.7** Verifyout: Comic importieren, Cover erscheint im Grid, Löschen entfernt alles ✓ (auf iOS Safari getestet)

---

## Phase 4: Pre-Processing & Panel-Erkennung

> Ziel: Nach dem Import (oder beim ersten Öffnen) werden alle Seiten analysiert und Panel-Koordinaten in der DB gespeichert.

### Algorithmus (Projection-Profile / Gutter-Analyse)

- [x] **4.1** `src/workers/detector.worker.js` (Web Worker):
  - Empfängt `{ imageData, width, height, pageIndex }` via `postMessage`
  - `isWhiteRow(data, width, y, threshold=240)`: Durchschnitt der RGB-Werte aller Pixel in Zeile y
  - `isWhiteColumn(data, width, y0, y1, x, threshold=240)`: Analog für Spalte x, nur im Y-Bereich y0–y1
  - `findRowStrips(imageData)`: Horizontale Gutter → liefert Array von `{yStart, yEnd}` der Comic-Zeilen
  - `findPanelsInStrip(imageData, yStart, yEnd)`: Vertikale Gutter pro Strip → liefert `[{x,y,w,h}]`
  - `detectPanels(imageData)`: Kombination → sortiert nach (y, x) → gefiltert nach Mindestgröße (>3% Bildbreite)
  - Gibt `{ pageIndex, panels }` zurück
- [x] **4.2** `src/composables/usePreprocessor.js`:
  - Öffnet PDF via `pdf-loader.js`
  - Iteriert Seiten sequenziell (for-Schleife, kein Promise.all!)
  - Pro Seite: rendern → `ImageData` an Worker → auf Ergebnis warten → in DB speichern → Canvas-Referenz `= null`
  - Emittiert Fortschritt: `{ current, total }` als reaktiver State
- [x] **4.3** `src/components/ProcessingOverlay.vue`: Blockierendes Overlay während Analyse
  - „Analysiere Seite 12 von 240..."
  - Fortschrittsbalken
- [x] **4.4** `src/components/ProcessingSuccessModal.vue`: Nach Abschluss
  - „Erfolgreich! X Seiten und Y Panels gefunden" → Klick schließt Modal und öffnet Reader
- [x] **4.5** Trigger-Logik: Comic-Karte klicken → prüfen ob `panels` für `comicId` in DB vorhanden → falls ja: direkt Reader öffnen; falls nein: Pre-Processing starten
- [x] **4.6** Verifyout: Test-Comic importieren, Overlay zählt Seiten hoch, Erfolgsmeldung zeigt korrekte Zahlen, DB enthält Panel-Koordinaten ✓ (auf iOS Safari getestet)

---

## Phase 5: Smart-Zoom Reader

> Ziel: Bildschirmfüllende Panel-Navigation via CSS-Transform — kein Zerschneiden, nur Viewport-Verschiebung.

### Smart-Zoom Mathematik
Für ein Panel `{x, y, w, h}` auf einem Canvas der Größe `(cW, cH)`, angezeigt in einem Viewport `(vW, vH)`:
```
scale     = min(vW / w, vH / h)
translateX = (vW/2) - (x + w/2) * scale
translateY = (vH/2) - (y + h/2) * scale
transform  = translate(translateX px, translateY px) scale(scale)
```

- [x] **5.1** `src/views/ReaderView.vue`: Empfängt `comicId` als Route-Parameter
- [x] **5.2** Canvas-Container: `overflow: hidden`, `width: 100vw`, `height: 100vh`
  - Innerer `<canvas>`: bekommt `transform` via computed Property
- [x] **5.3** `src/composables/useReader.js`:
  - Lädt `progress` aus DB → setzt `currentPage` + `currentPanelIndex`
  - `loadPage(pageIndex)`: PDF-Seite rendern, Canvas-Referenz halten
  - `currentPanel` computed: `panels[currentPanelIndex]`
  - `zoomTransform` computed: Berechnet translate + scale aus Panel-Koordinaten
  - `nextPanel()` / `prevPanel()`: Index-Navigation mit Seiten-Überlauf
  - Automatisches `saveProgress()` bei jedem Panel-Wechsel
- [x] **5.4** CSS-Transition: Wenn Setting "Weiche Kamerafahrt" → `transition: transform 400ms ease-in-out`; wenn "Instantan" → keine Transition
- [x] **5.5** Navigation:
  - Touch: `touchstart`/`touchend` → Swipe (>50px horizontal) oder Tap (linke/rechte Hälfte)
  - Keyboard: `ArrowLeft` / `ArrowRight` (für Desktop-Testing)
  - Dezente Pfeil-Overlays (halbtransparent, auto-hide nach 3s)
- [x] **5.6** Seitenübergang: Letztes Panel einer Seite → nächste Seite im Hintergrund rendern, dann Sprung auf erstes Panel
- [x] **5.7** Pinch-to-Zoom Fallback: `touch-action: none` auf Canvas-Container; eigener `pointermove`-Handler für 2-Finger-Zoom (scale + translate) — beim nächsten `nextPanel()` wird Smart-Zoom wieder übernommen
- [x] **5.8** Panel-Counter HUD: `„Panel 3/12 – Seite 1/24"` — dezentes Overlay, auto-hide nach 2s
- [x] **5.9** Zurück-Button: Schließt Reader, kehrt zum Dashboard zurück
- [x] **5.10** Verifyout: Comic öffnen, alle Panels navigieren, Seitenübergang, Transition-Einstellung umschalten ✓ (auf iOS Safari getestet)

---

## Phase 6: PWA Polish & Finaler Check

> Ziel: App ist vollständig offline-fähig, auf iOS + Android getestet und installierbar.

- [x] **6.1** Service Worker: Alle App-Assets + PDF.js Worker in Workbox-Precache (verifiziert: `pdf.worker.min.mjs`, `detector.worker`, App-JS/CSS, Icons, `index.html` im Precache)
- [x] **6.2** iOS-Meta-Tags prüfen: `apple-mobile-web-app-capable`, Status-Bar-Style, `apple-touch-icon` (+ `mobile-web-app-capable`, `apple-mobile-web-app-title`, `description`)
- [x] **6.3** Android Install-Prompt: `beforeinstallprompt` abfangen → eigener "Installieren"-Button im Dashboard (`useInstallPrompt.js`)
- [ ] **6.4** Offline-Test: App nach Installation ohne Netz öffnen → alles muss funktionieren ← **du bist dran (Gerät)**
- [ ] **6.5** Lighthouse-Audit: PWA ≥ 90, Performance ≥ 70 (Mobile-Simulation) ← **du bist dran (Chrome DevTools)**
- [ ] **6.6** Finaler Test auf echtem Gerät: Install-Flow, Offline, Navigation, Progress-Restore ← **du bist dran (Gerät)**

---

## Dateistruktur (Ziel)

```
src/
├── main.js
├── App.vue
├── styles/
│   ├── _variables.scss
│   ├── _reset.scss
│   └── main.scss
├── views/
│   ├── DashboardView.vue
│   └── ReaderView.vue
├── components/
│   ├── ComicCard.vue
│   ├── SettingsModal.vue
│   ├── ProcessingOverlay.vue
│   └── ProcessingSuccessModal.vue
├── composables/
│   ├── usePreprocessor.js
│   └── useReader.js
├── storage/
│   ├── db.js
│   ├── comics.js
│   ├── panels.js
│   └── progress.js
├── workers/
│   └── detector.worker.js
└── pdf-loader.js
```

---

## Reihenfolge & Abhängigkeiten

```
Phase 1 (Vue Setup)
    └── Phase 2 (Storage Layer)
            └── Phase 3 (Dashboard)
                    └── Phase 4 (Pre-Processing)
                            └── Phase 5 (Smart-Zoom Reader)
                                    └── Phase 6 (PWA Polish)
```

---

**Status: Warte auf Go für Phase 1.**
