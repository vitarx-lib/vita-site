# @vitapress/theme-default

VitaPress 默认主题插件，提供开箱即用的文档站点外观与交互。

## 安装

```bash
pnpm add @vitapress/theme-default
```

## 快速开始

在 VitaPress 配置文件中使用默认主题：

```js
import { defineConfig } from 'vitapress/server'
import { defaultTheme } from '@vitapress/theme-default/plugin'

export default defineConfig({
  plugins: [
    defaultTheme({
      title: 'My Docs',
      color: '#3b82f6'
    })
  ]
})
```

## 配置选项

### DefaultThemeOptions

| 选项              | 类型                                                     | 默认值    | 说明                                     |
|-----------------|--------------------------------------------------------|--------|----------------------------------------|
| `title`         | `string`                                               | -      | **必填**，站点标题，支持 i18n 翻译标识符              |
| `color`         | `AnyColor`                                             | -      | **必填**，主题主色调，支持 HEX / RGB / HSL 等格式    |
| `schemeOptions` | `SchemeOptions`                                        | -      | 配色方案选项，由 `@zmaui/color` 提供             |
| `useContainer`  | `boolean`                                              | `true` | 是否启用容器插件（info/success/warning/error 块） |
| `logo`          | `string \| null`                                       | `null` | 站点 Logo 图片地址                           |
| `edit`          | `string \| null`                                       | `null` | 仓库编辑地址前缀，配置后文档页显示"帮助改进此文档"链接           |
| `footer`        | `string \| null`                                       | `null` | 站点页脚，支持 HTML 字符串                       |
| `libLink`       | `string \| null`                                       | `null` | 代码仓库链接，配置后导航栏显示 GitHub 图标              |
| `navLinks`      | `NavLink[] \| { [lang: string]: NavLink[] }`           | `[]`   | 导航栏链接，支持普通链接和下拉菜单                      |
| `hero`          | `HeroConfig \| { [lang: string]: HeroConfig } \| null` | `null` | 首页 Hero 区域配置                           |
| `features`      | `Feature[] \| { [lang: string]: Feature[] }`           | `[]`   | 首页 Features 区域配置                       |
| `useSearch`     | `boolean`                                              | `true` | 是否启用搜索插件                               |

### 完整配置示例

```js
defaultTheme({
  title: 'VitaPress',
  color: '#3b82f6',
  logo: '/logo.png',
  edit: 'https://github.com/username/repo/edit/main/docs/',
  footer: '<p>Released under the MIT License.</p>',
  libLink: 'https://github.com/username/repo',
  useContainer: true,
  useSearch: true,
  navLinks: [
    { text: '首页', link: '/' },
    { text: '指南', link: '/guide/quick-start' },
    {
      text: '资源',
      children: [
        { text: '组件', link: '/components/' },
        { text: 'GitHub', link: 'https://github.com/username/repo', isExternal: true }
      ]
    }
  ],
  hero: {
    name: 'VitaPress',
    text: '下一代文档站点框架',
    actions: [
      { text: '快速开始', link: '/guide/', theme: 'primary' },
      { text: 'GitHub', link: 'https://github.com/username/repo', theme: 'secondary' }
    ]
  },
  features: [
    { icon: '⚡', title: '极速构建', details: '基于 Vite 的即时热更新' },
    { icon: '📝', title: 'Markdown 驱动', details: '用 Markdown 编写文档，专注内容' },
    { icon: '🎨', title: '主题定制', details: '灵活的主题系统，轻松定制外观' }
  ]
})
```

## 多语言配置

`navLinks`、`hero`、`features` 均支持按语言分别配置：

```js
defaultTheme({
  title: 'VitaPress',
  color: '#3b82f6',
  navLinks: {
    zh: [
      { text: '首页', link: '/' },
      { text: '指南', link: '/guide/' }
    ],
    en: [
      { text: 'Home', link: '/' },
      { text: 'Guide', link: '/guide/' }
    ]
  },
  hero: {
    zh: { name: 'VitaPress', text: '下一代文档站点框架' },
    en: { name: 'VitaPress', text: 'Next-gen doc site framework' }
  },
  features: {
    zh: [{ icon: '⚡', title: '极速构建', details: '基于 Vite 的即时热更新' }],
    en: [{ icon: '⚡', title: 'Fast Build', details: 'Instant HMR powered by Vite' }]
  }
})
```

