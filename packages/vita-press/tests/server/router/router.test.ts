import { existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import type { ParsedNode, RouteNode } from 'vitarx-router/file-router'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { VitaPressApp } from '../../../src/server/app/index.js'
import type { ResolvedConfig, VitaPressPlugin } from '../../../src/server/index.js'
import type { MdParser, MdParseResult } from '../../../src/server/markdown/index.js'
import { VitaPressRouter } from '../../../src/server/router/router.js'

vi.mock('vitarx-router/file-router', async importOriginal => {
  const mod = await importOriginal<typeof import('vitarx-router/file-router')>()
  return {
    ...mod,
    warn: vi.fn()
  }
})

function createMockMdParser(): MdParser {
  return {
    parse: vi.fn().mockImplementation((filePath: string): MdParseResult => {
      return {
        content: `// 此文件由vita-press自动生成
import { builder } from 'vitarx'
definePage({
  meta: {}
})
export default builder(() => {
  return <article class="v-doc-content">Mock MD Content</article>
})
`,
        filePath,
        meta: {
          title: 'Mock Title',
          description: 'Mock Description',
          lang: 'zh-CN',
          authors: [],
          createdAt: '',
          lastUpdateAt: '',
          tocList: [],
          relativePath: filePath
        }
      }
    })
  } as any
}

function createMockApp(options: {
  root: string
  docDir?: string | { dir: string; prefix?: string; group?: boolean }
  pageDirs?: { dir: string; prefix?: string; group?: boolean }[]
  languages?: string[]
  plugins?: VitaPressPlugin[]
  mdParser?: MdParser
}): VitaPressApp {
  const docDirConfig =
    typeof options.docDir === 'string'
      ? {
          dir: options.docDir,
          prefix: '/',
          include: ['**/*.{tsx,jsx,md}'],
          exclude: ['**/.*'],
          group: true
        }
      : {
          dir: 'docs',
          prefix: '/',
          include: ['**/*.{tsx,jsx,md}'],
          exclude: ['**/.*'],
          group: true,
          ...options.docDir
        }

  const config: ResolvedConfig = {
    title: '',
    description: '',
    keywords: '',
    lang: options.languages || 'zh-CN',
    docDir: docDirConfig,
    pageDirs:
      options.pageDirs?.map(p => ({
        dir: p.dir,
        prefix: p.prefix || '/',
        include: ['**/*.{tsx,jsx,md}'],
        exclude: ['**/.*'],
        group: p.group ?? true
      })) || [],
    dts: false,
    plugins: options.plugins || [],
    injectHead: [],
    injectBody: [],
    injectCode: [],
    markdownIt: {},
    viteConfig: {
      base: '/',
      publicDir: '.vitapress/public',
      define: {},
      plugins: [],
      resolve: {},
      server: {}
    }
  } as ResolvedConfig

  return {
    root: options.root,
    config,
    plugins: options.plugins || [],
    mdParser: options.mdParser || createMockMdParser(),
    command: 'serve',
    isDev: true,
    docDirPath: join(options.root, docDirConfig.dir)
  } as unknown as VitaPressApp
}

describe('VitaPressRouter', () => {
  let tempDir: string

  beforeEach(() => {
    tempDir = join(process.cwd(), 'temp-test-router-' + Date.now())
    mkdirSync(tempDir, { recursive: true })
  })

  afterEach(() => {
    if (existsSync(tempDir)) {
      rmSync(tempDir, { recursive: true, force: true })
    }
  })

  describe('初始化与配置', () => {
    it('应正确初始化路由器', () => {
      const docsDir = join(tempDir, 'docs')
      mkdirSync(docsDir, { recursive: true })
      writeFileSync(join(docsDir, 'index.tsx'), 'export default function Page() {}')

      const app = createMockApp({ root: tempDir })
      const router = new VitaPressRouter(app)

      expect(router).toBeDefined()
    })

    it('应正确配置 importMode 为 lazy', () => {
      const docsDir = join(tempDir, 'docs')
      mkdirSync(docsDir, { recursive: true })
      writeFileSync(join(docsDir, 'index.tsx'), 'export default function Page() {}')

      const app = createMockApp({ root: tempDir })
      const router = new VitaPressRouter(app)
      const { code } = router.generate()

      expect(code).toContain('lazy')
    })

    it('应正确配置 pathStrategy 为 kebab', () => {
      const docsDir = join(tempDir, 'docs')
      mkdirSync(docsDir, { recursive: true })
      writeFileSync(join(docsDir, 'MyPage.tsx'), 'export default function Page() {}')

      const app = createMockApp({ root: tempDir })
      const router = new VitaPressRouter(app)
      const { code } = router.generate()

      expect(code).toContain('my-page')
    })
  })

  describe('Markdown 文件转换', () => {
    it('应正确处理 Markdown 文件并生成路由', () => {
      const docsDir = join(tempDir, 'docs')
      mkdirSync(docsDir, { recursive: true })
      writeFileSync(join(docsDir, 'guide.md'), '# Guide')

      const app = createMockApp({ root: tempDir })
      const router = new VitaPressRouter(app)
      const { code } = router.generate()

      expect(code).toContain('export default')
      expect(code).toContain('path: "guide"')
      expect(code).toContain('guide.md')
    })

    it('应正确处理 Markdown 文件作为入口页', () => {
      const docsDir = join(tempDir, 'docs')
      mkdirSync(docsDir, { recursive: true })
      writeFileSync(join(docsDir, 'index.md'), '# Home')

      const app = createMockApp({ root: tempDir })
      const router = new VitaPressRouter(app)
      const { code } = router.generate()

      expect(code).toContain('export default')
      expect(code).toContain('path: "/"')
    })

    it('应正确处理 TSX 文件', () => {
      const docsDir = join(tempDir, 'docs')
      mkdirSync(docsDir, { recursive: true })
      writeFileSync(
        join(docsDir, 'custom.tsx'),
        'export default function CustomPage() { return <div>Custom</div> }'
      )

      const app = createMockApp({ root: tempDir })
      const router = new VitaPressRouter(app)
      const { code } = router.generate()

      expect(code).toContain('path: "custom"')
      expect(code).toContain('lazy')
    })
  })

  describe('插件扩展路由', () => {
    it('应调用插件的 extendRoute 钩子', () => {
      const docsDir = join(tempDir, 'docs')
      mkdirSync(docsDir, { recursive: true })
      writeFileSync(join(docsDir, 'index.tsx'), 'export default function Page() {}')

      const extendRouteMock = vi.fn()
      const plugin: VitaPressPlugin = {
        name: 'test-plugin',
        extendRoute: extendRouteMock
      }

      const app = createMockApp({ root: tempDir, plugins: [plugin] })
      const router = new VitaPressRouter(app)
      router.generate()

      expect(extendRouteMock).toHaveBeenCalled()
    })

    it('应传递正确的参数给 extendRoute 钩子', () => {
      const docsDir = join(tempDir, 'docs')
      mkdirSync(docsDir, { recursive: true })
      writeFileSync(join(docsDir, 'index.tsx'), 'export default function Page() {}')

      let capturedRoute: RouteNode | null = null
      let capturedParsed: ParsedNode | null = null

      const plugin: VitaPressPlugin = {
        name: 'test-plugin',
        extendRoute: (route, parsed) => {
          capturedRoute = route
          capturedParsed = parsed
        }
      }

      const app = createMockApp({ root: tempDir, plugins: [plugin] })
      const router = new VitaPressRouter(app)
      router.generate()

      expect(capturedRoute).not.toBeNull()
      expect(capturedParsed).not.toBeNull()
    })

    it('应处理插件 extendRoute 抛出的错误', () => {
      const docsDir = join(tempDir, 'docs')
      mkdirSync(docsDir, { recursive: true })
      writeFileSync(join(docsDir, 'index.tsx'), 'export default function Page() {}')

      const plugin: VitaPressPlugin = {
        name: 'error-plugin',
        extendRoute: () => {
          throw new Error('Plugin error')
        }
      }

      const app = createMockApp({ root: tempDir, plugins: [plugin] })

      expect(() => {
        const router = new VitaPressRouter(app)
        router.generate()
      }).not.toThrow()
    })

    it('应支持多个插件的 extendRoute 钩子', () => {
      const docsDir = join(tempDir, 'docs')
      mkdirSync(docsDir, { recursive: true })
      writeFileSync(join(docsDir, 'index.tsx'), 'export default function Page() {}')

      const callOrder: string[] = []
      const plugins: VitaPressPlugin[] = [
        {
          name: 'plugin-1',
          extendRoute: () => {
            callOrder.push('plugin-1')
          }
        },
        {
          name: 'plugin-2',
          extendRoute: () => {
            callOrder.push('plugin-2')
          }
        }
      ]

      const app = createMockApp({ root: tempDir, plugins })
      const router = new VitaPressRouter(app)
      router.generate()

      expect(callOrder).toContain('plugin-1')
      expect(callOrder).toContain('plugin-2')
    })
  })

  describe('路由生成', () => {
    it('应生成正确的路由代码', () => {
      const docsDir = join(tempDir, 'docs')
      mkdirSync(docsDir, { recursive: true })
      writeFileSync(join(docsDir, 'index.tsx'), 'export default function Page() {}')

      const app = createMockApp({ root: tempDir })
      const router = new VitaPressRouter(app)
      const { code } = router.generate()

      expect(code).toContain('export default')
      expect(code).toContain('path: "/"')
    })

    it('应正确处理嵌套目录结构', () => {
      const docsDir = join(tempDir, 'docs')
      const apiDir = join(docsDir, 'api')
      mkdirSync(apiDir, { recursive: true })
      writeFileSync(join(docsDir, 'index.tsx'), 'export default function Page() {}')
      writeFileSync(join(apiDir, 'intro.tsx'), 'export default function Intro() {}')

      const app = createMockApp({ root: tempDir })
      const router = new VitaPressRouter(app)
      const { code } = router.generate()

      expect(code).toContain('path: "/"')
      expect(code).toContain('path: "api"')
      expect(code).toContain('path: "intro"')
    })

    it('应正确处理空文档目录', () => {
      const docsDir = join(tempDir, 'docs')
      mkdirSync(docsDir, { recursive: true })

      const app = createMockApp({ root: tempDir })
      const router = new VitaPressRouter(app)
      const { code } = router.generate()

      expect(code).toContain('export default')
    })
  })

  describe('页面目录配置', () => {
    it('应支持自定义文档目录', () => {
      const customDocsDir = join(tempDir, 'custom-docs')
      mkdirSync(customDocsDir, { recursive: true })
      writeFileSync(join(customDocsDir, 'index.tsx'), 'export default function Page() {}')

      const app = createMockApp({ root: tempDir, docDir: 'custom-docs' })
      const router = new VitaPressRouter(app)
      const { code } = router.generate()

      expect(code).toContain('export default')
    })

    it('应支持自定义文档目录前缀（group: false）', () => {
      const docsDir = join(tempDir, 'docs')
      mkdirSync(docsDir, { recursive: true })
      writeFileSync(join(docsDir, 'index.tsx'), 'export default function Page() {}')

      const app = createMockApp({
        root: tempDir,
        docDir: { dir: 'docs', prefix: '/docs', group: false }
      })
      const router = new VitaPressRouter(app)
      const { code } = router.generate()

      expect(code).toContain('path: "/docs"')
    })

    it('应支持额外的页面目录', () => {
      const docsDir = join(tempDir, 'docs')
      const pagesDir = join(tempDir, 'pages')
      mkdirSync(docsDir, { recursive: true })
      mkdirSync(pagesDir, { recursive: true })
      writeFileSync(join(docsDir, 'index.tsx'), 'export default function Page() {}')
      writeFileSync(join(pagesDir, 'admin.tsx'), 'export default function Admin() {}')

      const app = createMockApp({
        root: tempDir,
        pageDirs: [{ dir: 'pages', prefix: '/' }]
      })
      const router = new VitaPressRouter(app)
      const { code } = router.generate()

      expect(code).toContain('path: "admin"')
    })

    it('应支持自定义页面目录前缀（group: false）', () => {
      const docsDir = join(tempDir, 'docs')
      const pagesDir = join(tempDir, 'pages')
      mkdirSync(docsDir, { recursive: true })
      mkdirSync(pagesDir, { recursive: true })
      writeFileSync(join(docsDir, 'index.tsx'), 'export default function Page() {}')
      writeFileSync(join(pagesDir, 'dashboard.tsx'), 'export default function Dashboard() {}')

      const app = createMockApp({
        root: tempDir,
        pageDirs: [{ dir: 'pages', prefix: '/app/', group: false }]
      })
      const router = new VitaPressRouter(app)
      const { code } = router.generate()

      expect(code).toContain('path: "/app/dashboard"')
    })
  })

  describe('热更新支持', () => {
    it('应支持重新扫描路由', () => {
      const docsDir = join(tempDir, 'docs')
      mkdirSync(docsDir, { recursive: true })
      writeFileSync(join(docsDir, 'index.tsx'), 'export default function Page() {}')

      const app = createMockApp({ root: tempDir })
      const router = new VitaPressRouter(app)

      let { code } = router.generate()
      expect(code).toContain('path: "/"')
      expect(code).not.toContain('path: "guide"')

      writeFileSync(join(docsDir, 'guide.tsx'), 'export default function Guide() {}')
      router.reload()

      code = router.generate().code
      expect(code).toContain('path: "guide"')
    })

    it('应支持清空缓存', () => {
      const docsDir = join(tempDir, 'docs')
      mkdirSync(docsDir, { recursive: true })
      writeFileSync(join(docsDir, 'index.tsx'), 'export default function Page() {}')

      const app = createMockApp({ root: tempDir })
      const router = new VitaPressRouter(app)

      router.generate()
      router.clearGenerateResult()

      const { code } = router.generate()
      expect(code).toContain('export default')
    })
  })

  describe('DTS 配置', () => {
    it('应正确传递 dts 配置', () => {
      const docsDir = join(tempDir, 'docs')
      mkdirSync(docsDir, { recursive: true })
      writeFileSync(join(docsDir, 'index.tsx'), 'export default function Page() {}')

      const app = createMockApp({ root: tempDir })
      const router = new VitaPressRouter(app)

      expect(router).toBeDefined()
    })
  })

  describe('边界情况', () => {
    it('应处理没有插件的情况', () => {
      const docsDir = join(tempDir, 'docs')
      mkdirSync(docsDir, { recursive: true })
      writeFileSync(join(docsDir, 'index.tsx'), 'export default function Page() {}')

      const app = createMockApp({ root: tempDir, plugins: [] })
      const router = new VitaPressRouter(app)
      const { code } = router.generate()

      expect(code).toContain('export default')
    })

    it('应处理插件没有 extendRoute 方法的情况', () => {
      const docsDir = join(tempDir, 'docs')
      mkdirSync(docsDir, { recursive: true })
      writeFileSync(join(docsDir, 'index.tsx'), 'export default function Page() {}')

      const plugin: VitaPressPlugin = {
        name: 'plugin-without-extend'
      }

      const app = createMockApp({ root: tempDir, plugins: [plugin] })
      const router = new VitaPressRouter(app)
      const { code } = router.generate()

      expect(code).toContain('export default')
    })

    it('应处理多个文件类型混合的情况', () => {
      const docsDir = join(tempDir, 'docs')
      mkdirSync(docsDir, { recursive: true })
      writeFileSync(join(docsDir, 'index.tsx'), 'export default function Page() {}')
      writeFileSync(join(docsDir, 'guide.md'), '# Guide')
      writeFileSync(join(docsDir, 'about.jsx'), 'export default function About() {}')

      const app = createMockApp({ root: tempDir })
      const router = new VitaPressRouter(app)
      const { code } = router.generate()

      expect(code).toContain('export default')
      expect(code).toContain('guide.md')
      expect(code).toContain('about.jsx')
    })
  })
})
