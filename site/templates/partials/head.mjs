import { esc } from '../util.mjs'

/**
 * <head>-Inhalt jeder Seite: Title, Description, canonical, hreflang (inkl. x-default),
 * Open Graph. Die Alternates kommen fertig aus dem Build (page.alternates), damit
 * Head und Sitemap aus derselben Quelle stammen.
 */
export function renderHead(page, ctx) {
  const { site } = ctx
  const url = site.origin + page.path
  const ogImage = page.ogImage && site.origin + page.ogImage
  const otherOgLocales = page.alternates
    .filter((a) => a.locale && a.locale.code !== page.locale.code)
    .map((a) => a.locale.ogLocale)

  return [
    '<meta charset="utf-8">',
    '<meta name="viewport" content="width=device-width, initial-scale=1">',
    `<title>${esc(page.title)}</title>`,
    `<meta name="description" content="${esc(page.description)}">`,
    ctx.isDev ? '<meta name="robots" content="noindex, nofollow">' : page.noindex ? '<meta name="robots" content="noindex, follow">' : '',
    `<link rel="canonical" href="${esc(url)}">`,
    ...page.alternates.map((a) => `<link rel="alternate" hreflang="${esc(a.hreflang)}" href="${esc(a.href)}">`),
    `<meta property="og:type" content="${page.type === 'article' ? 'article' : 'website'}">`,
    `<meta property="og:site_name" content="${esc(site.name)}">`,
    `<meta property="og:title" content="${esc(page.ogTitle || page.title)}">`,
    `<meta property="og:description" content="${esc(page.ogDescription || page.description)}">`,
    `<meta property="og:url" content="${esc(url)}">`,
    `<meta property="og:locale" content="${esc(page.locale.ogLocale)}">`,
    ...otherOgLocales.map((l) => `<meta property="og:locale:alternate" content="${esc(l)}">`),
    ...(ogImage
      ? [
          `<meta property="og:image" content="${esc(ogImage)}">`,
          '<meta property="og:image:width" content="1200">',
          '<meta property="og:image:height" content="630">',
          `<meta property="og:image:alt" content="${esc(page.ogImageAlt || page.ogTitle || page.title)}">`,
          '<meta name="twitter:card" content="summary_large_image">',
        ]
      : ['<meta name="twitter:card" content="summary">']),
    `<meta name="theme-color" content="${esc(site.themeColor)}">`,
    '<link rel="icon" href="/favicon.ico" sizes="32x32">',
    '<link rel="icon" type="image/svg+xml" href="/favicon.svg">',
    '<link rel="apple-touch-icon" href="/apple-touch-icon.png">',
    '<link rel="preload" href="/fonts/bangers-latin-400-normal.woff2" as="font" type="font/woff2" crossorigin>',
    `<link rel="stylesheet" href="${esc(ctx.cssHref)}">`,
  ].filter(Boolean).join('\n    ')
}
