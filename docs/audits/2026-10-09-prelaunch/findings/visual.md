# Visual and mobile check: develop.panelzoom.com/de/ and /en/ (2026-10-09)

Score: 86/100

Screenshots (desktop 1920, laptop, tablet, mobile 375): screenshots/de/ and screenshots/en/.
Method: capture_screenshot.py (all viewports) and render_page.py (auto, a11y tree). The plugin runner only allows bundled scripts, so no custom DOM measurement was run. Tap-target sizes and horizontal scroll are judged from screenshots only.

## Above the fold
- H1 is visible without scrolling on desktop and mobile in both languages ("PDF Comics lesen, Panel fuer Panel" / "Read PDF comics, panel by panel").
- The primary CTA ("Comic oeffnen & lesen" / "Open comic & start reading") appears twice above the fold, in the header and under the H1. Contrast is strong (red on dark).
- The hero image (phone with panels) loads and renders correctly. No layout shift was visible.
- The USP strip (Kein Account / Offline / Kostenlos) is visible right after the hero on mobile.

## Mobile (375x812)
- The header CTA is large (about 45 px or taller) and the hero CTA is clearly above 48 px, so tap targets look fine.
- No horizontal overflow is visible. The USP strip is a marquee on desktop and a static three-column row on mobile.
- Body text is readable at about 16 px or more.
- The navigation is a single header CTA with no hamburger, which fits a one-page landing.

## Issues
1. Medium: on desktop (1920 and 1366) the hero is mostly empty dark space. The H1 and CTA sit low and right, around y=600-780 of 1080, and the phone is left of centre and vertically offset from the text. The composition feels unbalanced. The CTA is still in view, but the H1 is about 55% down the viewport.
2. Medium: on mobile the hero places the H1 at about y=450-520 CSS px, after roughly 150 px of empty dark space above the phone. The H1 is right-aligned and the CTA is a different width in DE and EN. Tighten the top padding so the H1 sits higher.
3. Low (EN mobile): the header CTA wraps to two lines ("Open comic & start reading") and the "Comic-Reader" tagline wraps ("Comic- / Reader"). The header grows taller than in DE. Suggest a shorter label such as "Open app" in the header, or hide the tagline below 400 px.
4. Low: the desktop marquee clips text at the viewport edges ("OFFL..."). This is intended, but check that it respects prefers-reduced-motion.
5. Info: the page is noindex (intended). The canonical and hreflang tags point to panelzoom.com (the production domain), which is expected for staging.

## Not verified
- Exact touch-target pixel sizes, horizontal scroll, CLS and the a11y-tree output beyond the skip-link and header structure (the plugin runner blocked custom scripts).
