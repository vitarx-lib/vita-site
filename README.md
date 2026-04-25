# VitaPress

一个基于 Vitarx 框架的静态站点生成器，专为编写技术文档而设计。

## 特性

- 🚀 **快速开发** - 基于 Vite 的即时热更新
- 📝 **Markdown 优先** - 使用 Markdown 编写文档，支持 Frontmatter
- 🎨 **代码高亮** - 内置 Shiki 语法高亮，支持多种主题
- 📖 **目录生成** - 自动生成文档目录树（TOC）
- 🌍 **多语言支持** - 内置国际化支持
- 🔌 **插件系统** - 灵活的插件机制，可扩展功能
- 📦 **零配置** - 开箱即用，无需复杂配置
- 🎯 **TypeScript** - 完整的 TypeScript 支持
- ⚡ **SSR 支持** - 支持服务端渲染

## 安装

```bash
# 使用 pnpm
pnpm add -D vitapress

# 使用 npm
npm install -D vitapress

# 使用 yarn
yarn add -D vitapress
```

## 快速开始

### 1. 创建项目结构

```
my-docs/
├── docs/
│   ├── index.md
│   ├── guide/
│   │   ├── getting-started.md
│   │   └── advanced.md
│   └── api/
│       └── overview.md
└── .vitapress/
    └── config.ts
```

### 2. 创建配置文件

在项目根目录创建 `.vitapress/config.ts`：

```typescript
import { defineConfig } from 'vitapress/server'

export default defineConfig({
  title: '我的文档',
  description: '一个基于 VitaPress 的文档站点',
  lang: 'zh-CN'
})
```

### 3. 启动开发服务器

```bash
npx vitapress dev
```

## CLI 命令

### `vitapress dev`

启动开发服务器。

```bash
vitapress dev [options]

选项:
  -d, --debug          启用调试模式
  -h, --host <host>    主机地址
  -p, --port <port>    端口号
  -o, --open           自动打开浏览器
  -c, --config <path>  配置文件路径
  -f, --force          强制清空缓存
```

### `vitapress build`

构建生产版本。

```bash
vitapress build [options]
```

### `vitapress preview`

预览生产版本。

```bash
vitapress preview [options]
```

### `vitapress clean`

清除缓存。

```bash
vitapress clean
```

## 配置

### 配置文件

VitaPress 支持以下配置文件格式：

- `.vitapress/config.ts`
- `.vitapress/config.js`
- `.vitapress/config.mjs`
- `.vitapress/config.mts`
- `.vitapress/config.server.ts`
- `.vitapress/config.server.js`
- `.vitapress/config.server.mjs`
- `.vitapress/config.server.mts`

### 配置选项

```typescript
import { defineConfig } from 'vitapress/server'

export default defineConfig({
  // 网站信息
  title: '网站标题',
  description: '网站描述',
  keywords: '关键字',
  lang: 'zh-CN',

  // 多语言配置
  langDirs: ['zh-CN', 'en-US'],

  // 文档目录配置
  docDir: {
    dir: 'docs',
    patterns: ['**/*.{tsx,jsx,md}', '!.*'],
    exclude: ['**/.*'],
    prefix: '/',
    group: true
  },

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
  viteConfig: {}
})
```

### 客户端配置

创建 `.vitapress/config.client.ts` 配置客户端应用：

```tsx
import { defineClientConfig } from 'vitapress'

export default defineClientConfig({
  // 自定义布局
  layout: () => <CustomLayout />,

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

## Markdown 功能

### Frontmatter

支持在 Markdown 文件顶部添加 YAML 格式的元数据：

```markdown
---
title: 页面标题
description: 页面描述
keywords: 关键字1, 关键字2
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

使用 Shiki 提供语法高亮：

### 路由链接

支持使用相对路径创建路由链接：

```markdown
[快速开始](./getting-started.md)
```

## 插件系统

VitaPress 提供了强大的插件系统，可以通过插件扩展功能。

### 插件接口

```typescript
interface VitaPressPlugin {
  name: string
  enforce?: 'pre' | 'post' | number

  // 配置钩子
  config?(config: UserConfig): void | UserConfig | Promise<void | UserConfig>

  configResolved?(config: ResolvedConfig): void | Promise<void>

  // Markdown 钩子
  markdown?(md: MarkdownIt): void | Promise<void>

  beforeParse?(content: string, file: string): string | void

  afterParse?(res: MdParseResult): MdParseResult | void

  // 路由钩子
  extendRoute?(route: RouteNode, parsed: ParsedNode, app: VitaPressApp): void
}
```

### 插件示例

```typescript
import type { VitaPressPlugin } from 'vitapress/server'

const myPlugin: VitaPressPlugin = {
  name: 'my-plugin',

  config(config) {
    // 修改配置
    return {
      ...config,
      title: config.title || 'Default Title'
    }
  },

  beforeParse(content, file) {
    // 在解析前处理内容
    return content.replace(/foo/g, 'bar')
  },

  afterParse(result) {
    // 在解析后处理结果
    result.meta.customField = 'value'
    return result
  }
}

export default myPlugin
```

### 使用插件

```typescript
import { defineConfig } from 'vitapress/server'
import myPlugin from './plugins/my-plugin'

export default defineConfig({
  plugins: [myPlugin]
})
```

## 内置 Markdown 插件

VitaPress 内置了以下 Markdown 插件：

### 代码导入

支持从外部文件导入代码：

```markdown
# 导入全部代码

@[code](./test.ts)

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

VitaPress 会自动扫描文档目录并生成路由：

```text

docs/
├── index.md → /
├── guide/
│ ├── index.md → /guide
│ └── quick-start.md → /guide/quick-start

```

### 路由元数据

每个路由都包含以下元数据：

```typescript
interface DocPageMetaData {
  title: string
  description: string
  keywords: string
  lang: string
  relativePath: string
  tocList: TocTree[]
  authors: string[]
  createdAt: string
  lastUpdateAt: string
  // ... frontmatter 中的其他字段
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

## 缓存机制

VitaPress 使用智能缓存机制提升性能：

- 缓存目录：`.vitapress/.cache`
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
