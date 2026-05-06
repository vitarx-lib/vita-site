import type { ResolvedConfig } from '../../types/index.js'

export const DEFAULT_CONFIG: ResolvedConfig = {
  dts: false,
  title: '',
  description: '',
  keywords: '',
  docLayoutFile: null,
  homeFile: null,
  i18nMessages: {},
  locales: [],
  docDir: {
    dir: 'docs',
    include: [],
    exclude: [],
    prefix: '/'
  },
  injectBody: [],
  injectCode: [],
  injectHead: [],
  markdownIt: {},
  pageDirs: [],
  plugins: [],
  vite: {
    publicDir: '.vitapress/public',
    build: {
      outDir: '.vitapress/dist'
    }
  }
}
