# Product Requirements Document (PRD): Offline PWA Comic Reader (Final Version)

## 1. Projektübersicht & Ziel

Das Ziel dieses Projekts ist die Entwicklung eines mobilen, offline-fähigen Comic-Readers als Progressive Web App (PWA).

**Das Problem:** Das Lesen von Comics (speziell im DIN-A5-Format) als PDF auf dem Smartphone ist frustrierend. Es erfordert ständiges Zoomen und Scrollen. Zudem geht beim Schließen des Readers der aktuelle Lesestand verloren.

**Die Lösung:** Eine Web-App, die PDF-Dateien lokal importiert, die einzelnen Comic-Panels automatisch im Voraus erkennt und beim Lesen intelligent von Panel zu Panel zoomt (Smart-Zoom). Der Lesestand und die Comics werden dauerhaft lokal gespeichert.

---

## 2. Technische Architektur & Rahmenbedingungen

- **Plattform:** Progressive Web App (PWA). Vollständig installierbar auf iOS (Safari → "Zum Home-Bildschirm") und Android (Chrome).
- **Offline-Fähigkeit:** 100 % offline-fähig nach dem ersten Laden. Alle Ressourcen werden über einen Service Worker gecacht.
- **Backend:** Absolut KEIN Backend. Die gesamte Logik, Bildanalyse, Datenverarbeitung und Speicherung erfolgt rein Client-seitig im Browser des Nutzers.
- **Datenspeicherung:** Nutzung von `IndexedDB` zur dauerhaften lokalen Ablage von PDF-Dateien, Panel-Koordinaten und Leseständen.
- **Erlaubte Bibliotheken:** Zur Vermeidung der nativen Callback-Hölle darf der Agent leichtgewichtige Wrapper wie `idb` (von Jake Archibald) oder `localForage` verwenden.
- **Framework & Tooling:** Vue.js 3 mit der Composition API und Vite als Build-Tool.
- **Custom CSS/SCSS:** Es dürfen explizit KEINE UI-Bibliotheken (wie Vuetify, Tailwind, Bootstrap etc.) verwendet werden. Das Design muss vollständig via Custom CSS/SCSS responsiv für Mobilgeräte aufgebaut werden.
- **Design & Theming:**
  - Die App unterstützt standardmäßig Light Mode und Dark Mode.
  - Die App muss sich standardmäßig nach den Systemeinstellungen des Nutzers richten (`@media (prefers-color-scheme: dark)`).
- **PDF-Verarbeitung:** Nutzung von `PDF.js` (Mozilla) zum Parsen und Rendern der PDF-Seiten auf HTML5 Canvas-Elemente.

---

## 3. Kernfunktionen (MVP)

### 3.1. Dashboard & Lokale Bibliothek

- **Startseite:** Beim App-Start landet der Nutzer auf dem Dashboard, das alle bereits importierten Comics mit Cover (erste PDF-Seite als Thumbnail) und Titel auflistet.
- **Import-Funktion:** Über einen auffälligen Button ("Neuen Comic hinzufügen") öffnet sich der native Datei-Picker. Ausgewählte PDF-Dateien (auch große Dateien mit z. B. 240 MB) werden als Binärdaten (Blob / ArrayBuffer) direkt in die `IndexedDB` kopiert.
- **Comic-Löschfunktion (Storage Management):** Da der Speicherplatz im Browser begrenzt ist, muss jedes Comic auf dem Dashboard eine Option zum unwiderruflichen Löschen besitzen (z. B. ein Mülleimer-Icon). Beim Löschen werden das PDF, die extrahierten Panels und der Lesestand vollständig aus der `IndexedDB` entfernt.
- **Einstellungs-Menü (Zahnrad):** Das Dashboard-Header besitzt ein Zahnrad-Icon. Beim Klick öffnet sich ein modales Overlay für globale Einstellungen:
  - **Animations-Typ:** Umschalter zwischen "Weiche Kamerafahrt" (CSS-Transition beim Panel-Wechsel) und "Instantan" (direkter, harter Schnitt).

### 3.2. Pre-Processing & Panel-Erkennung (Algorithmus)

