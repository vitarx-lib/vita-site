import type { DeepReadonly } from 'vitarx'
import type { PageDirOptions } from 'vitarx-router/file-router'
import type { UserConfig as ViteUserConfig } from 'vite'
import type { I18nMessages } from '../client/index.js'
import type { MarkdownItConfig } from './markdown.js'
import type { VitaPressPlugin } from './plugin.js'

export interface InjectOptions {
  /**
   * 注入到head标签的内容
   *
   * @example
   * ```ts
   * ['<link href="@css/global.css" rel="stylesheet">']
   * ```
   */
  injectHead?: string[]
  /**
   * 注入到body标签的内容
   *
   * @example
   * ```ts
   * // 以下内容会被原样写入到index.html的body标签的最后一行
   * ['<script>console.log('Hello World!')</script>']
   * ```
   */
  injectBody?: string[]
  /**
   * md文件解析后注入到模块顶部的语句，
   * 通常用于注入导入语句。
   *
   * @example
   * ```ts
   * ['import { Button } from "components"']
   * ```
   */
  injectCode?: string[]
}

export interface MarkdownOptions {
  /**
   * markdown 解析器相关配置
   */
  markdownIt?: MarkdownItConfig
}

export interface SiteOptions {
  /**
   * 网站标题
   *
   * @default ''
   */
  title?: string
  /**
   * 网站描述
   *
   * @default ''
   */
  description?: string
  /**
   * 网站关键字
   *
   * @default ''
   */
  keywords?: string
}

export interface PluginOptions {
  /**
   * 插件列表
   */
  plugins?: VitaPressPlugin[]
}

export interface Locale {
  /**
   * 语言标识，如：zh-CN、en-US
   *
   * 遵循 IETF BCP 47 标准的（Tags for Identifying Languages）
   */
  id: string
  /**
   * 语言名称
   *
   * 用于显示在语言切换菜单中展示
   */
  name: string
}

/**
 * VitaPress用户配置
 */
export interface UserConfig extends SiteOptions, InjectOptions, MarkdownOptions, PluginOptions {
  /**
   * 是否生成路由 dts 文件
   *
   * - `true`: 生成 dts 文件，文件名为 `router.d.ts`
   * - `false`: 不生成 dts 文件
   * - `string`: 生成 dts 文件，支持绝对路径和相对路径（相对于root）如：`'typed-router.d.ts'`
   *
   * @default false
   */
  dts?: string | boolean
  /**
   * 文档布局组件文件路径
   *
   * 通常由插件提供（如：@vitapress/theme-default 提供了默认的文档布局组件），
   * 优先级低于 'docDir/_layout.{tsx,jsx}'
   *
   * 注意：必须是绝对路径，否则会抛出异常
   *
   * @default null
   */
  docLayoutPath?: string | null
  /**
   * 首页组件文件路径
   *
   * 通常由插件提供（如：@vitapress/theme-default 提供了默认的首页组件），
   * 优先级低于 'pageDir/index.{tsx,jsx}'
   *
   * 注意：必须是绝对路径，否则会抛出异常
   *
   * @default null
   */
  homePath?: string | null
  /**
   * 多语言配置
   *
   * @example
   * ```ts
   * // 多语言配置
   * // docs/index.md
   * // docs/index.en-US.md
   * {
   *  locales: [{ id: 'zh-CN', name: '简体中文' }, { id: 'en-US', name: 'English' }]
   * }
   * ```
   *
   * @default [{ id: 'zh-CN', name: '简体中文' }]
   */
  locales?: Locale[]
  /**
   * 多语言配置
   */
  i18nMessages?: I18nMessages
  /**
   * 文档目录
   *
   * @default { dir: 'docs', include: ['**\/*.md'], exclude: ['**\/.*'], prefix:'/' }
   */
  docDir?: Omit<PageDirOptions, 'group'>
  /**
   * 页面目录
   */
  pageDirs?: PageDirOptions[]
  /**
   * Vite 配置
   */
  vite?: ViteUserConfig
}

export type ResolvedConfig = DeepReadonly<Required<UserConfig>>
