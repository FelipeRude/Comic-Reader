// Feste Angaben zur Website, von scripts/build-site.mjs und den Templates genutzt.
export const SITE = {
  name: 'PanelZoom',
  origin: 'https://panelzoom.com', // kanonische Variante: HTTPS, ohne www
  host: 'panelzoom.com',
  appPath: '/app/',
  themeColor: '#FFFEF0',
  // IndexNow (Bing, Yandex …): Schlüsseldatei /<key>.txt im Live-Build, Ping in scripts/deploy.sh.
  // Der Schlüssel ist absichtlich öffentlich, er belegt nur, dass die Domain uns gehört.
  indexNowKey: 'f6e777e205aafd56b2af667e09b5a5c2',
}
