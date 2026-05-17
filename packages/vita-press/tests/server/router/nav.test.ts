import { existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import type { RouteNode } from 'vitarx-router/file-router'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import type { NavEntry, NavGroup, NavItem } from '../../../src/types/nav.js'
import { createTestApp } from '../../testUtils.js'

const DEFAULT_DOC_PATH = '/'

function flattenNavItems(entries: NavEntry[]): NavItem[] {
  const items: NavItem[] = []
  for (const entry of entries) {
    if (entry.type === 'group') {
      items.push(...entry.items)
    } else {
      items.push(entry)
    }
  }
  return items
}

/**
 * 递归查找 fullPath 匹配的路由节点
 *
 * @param routes - 路由节点数组
 * @param fullPath - 目标完整路径
 * @returns 匹配的路由节点，未找到返回 null
 */
function findRouteByFullPath(routes: RouteNode[], fullPath: string): RouteNode | null {
  for (const route of routes) {
    if (route.fullPath === fullPath) return route
    if (route.children) {
      const found = findRouteByFullPath(route.children, fullPath)
      if (found) return found
    }
  }
  return null
}

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
      const entries = navTree!['zh-CN']![DEFAULT_DOC_PATH]
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
      const entries = navTree!['zh-CN']![DEFAULT_DOC_PATH]
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

      const entries = app.router.navTree!['zh-CN']![DEFAULT_DOC_PATH]
      const groups = entries!.filter(e => e.type === 'group')
      const items = entries!.filter(e => e.type === 'item')

      expect(groups.length).toBe(1)
      expect(items.length).toBe(1)
    })
  })

  describe('index.md 处理', () => {
    it('有 index.md 的分组 path 和 indexPath 应均存在', async () => {
      createFile('docs/guide/index.md', '# Guide')
      createFile('docs/guide/getting-started.md', '# Getting Started')

      const app = await createTestApp(tempDir)
      app.router.generate()

      const entries = app.router.navTree!['zh-CN']![DEFAULT_DOC_PATH]
      const guideGroup = entries!.find(e => e.type === 'group') as NavGroup

      expect(guideGroup).toBeDefined()
      expect(guideGroup.path).toBe('/guide')
      expect(guideGroup.indexPath).toBe('/guide')
    })

    it('无 index.md 的分组 path 应存在但 indexPath 应不存在', async () => {
      createFile('docs/guide/getting-started.md', '# Getting Started')

      const app = await createTestApp(tempDir)
      app.router.generate()

      const entries = app.router.navTree!['zh-CN']![DEFAULT_DOC_PATH]
      const guideGroup = entries!.find(e => e.type === 'group') as NavGroup

      expect(guideGroup).toBeDefined()
      expect(guideGroup.path).toBe('/guide')
      expect(guideGroup.indexPath).toBeUndefined()
    })

    it('index.md 不应出现在 items 中', async () => {
      createFile('docs/guide/index.md', '# Guide')
      createFile('docs/guide/getting-started.md', '# Getting Started')

      const app = await createTestApp(tempDir)
      app.router.generate()

      const entries = app.router.navTree!['zh-CN']![DEFAULT_DOC_PATH]
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

      const entries = app.router.navTree!['zh-CN']![DEFAULT_DOC_PATH]
      const guideGroup = entries!.find(e => e.type === 'group') as any

      expect(guideGroup.title).toBe('指南')
    })

    it('无 _config.ts 时应回退到 index.md 的 navTitle', async () => {
      createFile('docs/guide/index.md', '---\nnavTitle: 指南2\n---\n# Guide')
      createFile('docs/guide/getting-started.md', '# Getting Started')

      const app = await createTestApp(tempDir)
      app.router.generate()

      const entries = app.router.navTree!['zh-CN']![DEFAULT_DOC_PATH]
      const guideGroup = entries!.find(e => e.type === 'group') as any

      expect(guideGroup.title).toBe('指南2')
    })

    it('无 navTitle 时应从路径推断标题', async () => {
      createFile('docs/guide/getting-started.md', '# Getting Started')

      const app = await createTestApp(tempDir)
      app.router.generate()

      const entries = app.router.navTree!['zh-CN']![DEFAULT_DOC_PATH]
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

      const entries = app.router.navTree!['zh-CN']![DEFAULT_DOC_PATH]
      const groups = entries!.filter(e => e.type === 'group')

      expect(groups[0]!.title).toBe('指南')
      expect(groups[1]!.title).toBe('API')
    })

    it('分组内 items 应按 navOrder 排序', async () => {
      createFile('docs/guide/advanced.md', '---\nnavOrder: 2\n---\n# Advanced')
      createFile('docs/guide/getting-started.md', '---\nnavOrder: 1\n---\n# Getting Started')

      const app = await createTestApp(tempDir)
      app.router.generate()

      const entries = app.router.navTree!['zh-CN']![DEFAULT_DOC_PATH]
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

      const entries = app.router.navTree!['zh-CN']![DEFAULT_DOC_PATH]
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

      const entries = app.router.navTree!['zh-CN']![DEFAULT_DOC_PATH]
      const titles = entries!.map(e => e.title)

      expect(titles).not.toContain('Guide')
    })

    it('应隐藏 navHidden 为 true 的独立项', async () => {
      createFile('docs/changelog.md', '---\nnavHidden: true\n---\n# Changelog')
      createFile('docs/guide/intro.md', '# Intro')

      const app = await createTestApp(tempDir)
      app.router.generate()

      const entries = app.router.navTree!['zh-CN']![DEFAULT_DOC_PATH]
      const paths = entries!.map(e => (e.type === 'item' ? e.path : null)).filter(Boolean)

      expect(paths).not.toContain('/changelog')
    })
  })

  describe('分页数据 (Pagination)', () => {
    it('唯一 NavItem 的 prev 和 next 应均为 null', async () => {
      createFile('docs/changelog.md', '# Changelog')

      const app = await createTestApp(tempDir)
      app.router.generate()
      const route = app.router.generate().routes[0]!.children![0]!
      const entries = app.router.navTree!['zh-CN']![DEFAULT_DOC_PATH]!
      const items = flattenNavItems(entries)

      expect(items.length).toBe(1)
      expect(route.meta!['pagination'].prev).toBeNull()
      expect(route.meta!['pagination'].next).toBeNull()
    })

    it('同分组内多个 NavItem 应按顺序串联 prev/next', async () => {
      createFile('docs/guide/getting-started.md', '---\nnavOrder: 1\n---\n# Getting Started')
      createFile('docs/guide/advanced.md', '---\nnavOrder: 2\n---\n# Advanced')
      createFile('docs/guide/deployment.md', '---\nnavOrder: 3\n---\n# Deployment')

      const app = await createTestApp(tempDir)
      const { routes } = app.router.generate()
      const entries = app.router.navTree!['zh-CN']![DEFAULT_DOC_PATH]!
      const items = flattenNavItems(entries)

      expect(items.length).toBe(3)

      const route1 = findRouteByFullPath(routes, '/guide/getting-started')!
      const route2 = findRouteByFullPath(routes, '/guide/advanced')!
      const route3 = findRouteByFullPath(routes, '/guide/deployment')!

      expect(route1.meta!['pagination'].prev).toBeNull()
      expect(route1.meta!['pagination'].next).toEqual({
        title: 'Advanced',
        path: '/guide/advanced'
      })

      expect(route2.meta!['pagination'].prev).toEqual({
        title: 'Getting Started',
        path: '/guide/getting-started'
      })
      expect(route2.meta!['pagination'].next).toEqual({
        title: 'Deployment',
        path: '/guide/deployment'
      })

      expect(route3.meta!['pagination'].prev).toEqual({
        title: 'Advanced',
        path: '/guide/advanced'
      })
      expect(route3.meta!['pagination'].next).toBeNull()
    })

    it('跨分组的 NavItem 应连续串联分页', async () => {
      createFile(
        'docs/guide/_config.ts',
        `definePage({ meta: { navTitle: 'Guide', navOrder: 10 } })`
      )
      createFile('docs/guide/intro.md', '# Intro')
      createFile('docs/api/_config.ts', `definePage({ meta: { navTitle: 'API', navOrder: 20 } })`)
      createFile('docs/api/rest.md', '# REST')

      const app = await createTestApp(tempDir)
      const { routes } = app.router.generate()
      const entries = app.router.navTree!['zh-CN']![DEFAULT_DOC_PATH]!
      const items = flattenNavItems(entries)

      expect(items.length).toBe(2)

      const introRoute = findRouteByFullPath(routes, '/guide/intro')!
      const restRoute = findRouteByFullPath(routes, '/api/rest')!

      expect(introRoute.meta!['pagination'].prev).toBeNull()
      expect(introRoute.meta!['pagination'].next).toEqual({ title: 'REST', path: '/api/rest' })

      expect(restRoute.meta!['pagination'].prev).toEqual({ title: 'Intro', path: '/guide/intro' })
      expect(restRoute.meta!['pagination'].next).toBeNull()
    })

    it('独立项与分组项应混合串联分页', async () => {
      createFile(
        'docs/guide/_config.ts',
        `definePage({ meta: { navTitle: 'Guide', navOrder: 10 } })`
      )
      createFile('docs/guide/intro.md', '---\nnavOrder: 1\n---\n# Intro')
      createFile('docs/guide/advanced.md', '---\nnavOrder: 2\n---\n# Advanced')
      createFile('docs/changelog.md', '---\nnavOrder: 20\n---\n# Changelog')

      const app = await createTestApp(tempDir)
      const { routes } = app.router.generate()
      const entries = app.router.navTree!['zh-CN']![DEFAULT_DOC_PATH]!
      const items = flattenNavItems(entries)

      expect(items.length).toBe(3)

      const introRoute = findRouteByFullPath(routes, '/guide/intro')!
      const advancedRoute = findRouteByFullPath(routes, '/guide/advanced')!
      const changelogRoute = findRouteByFullPath(routes, '/changelog')!

      expect(introRoute.meta!['pagination'].prev).toBeNull()
      expect(introRoute.meta!['pagination'].next).toEqual({
        title: 'Advanced',
        path: '/guide/advanced'
      })

      expect(advancedRoute.meta!['pagination'].prev).toEqual({
        title: 'Intro',
        path: '/guide/intro'
      })
      expect(advancedRoute.meta!['pagination'].next).toEqual({
        title: 'Changelog',
        path: '/changelog'
      })

      expect(changelogRoute.meta!['pagination'].prev).toEqual({
        title: 'Advanced',
        path: '/guide/advanced'
      })
      expect(changelogRoute.meta!['pagination'].next).toBeNull()
    })

    it('分页数据应携带正确的 title 和 path', async () => {
      createFile('docs/guide/first.md', '---\nnavOrder: 1\nnavTitle: 第一步\n---\n# First')
      createFile('docs/guide/second.md', '---\nnavOrder: 2\nnavTitle: 第二步\n---\n# Second')

      const app = await createTestApp(tempDir)
      const { routes } = app.router.generate()

      const firstRoute = findRouteByFullPath(routes, '/guide/first')!
      const secondRoute = findRouteByFullPath(routes, '/guide/second')!

      expect(firstRoute.meta!['pagination'].next).toEqual({
        title: '第二步',
        path: '/guide/second'
      })
      expect(secondRoute.meta!['pagination'].prev).toEqual({
        title: '第一步',
        path: '/guide/first'
      })
    })
  })

  describe('多语言导航 (i18n)', () => {
    it('应按语言分离导航条目', async () => {
      createFile('docs/guide/intro.md', '# Intro')
      createFile('docs/guide/intro.en-US.md', '# Introduction')

      const app = await createTestApp(tempDir, {
        locales: [
          { id: 'zh-CN', name: '简体中文' },
          { id: 'en-US', name: 'English' }
        ]
      })
      app.router.generate()

      const zhEntries = app.router.navTree!['zh-CN']![DEFAULT_DOC_PATH]!
      const enEntries = app.router.navTree!['en-US']![DEFAULT_DOC_PATH]!

      const zhItems = flattenNavItems(zhEntries)
      const enItems = flattenNavItems(enEntries)

      expect(zhItems.length).toBe(1)
      expect(enItems.length).toBe(1)

      expect(zhItems[0]!.path).toBe('/guide/intro')
      expect(enItems[0]!.path).toBe('/guide/intro-en-us')
    })

    it('非默认语言的 index 应被正确识别为分组首页', async () => {
      createFile('docs/guide/index.md', '# Guide')
      createFile('docs/guide/index.en-US.md', '# Guide EN')
      createFile('docs/guide/getting-started.md', '# Getting Started')
      createFile('docs/guide/getting-started.en-US.md', '# Getting Started EN')

      const app = await createTestApp(tempDir, {
        locales: [
          { id: 'zh-CN', name: '简体中文' },
          { id: 'en-US', name: 'English' }
        ]
      })
      app.router.generate()

      const zhEntries = app.router.navTree!['zh-CN']![DEFAULT_DOC_PATH]!
      const enEntries = app.router.navTree!['en-US']![DEFAULT_DOC_PATH]!

      const zhGroup = zhEntries.find(e => e.type === 'group') as NavGroup
      const enGroup = enEntries.find(e => e.type === 'group') as NavGroup

      expect(zhGroup).toBeDefined()
      expect(zhGroup.path).toBe('/guide')
      expect(zhGroup.indexPath).toBe('/guide')
      expect(zhGroup.items.length).toBe(1)
      expect(zhGroup.items[0]!.path).toBe('/guide/getting-started')

      expect(enGroup).toBeDefined()
      expect(enGroup.path).toBe('/guide')
      expect(enGroup.indexPath).toBe('/guide/index-en-us')
      expect(enGroup.items.length).toBe(1)
      expect(enGroup.items[0]!.path).toBe('/guide/getting-started-en-us')
    })

    it('非默认语言的 index 不应出现在 items 中', async () => {
      createFile('docs/guide/index.en-US.md', '# Guide EN')
      createFile('docs/guide/advanced.en-US.md', '# Advanced EN')

      const app = await createTestApp(tempDir, {
        locales: [
          { id: 'zh-CN', name: '简体中文' },
          { id: 'en-US', name: 'English' }
        ]
      })
      app.router.generate()

      const enEntries = app.router.navTree!['en-US']![DEFAULT_DOC_PATH]!
      const enGroup = enEntries.find(e => e.type === 'group') as NavGroup

      const paths = enGroup.items.map((i: NavItem) => i.path)
      expect(paths).not.toContain('/guide/index-en-us')
      expect(paths).toContain('/guide/advanced-en-us')
    })

    it('仅默认语言的页面不应出现在非默认语言导航中', async () => {
      createFile('docs/guide/intro.md', '# Intro')
      createFile('docs/changelog.md', '# Changelog')

      const app = await createTestApp(tempDir, {
        locales: [
          { id: 'zh-CN', name: '简体中文' },
          { id: 'en-US', name: 'English' }
        ]
      })
      app.router.generate()
      expect(app.router.navTree!['zh-CN']).toBeDefined()
      expect(app.router.navTree!['en-US']).toBeUndefined()
    })

    it('独立页面也应按语言分离', async () => {
      createFile('docs/changelog.md', '# Changelog')
      createFile('docs/changelog.en-US.md', '# Changelog EN')

      const app = await createTestApp(tempDir, {
        locales: [
          { id: 'zh-CN', name: '简体中文' },
          { id: 'en-US', name: 'English' }
        ]
      })
      app.router.generate()

      const zhEntries = app.router.navTree!['zh-CN']![DEFAULT_DOC_PATH]!
      const enEntries = app.router.navTree!['en-US']![DEFAULT_DOC_PATH]!

      const zhItem = zhEntries.find(e => e.type === 'item') as NavItem
      const enItem = enEntries.find(e => e.type === 'item') as NavItem

      expect(zhItem).toBeDefined()
      expect(zhItem.path).toBe('/changelog')

      expect(enItem).toBeDefined()
      expect(enItem.path).toBe('/changelog-en-us')
    })

    it('多语言导航应各自独立计算分页', async () => {
      createFile('docs/guide/intro.md', '---\nnavOrder: 1\nnavTitle: 介绍\n---\n# Intro')
      createFile(
        'docs/guide/intro.en-US.md',
        '---\nnavOrder: 1\nnavTitle: Introduction\n---\n# Intro'
      )
      createFile('docs/guide/advanced.md', '---\nnavOrder: 2\nnavTitle: 进阶\n---\n# Advanced')
      createFile(
        'docs/guide/advanced.en-US.md',
        '---\nnavOrder: 2\nnavTitle: Advanced\n---\n# Advanced'
      )

      const app = await createTestApp(tempDir, {
        locales: [
          { id: 'zh-CN', name: '简体中文' },
          { id: 'en-US', name: 'English' }
        ]
      })
      const { routes } = app.router.generate()

      const zhIntroRoute = findRouteByFullPath(routes, '/guide/intro')!
      const zhAdvancedRoute = findRouteByFullPath(routes, '/guide/advanced')!
      const enIntroRoute = findRouteByFullPath(routes, '/guide/intro-en-us')!
      const enAdvancedRoute = findRouteByFullPath(routes, '/guide/advanced-en-us')!

      expect(zhIntroRoute.meta!['pagination'].next).toEqual({
        title: '进阶',
        path: '/guide/advanced'
      })
      expect(zhAdvancedRoute.meta!['pagination'].prev).toEqual({
        title: '介绍',
        path: '/guide/intro'
      })

      expect(enIntroRoute.meta!['pagination'].next).toEqual({
        title: 'Advanced',
        path: '/guide/advanced-en-us'
      })
      expect(enAdvancedRoute.meta!['pagination'].prev).toEqual({
        title: 'Introduction',
        path: '/guide/intro-en-us'
      })
    })
  })

  describe('导航元数据清理', () => {
    it('导航处理完成后应从路由 meta 中移除 navTitle', async () => {
      createFile('docs/guide/first.md', '---\nnavOrder: 1\nnavTitle: 第一步\n---\n# First')
      createFile('docs/guide/second.md', '---\nnavOrder: 2\nnavTitle: 第二步\n---\n# Second')

      const app = await createTestApp(tempDir)
      const { routes } = app.router.generate()

      const firstRoute = findRouteByFullPath(routes, '/guide/first')!
      const secondRoute = findRouteByFullPath(routes, '/guide/second')!

      expect(firstRoute.meta!['navTitle']).toBeUndefined()
      expect(secondRoute.meta!['navTitle']).toBeUndefined()
    })

    it('导航处理完成后应从路由 meta 中移除 navOrder', async () => {
      createFile('docs/guide/first.md', '---\nnavOrder: 1\n---\n# First')
      createFile('docs/guide/second.md', '---\nnavOrder: 2\n---\n# Second')

      const app = await createTestApp(tempDir)
      const { routes } = app.router.generate()

      const firstRoute = findRouteByFullPath(routes, '/guide/first')!
      const secondRoute = findRouteByFullPath(routes, '/guide/second')!

      expect(firstRoute.meta!['navOrder']).toBeUndefined()
      expect(secondRoute.meta!['navOrder']).toBeUndefined()
    })

    it('导航处理完成后应从路由 meta 中移除 navHidden', async () => {
      createFile('docs/guide/intro.md', '# Intro')
      createFile('docs/guide/hidden.md', '---\nnavHidden: true\n---\n# Hidden')

      const app = await createTestApp(tempDir)
      const { routes } = app.router.generate()

      const hiddenRoute = findRouteByFullPath(routes, '/guide/hidden')!

      expect(hiddenRoute.meta!['navHidden']).toBeUndefined()
    })

    it('分组节点的导航元数据也应被清理', async () => {
      createFile(
        'docs/guide/_config.ts',
        `definePage({ meta: { navTitle: '指南', navOrder: 10 } })`
      )
      createFile('docs/guide/intro.md', '# Intro')

      const app = await createTestApp(tempDir)
      const { routes } = app.router.generate()

      const guideRoute = findRouteByFullPath(routes, '/guide')!

      expect(guideRoute.meta!['navTitle']).toBeUndefined()
      expect(guideRoute.meta!['navOrder']).toBeUndefined()
    })
  })
})
