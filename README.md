# VitaSite

一个基于 Vitarx 框架的静态站点生成器，专为编写技术文档而设计。

## 特性

- 🚀 **快速开发** - 基于 Vite 的即时热更新
- 📝 **Markdown 优先** - 使用 Markdown 编写文档，支持 Frontmatter
- 🎨 **代码高亮** - 内置 Shiki 语法高亮，支持多种主题
- 📖 **目录生成** - 自动生成文档目录树（TOC）
- 🧭 **导航树** - 自动从目录结构生成导航数据，支持排序和隐藏
- 🔍 **搜索功能** - 提供本地搜索插件，支持全文检索
- 🌍 **多语言支持** - 内置国际化支持
- 🔌 **插件系统** - 灵活的插件机制，可扩展功能
- 📦 **零配置** - 开箱即用，无需复杂配置
- 🎯 **TypeScript** - 完整的 TypeScript 支持
- ⚡ **SSR 支持** - 支持服务端渲染

## 安装

```bash
# 使用 pnpm
pnpm add -D vita-site

# 使用 npm
npm install -D vita-site

# 使用 yarn
yarn add -D vita-site
```

## 快速开始

### 1. 创建项目结构

```
my-docs/
├── docs/
│   ├── guide/
│   │   ├── _config.ts # guide 分组配置
│   │   ├── index.md
│   │   ├── getting-started.md
│   │   └── advanced.md
│   └── api/
│   │    ├── _config.ts # api 分组配置
│   │    └── overview.md
│   └── _layout.tsx # 文档布局组件
├── pages/
│   └── index.tsx
└── .vita-site/
    ├── config.ts
    └── config.client.ts
```

### 2. 创建服务端配置文件

在项目根目录创建 `.vita-site/config.ts`：

```typescript
import { defineConfig } from 'vita-site/server'

export default defineConfig({
  title: '我的文档',
  description: '一个基于 VitaSite 的文档站点',
  locales: [{ id: 'zh-CN', name: '简体中文' }]
})
```

### 3. 创建客户端配置文件

创建 `.vita-site/config.client.ts`：

```tsx
import { defineConfig } from 'vita-site'

export default defineConfig({
  layout: () => <CustomLayout />
})
```

### 4. 启动开发服务器

```bash
npx vita-site dev
```

## CLI 命令

### `vita-site dev`

启动开发服务器。

```bash
vita-site dev [options]

选项:
  -d, --debug          启用调试模式
  -h, --host <host>    主机地址
  -p, --port <port>    端口号
  -o, --open           自动打开浏览器
  -c, --config <path>  配置文件路径
  -f, --force          强制清空缓存
```

### `vita-site build`

构建生产版本。

```bash
vita-site build [options]
```

### `vita-site preview`

预览生产版本。

```bash
vita-site preview [options]
```

### `vita-site clean`

清除缓存。

```bash
vita-site clean
```

## 配置

### 配置文件

VitaSite 支持以下配置文件格式：

- `.vita-site/config.ts`
- `.vita-site/config.js`
- `.vita-site/config.mjs`
- `.vita-site/config.mts`
- `.vita-site/config.server.ts`
- `.vita-site/config.server.js`
- `.vita-site/config.server.mjs`
- `.vita-site/config.server.mts`

### 服务端配置选项

```typescript
import { defineConfig } from 'vita-site/server'

export default defineConfig({
  // 网站信息
  title: '网站标题',
  description: '网站描述',
  keywords: '关键字',

  // 多语言配置
  locales: [
    { id: 'zh-CN', name: '简体中文' },
    { id: 'en-US', name: 'English' }
  ],

  // 文档目录配置
  docDirs: [{
    dir: 'docs',
    include: ['**/*.md'],
    exclude: ['**/.*'],
    prefix: '/'
  }],

  // 文档布局组件文件
  // 通常由插件提供，优先级低于 docDir/_layout.{tsx,jsx}
  docLayoutFile: null,

  // 首页组件文件
  // 通常由插件提供，当根路径 / 未被其他路由占用时生效
  // 注意：如果存在 docs/index.md 或 pages/index.tsx 则 homeFile 不会生效
  homeFile: null,

  // 页面目录配置
  pageDirs: [],

  // 生成路由类型文件
  dts: 'router.d.ts',

  // 注入内容
  injectHead: [
    '<link href="@css/global.css" rel="stylesheet">'
  ],
  injectBody: [
    '<script>console.log("Hello World!")</script>'
  ],
  injectCode: [
    'import { Button } from "components"'
  ],

  // Markdown 配置
  markdownIt: {
    // MarkdownIt 配置选项
  },

  // 插件列表
  plugins: [],

  // Vite 配置
  vite: {}
})
```

