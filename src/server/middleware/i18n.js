
'use strict';

const i18n = require('i18next');
const i18nMiddleware = require('i18next-express-middleware');
const i18nFsBackend = require('i18next-node-fs-backend');
const en = require('../../i18n/en/translation');
const zh = require('../../i18n/zh/translation');

i18n
  .use(i18nMiddleware.LanguageDetector)
  .use(i18nFsBackend)
  .init({
    preload: ['en', 'zh'],
    fallbackLng: 'zh',
    returnObjects: true,
    resources: {
      en: {
        translation: en,
      },
      zh: {
        translation: zh,
      },
    },
    ns: ['translation'],
    fallbackNS: 'translation',
    detection: {
      order: [/* 'path', 'session', */'querystring', 'cookie', 'header'],
      lookupQuerystring: 'lng',
      lookupCookie: 'i18n',
      lookupPath: 'lng',
      lookupFromPathIndex: 0,
    },
  });

module.exports = i18nMiddleware.handle(i18n, {
  ignoreRoutes: ['static/', 'public/'],
  removeLngFromUrl: false,
});
