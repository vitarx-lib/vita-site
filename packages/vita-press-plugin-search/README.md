# vita-press-plugin-search

VitaPress 本地搜索插件，基于倒排索引提供中英文混合的客户端全文搜索能力。

## 特性

- **离线可用**：搜索索引在构建时预生成，无需后端服务，不依赖网络
- **中英文混合分词**：中文单字 + bigram 双字组合，英文空格分词 + 小写化，精确匹配标点边界
- **倒排索引**：O(1) 查找匹配文档，搜索结果按相关度排序
- **智能评分**：标题匹配自动加权 5 倍，内容匹配权重 1 倍，多关键词命中得分累加
- **异步取消**：连续搜索自动取消前一次，支持手动取消，避免过期结果覆盖
- **按需加载**：索引通过动态 `import()` 懒加载，不影响首屏性能
- **子目录部署**：基于 Vite 虚拟模块交付索引，自动适配 `base` 配置

## 安装

```bash
pnpm add vita-press-plugin-search
```

## 快速开始

在 VitaPress 配置文件中注册插件：

```ts
// .vitepress/config.ts
import { defineConfig } from 'vitapress'
import { searchPlugin } from 'vita-press-plugin-search'

export default defineConfig({
  plugins: [
    searchPlugin()
    // ... 其他插件
  ]
})
```

在搜索 UI 组件中调用搜索 API：

```ts
import { search, cancelSearch } from 'vita-press-plugin-search'

// 执行搜索
const result = await search('VitaPress 搜索')

if (result.status === 'success') {
  for (const item of result.matched) {
    console.log(`${item.title} > ${item.heading}`)
    console.log(`路径: ${item.path}${item.hash ? '#' + item.hash : ''}`)
    console.log(`内容: ${item.content}`)
    console.log(`得分: ${item.score}`)
  }
}

// 关闭搜索弹窗时取消进行中的搜索
cancelSearch()
```

## API

### `search(query, maxResults?)`

执行搜索查询，返回 Promise。

```ts
declare function search(query: string, maxResults?: number): Promise<SearchResponse>
```

| 参数           | 类型       | 默认值  | 说明      |
|--------------|----------|------|---------|
| `query`      | `string` | 必填   | 搜索关键词   |
| `maxResults` | `number` | `10` | 最大返回结果数 |

**返回值** `SearchResponse`：

```ts
interface SearchResponse {
  status: 'success' | 'canceled'
  matched: SearchResult[]
}
```

当搜索被新搜索或 `cancelSearch()` 取消时，`status` 为 `'canceled'`，`matched` 为空数组。

**搜索结果** `SearchResult`：

```ts
interface SearchResult {
  path: string       // 路由路径
  hash: string       // 锚点 hash（用于跳转到对应标题）
  title: string      // 页面标题
  heading: string    // 段落标题
  content: string    // 匹配的文本片段
  matchType: 'page' | 'content'  // 匹配类型
  score: number      // 匹配得分
}
```

### `searchWithIndex(query, searchIndex, maxResults?, maxContentLength?)`

使用指定索引执行搜索，不依赖虚拟模块，适合单元测试。

```ts
declare function searchWithIndex(
  query: string,
  searchIndex: SearchIndex,
  maxResults?: number,
  maxContentLength?: number
): SearchResult[]
```

### `cancelSearch()`

取消当前正在进行的搜索。

```ts
declare function cancelSearch(): void
```

### `loadIndex()`

手动懒加载搜索索引，返回 Promise。首次搜索时自动调用，通常无需手动使用。

```ts
declare function loadIndex(): Promise<SearchIndex>
```

## 架构

