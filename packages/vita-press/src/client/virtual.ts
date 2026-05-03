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
