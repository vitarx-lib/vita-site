export interface HeroAction {
  /**
   * 按钮文本
   */
  text: string
  /**
   * 按钮链接
   */
  link: string
  /**
   * 按钮主题样式
   *
   * @default 'primary'
   */
  theme?: 'primary' | 'secondary'
}

export interface HeroConfig {
  /**
   * Hero 标题，不配置则使用站点标题
   */
  name?: string
  /**
   * Hero 描述文本
   */
  text?: string
  /**
   * Hero 操作按钮
   */
  actions?: HeroAction[]
}

export interface Feature {
  /**
   * Feature 图标（支持 emoji 或 HTML 字符串）
   */
  icon?: string
  /**
   * Feature 标题
   */
  title: string
  /**
   * Feature 详细描述
   */
  details: string
  /**
   * Feature 链接，点击后跳转
   */
  link?: string
}

export interface NavLinkChild {
  /**
   * 子项文本
   */
  text: string
  /**
   * 子项链接地址
   */
  link: string
  /**
   * 是否为外部链接（新窗口打开）
   *
   * @default false
   */
  isExternal?: boolean
}

export interface NavLink {
  /**
   * 导航项文本
   */
  text: string
  /**
   * 导航项链接地址（普通链接模式）
   */
  link?: string
  /**
   * 下拉子项列表（下拉菜单模式，与 link 二选一）
   */
  children?: NavLinkChild[]
}

export interface SiteOptions {
  /**
   * 站点的标题
   *
   * 支持传入 i18n 翻译标识符，如：`nav.title`
   */
  title: string
  /**
   * logo地址
   *
   * @default null
   */
  logo?: string | null
  /**
   * 仓库编辑地址
   *
   * 如果不配置将不会在文档页面展示编辑地址
   *
   * @example
   * ```js
   * {
   *  edit: 'https://github.com/username/repo/edit/branch/docs/'
   * }
   * ```
   *
   * @default null
   */
  edit?: string | null
  /**
   * 站点的页脚
   *
   * @default null
   */
  footer?: string | null
  /**
   * 代码仓库链接
   *
   * @default null
   */
  libLink?: string | null
  /**
   * 导航栏链接
   *
   * 支持普通链接和下拉菜单两种形态：
   * - 普通链接：配置 `link` 字段
   * - 下拉菜单：配置 `children` 字段，包含子项列表
   *
   * @example
   * ```js
   * // 普通链接 + 下拉菜单混合
   * [
   *  { text: 'Home', link: '/' },
   *  { text: 'Guide', link: '/guide/quick-start' },
   *  {
   *    text: 'Resources',
   *    children: [
   *      { text: 'Actions', link: '/actions/' },
   *      { text: 'Components', link: '/components/' },
   *      { text: 'GitHub', link: 'https://github.com/username/repo', isExternal: true }
   *    ]
   *  },
   *  { text: 'GitHub', link: 'https://github.com/username/repo' }
   * ]
   * // 多语言导航栏链接
   * {
   *  'zh': [
   *    { text: '首页', link: '/' },
   *    {
   *      text: '资源',
   *      children: [
   *        { text: '操作', link: '/actions/' },
   *        { text: '组件', link: '/components/', isExternal: true }
   *      ]
   *    }
   *  ],
   *  'en': [
   *    { text: 'Home', link: '/' },
   *    {
   *      text: 'Resources',
   *      children: [
   *        { text: 'Actions', link: '/actions-en/' },
   *        { text: 'Components', link: '/components-en/' }
   *      ]
   *    }
   *  ]
   * }
   * ```
   *
   * @default []
   */
  navLinks?:
    | NavLink[]
    | {
        [lang: string]: NavLink[]
      }
  /**
   * Hero 区域配置
   *
   * 支持直接传入配置或按语言分别配置
   *
   * @example
   * ```js
   * // 直接配置
   * {
   *   name: 'VitaPress',
   *   text: '下一代文档站点框架',
   *   actions: [
   *     { text: '快速开始', link: '/guide/', theme: 'primary' },
   *     { text: 'GitHub', link: 'https://github.com/...', theme: 'secondary' }
   *   ]
   * }
   * // 多语言配置
   * {
   *   zh: { name: 'VitaPress', text: '下一代文档站点框架', actions: [...] },
   *   en: { name: 'VitaPress', text: 'Next-gen doc site framework', actions: [...] }
   * }
   * ```
   *
   * @default null
   */
  hero?: HeroConfig | { [lang: string]: HeroConfig } | null
  /**
   * 站点的特征
   *
   * 支持直接传入数组或按语言分别配置
   *
   * @example
   * ```js
   * // 直接配置
   * [
   *   { icon: '⚡', title: '极速构建', details: '基于 Vite 的即时热更新' }
   * ]
   * // 多语言配置
   * {
   *   zh: [{ icon: '⚡', title: '极速构建', details: '基于 Vite 的即时热更新' }],
   *   en: [{ icon: '⚡', title: 'Fast Build', details: 'Instant HMR powered by Vite' }]
   * }
   * ```
   *
   * @default []
   */
  features?: Feature[] | { [lang: string]: Feature[] }
  /**
   * 是否使用搜索插件
   *
   * @default true
   */
  useSearch?: boolean
}

export interface SiteData extends Required<SiteOptions> {}