### 客户端配置

创建 `.vita-site/config.client.ts` 配置客户端应用：

```tsx
import { defineConfig } from 'vita-site'
import Loading from './components/Loading.tsx'

export default defineConfig({
  // 自定义布局
  layout: () => <CustomLayout />,

  // 惰性加载配置
  lazy: {
    loading: () => Loading,
    delay: 300,
    timeout: 10000,
    onError: (e) => <div>加载失败: {String(e)}</div>
  },

  // 应用配置
  app: {},

  // 路由配置
  router: {
    mode: 'path'
  },

  // 增强应用
  enhanceApp(app, router) {
    // 注册全局组件
    // 安装插件
  }
})
```

## 虚拟模块

VitaSite 通过虚拟模块在客户端访问构建时生成的数据：

### `virtual:vita-site/runtime/config`

运行时配置，合并了所有主题配置和用户配置。

```tsx
import config from 'virtual:vita-site/runtime/config'
// config: RuntimeConfig
```

### `virtual:vita-site/runtime/locales`

多语言配置列表。

```tsx
import locales from 'virtual:vita-site/runtime/locales'
// locales: Locale[]
```

### `virtual:vita-site/runtime/nav`

导航树数据，按语言分组。

```tsx
import navTree from 'virtual:vita-site/runtime/nav'
// navTree: Record<string, NavEntry[]>
```

### `virtual:vita-site/runtime/site-data`

站点数据，由插件通过 `siteData` 字段提供，多个插件的数据浅合并。

```tsx
import siteData from 'virtual:vita-site/runtime/site-data'
// siteData: Record<string, unknown>
```

也可使用 `useSiteData()` API 获取：

```tsx
import { useSiteData } from 'vita-site'

const siteData = useSiteData()
console.log(siteData.version)
```

## 导航树

VitaSite 自动从文档目录结构生成导航树，供侧边栏等组件消费。

### 目录结构与导航的对应关系

```
docs/
├── guide/
│   ├── _config.ts           # navTitle: '指南', navOrder: 10
│   ├── index.md             # 分组简介页
│   ├── getting-started.md   # navOrder: 1
│   └── advanced.md          # navOrder: 2
├── api/
│   ├── _config.ts           # navTitle: 'API', navOrder: 20
│   └── rest.md              # navOrder: 1
└── changelog.md             # 扁平文件（独立 NavItem）
```

生成结果：

```json
{
  "zh-CN": {
    "/docs": [
      {
        "type": "group",
        "title": "指南",
        "path": "/docs/guide",
        "order": 10,
        "indexPath": "/docs/guide",
        "items": [
          {
            "type": "item",
            "path": "/docs/guide/getting-started",
            "title": "快速开始",
            "order": 1
          },
          {
            "type": "item",
            "path": "/docs/guide/advanced",
            "title": "进阶",
            "order": 2
          }
        ]
      },
      {
        "type": "group",
        "title": "API",
        "path": "/docs/api",
        "order": 20,
        "items": [
          {
            "type": "item",
            "path": "/docs/api/rest",
            "title": "REST API",
            "order": 1
          }
        ]
      },
      {
        "type": "item",
        "path": "/docs/changelog",
        "title": "更新日志",
        "order": 0
      }
    ]
  }
}
```

### 导航类型

```typescript
interface NavItem {
  type: 'item'
  path: string
  title: string
  order: number
}

interface NavGroup {
  type: 'group'
  path: string
  title: string
  order: number
  indexPath?: string  // 有 index 页面时存在，可点击跳转
  items: NavItem[]
}

type NavEntry = NavGroup | NavItem
type NavTree = Record<string, Record<string, NavEntry[]>>
```

### 导航配置

通过 frontmatter 或 `_config.ts` 配置导航行为：

| 字段          | 说明                      | 默认值     |
|-------------|-------------------------|---------|
| `navTitle`  | 导航标题，缺省取 `title` 或从路径推断 | -       |
| `navOrder`  | 排序权重，数值越小越靠前            | `0`     |
| `navHidden` | 是否在导航中隐藏                | `false` |

**分组标题优先级**：`_config.ts` 的 `navTitle` > `index.md` 的 `navTitle` > 目录名推断

**分组 path 规则**：当目录下存在 `index.md` 时，分组具有 `path` 属性（可点击跳转简介页），否则无 `path`（纯标签）。

#### 目录级配置（`_config.ts`）

```js
// docs/guide/_config.ts
definePage({
  meta: {
    navTitle: '指南',
    navOrder: 10
  }
})
```

