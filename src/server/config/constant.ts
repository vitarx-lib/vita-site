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
  docDirs: [],
  injectBody: [],
  injectCode: [],
  injectHead: [],
  markdownIt: {},
  pageDirs: [],
  plugins: [],
  vite: {
    publicDir: '.vita-site/public',
    build: {
      outDir: '.vita-site/dist'
    }
  }
} as const
