import { existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { createTestApp } from '../../testUtils.js'

describe('buildNavTree', () => {
  let tempDir: string

  beforeEach(() => {
    tempDir = join(tmpdir(), `nav-test-${Date.now()}`)
    mkdirSync(tempDir, { recursive: true })
  })

  afterEach(() => {
    if (existsSync(tempDir)) {
      rmSync(tempDir, { recursive: true, force: true })
    }
  })

  function createFile(relativePath: string, content: string): string {
    const fullPath = join(tempDir, relativePath)
    const dir = join(fullPath, '..')
    mkdirSync(dir, { recursive: true })
    writeFileSync(fullPath, content)
    return fullPath
  }

  describe('基础导航树生成', () => {
    it('应从目录分组生成 NavGroup', async () => {
      createFile('docs/guide/getting-started.md', '# Getting Started')
      createFile('docs/guide/advanced.md', '# Advanced')

      const app = await createTestApp(tempDir)
      app.router.generate()

      const navTree = app.router.navTree
      expect(navTree).not.toBeNull()
      const entries = navTree!['zh-CN']
      expect(entries).toBeDefined()
      expect(entries!.length).toBeGreaterThan(0)

      const guideGroup = entries!.find(e => e.type === 'group') as any
      expect(guideGroup).toBeDefined()
      expect(guideGroup.title).toBe('Guide')
      expect(guideGroup.items.length).toBe(2)
    })

    it('应从扁平文件生成 NavItem', async () => {
      createFile('docs/changelog.md', '# Changelog')

      const app = await createTestApp(tempDir)
      app.router.generate()

      const navTree = app.router.navTree
      expect(navTree).not.toBeNull()
      const entries = navTree!['zh-CN']
      expect(entries).toBeDefined()

      const item = entries!.find(e => e.type === 'item') as any
      expect(item).toBeDefined()
      expect(item.path).toBe('/changelog')
      expect(item.title).toBe('Changelog')
    })

    it('分组和独立项应同时存在', async () => {
      createFile('docs/guide/intro.md', '# Intro')
      createFile('docs/changelog.md', '# Changelog')

      const app = await createTestApp(tempDir)
      app.router.generate()

      const entries = app.router.navTree!['zh-CN']
      const groups = entries!.filter(e => e.type === 'group')
      const items = entries!.filter(e => e.type === 'item')

      expect(groups.length).toBe(1)
      expect(items.length).toBe(1)
    })
  })

  describe('index.md 处理', () => {
    it('有 index.md 的分组应有 path 属性', async () => {
      createFile('docs/guide/index.md', '# Guide')
      createFile('docs/guide/getting-started.md', '# Getting Started')

      const app = await createTestApp(tempDir)
      app.router.generate()

      const entries = app.router.navTree!['zh-CN']
      const guideGroup = entries!.find(e => e.type === 'group') as any

      expect(guideGroup).toBeDefined()
      expect(guideGroup.path).toBe('/guide')
    })

    it('无 index.md 的分组不应有 path 属性', async () => {
      createFile('docs/guide/getting-started.md', '# Getting Started')

      const app = await createTestApp(tempDir)
      app.router.generate()

      const entries = app.router.navTree!['zh-CN']
      const guideGroup = entries!.find(e => e.type === 'group') as any

      expect(guideGroup).toBeDefined()
      expect(guideGroup.path).toBeUndefined()
    })

    it('index.md 不应出现在 items 中', async () => {
      createFile('docs/guide/index.md', '# Guide')
      createFile('docs/guide/getting-started.md', '# Getting Started')

      const app = await createTestApp(tempDir)
      app.router.generate()

      const entries = app.router.navTree!['zh-CN']
      const guideGroup = entries!.find(e => e.type === 'group') as any

      const indexPaths = guideGroup.items.map((i: any) => i.path)
      expect(indexPaths).not.toContain('/guide')
      expect(indexPaths).toContain('/guide/getting-started')
    })
  })

  describe('navTitle 配置', () => {
    it('应优先使用 _config.ts 的 navTitle', async () => {
      createFile('docs/guide/_config.ts', `definePage({ meta: { navTitle: '指南' } })`)
      createFile('docs/guide/index.md', '---\nnavTitle: 指南2\n---\n# Guide')
      createFile('docs/guide/getting-started.md', '# Getting Started')

      const app = await createTestApp(tempDir)
      app.router.generate()

      const entries = app.router.navTree!['zh-CN']
      const guideGroup = entries!.find(e => e.type === 'group') as any

      expect(guideGroup.title).toBe('指南')
    })

    it('无 _config.ts 时应回退到 index.md 的 navTitle', async () => {
      createFile('docs/guide/index.md', '---\nnavTitle: 指南2\n---\n# Guide')
      createFile('docs/guide/getting-started.md', '# Getting Started')

      const app = await createTestApp(tempDir)
      app.router.generate()

      const entries = app.router.navTree!['zh-CN']
      const guideGroup = entries!.find(e => e.type === 'group') as any

      expect(guideGroup.title).toBe('指南2')
    })

    it('无 navTitle 时应从路径推断标题', async () => {
      createFile('docs/guide/getting-started.md', '# Getting Started')

      const app = await createTestApp(tempDir)
      app.router.generate()

      const entries = app.router.navTree!['zh-CN']
      const guideGroup = entries!.find(e => e.type === 'group') as any

      expect(guideGroup.title).toBe('Guide')
    })
  })

  describe('navOrder 排序', () => {
    it('应按 navOrder 升序排列', async () => {
      createFile('docs/api/_config.ts', `definePage({ meta: { navTitle: 'API', navOrder: 20 } })`)
      createFile('docs/api/rest.md', '# REST')
      createFile(
        'docs/guide/_config.ts',
        `definePage({ meta: { navTitle: '指南', navOrder: 10 } })`
      )
      createFile('docs/guide/intro.md', '# Intro')

      const app = await createTestApp(tempDir)
      app.router.generate()

      const entries = app.router.navTree!['zh-CN']
      const groups = entries!.filter(e => e.type === 'group')

      expect(groups[0]!.title).toBe('指南')
      expect(groups[1]!.title).toBe('API')
    })

    it('分组内 items 应按 navOrder 排序', async () => {
      createFile('docs/guide/advanced.md', '---\nnavOrder: 2\n---\n# Advanced')
      createFile('docs/guide/getting-started.md', '---\nnavOrder: 1\n---\n# Getting Started')

      const app = await createTestApp(tempDir)
      app.router.generate()

      const entries = app.router.navTree!['zh-CN']
      const guideGroup = entries!.find(e => e.type === 'group') as any

      expect(guideGroup.items[0].title).toBe('Getting Started')
      expect(guideGroup.items[1].title).toBe('Advanced')
    })
  })

  describe('navHidden 隐藏', () => {
    it('应隐藏 navHidden 为 true 的页面', async () => {
      createFile('docs/guide/intro.md', '# Intro')
      createFile('docs/guide/hidden.md', '---\nnavHidden: true\n---\n# Hidden')

      const app = await createTestApp(tempDir)
      app.router.generate()

      const entries = app.router.navTree!['zh-CN']
      const guideGroup = entries!.find(e => e.type === 'group') as any

      const paths = guideGroup.items.map((i: any) => i.path)
      expect(paths).not.toContain('/guide/hidden')
    })

    it('应隐藏 navHidden 为 true 的分组', async () => {
      createFile('docs/guide/_config.ts', `definePage({ meta: { navHidden: true } })`)
      createFile('docs/guide/intro.md', '# Intro')
      createFile('docs/api/rest.md', '# REST')

      const app = await createTestApp(tempDir)
      app.router.generate()

      const entries = app.router.navTree!['zh-CN']
      const titles = entries!.map(e => e.title)

      expect(titles).not.toContain('Guide')
    })

    it('应隐藏 navHidden 为 true 的独立项', async () => {
      createFile('docs/changelog.md', '---\nnavHidden: true\n---\n# Changelog')
      createFile('docs/guide/intro.md', '# Intro')

      const app = await createTestApp(tempDir)
      app.router.generate()

      const entries = app.router.navTree!['zh-CN']
      const paths = entries!.map(e => (e.type === 'item' ? e.path : null)).filter(Boolean)

      expect(paths).not.toContain('/changelog')
    })
  })

  describe('tocList', () => {
    it('NavItem 应携带 tocList', async () => {
      createFile('docs/guide/intro.md', '## Section 1\n### Subsection\n## Section 2')

      const app = await createTestApp(tempDir)
      app.router.generate()

      const entries = app.router.navTree!['zh-CN']
      const guideGroup = entries!.find(e => e.type === 'group') as any

      expect(guideGroup.items.length).toBe(1)
      expect(Array.isArray(guideGroup.items[0].tocList)).toBe(true)
    })
  })
})
