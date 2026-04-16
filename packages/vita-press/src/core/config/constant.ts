import type { ResolvedConfig } from '../types/index.js'

export const DEFAULT_CONFIG: ResolvedConfig = {
  dts: false,
  lang: 'zh-CN',
  title: '',
  description: '',
  keywords: '',
  docDir: {
    dir: 'docs',
    include: ['**/*.{tsx,jsx,md}'],
    exclude: ['**/.*'],
    prefix: '/',
    group: true
  },
  injectBody: [],
  injectCode: [],
  injectHead: [],
  markdownIt: {},
  pageDirs: [],
  plugins: [],
  viteConfig: {
    publicDir: '.vitapress/public'
  }
}
