declare module 'virtual:vitapress/runtime/config' {
  type ClientConfig = import('./config').ClientConfig

  export type { ClientConfig }

  const config: ClientConfig

  export default config
}

declare module 'virtual:vitapress/runtime/locales' {
  type Locale = import('../types/config').Locale

  const locales: Locale[]

  export default locales
}

declare module 'virtual:vitapress/runtime/nav' {
  type NavTree = import('../types/nav').NavTree

  const navTree: NavTree

  export default navTree
}

declare module 'virtual:vitapress/runtime/site-data' {
  type SiteData = import('./siteData').SiteData

  const siteData: SiteData

  export default siteData
}

declare module 'virtual:vitapress/runtime/i18n-messages' {
  type I18nMessages = import('./i18n').I18nMessages

  const i18nMessages: I18nMessages

  export default i18nMessages
}
