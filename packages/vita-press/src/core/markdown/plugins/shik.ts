import type { MarkdownItShikiSetupOptions } from '@shikijs/markdown-it'
import { fromHighlighter } from '@shikijs/markdown-it/core'
import type { PluginSimple } from 'markdown-it'
import { type BuiltinTheme, createOnigurumaEngine } from 'shiki'
import type { BundledLanguage } from 'shiki/bundle/web'
import { createHighlighterCore } from 'shiki/core'
import { mergeConfig } from '../../config/index.js'

export type ShikiSetupOptions = MarkdownItShikiSetupOptions & {
  /**
   * 主题配置，默认为 `{ dark: 'github-dark', light: 'github-light' }`
   */
  themes?: {
    /**
     * 暗黑主题
     */
    dark: BuiltinTheme
    /**
     * 明亮主题
     */
    light: BuiltinTheme
  }
}

export interface ShikiConfig {
  /**
   * 要加载的语言列表
   *
   * 默认加载的语言列表：{@linkcode DEFAULT_CONFIG.langs}
   *
   * @default ['javascript', 'typescript', 'bash', 'shell', 'jsx', 'tsx']
   */
  langs: BundledLanguage[]
  /**
   * `ShikiSetupOptions` 的配置项
   *
   * 常用选项：
   * - themes: 主题配置，默认为 `{ dark: 'github-dark', light: 'github-light' }`
   * - transformers: 转换器配置
   * - cssVariablePrefix: CSS 变量前缀，默认为`--shiki-`
   * - defaultColor: 默认颜色，默认为 `light`，可选值 `light`、`dark`
   * - fallbackLanguage: 当代码块的 lang 不包含在 options 的 lang 中时，它将作为后备 lang。
   * - defaultLanguage: 当代码块的 lang 为空时，它将作为默认 lang。
   *
   * @see {@link https://shiki.tmrs.site/packages/markdown-it shiki官方文档}
   */
  options: ShikiSetupOptions
}

// 默认配置
const DEFAULT_CONFIG: ShikiConfig = {
  langs: ['javascript', 'typescript', 'jsx', 'tsx', 'bash', 'shell'],
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
  return langs.map(lang => import(`shiki/langs/${lang}.mjs`))
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