#### 页面级配置（frontmatter）

```yaml
---
navTitle: 快速开始
navOrder: 1
navHidden: false
---
```

## Markdown 功能

### Frontmatter

支持在 Markdown 文件顶部添加 YAML 格式的元数据：

```markdown
---
title: 页面标题
description: 页面描述
keywords: 关键字1, 关键字2
navTitle: 导航标题
navOrder: 1
navHidden: false
---

# 页面标题

内容...
```

### 目录树（TOC）

自动为标题生成目录树和锚点链接：

- 支持 h1-h6 标题
- 为 h2-h3 生成目录树
- 自动生成唯一 ID

### 代码高亮

使用 Shiki 提供语法高亮。

### 路由链接

支持使用相对路径创建路由链接：

```markdown
[快速开始](./getting-started.md)
```

### 代码导入

支持从外部文件导入代码：

```markdown
# 导入全部代码

@[code](../../test.ts)

# 导入部分代码

@[code{1-3}](./test.ts)

# 指定语言

@[code typescript](./test.ts)

# 指定范围和语言

@[code{1-3} typescript](./test.ts)
```

### 标题提取

自动从文档中提取第一个 h1 标题作为页面标题。

### JSX 组件解析

支持在 Markdown 中使用 JSX 组件。

## 路由

### 自动路由生成

VitaSite 会自动扫描文档目录并生成路由：

```text
docs/
├── index.md → /
├── guide/
│   ├── index.md → /guide
│   ├── _config.ts → 目录级路由配置
│   └── quick-start.md → /guide/quick-start
```

### 多语言文件命名

当 `locales` 配置了多种语言时，通过文件名后缀 `.{langId}` 标识非默认语言的文档。

**命名规则**：`{baseName}.{langId}.{ext}`

- 默认语言（`locales` 数组第一项）的文件**不带语言后缀**
- 非默认语言的文件在扩展名前添加 `.{langId}` 后缀
- `langId` 遵循 IETF BCP 47 标准（如 `zh-CN`、`en-US`、`ja-JP`），必须在 `locales` 中声明
- 文件名中的 `.` 如果最后一部分不匹配已注册语言 ID，则视为普通分隔符

假设配置 `locales: [{ id: 'zh-CN' }, { id: 'en-US' }]`：

```text
docs/
├── index.md                → /                    (zh-CN 首页)
├── index.en-US.md          → /index-en-us         (en-US 首页)
├── guide/
│   ├── index.md            → /guide               (zh-CN)
│   ├── index.en-US.md      → /guide/index-en-us   (en-US)
│   ├── quick-start.md      → /guide/quick-start   (zh-CN)
│   └── quick-start.en-US.md → /guide/quick-start-en-us (en-US)
├── api.rest.md             → /api-rest            (点号不匹配语言ID，视为普通分隔符)
└── changelog.md            → /changelog           (zh-CN)
```

**文件名 → 路由路径映射规则**：

| 文件名              | 语言后缀匹配         | 解析后 path      | lang    |
|------------------|----------------|---------------|---------|
| `index.md`       | 无              | `""` (空)      | `zh-CN` |
| `index.en-US.md` | ✅ `en-US`      | `index-en-US` | `en-US` |
| `guide.md`       | 无              | `guide`       | `zh-CN` |
| `guide.en-US.md` | ✅ `en-US`      | `guide-en-US` | `en-US` |
| `api.rest.md`    | ❌ `rest` 非语言ID | `api-rest`    | `zh-CN` |

### 路由元数据

每个路由都包含以下元数据：

```typescript
interface DocPageMetaData {
  // 站点信息
  title: string
  description: string
  keywords: string
  lang: string

  // 导航配置
  navTitle?: string
  navOrder?: number
  navHidden?: boolean

  // 文档信息
  relativePath: string
  tocList: TocTree[]

  // Git 信息
  authors: string[]
  createdAt: string
  lastUpdateAt: string

  // frontmatter 中的其他字段
  [key: string]: any
}
```

### 页面别名

通过 Frontmatter 设置页面别名：

```markdown
---
alias: /old-path/
---

# 页面内容
```

### 目录级路由配置（`_config.ts`）

在目录下创建 `_config.ts` 文件，使用 `definePage` 配置该目录的路由属性：

```js
// docs/guide/_config.ts
definePage({
  meta: {
    navTitle: '指南',
    navOrder: 10
  }
})
```

## 插件系统

VitaSite 提供了强大的插件系统，可以通过插件扩展功能。

### 插件接口

