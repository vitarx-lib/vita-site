import type { PageSource } from 'vitarx-router/file-router'
import type { MarkdownItConfig } from './markdown.js'

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
   * md文件解析后注入到文件顶部的语句
   *
   * @example
   * ```ts
   * ['import { Button } from "components"']
   * ```
   */
  injectCode?: string[]
}
export interface Language {
  /**
   * id 必须对应docDir子目录，
   * 例如 id 为 zh 的目录为 docDir/zh
   */
  id: string
  /**
   * 语言名称，展示在语言切换菜单中
   */
  name: string
}
export interface ThemeConfig extends InjectOptions {
  /**
   * 运行时入口组件文件路径，必须是绝对路径
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
   * 仅在未扫描到index首页时生效。
   */
  home?: string
  /**
   * 主题的配置元数据
   *
   * 可以在布局组件中通过 `useThemeData` 获取到此对象，必须是可序列化的对象。
   */
  data?: Record<string, any>
  /**
   * markdownIt解析器配置
   */
  markdownIt?: MarkdownItConfig
}
export type NavSort = 'asc' | 'desc'

export interface UserConfig extends InjectOptions {
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
  /**
   * 文档目录
   *
   * @default 'docs'
   */
  docDir?: string
  /**
   * 页面目录
   *
   * 页面目录下仅扫描 `.tsx` | `.jsx` 文件
   */
  pageDirs?: PageSource | PageSource[]
  /**
   * 导航排序规则
   *
   * 可选值：
   * - asc: 升序，建议使用。
   * - desc: 降序
   *
   * @default 'asc'
   */
  sort?: NavSort
  /**
   * 多语言配置
   */
  languages?: Language[]
  /**
   * markdownIt解析器配置
   *
   * 通常来说你无需进行任何配置，已经支持了常用的功能，
   * 如果你对 `markdown-it` 的解析器有特殊需求，可以传入自定义的配置。
   *
   * @default {}
   */
  markdownIt?: MarkdownItConfig
  /**
   * 主题配置
   */
  theme?: ThemeConfig
}
