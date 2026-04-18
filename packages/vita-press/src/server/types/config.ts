import type { DeepReadonly } from 'vitarx'
import type { PageDirOptions } from 'vitarx-router/file-router'
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
   * 网站默认语言
   *
   * 文档或页面中通过配置定义的lang优先级高于此配置，
   * 其次如果文档处于多语言映射目录下，则优先使用文档语言。
   *
   * @default 'zh-CN'
   */
  lang?: string
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
   * 默认语言
   *
   * 如果文档支持多语言，则将docs目录下的语言目录名称传入。
   *
   * @example
   * ```ts
   * // 多语言配置
   * // docs/zh-CN/index.md
   * // docs/en-US/index.md
   * {
   *  langDirs: ['zh-CN', 'en-US']
   * }
   * ```
   *
   * @default []
   */
  langDirs?: string[]
  /**
   * 文档目录
   *
   * @default { dir: 'docs', patterns: ['**\/*.{tsx,jsx,md}','!.*'], exclude: ['**\/.*'], prefix:'/', group: true }
   */
  docDir?: PageDirOptions
  /**
   * 页面目录
   *
   * @default []
   */
  pageDirs?: PageDirOptions[]
  /**
   * 插件列表
   */
  plugins?: VitaPressPlugin[]
  /**
   * Vite 配置
   */
  viteConfig?: ViteUserConfig
}
export type ResolvedConfig = DeepReadonly<Required<UserConfig>>