```typescript
interface VitaSitePlugin {
  /** 插件名称 */
  name: string
  /** 插件优先级 */
  enforce?: 'pre' | 'post' | number
  /** 客户端主题配置模块路径 */
  clientConfig?: string
  /** 插件提供的站点数据，客户端可通过 useSiteData() 获取 */
  siteData?: Record<string, unknown>

  // 配置钩子
  config?(config: UserConfig): void | UserConfig | Promise<void | UserConfig>

  configResolved?(config: ResolvedConfig): void | Promise<void>

  // 应用钩子
  appCreated?(app: VitaSiteApp): void | Promise<void>

  // Markdown 钩子
  markdownIt?(md: MarkdownIt): void | Promise<void>

  beforeParse?(content: string, file: string, app: VitaSiteApp): string | void

  afterParse?(res: MdParseResult, app: VitaSiteApp): void

  // 路由钩子
  extendRoute?(route: RouteNode, app: VitaSiteApp): void

  beforeWriteRoutes?(routes: RouteNode[], app: VitaSiteApp): RouteNode[] | void

  // 构建钩子
  buildEnd?(app: VitaSiteApp): void | Promise<void>
}
```

### 钩子调用时序

```
VitaSiteApp.create()
  │
  ├── config()              // 配置解析前，可返回新配置
  ├── configResolved()      // 配置解析完成
  ├── markdownIt()           // MarkdownIt 实例创建后
  │
  ├── new VitaSiteApp()    // 构造应用实例（路由器延迟扫描）
  ├── appCreated()          // 应用实例创建完成，可记录 app 引用
  ├── router.reload()       // 触发路由扫描
  │   ├── beforeParse()     // 每个 Markdown 文件解析前
  │   ├── afterParse()      // 每个 Markdown 文件解析后
  │   ├── extendRoute()     // 每个路由节点解析后
  │   └── beforeWriteRoutes() // 路由写入前（导航树在此阶段生成）
  │
  └── 构建阶段
      └── buildEnd()        // 构建完成，所有 HTML 已生成
```

### 插件示例

```typescript
import type { VitaSitePlugin } from 'vita-site/server'

const myPlugin: VitaSitePlugin = {
  name: 'my-plugin',

  siteData: {
    version: '1.0.0',
    features: ['search', 'i18n']
  },

  config(config) {
    return {
      ...config,
      title: config.title || 'Default Title'
    }
  },

  appCreated(app) {
    // 记录 app 实例引用，供后续钩子使用
    // 此时 app.router 尚未扫描，不可访问路由数据
  },

  beforeParse(content, file, app) {
    return content.replace(/foo/g, 'bar')
  },

  afterParse(result, app) {
    // result.html - 渲染后的 HTML
    // result.content - 去除 frontmatter 后的原始 Markdown
    // result.meta - 文档元数据
    // app - 应用实例，可访问 app.lang 等配置
    result.meta.customField = 'value'
  },

  buildEnd(app) {
    // 构建完成后执行，如生成搜索索引
  }
}

export default myPlugin
```

### 使用插件

```typescript
import { defineConfig } from 'vita-site/server'
import myPlugin from './plugins/my-plugin'

export default defineConfig({
  plugins: [myPlugin]
})
```

### 插件客户端配置

插件通过 `clientConfig` 字段提供客户端配置，构建时自动与用户配置合并：

```typescript
const myThemePlugin: VitaSitePlugin = {
  name: 'my-theme',
  clientConfig: 'my-theme/client.ts'
}
```

```typescript
// my-theme/client.ts
import Layout from './components/Layout.tsx'
import NotFound from './components/NotFound.tsx'

export default {
  layout: Layout,
  messages: { 'zh-CN': { 'nav.home': '首页' } },
  enhanceApp(app, router) {
    // 注册全局组件
  }
}
```

## 缓存机制

VitaSite 使用智能缓存机制提升性能：

- 缓存目录：`.vita-site/.cache`
- 基于文件内容和配置生成缓存键
- 支持强制清除缓存（`--force` 选项）

## 开发

### 构建

```bash
pnpm build
```

### 测试

```bash
pnpm test

# 监听模式
pnpm test:watch
```

### 类型检查

```bash
pnpm typecheck
```

## 技术栈

- [Vitarx](https://github.com/vitarx/vitarx) - 响应式框架
- [Vitarx Router](https://github.com/vitarx/vitarx-router) - 路由管理
- [Vite](https://vitejs.dev/) - 构建工具
- [Markdown-it](https://github.com/markdown-it/markdown-it) - Markdown 解析
- [Shiki](https://shiki.style/) - 代码高亮
- [Commander](https://github.com/tj/commander.js/) - CLI 框架

## License

MIT