## 类型定义

### NavLink

```ts
interface NavLink {
  text: string
  link?: string
  children?: NavLinkChild[]
}

interface NavLinkChild {
  text: string
  link: string
  isExternal?: boolean // 是否新窗口打开，默认 false
}
```

### HeroConfig

```ts
interface HeroConfig {
  name?: string   // Hero 标题，不配置则使用站点标题
  text?: string   // Hero 描述文本
  actions?: HeroAction[]
}

interface HeroAction {
  text: string
  link: string
  theme?: 'primary' | 'secondary' // 默认 'primary'
}
```

### Feature

```ts
interface Feature {
  icon?: string    // 支持 emoji 或 HTML 字符串
  title: string
  details: string
  link?: string    // 点击后跳转
}
```

## 客户端 API

从 `@vitapress/theme-default` 导入客户端 API：

```ts
import { useTheme, setLangSelector } from '@vitapress/theme-default'
import type { ThemeManager, HeroConfig, Feature, NavLink, SiteData } from '@vitapress/theme-default'
```

### useTheme()

获取主题管理器实例（单例），用于读取和切换明暗模式。

```ts
const theme = useTheme()

// 读取当前模式
theme.mode   // 'light' | 'dark' | 'system'
theme.bright // 'light' | 'dark'（实际亮度）

// 设置模式
theme.setMode('light')  // 切换到浅色模式
theme.setMode('dark')   // 切换到深色模式
theme.setMode('system') // 跟随系统

// 切换亮度（light ↔ dark）
theme.toggleBright()
```

> **注意**：调用 `toggleBright()` 后主题不再跟随系统变化，需手动 `setMode('system')` 恢复。

### setLangSelector(app, props)

自定义语言选择器，适用于多语言分别部署的场景。

```ts
import { defineConfig } from 'vitapress'
import { setLangSelector } from '@vitapress/theme-default'

export default defineConfig({
  enhanceApp(app, { i18n }) {
    const locales = [
      { name: 'English', id: 'https://en.example.com/' },
      { name: 'Chinese', id: 'https://zh.example.com/' }
    ]
    setLangSelector(app, {
      locales,
      // 必须使用 getter 保持响应性
      get activeId() {
        return i18n.lang.value === 'en' ? locales[0].id : locales[1].id
      },
      onSelect(id) {
        window.open(id, '_blank')
      }
    })
  }
})
```

## 内置功能

### 主题切换

默认提供明暗模式切换按钮，支持 `light` / `dark` / `system` 三种模式，用户偏好自动持久化到 `localStorage`（key:
`__THEME_MODE__`）。

### 搜索

默认启用搜索功能（基于 `@vitapress/plugin-search`），支持：

- 输入即搜
- 搜索结果高亮
- 键盘导航（↑↓ 选择、Enter 跳转、Esc 关闭）

通过 `useSearch: false` 可禁用。

### 容器块

默认启用容器插件（基于 `@vitapress/plugin-container`），支持在 Markdown 中使用：

```md
::: info
信息提示
:::

::: success
成功提示
:::

::: warning
警告提示
:::

::: error
错误提示
:::

::: info:自定义标题
自定义标题的信息提示
:::
```

通过 `useContainer: false` 可禁用。

### 404 页面

自动注册 404 页面，当路由未匹配时显示，提供"返回首页"和"回退页面"操作。

## 导出入口

| 路径                                | 说明                                         |
|-----------------------------------|--------------------------------------------|
| `@vitapress/theme-default`        | 客户端 API（`useTheme`、`setLangSelector`、类型导出） |
| `@vitapress/theme-default/plugin` | 服务端插件（`defaultTheme`）                      |

## License

MIT
