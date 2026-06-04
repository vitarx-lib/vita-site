import { fromHighlighter } from '@shikijs/markdown-it/core'
import type { PluginSimple } from 'markdown-it'
import { type BundledLanguage, bundledLanguages, createOnigurumaEngine } from 'shiki'
import { createHighlighterCore } from 'shiki/core'
import type { ShikiConfig } from '../../../types/index.js'
import { mergeConfig } from '../../config/index.js'

// 默认配置
const DEFAULT_CONFIG: ShikiConfig = {
  langs: ['javascript', 'typescript', 'jsx', 'tsx', 'bash', 'shell', 'html', 'json'],
  options: {
    themes: {
      dark: 'github-dark',
      light: 'github-light'
    },
    defaultColor: false,
    transformers: []
  }
}

export type PartialShikiConfig = Partial<ShikiConfig>

// 获取 shiki 所有语言模块的路径
function loadLangs(langs: string[]) {
  return langs.map(lang => {
    return bundledLanguages[lang as BundledLanguage] || import(`shiki/langs/${lang}.mjs`)
  })
}

// 加载主题
function loadThemes(themes: string[]) {
  return themes.map(theme => import(`shiki/themes/${theme}.mjs`))
}

/**
 * 创建 shiki 高亮器
 */
export async function createShikiHighlighter(config: PartialShikiConfig): Promise<PluginSimple> {
  const mergedConfig = mergeConfig(DEFAULT_CONFIG, config) as ShikiConfig
  const themes: string[] = []
  if (mergedConfig.options.themes) {
    themes.push(mergedConfig.options.themes.dark)
    themes.push(mergedConfig.options.themes.light)
  }
  const highlighter = await createHighlighterCore({
    engine: createOnigurumaEngine(import('shiki/wasm')),
    themes: loadThemes(themes),
    langs: loadLangs(mergedConfig.langs)
  })

  return fromHighlighter(highlighter, mergedConfig.options)
}