Sobald ein Comic importiert oder das erste Mal geöffnet wird, startet eine einmalige, automatische Hintergrund-Analyse.

- **Ladebildschirm & Fortschritt:** Der Nutzer sieht ein blockierendes Lade-Overlay mit Echtzeit-Statistiken (z. B. „Analysiere Seite 12 von 240...").
- **Erfolgsmeldung:** Nach Abschluss erscheint eine Zusammenfassung (z. B. „Erfolgreich! 240 Seiten und 1.150 Panels gefunden"), die per Klick geschlossen wird.
- **Der Panel-Erkennungs-Algorithmus:**
  1. Kein Einsatz schwerer Bibliotheken (wie OpenCV.js). Performanter Vanilla-JS-Algorithmus auf Basis von `ctx.getImageData`.
  2. Gutter-Erkennung (Weißraum-Analyse): Scan horizontaler und vertikaler Pixelreihen mit Helligkeits-Schwellenwert zur Isolierung von Bounding Boxes.
  3. Sortierung der Panels pro Seite: strikt westliche Leserichtung (Links → Rechts, Oben → Unten).
- **RAM- & Performance-Vorgabe (Chunking):** Analyse strikt sequenziell (Seite für Seite). Nach der Analyse einer Seite müssen das Canvas und die Objektreferenzen gelöscht und die Garbage Collection begünstigt werden, bevor die nächste Seite geladen wird. Die berechneten Koordinaten werden sofort in der `IndexedDB` persistiert.

### 3.3. Smart-Zoom Lese-Modus (Viewport)

- **Kein Bild-Zerschneiden:** Die App rendert stets die vollständige PDF-Seite im Hintergrund über `PDF.js`.
- **Sichtbereich steuern:** Die App nutzt die in der DB gespeicherten Bounding-Box-Koordinaten des aktuellen Panels und verschiebt/zoomt den CSS-Viewport (mittels `transform: translate(...) scale(...)` auf dem Container), sodass das aktuelle Panel perfekt zentriert und bildschirmfüllend sichtbar ist.
- **Navigation:**
  - Touch-Gesten: Tippen auf die rechte/linke Bildschirmhälfte oder Wischen.
  - Optionale, dezente Pfeil-Overlays.
- **Seitenübergang:** Befindet sich der Nutzer auf dem letzten Panel einer Seite und drückt "Weiter", rendert die App im Hintergrund die nächste Seite und springt automatisch auf das erste Panel der Folgeseite.
- **Manueller Fallback (Pinch-to-Zoom):** Der Nutzer kann jederzeit mit zwei Fingern manuell zoomen oder den Ausschnitt verschieben. Sobald er wieder "Weiter" drückt, greift wieder der automatische Smart-Zoom.

### 3.4. Fortschrittsspeicherung & Error Handling

- **Automatisches Tracking:** Die App speichert bei jeder Navigation Comic-ID, aktuelle Seitenzahl und Panel-Index in der `IndexedDB`.
- **State-Wiederherstellung:** Startet der Nutzer ein Comic vom Dashboard, springt die App sofort zu genau dem Panel, bei dem der Nutzer aufgehört hat.
- **Robustes Error Handling (Quota Exceeded):** Wenn der Speicherplatz voll ist, darf die App nicht abstürzen. Es muss ein abfangendes Error-Handling für den `QuotaExceededError` implementiert werden. Dem Nutzer wird ein klares Modal angezeigt: *„Nicht genügend Speicherplatz im Browser verfügbar. Bitte lösche alte Comics vom Dashboard, um Platz zu schaffen."*

### 3.5. PWA-Spezifikationen & Assets

- Gültige `manifest.json` und funktionaler Service Worker (via `vite-plugin-pwa`).
- Platzhalter-Icons (192×192 und 512×512 Pixel) im Manifest referenziert.

---

## 4. Out of Scope (Für spätere Versionen explizit ignorieren)

- Intelligente Textblasen-Vergrößerung (OCR / Text-Erkennung).
- Cloud-Synchronisation oder Accounts.
- Native App-Wrapper (wie Capacitor oder Cordova).
- Filter- oder Tagging-Systeme für die Bibliothek.
