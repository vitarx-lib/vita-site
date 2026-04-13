import MarkdownIt from 'markdown-it'
import { existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { MdParser } from '../../../../src/core/markdown/parser/index.js'

vi.mock('../../../../src/core/markdown/utils/index.js', () => ({
  parseFrontMatter: vi.fn((content: string) => {
    const frontMatterMatch = content.match(/^---\n([\s\S]*?)\n---\n/)
    if (frontMatterMatch) {
      return {
        data: { title: 'Test Title' },
        content: content.slice(frontMatterMatch[0].length)
      }
    }
    return { data: {}, content }
  }),
  getCommitInfo: vi.fn(() => ({
    authors: ['test-author'],
    createdAt: '2024-01-01T00:00:00+08:00',
    lastUpdateAt: '2024-01-01T00:00:00+08:00'
  }))
}))

describe('MdParser', () => {
  let tempDir: string
  let md: MarkdownIt
  let parser: MdParser
  const cacheDirPath = '.vitapress/.cache/markdown'

  const createMarkdownFile = (relativePath: string, content: string): string => {
    const fullPath = join(tempDir, relativePath)
    const dir = join(fullPath, '..')
    mkdirSync(dir, { recursive: true })
    writeFileSync(fullPath, content)
    return fullPath
  }

  beforeEach(() => {
    tempDir = join(tmpdir(), `parser-test-${Date.now()}`)
    mkdirSync(tempDir, { recursive: true })
    md = new MarkdownIt()
    parser = new MdParser(md, { root: tempDir, injectCode: [] })
  })

  afterEach(() => {
    rmSync(tempDir, { recursive: true, force: true })
  })

  describe('parse', () => {
    it('应正确转换 Markdown 内容', async () => {
      const filePath = createMarkdownFile('docs/test.md', '# Hello World')
      const content = '# Hello World'

      const result = await parser.parse(filePath, content)

      expect(result.content).toContain('// 此文件由vita-press自动生成')
      expect(result.content).toContain('import { createView, builder }')
      expect(result.content).toContain('import { RouterLink }')
      expect(result.content).toContain('<article class="v-doc-content">')
      expect(result.content).toContain('<h1>Hello World</h1>')
      expect(result.meta.relativePath).toBe('docs/test.md')
      expect(result.filePath).toBe(filePath)
    })

    it('应正确处理 frontmatter', async () => {
      const filePath = createMarkdownFile('docs/test.md', '---\ntitle: Test\n---\n# Content')
      const content = '---\ntitle: Test\n---\n# Content'

      const result = await parser.parse(filePath, content)

      expect(result.meta.title).toBe('Test Title')
    })

    it('应注入自定义代码', async () => {
      const customParser = new MdParser(md, {
        root: tempDir,
        injectCode: ['import { Button } from "components"', 'import { Card } from "ui"']
      })

      const filePath = createMarkdownFile('docs/test.md', '# Test')
      const content = '# Test'

      const result = await customParser.parse(filePath, content)

      expect(result.content).toContain('import { Button } from "components"')
      expect(result.content).toContain('import { Card } from "ui"')
    })

    it('应生成正确的组件结构', async () => {
      const filePath = createMarkdownFile('docs/test.md', '# Test')
      const content = '# Test'

      const result = await parser.parse(filePath, content)

      expect(result.content).toContain('definePage({')
      expect(result.content).toContain('export default builder(() => {')
      expect(result.content).toContain('@title')
      expect(result.content).toContain('@description')
      expect(result.content).toContain('@source')
    })
  })

  describe('cache', () => {
    beforeEach(() => {
      parser.initCache()
    })

    it('应缓存转换结果', async () => {
      const filePath = createMarkdownFile('docs/test.md', '# Test')
      const content = '# Test'

      const result1 = await parser.parse(filePath, content)
      const result2 = await parser.parse(filePath, content)

      expect(result1.content).toBe(result2.content)
    })

    it('内容变化时应重新转换', async () => {
      const filePath = createMarkdownFile('docs/test.md', '# Test')
      const content1 = '# Test'
      const content2 = '# Updated Test'

      const result1 = await parser.parse(filePath, content1)
      const result2 = await parser.parse(filePath, content2)

      expect(result1.content).not.toBe(result2.content)
      expect(result2.content).toContain('Updated Test')
    })

    it('不同配置应生成不同的缓存', async () => {
      const parser1 = new MdParser(md, { root: tempDir, injectCode: ['import A from "a"'] })
      const parser2 = new MdParser(md, { root: tempDir, injectCode: ['import B from "b"'] })

      parser1.initCache()
      parser2.initCache()

      const filePath = createMarkdownFile('docs/test.md', '# Test')
      const content = '# Test'

      const result1 = await parser1.parse(filePath, content)
      const result2 = await parser2.parse(filePath, content)

      expect(result1.content).toContain('import A from "a"')
      expect(result2.content).toContain('import B from "b"')
    })
  })

  describe('pruneCache', () => {
    beforeEach(() => {
      parser.initCache()
    })

    it('应清理失效缓存', async () => {
      const filePath = createMarkdownFile('docs/test.md', '# Test')
      const content = '# Test'

      await parser.parse(filePath, content)

      await new Promise((resolve) => setTimeout(resolve, 100))

      rmSync(filePath)

      const prunedCount = parser.pruneCache()
      expect(prunedCount).toBe(1)
    })

    it('应保留有效的缓存', async () => {
      const filePath = createMarkdownFile('docs/test.md', '# Test')
      const content = '# Test'

      await parser.parse(filePath, content)

      await new Promise((resolve) => setTimeout(resolve, 100))

      const prunedCount = parser.pruneCache()
      expect(prunedCount).toBe(0)
    })
  })

  describe('clearCache', () => {
    beforeEach(() => {
      parser.initCache()
    })

    it('应清除所有缓存', async () => {
      const filePath1 = createMarkdownFile('docs/test1.md', '# Test 1')
      const filePath2 = createMarkdownFile('docs/test2.md', '# Test 2')

      await parser.parse(filePath1, '# Test 1')
      await parser.parse(filePath2, '# Test 2')

      await new Promise((resolve) => setTimeout(resolve, 100))

      parser.clearCache()

      const cacheDir = join(tempDir, cacheDirPath)
      const files = existsSync(cacheDir) ? require('fs').readdirSync(cacheDir) : []
      expect(files.length).toBe(0)
    })
  })

  describe('initCache', () => {
    it('应创建缓存目录', () => {
      parser.initCache()
      const cacheDir = join(tempDir, cacheDirPath)
      expect(existsSync(cacheDir)).toBe(true)
    })

    it('重复调用不应报错', () => {
      parser.initCache()
      parser.initCache()
      const cacheDir = join(tempDir, cacheDirPath)
      expect(existsSync(cacheDir)).toBe(true)
    })
  })
})
