import type {
  Options as MarkdownItOptions,
  PluginSimple,
  PluginWithOptions,
  PluginWithParams
} from 'markdown-it'
import type { ShikiConfig } from '../markdown/plugins/shik.js'

type PluginWithOptionsType<T> = {
  plugin: PluginWithOptions<T>
  options: T
}
type PluginWithParamsType = {
  plugin: PluginWithParams
  options: any[]
}

type PluginSimpleType = PluginSimple

export type MarkdownItPlugin = PluginSimpleType | PluginWithOptionsType<any> | PluginWithParamsType

/**
 * markdown-it配置
 */
export interface MarkdownItConfig {
  /**
   * markdown-it可选配置
   *
   * > 注意：`highlight`无效，因为内部使用了shiki插件来高亮代码，`highlight`配置的回调不会触发！
   *
   * @see {@link https://markdown-it.docschina.org/#%E7%94%A8%E6%B3%95%E7%A4%BA%E4%BE%8B markdown-it官方文档}
   *
   * @default {
   *   html: true, // 启用 HTML 标签解析
   *   linkify: true, // 自动将类似 URL 的文本转换为链接
   *   typographer: true, // 启用一些语言中立的替换 + 引号美化
   *   xhtmlOut: true // 使用 '/' 来闭合单标签 （比如 <br />）。
   * }
   */
  options?: Omit<MarkdownItOptions, 'highlight'>
  /**
   * markdown-it插件
   */
  plugins?: MarkdownItPlugin[]
  /**
   * `@shikijs/markdown-it`插件的配置
   *
   * 此插件用于代码高亮
   */
  shikiConfig?: Partial<ShikiConfig>
}
