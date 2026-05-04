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

  describe('文档布局配置', () => {
    it('应将 docLayoutPath 注入到文档路由的 component.default', async () => {
      const docsDir = join(tempDir, 'docs')
      mkdirSync(docsDir, { recursive: true })
      writeFileSync(join(docsDir, 'index.md'), '# Home')

      const layoutPath = join(tempDir, 'layout.tsx')
      writeFileSync(layoutPath, 'export default function Layout() {}')

      const { router } = await createTestApp(tempDir, {
        docLayoutPath: layoutPath
      })
      const { routes } = router.generate()

      const docsRoute = routes.find(route => route.filePath === join(tempDir, 'docs'))
      expect(docsRoute).toBeDefined()
      expect(docsRoute!.component).toBeDefined()
      expect(docsRoute!.component!['default']).toBe(layoutPath)
    })

    it('应在 docLayoutPath 文件不存在时不注入布局组件', async () => {
      const docsDir = join(tempDir, 'docs')
      mkdirSync(docsDir, { recursive: true })
      writeFileSync(join(docsDir, 'index.md'), '# Home')

      const layoutPath = join(tempDir, 'non-existent-layout.tsx')

      const { router } = await createTestApp(tempDir, {
        docLayoutPath: layoutPath
      })
      const { routes } = router.generate()

      const docsRoute = routes.find(route => route.filePath === join(tempDir, 'docs'))
      expect(docsRoute).toBeDefined()
      if (docsRoute!.component) {
        expect(docsRoute!.component['default']).not.toBe(layoutPath)
      }
    })

    it('应在 docLayoutPath 为 null 时不注入布局组件', async () => {
      const docsDir = join(tempDir, 'docs')
      mkdirSync(docsDir, { recursive: true })
      writeFileSync(join(docsDir, 'index.md'), '# Home')

      const { router } = await createTestApp(tempDir, {
        docLayoutPath: null
      })
      const { routes } = router.generate()

      const docsRoute = routes.find(route => route.filePath === join(tempDir, 'docs'))
      expect(docsRoute).toBeDefined()
      if (docsRoute!.component) {
        expect(docsRoute!.component['default']).toBeUndefined()
      }
    })

    it('应在不覆盖已有 component.default 的情况下补充布局', async () => {
      const docsDir = join(tempDir, 'docs')
      mkdirSync(docsDir, { recursive: true })
      writeFileSync(join(docsDir, 'index.md'), '# Home')
      writeFileSync(join(docsDir, '_layout.tsx'), 'export default function FileLayout() {}')

      const layoutPath = join(tempDir, 'plugin-layout.tsx')
      writeFileSync(layoutPath, 'export default function PluginLayout() {}')

      const { router } = await createTestApp(tempDir, {
        docLayoutPath: layoutPath
      })
      const { routes } = router.generate()

      const docsRoute = routes.find(route => route.filePath === join(tempDir, 'docs'))
      expect(docsRoute).toBeDefined()
      expect(docsRoute!.component).toBeDefined()
      expect(docsRoute!.component!['default']).not.toBe(layoutPath)
    })

    it('应在路由无 component 时设置 default 为布局组件', async () => {
      const docsDir = join(tempDir, 'docs')
      mkdirSync(docsDir, { recursive: true })
      writeFileSync(join(docsDir, 'index.md'), '# Home')

      const layoutPath = join(tempDir, 'layout.tsx')
      writeFileSync(layoutPath, 'export default function Layout() {}')

      const { router } = await createTestApp(tempDir, {
        docLayoutPath: layoutPath
      })
      const { routes } = router.generate()

      const docsRoute = routes.find(route => route.filePath === join(tempDir, 'docs'))
      expect(docsRoute).toBeDefined()
      expect(docsRoute!.component).toEqual({ default: layoutPath })
    })
  })

  describe('首页组件配置', () => {
    it('应在根路径未被占用时添加首页路由', async () => {
      const docsDir = join(tempDir, 'docs')
      mkdirSync(docsDir, { recursive: true })
      writeFileSync(join(docsDir, 'guide.md'), '# Guide')

      const homePath = join(tempDir, 'home.tsx')
      writeFileSync(homePath, 'export default function Home() {}')

      const { router } = await createTestApp(tempDir, { homePath })
      const { routes } = router.generate()

      const homeRoute = routes.find(route => route.fullPath === '/' && !route.isGroup)
      expect(homeRoute).toBeDefined()
      expect(homeRoute!.component).toBeDefined()
      expect(homeRoute!.component!['default']).toBe(homePath)
    })

    it('应在根路径被 docs/index.md 占用时不添加首页路由', async () => {
      const docsDir = join(tempDir, 'docs')
      mkdirSync(docsDir, { recursive: true })
      writeFileSync(join(docsDir, 'index.md'), '# Home')

      const homePath = join(tempDir, 'home.tsx')
      writeFileSync(homePath, 'export default function Home() {}')

      const { router } = await createTestApp(tempDir, { homePath })
      const { routes } = router.generate()

      const homeRoute = routes.find(
        route => route.fullPath === '/' && !route.isGroup && route.filePath === homePath
      )
      expect(homeRoute).toBeUndefined()
    })

    it('应在根路径被 pages/index.tsx 占用时不添加首页路由', async () => {
      const docsDir = join(tempDir, 'docs')
      const pagesDir = join(tempDir, 'pages')
      mkdirSync(docsDir, { recursive: true })
      mkdirSync(pagesDir, { recursive: true })
      writeFileSync(join(docsDir, 'guide.md'), '# Guide')
      writeFileSync(join(pagesDir, 'index.tsx'), 'export default function Page() {}')

      const homePath = join(tempDir, 'home.tsx')
      writeFileSync(homePath, 'export default function Home() {}')

      const { router } = await createTestApp(tempDir, {
        homePath,
        pageDirs: [{ dir: 'pages', prefix: '/', include: ['**/*.tsx'] }]
      })
      const { routes } = router.generate()

      const homeRoute = routes.find(
        route => route.fullPath === '/' && !route.isGroup && route.filePath === homePath
      )
      expect(homeRoute).toBeUndefined()
    })

    it('应在 homePath 为 null 时不添加首页路由', async () => {
      const docsDir = join(tempDir, 'docs')
      mkdirSync(docsDir, { recursive: true })
      writeFileSync(join(docsDir, 'guide.md'), '# Guide')

      const { router } = await createTestApp(tempDir, { homePath: null })
      const { routes } = router.generate()

      const homeRoute = routes.find(
        route => !route.isGroup && route.path === '/' && route.meta?.['lang']
      )
      expect(homeRoute).toBeUndefined()
    })

    it('应在 homePath 文件不存在时不添加首页路由', async () => {
      const docsDir = join(tempDir, 'docs')
      mkdirSync(docsDir, { recursive: true })
      writeFileSync(join(docsDir, 'guide.md'), '# Guide')

      const homePath = join(tempDir, 'non-existent-home.tsx')

      const { router } = await createTestApp(tempDir, { homePath })
      const { routes } = router.generate()

      const homeRoute = routes.find(
        route => !route.isGroup && route.path === '/' && route.filePath === homePath
      )
      expect(homeRoute).toBeUndefined()
    })

    it('应同时支持 docLayoutPath 和 homePath', async () => {
      const docsDir = join(tempDir, 'docs')
      mkdirSync(docsDir, { recursive: true })
      writeFileSync(join(docsDir, 'guide.md'), '# Guide')

      const layoutPath = join(tempDir, 'layout.tsx')
      writeFileSync(layoutPath, 'export default function Layout() {}')
      const homePath = join(tempDir, 'home.tsx')
      writeFileSync(homePath, 'export default function Home() {}')

      const { router } = await createTestApp(tempDir, {
        docLayoutPath: layoutPath,
        homePath
      })
      const { routes } = router.generate()

      const docsRoute = routes.find(route => route.filePath === join(tempDir, 'docs'))
      expect(docsRoute).toBeDefined()
      expect(docsRoute!.component!['default']).toBe(layoutPath)

      const homeRoute = routes.find(route => route.fullPath === '/' && !route.isGroup)
      expect(homeRoute).toBeDefined()
      expect(homeRoute!.component!['default']).toBe(homePath)
    })

    it('应为多语言配置添加非默认语言的首页路由', async () => {
      const docsDir = join(tempDir, 'docs')
      mkdirSync(docsDir, { recursive: true })
      writeFileSync(join(docsDir, 'guide.md'), '# Guide')

      const homePath = join(tempDir, 'home.tsx')
      writeFileSync(homePath, 'export default function Home() {}')

      const { router } = await createTestApp(tempDir, {
        homePath,
        locales: [
          { id: 'zh-CN', name: '简体中文' },
          { id: 'en-US', name: 'English' }
        ]
      })
      const { routes } = router.generate()

      const defaultHomeRoute = routes.find(route => route.fullPath === '/' && !route.isGroup)
      expect(defaultHomeRoute).toBeDefined()
      expect(defaultHomeRoute!.component!['default']).toBe(homePath)
      expect(defaultHomeRoute!.meta!['lang']).toBe('zh-CN')

      const enHomeRoute = routes.find(route => route.fullPath === '/index-en-us' && !route.isGroup)
      expect(enHomeRoute).toBeDefined()
      expect(enHomeRoute!.component!['default']).toBe(homePath)
      expect(enHomeRoute!.meta!['lang']).toBe('en-US')
    })

    it('应在多语言时非默认语言的首页路径被占用时不添加该语言路由', async () => {
      const docsDir = join(tempDir, 'docs')
      const pagesDir = join(tempDir, 'pages')
      mkdirSync(docsDir, { recursive: true })
      mkdirSync(pagesDir, { recursive: true })
      writeFileSync(join(docsDir, 'guide.md'), '# Guide')
      writeFileSync(join(pagesDir, 'index-en-US.tsx'), 'export default function Page() {}')

      const homePath = join(tempDir, 'home.tsx')
      writeFileSync(homePath, 'export default function Home() {}')

      const { router } = await createTestApp(tempDir, {
        homePath,
        locales: [
          { id: 'zh-CN', name: '简体中文' },
          { id: 'en-US', name: 'English' }
        ],
        pageDirs: [{ dir: 'pages', prefix: '/', include: ['**/*.tsx'] }]
      })
      const { routes } = router.generate()

      const defaultHomeRoute = routes.find(route => route.fullPath === '/' && !route.isGroup)
      expect(defaultHomeRoute).toBeDefined()

      const enHomeRoute = routes.find(
        route => route.fullPath === '/index-en-us' && !route.isGroup && route.filePath === homePath
      )
      expect(enHomeRoute).toBeUndefined()
    })

    it('应为三个以上的语言配置添加所有非默认语言的首页路由', async () => {
      const docsDir = join(tempDir, 'docs')
      mkdirSync(docsDir, { recursive: true })
      writeFileSync(join(docsDir, 'guide.md'), '# Guide')

      const homePath = join(tempDir, 'home.tsx')
      writeFileSync(homePath, 'export default function Home() {}')

      const { router } = await createTestApp(tempDir, {
        homePath,
        locales: [
          { id: 'zh-CN', name: '简体中文' },
          { id: 'en-US', name: 'English' },
          { id: 'ja-JP', name: '日本語' }
        ]
      })
      const { routes } = router.generate()

      const defaultHomeRoute = routes.find(route => route.fullPath === '/' && !route.isGroup)
      expect(defaultHomeRoute).toBeDefined()
      expect(defaultHomeRoute!.meta!['lang']).toBe('zh-CN')

      const enHomeRoute = routes.find(route => route.fullPath === '/index-en-us' && !route.isGroup)
      expect(enHomeRoute).toBeDefined()
      expect(enHomeRoute!.meta!['lang']).toBe('en-US')

      const jaHomeRoute = routes.find(route => route.fullPath === '/index-ja-jp' && !route.isGroup)
      expect(jaHomeRoute).toBeDefined()
      expect(jaHomeRoute!.meta!['lang']).toBe('ja-JP')
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
