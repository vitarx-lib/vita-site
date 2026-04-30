declare module 'virtual:vitapress/runtime/config' {
  type RuntimeConfig = import('./config').RuntimeConfig

  export type { RuntimeConfig }

  const config: RuntimeConfig

  export default config
}

declare module 'virtual:vitapress/runtime/locales' {
  type Locale = import('../server/types/config').Locale

  const locales: Locale[]

  export default locales
}

declare module 'virtual:vitapress/runtime/nav' {
  type NavTree = import('../server/types/nav').NavTree

  const navTree: NavTree

  export default navTree
}
