import type { UserConfig as ViteUserConfig } from 'vite'
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
export interface MarkdownItOptions {
  /**
   * markdownIt解析器配置
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
export interface ThemeConfig {
  /**
   * 运行时应用入口组件文件路径，必须是绝对路径
   *
   * 组件中必须包含 `<RouterView />`，通常用于自定义全局布局。
   */
  entry?: string
  /**
   * 文档布局组件文件路径，必须是绝对路径
   */
  layout?: string
  /**
   * 首页文件路径，必须是绝对路径
   *
   * 仅在未扫描到 `/index` 首页时生效。
   */
  home?: string
  /**
   * 主题的客户端配置元数据
   *
   * 可以在布局组件中通过 `useThemeData` 获取到此对象，必须是可序列化的对象。
   */
  clientData?: Record<string, any>
  /**
   * 主题使用的插件列表
   */
  plugins?: VitaPressPlugin[]
}

/**
 * 目录配置
 */
export interface DirConfig {
  /**
   * 目录路径
   *
   * 支持绝对路径和相对路径，相对路径相对于 `process.cwd()`
   */
  dir: string
  /**
   * 文件匹配模式
   *
   * @default ["**\/*.{md,markdown}","!.*"]
   */
  patterns?: string[]
  /**
   * 分组path
   *
   * @default '/'
   */
  group?: string
}

/**
 * 用户配置
 */
export interface UserConfig extends SiteOptions, InjectOptions, MarkdownItOptions {
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
   * 站点基础路径
   *
   * @default '/'
   */
  base?: string
  /**
   * 默认语言
   *
   * 如果文档支持多语言，则可以传入数组。
   *
   * @example
   * ```ts
   * // 多语言配置
   * // docs/zh-CN/index.md
   * // docs/en-US/index.md
   * {
   *  lang: ['zh-CN', 'en-US']
   * }
   * ```
   *
   * @default 'zh-CN'
   */
  lang?: string | string[]
  /**
   * 是否开启调试模式
   *
   * 开启调试模式后，会输出更多日志信息。
   *
   * @default false
   */
  debug?: boolean
  /**
   * 主题配置
   */
  theme?: ThemeConfig
  /**
   * 文档目录
   *
   * @default { dir: 'docs', patterns: ['**\/*.{tsx,jsx,md}','!.*'], group:'/' }
   */
  docsDir?: DirConfig
  /**
   * 页面目录
   *
   * @default { dir: 'pages', patterns: ['**\/*.{tsx,jsx}','!.*'], group:'/' }
   */
  pagesDir?: DirConfig
  /**
   * 插件列表
   */
  plugins?: VitaPressPlugin[]
  /**
   * Vite 配置
   */
  viteConfig?: {
    /**
     * 静态资源目录
     *
     * @default '.vitapress/public'
     */
    publicDir?: ViteUserConfig['publicDir']
    /**
     * 预定义全局变量
     */
    define?: ViteUserConfig['define']
    /**
     * 插件列表
     */
    plugins?: ViteUserConfig['plugins']
    /**
     * 解析配置
     */
    resolve?: ViteUserConfig['resolve']
    /**
     * 服务器配置
     */
    server?: ViteUserConfig['server']
  }
}

export type ResolvedConfig = Required<UserConfig>
