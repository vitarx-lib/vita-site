import type { RouteNode } from 'vitarx-router/file-router'
import { describe, expect, it } from 'vitest'
import { buildSearchIndex } from '../../src/server/builder.js'
import type { SearchSectionBuild } from '../../src/shared/types.js'

function createMockRoutes(items: Array<{ relativePath: string; fullPath: string }>): RouteNode[] {
  return items.map(item => ({
    meta: { relativePath: item.relativePath },
    fullPath: item.fullPath,
    path: item.fullPath,
    children: []
  })) as unknown as RouteNode[]
}

function createMockDocs(
  entries: Array<{
    relativePath: string
    title: string
    sections: Array<{ hash: string; heading: string; content: string }>
    lang: string
  }>
): Map<string, { title: string; sections: SearchSectionBuild[]; lang: string }> {
  const map = new Map<string, { title: string; sections: SearchSectionBuild[]; lang: string }>()
  for (const entry of entries) {
    map.set(entry.relativePath, {
      title: entry.title,
      sections: entry.sections.map(s => ({
        hash: s.hash,
        heading: s.heading,
        content: s.content,
        contentTokens: []
      })),
      lang: entry.lang
    })
  }
  return map
}

describe('buildSearchIndex', () => {
  describe('基本构建', () => {
    it('应将文档与路由匹配并生成索引', () => {
      const docs = createMockDocs([
        {
          relativePath: 'guide/intro.md',
          title: '介绍',
          sections: [{ hash: '#intro', heading: '介绍', content: '这是介绍内容' }],
          lang: 'zh-CN'
        }
      ])
      const routes = createMockRoutes([
        { relativePath: 'guide/intro.md', fullPath: '/guide/intro' }
      ])

      const result = buildSearchIndex(docs, routes)
      expect(result.docs.length).toBe(1)
      expect(result.docs[0]!.path).toBe('/guide/intro')
      expect(result.docs[0]!.title).toBe('介绍')
    })

    it('应跳过无法匹配路由的文档', () => {
      const docs = createMockDocs([
        {
          relativePath: 'orphan.md',
          title: '孤立页面',
          sections: [{ hash: '', heading: '', content: '内容' }],
          lang: 'zh-CN'
        }
      ])
      const routes = createMockRoutes([])

      const result = buildSearchIndex(docs, routes)
      expect(result.docs.length).toBe(0)
    })
  })

  describe('倒排索引', () => {
    it('应构建标题 token 的倒排索引', () => {
      const docs = createMockDocs([
        {
          relativePath: 'guide/search.md',
          title: '搜索功能',
          sections: [{ hash: '', heading: '', content: '内容' }],
          lang: 'zh-CN'
        }
      ])
      const routes = createMockRoutes([
        { relativePath: 'guide/search.md', fullPath: '/guide/search' }
      ])

      const result = buildSearchIndex(docs, routes)
      expect(result.index['搜索']).toBeDefined()
      expect(result.index['搜索']).toContainEqual([0, -1])
    })

    it('标题 token 的 sectionIndex 应为 -1', () => {
      const docs = createMockDocs([
        {
          relativePath: 'guide.md',
          title: '指南',
          sections: [{ hash: '', heading: '', content: '内容' }],
          lang: 'zh-CN'
        }
      ])
      const routes = createMockRoutes([{ relativePath: 'guide.md', fullPath: '/guide' }])

      const result = buildSearchIndex(docs, routes)
      const titleEntries = result.index['指南']
      expect(titleEntries).toBeDefined()
      expect(titleEntries!.every(([, si]) => si === -1)).toBe(true)
    })

    it('内容 token 的 sectionIndex 应为对应段落索引', () => {
      const docs = createMockDocs([
        {
          relativePath: 'guide.md',
          title: '指南',
          sections: [
            { hash: '#a', heading: 'A', content: '搜索功能' },
            { hash: '#b', heading: 'B', content: '安装指南' }
          ],
          lang: 'zh-CN'
        }
      ])
      const routes = createMockRoutes([{ relativePath: 'guide.md', fullPath: '/guide' }])

      const result = buildSearchIndex(docs, routes)
      const searchEntries = result.index['搜索']
      expect(searchEntries).toBeDefined()
      expect(searchEntries!.some(([, si]) => si === 0)).toBe(true)
    })
  })

  describe('多文档索引', () => {
    it('应正确处理多个文档', () => {
      const docs = createMockDocs([
        {
          relativePath: 'a.md',
          title: '文档A',
          sections: [{ hash: '', heading: '', content: '内容A' }],
          lang: 'zh-CN'
        },
        {
          relativePath: 'b.md',
          title: '文档B',
          sections: [{ hash: '', heading: '', content: '内容B' }],
          lang: 'zh-CN'
        }
      ])
      const routes = createMockRoutes([
        { relativePath: 'a.md', fullPath: '/a' },
        { relativePath: 'b.md', fullPath: '/b' }
      ])

      const result = buildSearchIndex(docs, routes)
      expect(result.docs.length).toBe(2)
      expect(result.docs[0]!.path).toBe('/a')
      expect(result.docs[1]!.path).toBe('/b')
    })

    it('相同 token 应指向多个文档', () => {
      const docs = createMockDocs([
        {
          relativePath: 'a.md',
          title: '搜索指南',
          sections: [{ hash: '', heading: '', content: '内容' }],
          lang: 'zh-CN'
        },
        {
          relativePath: 'b.md',
          title: '搜索教程',
          sections: [{ hash: '', heading: '', content: '内容' }],
          lang: 'zh-CN'
        }
      ])
      const routes = createMockRoutes([
        { relativePath: 'a.md', fullPath: '/a' },
        { relativePath: 'b.md', fullPath: '/b' }
      ])

      const result = buildSearchIndex(docs, routes)
      const entries = result.index['搜索']
      expect(entries).toBeDefined()
      expect(entries!.length).toBe(2)
    })
  })

  describe('路径匹配', () => {
    it('应同时支持带 .md 和不带 .md 的路径匹配', () => {
      const docs = createMockDocs([
        {
          relativePath: 'guide/intro.md',
          title: '介绍',
          sections: [{ hash: '', heading: '', content: '内容' }],
          lang: 'zh-CN'
        }
      ])
      const routes = createMockRoutes([
        { relativePath: 'guide/intro.md', fullPath: '/guide/intro' }
      ])

      const result = buildSearchIndex(docs, routes)
      expect(result.docs.length).toBe(1)
    })
  })
})
