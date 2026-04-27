import { existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import type { RouteNode } from 'vitarx-router/file-router'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { VitaPressPlugin } from '../../../src/server/index.js'
import { createTestApp } from '../../testUtils.js'

vi.mock('vitarx-router/file-router', async importOriginal => {
  const mod = await importOriginal<typeof import('vitarx-router/file-router')>()
  return {
    ...mod,
    warn: vi.fn()
  }
})

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
    it('应正确初始化路由器', async () => {
      const docsDir = join(tempDir, 'docs')
      mkdirSync(docsDir, { recursive: true })
      writeFileSync(join(docsDir, 'index.md'), '# Home')

      const app = await createTestApp(tempDir)

      expect(app.router).toBeDefined()
    })

    it('应正确配置 importMode 为 lazy', async () => {
      const docsDir = join(tempDir, 'docs')
      mkdirSync(docsDir, { recursive: true })
      writeFileSync(join(docsDir, 'index.md'), '# Home')

      const { router } = await createTestApp(tempDir)
      const { code } = router.generate()

      expect(code).toContain('lazy')
    })

    it('应正确配置 pathStrategy 为 kebab', async () => {
      const docsDir = join(tempDir, 'docs')
      mkdirSync(docsDir, { recursive: true })
      writeFileSync(join(docsDir, 'MyPage.md'), '# My Page')

      const { router } = await createTestApp(tempDir)
      const { code } = router.generate()

      expect(code).toContain('my-page')
    })
  })

  describe('Markdown 文件转换', () => {
    it('应正确处理 Markdown 文件并生成路由', async () => {
      const docsDir = join(tempDir, 'docs')
      mkdirSync(docsDir, { recursive: true })
      writeFileSync(join(docsDir, 'guide.md'), '# Guide')

      const { router } = await createTestApp(tempDir)
      const { code } = router.generate()

      expect(code).toContain('export default')
      expect(code).toContain('path: "guide"')
      expect(code).toContain('guide.md')
    })

    it('应正确处理 Markdown 文件作为入口页', async () => {
      const docsDir = join(tempDir, 'docs')
      mkdirSync(docsDir, { recursive: true })
      writeFileSync(join(docsDir, 'index.md'), '# Home')

      const { router } = await createTestApp(tempDir)
      const { code } = router.generate()

      expect(code).toContain('export default')
      expect(code).toContain('path: "/"')
    })

    it('应正确处理 TSX 文件（配置 include）', async () => {
      const docsDir = join(tempDir, 'docs')
      mkdirSync(docsDir, { recursive: true })
      writeFileSync(
        join(docsDir, 'custom.tsx'),
        'export default function CustomPage() { return <div>Custom</div> }'
      )

      const { router } = await createTestApp(tempDir, {
        docDir: { dir: 'docs', include: ['**/*.tsx', '**/*.md'] }
      })
      const { code } = router.generate()

      expect(code).toContain('path: "custom"')
      expect(code).toContain('lazy')
    })
  })

  describe('插件扩展路由', () => {
    it('应调用插件的 extendRoute 钩子', async () => {
      const docsDir = join(tempDir, 'docs')
      mkdirSync(docsDir, { recursive: true })
      writeFileSync(join(docsDir, 'index.md'), '# Home')

      const extendRouteMock = vi.fn()
      const plugin: VitaPressPlugin = {
        name: 'test-plugin',
        extendRoute: extendRouteMock
      }

      const { router } = await createTestApp(tempDir, { plugins: [plugin] })
      router.generate()

      expect(extendRouteMock).toHaveBeenCalled()
    })

    it('应传递正确的参数给 extendRoute 钩子', async () => {
      const docsDir = join(tempDir, 'docs')
      mkdirSync(docsDir, { recursive: true })
      writeFileSync(join(docsDir, 'index.md'), '# Home')

      let capturedRoute: RouteNode | null = null

      const plugin: VitaPressPlugin = {
        name: 'test-plugin',
        extendRoute: route => {
          capturedRoute = route
        }
      }

      const { router } = await createTestApp(tempDir, { plugins: [plugin] })
      router.generate()

      expect(capturedRoute).not.toBeNull()
    })

    it('应处理插件 extendRoute 抛出的错误', async () => {
      const docsDir = join(tempDir, 'docs')
      mkdirSync(docsDir, { recursive: true })
      writeFileSync(join(docsDir, 'index.md'), '# Home')

      const plugin: VitaPressPlugin = {
        name: 'error-plugin',
        extendRoute: () => {
          throw new Error('Plugin error')
        }
      }

      const { router } = await createTestApp(tempDir, { plugins: [plugin] })

      expect(() => {
        router.generate()
      }).not.toThrow()
    })

    it('应支持多个插件的 extendRoute 钩子', async () => {
      const docsDir = join(tempDir, 'docs')
      mkdirSync(docsDir, { recursive: true })
      writeFileSync(join(docsDir, 'index.md'), '# Home')

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

      const { router } = await createTestApp(tempDir, { plugins })
      router.generate()

      expect(callOrder).toContain('plugin-1')
      expect(callOrder).toContain('plugin-2')
    })
  })

  describe('路由生成', () => {
    it('应生成正确的路由代码', async () => {
      const docsDir = join(tempDir, 'docs')
      mkdirSync(docsDir, { recursive: true })
      writeFileSync(join(docsDir, 'index.md'), '# Home')

      const { router } = await createTestApp(tempDir)
      const { code } = router.generate()

      expect(code).toContain('export default')
      expect(code).toContain('path: "/"')
    })

    it('应正确处理嵌套目录结构', async () => {
      const docsDir = join(tempDir, 'docs')
      const apiDir = join(docsDir, 'api')
      mkdirSync(apiDir, { recursive: true })
      writeFileSync(join(docsDir, 'index.md'), '# Home')
      writeFileSync(join(apiDir, 'intro.md'), '# Intro')

      const { router } = await createTestApp(tempDir)
      const { code } = router.generate()

      expect(code).toContain('path: "/"')
      expect(code).toContain('path: "api"')
      expect(code).toContain('path: "intro"')
    })

    it('应正确处理空文档目录', async () => {
      const docsDir = join(tempDir, 'docs')
      mkdirSync(docsDir, { recursive: true })

      const { router } = await createTestApp(tempDir)
      const { code } = router.generate()

      expect(code).toContain('export default')
    })
  })

  describe('页面目录配置', () => {
    it('应支持自定义文档目录', async () => {
      const customDocsDir = join(tempDir, 'custom-docs')
      mkdirSync(customDocsDir, { recursive: true })
      writeFileSync(join(customDocsDir, 'index.md'), '# Home')

      const { router } = await createTestApp(tempDir, { docDir: { dir: 'custom-docs' } })
      const { code } = router.generate()

      expect(code).toContain('export default')
    })

    it('应支持自定义文档目录前缀（group: false）', async () => {
      const docsDir = join(tempDir, 'docs')
      mkdirSync(docsDir, { recursive: true })
      writeFileSync(join(docsDir, 'index.md'), '# Home')

      const { router } = await createTestApp(tempDir, {
        docDir: { dir: 'docs', prefix: '/docs', group: false }
      })
      const { code } = router.generate()

      expect(code).toContain('path: "/docs"')
    })

    it('应支持额外的页面目录', async () => {
      const docsDir = join(tempDir, 'docs')
      const pagesDir = join(tempDir, 'pages')
      mkdirSync(docsDir, { recursive: true })
      mkdirSync(pagesDir, { recursive: true })
      writeFileSync(join(docsDir, 'index.md'), '# Home')
      writeFileSync(join(pagesDir, 'admin.tsx'), 'export default function Admin() {}')

      const { router } = await createTestApp(tempDir, {
        pageDirs: [{ dir: 'pages', prefix: '/', include: ['**/*.tsx'] }]
      })
      const { code } = router.generate()

      expect(code).toContain('path: "/admin"')
    })

    it('应支持自定义页面目录前缀（group: false）', async () => {
      const docsDir = join(tempDir, 'docs')
      const pagesDir = join(tempDir, 'pages')
      mkdirSync(docsDir, { recursive: true })
      mkdirSync(pagesDir, { recursive: true })
      writeFileSync(join(docsDir, 'index.md'), '# Home')
      writeFileSync(join(pagesDir, 'dashboard.tsx'), 'export default function Dashboard() {}')

      const { router } = await createTestApp(tempDir, {
        pageDirs: [{ dir: 'pages', prefix: '/app/', group: false, include: ['**/*.tsx'] }]
      })
      const { code } = router.generate()

      expect(code).toContain('path: "/app/dashboard"')
    })
  })

  describe('热更新支持', () => {
    it('应支持重新扫描路由', async () => {
      const docsDir = join(tempDir, 'docs')
      mkdirSync(docsDir, { recursive: true })
      writeFileSync(join(docsDir, 'index.md'), '# Home')

      const { router } = await createTestApp(tempDir)

      let { code } = router.generate()
      expect(code).toContain('path: "/"')
      expect(code).not.toContain('path: "guide"')

      writeFileSync(join(docsDir, 'guide.md'), '# Guide')
      router.reload()

      code = router.generate().code
      expect(code).toContain('path: "guide"')
    })

    it('应支持清空缓存', async () => {
      const docsDir = join(tempDir, 'docs')
      mkdirSync(docsDir, { recursive: true })
      writeFileSync(join(docsDir, 'index.md'), '# Home')

      const { router } = await createTestApp(tempDir)

      router.generate()
      router.clearGenerateResult()

      const { code } = router.generate()
      expect(code).toContain('export default')
    })
  })

  describe('DTS 配置', () => {
    it('应正确传递 dts 配置', async () => {
      const docsDir = join(tempDir, 'docs')
      mkdirSync(docsDir, { recursive: true })
      writeFileSync(join(docsDir, 'index.md'), '# Home')

      const { router } = await createTestApp(tempDir)

      expect(router).toBeDefined()
    })
  })

  describe('边界情况', () => {
    it('应处理没有插件的情况', async () => {
      const docsDir = join(tempDir, 'docs')
      mkdirSync(docsDir, { recursive: true })
      writeFileSync(join(docsDir, 'index.md'), '# Home')

      const { router } = await createTestApp(tempDir, { plugins: [] })
      const { code } = router.generate()

      expect(code).toContain('export default')
    })

    it('应处理插件没有 extendRoute 方法的情况', async () => {
      const docsDir = join(tempDir, 'docs')
      mkdirSync(docsDir, { recursive: true })
      writeFileSync(join(docsDir, 'index.md'), '# Home')

      const plugin: VitaPressPlugin = {
        name: 'plugin-without-extend'
      }

      const { router } = await createTestApp(tempDir, { plugins: [plugin] })
      const { code } = router.generate()

      expect(code).toContain('export default')
    })

    it('应处理多个文件类型混合的情况', async () => {
      const docsDir = join(tempDir, 'docs')
      mkdirSync(docsDir, { recursive: true })
      writeFileSync(join(docsDir, 'index.md'), '# Home')
      writeFileSync(join(docsDir, 'guide.md'), '# Guide')
      writeFileSync(join(docsDir, 'about.jsx'), 'export default function About() {}')

      const { router } = await createTestApp(tempDir, {
        docDir: { dir: 'docs', include: ['**/*.md', '**/*.jsx'] }
      })
      const { code } = router.generate()

      expect(code).toContain('export default')
      expect(code).toContain('guide.md')
      expect(code).toContain('about.jsx')
    })
  })
})
