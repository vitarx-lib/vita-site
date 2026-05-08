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
 * 文档目录选项
 */
interface DocDirOptions extends Omit<PageDirOptions, 'group'> {
  /**
   * 文件目录
   *
   * 支持相对路径或绝对路径
   */
  dir: string
  /**
   * 要包含的文件
   *
   * @default ['**\/*.{md,jsx,tsx}']
   */
  include?: string[]
  /**
   * 要排除的文件
   *
   * @default ['**\/.*']
   */
  exclude?: string[]
  /**
   * 文档路径前缀
   *
   * @default '/'
   */
  prefix?: string
  /**
   * 文档布局组件文件路径
   *
   * 通常由主题插件指定，亦可通过文档目录下的 `_layout.{tsx,jsx}` 文件覆盖
   */
  layout?: string
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
  docLayoutFile?: string | null
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
  homeFile?: string | null
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
   * @default [{ dir: 'docs', include: ['**\/*.{md,jsx,tsx}'], exclude: ['**\/.*'], prefix:'/' }]
   * @example
   * ```js
   * // 单文档目录 docDirs 配置
   * // docs/1.quick-start.md -> /quick-start.html
   * // docs/2.install.md -> /install.html
   * // docs/3.basic/1.tutorial.md -> /basic/tutorial.html
   * {
   *  docDirs: [{ dir: 'docs', include: ['**\/*.{md,jsx,tsx}'], exclude: ['**\/.*'], prefix:'/' }]
   * }
   *
   * // 多文档目录
   * // docDirs 配置
   * // guide/1.test.md -> /guide/test.html
   * // config/1.config.md -> /config/config.html
   * {
   *  docDirs: [
   *    { dir: 'guide', prefix:'/guide/' },
   *    { dir: 'config', prefix:'/config/' }
   *  ]
   * }
   * ```
   */
  docDirs?: DocDirOptions[]
  /**
   * 页面目录
   *
   * 用于配置独立页面目录，
   * 这些页面将作为独立路由处理，不使用文档布局组件，也不会出现在文档侧边栏导航中
   * 此目录下的文件（如 .jsx、.tsx 等，可以通过include配置需要扫描的文件）会被扫描并生成对应的独立路由
   *
   * @default []
   *
   * @example
   * ```ts
   * // pageDirs 配置
   * // pages/changelog.md -> /changelog.html
   * // pages/about.jsx -> /about.html
   * {
   *  pageDirs: [{ pages: 'pages', include: ['**\/*.{jsx,tsx}'], exclude: ['**\/.*'], prefix:'/' }]
   * }
   * ```
   */
  pageDirs?: PageDirOptions[]
  /**
   * Vite 配置
   */
  vite?: ViteUserConfig
}

export type ResolvedConfig = DeepReadonly<Required<UserConfig>>
