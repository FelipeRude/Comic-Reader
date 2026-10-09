// JSON-LD für die Landing Pages (WebSite, WebPage, WebApplication, Person), aus denselben
// Texten wie die sichtbare Seite (landing.json), damit Markup und Inhalt nicht auseinanderlaufen.
// Bewusst ohne Organization (es gibt keine Firma) und ohne FAQPage/Bewertungen
// (docs/audits/2026-10-09-prelaunch/findings/schema.md).

/** <script type="application/ld+json"> für eine Landing Page, sonst ''. */
export function renderSchema(page, ctx) {
  if (page.type !== 'landing') return ''
  const { origin, name, appPath } = ctx.site
  const { meta, about, schema } = page.data
  const lang = page.locale.hreflang
  const url = origin + page.path
  const ids = {
    website: `${origin}/#website`,
    person: `${origin}/#person-felipe-rude`,
    webpage: `${url}#webpage`,
    app: `${origin}/#webapp-${page.locale.code}`,
  }
  const graph = [
    {
      '@type': 'WebSite',
      '@id': ids.website,
      url: `${origin}/`,
      name,
      inLanguage: ctx.liveLocales.map((l) => l.hreflang),
      publisher: { '@id': ids.person },
    },
    {
      '@type': 'WebPage',
      '@id': ids.webpage,
      url,
      name: meta.title,
      description: meta.description,
      inLanguage: lang,
      isPartOf: { '@id': ids.website },
      about: { '@id': ids.app },
      mainEntity: { '@id': ids.app },
      ...(page.updated && { dateModified: page.updated }),
    },
    {
      '@type': 'WebApplication',
      '@id': ids.app,
      name,
      url: origin + appPath,
      mainEntityOfPage: { '@id': ids.webpage },
      description: meta.description,
      inLanguage: lang,
      applicationCategory: 'MultimediaApplication',
      operatingSystem: 'Any (Browser), iOS, Android',
      browserRequirements: 'Requires JavaScript and a current browser (Safari, Chrome)',
      isAccessibleForFree: true,
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'EUR' },
      ...(schema?.featureList && { featureList: schema.featureList }),
      author: { '@id': ids.person },
      creator: { '@id': ids.person },
    },
    about && {
      '@type': 'Person',
      '@id': ids.person,
      name: about.name,
      jobTitle: about.role,
      ...(about.photo && {
        image: { '@type': 'ImageObject', url: origin + about.photo, caption: about.photoAlt },
      }),
      url,
    },
  ].filter(Boolean)
  // "<" escapen, damit Texte das <script> nicht beenden können
  const json = JSON.stringify({ '@context': 'https://schema.org', '@graph': graph }).replace(/</g, '\\u003c')
  return `<script type="application/ld+json">${json}</script>`
}