```
src/
├── index.ts              # 统一导出入口
├── apis/                 # 客户端搜索 API
│   ├── index.ts          # 搜索函数导出
│   ├── search.ts         # 搜索实现（倒排索引查询、评分、取消）
│   └── virtual.d.ts      # 虚拟模块类型声明
├── common/               # 共享工具
│   └── tokenizer.ts      # 中英文混合分词器
├── server/               # 服务端构建
│   ├── index.ts          # 插件入口（生命周期钩子、虚拟模块注册）
│   ├── builder.ts        # 索引构建器（路由映射 + 倒排索引生成）
│   └── splitter.ts       # Markdown 分段器（按标题切分）
└── shared/               # 共享类型
    ├── index.ts          # 类型导出
    └── types.ts          # 类型定义
```

### 数据流

```
[Markdown 文件]
      │
      ▼
  splitter.ts          ← 按标题分段，生成 SearchSectionBuild（含分词）
      │
      ▼
  builder.ts           ← 路由映射 + 倒排索引构建，输出 SearchIndex（含倒排索引）
      │
      ▼
  虚拟模块              ← Vite 虚拟模块 `virtual:vita-press-search/index`
      │
      ▼
  search.ts            ← 查询分词 → 倒排查找 → 评分排序 → 返回结果
```

### 搜索取消机制

使用**代数计数器**（Generation Counter）实现搜索取消：

1. 每次 `search()` 调用时递增代数
2. 异步索引加载完成后检查代数是否仍为当前值
3. 若被新搜索取代，返回 `{ status: 'canceled', matched: [] }`
4. `cancelSearch()` 可主动递增代数使搜索立即失效

```ts
// 连续搜索时，前一次自动失效
search('关键词 A')   // generation = 1，等待索引加载...
search('关键词 B')   // generation = 2，前一次被取消
```

### 分词策略

| 文本类型 | 策略               | 示例                                              |
|------|------------------|-------------------------------------------------|
| 中文   | 单字 + 相邻双字 bigram | `搜索` → `['搜', '索', '搜索']`                       |
| 英文   | 空格分词 + 小写化       | `Hello World` → `['hello', 'world']`            |
| 数字   | 连续数字整体 token     | `v2.0` → `['v2', '0']`                          |
| 混合   | 正则识别边界，分别处理      | `VitaPress搜索` → `['vitapress', '搜', '索', '搜索']` |
| 标点   | 直接忽略             | `你好，世界！` → `['你', '好', '世', '界']`               |

### 评分策略

- 标题匹配（`sectionIndex === -1`）：加权 **5 倍**
- 内容匹配：权重 **1 倍**
- 多个查询 token 命中同一段落时得分累加
- 最终按得分降序排列，截取 `maxResults` 条

### 体积优化

构建时的 `SearchDocBuild` 含分词数据（`titleTokens` / `contentTokens`），用于生成倒排索引。写入虚拟模块时剥离分词数据转为
`SearchDoc`，减少约 **50%** 索引体积——倒排索引已包含所有匹配信息，预分词数据在运行时不再需要。

## 类型

```ts
export interface SearchIndex {
  docs: SearchDoc[]
  index: Record<string, [number, number][]>
}

export interface SearchDoc {
  path: string
  title: string
  sections: SearchSection[]
  lang: string
}

export interface SearchSection {
  hash: string
  heading: string
  content: string
}

export interface SearchResult {
  path: string
  hash: string
  title: string
  heading: string
  content: string
  matchType: 'page' | 'content'
  score: number
}

export interface SearchResponse {
  status: 'success' | 'canceled'
  matched: SearchResult[]
}
```

## 测试

```bash
pnpm test
```

测试覆盖：

- **tokenizer.test.ts**：中文分词、英文分词、数字分词、中英混合、边界情况
- **splitter.test.ts**：按标题分段的正确性
- **builder.test.ts**：索引构建与路由映射
- **search.test.ts**：客户端搜索逻辑与评分

## peerDependencies

| 包               | 版本         |
|-----------------|------------|
| `vitapress`     | `^1.0.0`   |
| `vitarx`        | `^4.0.0-0` |
| `vitarx-router` | `^4.0.0-0` |

## License

MIT
