import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import { uiResources } from '../locales'

const savedLocale = localStorage.getItem('locale')
const browserLocale = navigator.language.split('-')[0]
const supportedLocales = Object.keys(uiResources)
const detectedLocale = supportedLocales.includes(savedLocale ?? '') ? savedLocale!
  : supportedLocales.includes(browserLocale) ? browserLocale
  : 'en'

i18n
  .use(initReactI18next)
  .init({
    resources: Object.fromEntries(
      Object.entries(uiResources).map(([lang, translations]) => [
        lang,
        { translation: translations },
      ])
    ),
    lng: detectedLocale,
    fallbackLng: 'en',
    interpolation: { escapeValue: false },
  })

export default i18n
