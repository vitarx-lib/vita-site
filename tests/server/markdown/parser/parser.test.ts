import MarkdownIt from 'markdown-it'
import { existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { VitaSitePlugin } from '../../../../src/server/index.js'
import { MdParser } from '../../../../src/server/markdown/index.js'
import { createTestApp } from '../../../testUtils.js'

vi.mock('vitarx-router/file-router', async importOriginal => {
  const actual = await importOriginal<typeof import('vitarx-router/file-router')>()
  return {
    ...actual,
    warn: vi.fn()
  }
})

vi.mock('../../../../src/server/markdown/utils/index.js', async importOriginal => {
  const actual = await importOriginal<typeof import('../../../../src/server/markdown/utils/index.js')>()
  return {
    ...actual,
    parseFrontMatter: vi.fn((content: string) => {
      const frontMatterMatch = content.match(/^---\n([\s\S]*?)\n---\n/)
      if (frontMatterMatch) {
        const yaml = require('js-yaml')
        try {
          const data = yaml.load(frontMatterMatch[1]) || {}
          return {
            data: typeof data === 'object' && !Array.isArray(data) ? data : {},
            content: content.slice(frontMatterMatch[0].length)
          }
        } catch {
          return { data: {}, content: content.slice(frontMatterMatch[0].length) }
        }
      }
      return { data: {}, content }
    }),
    getCommitInfo: vi.fn(() => ({
      authors: ['test-author'],
      createdAt: '2024-01-01T00:00:00+08:00',
      lastUpdateAt: '2024-01-01T00:00:00+08:00'
    }))
  }
})

describe('MdParser', () => {
  let tempDir: string
  let md: MarkdownIt
  let parser: MdParser

  const createMarkdownFile = (relativePath: string, content: string): string => {
    const fullPath = join(tempDir, relativePath)
    const dir = join(fullPath, '..')
    mkdirSync(dir, { recursive: true })
    writeFileSync(fullPath, content)
    return fullPath
  }

  beforeEach(async () => {
    tempDir = join(tmpdir(), `parser-test-${Date.now()}`)
    mkdirSync(tempDir, { recursive: true })
    md = new MarkdownIt()
    const app = await createTestApp(tempDir)
    parser = new MdParser(md, app)
  })

  afterEach(() => {
    rmSync(tempDir, { recursive: true, force: true })
  })

  describe('parse', () => {
    it('应正确转换 Markdown 内容', () => {
      const filePath = createMarkdownFile('docs/test.md', '# Hello World')
      const content = '# Hello World'

      const result = parser.parse(filePath, content)

      expect(result).toContain('// 此文件由vita-site自动生成')
      expect(result).toContain('import { RouterLink }')
      expect(result).toContain('<article class="v-doc-content">')
      expect(result).toContain('<h1>Hello World</h1>')
    })

    it('应正确处理 frontmatter', () => {
      const filePath = createMarkdownFile('docs/test.md', '---\ntitle: Test\n---\n# Content')
      const content = '---\ntitle: Test\n---\n# Content'

      const result = parser.parse(filePath, content)

      expect(result).toContain('"title":"Test"')
    })

    it('应注入自定义代码', async () => {
      const customApp = await createTestApp(tempDir, {
        injectCode: ['import { Button } from "components"', 'import { Card } from "ui"']
      })
      const customParser = new MdParser(md, customApp)

      const filePath = createMarkdownFile('docs/test.md', '# Test')
      const content = '# Test'

      const result = customParser.parse(filePath, content)

      expect(result).toContain('import { Button } from "components"')
      expect(result).toContain('import { Card } from "ui"')
    })

    it('应生成正确的组件结构', () => {
      const filePath = createMarkdownFile('docs/test.md', '# Test')
      const content = '# Test'

      const result = parser.parse(filePath, content)

      expect(result).toContain('definePage({')
      expect(result).toContain('export default () => (')
      expect(result).toContain('@title')
      expect(result).toContain('@description')
      expect(result).toContain('@source')
    })

    it('frontmatter 中指定的语言应覆盖自动推断', async () => {
      const multiLangApp = await createTestApp(tempDir, {
        locales: [
          { id: 'zh-CN', name: '简体中文' },
          { id: 'en-US', name: 'English' }
        ]
      })
      const multiLangParser = new MdParser(md, multiLangApp)

      const zhDir = join(tempDir, 'docs', 'zh-CN')
      mkdirSync(zhDir, { recursive: true })

      const zhFilePath = join(zhDir, 'test.md')
      writeFileSync(zhFilePath, '# Test')

      const result = multiLangParser.parse(zhFilePath, '---\nlang: en-US\n---\n# Test')

      expect(result).toContain('"lang":"en-US"')
    })

    it('应正确处理不存在的文件路径', () => {
      const nonExistentPath = join(tempDir, 'non-existent.md')
      const content = '# Test Content'

      const result = parser.parse(nonExistentPath, content)

      expect(result).toContain('<h1>Test Content</h1>')
    })

    it('应在未提供内容时从文件读取', () => {
      const filePath = createMarkdownFile('docs/test.md', '# File Content')
      mkdirSync(join(tempDir, 'docs'), { recursive: true })

      const result = parser.parse(filePath)

      expect(result).toContain('<h1>File Content</h1>')
    })

    it('应在文件读取失败时抛出错误', () => {
      const nonExistentPath = join(tempDir, 'non-existent.md')

      expect(() => parser.parse(nonExistentPath)).toThrow('Read file error')
    })
  })

  describe('cache', () => {
    it('应缓存转换结果', () => {
      const filePath = createMarkdownFile('docs/test.md', '# Test')
      const content = '# Test'

      const result1 = parser.parse(filePath, content)
      const result2 = parser.parse(filePath, content)

      expect(result1).toBe(result2)
    })

    it('内容变化时应重新转换', () => {
      const filePath = createMarkdownFile('docs/test.md', '# Test')
      const content1 = '# Test'
      const content2 = '# Updated Test'

      const result1 = parser.parse(filePath, content1)
      const result2 = parser.parse(filePath, content2)

      expect(result1).not.toBe(result2)
      expect(result2).toContain('Updated Test')
    })

    it('不同配置应生成不同的缓存', async () => {
      const app1 = await createTestApp(tempDir, { injectCode: ['import A from "a"'] })
      const app2 = await createTestApp(tempDir, { injectCode: ['import B from "b"'] })

      const parser1 = new MdParser(md, app1)
      const parser2 = new MdParser(md, app2)

      const filePath = createMarkdownFile('docs/test.md', '# Test')
      const content = '# Test'

      const result1 = parser1.parse(filePath, content)
      const result2 = parser2.parse(filePath, content)

      expect(result1).toContain('import A from "a"')
      expect(result2).toContain('import B from "b"')
    })
  })

  describe('cache.clear', () => {
    it('应清除所有缓存', () => {
      const filePath1 = createMarkdownFile('docs/test1.md', '# Test 1')
      const filePath2 = createMarkdownFile('docs/test2.md', '# Test 2')

      parser.parse(filePath1, '# Test 1')
      parser.parse(filePath2, '# Test 2')

      parser.cache.clear()

      expect(existsSync(parser.cache.getCacheFilePath('docs/test1.md', 'json'))).toBe(false)
      expect(existsSync(parser.cache.getCacheFilePath('docs/test2.md', 'json'))).toBe(false)
    })

    it('清除后重新解析应生成新缓存', () => {
      const filePath = createMarkdownFile('docs/test.md', '# Test')

      parser.parse(filePath, '# Test')
      parser.cache.clear()

      const result = parser.parse(filePath, '# Test')
      expect(result).toContain('<h1>Test</h1>')
    })
  })

  describe('cache 属性', () => {
    it('应暴露 cache 实例', () => {
      expect(parser.cache).toBeDefined()
      expect(parser.cache.computeHash).toBeDefined()
      expect(parser.cache.get).toBeDefined()
      expect(parser.cache.set).toBeDefined()
    })
  })

  describe('metadata', () => {
    it('应正确提取 git 信息', () => {
      const filePath = createMarkdownFile('docs/test.md', '# Test')
      const content = '# Test'

      const result = parser.parse(filePath, content)

      expect(result).toContain('"authors":["test-author"]')
      expect(result).toContain('"createdAt":"2024-01-01T00:00:00+08:00"')
      expect(result).toContain('"lastUpdateAt":"2024-01-01T00:00:00+08:00"')
    })

    it('应正确设置相对路径', () => {
      const filePath = createMarkdownFile('docs/guide/getting-started.md', '# Guide')
      const content = '# Guide'

      const result = parser.parse(filePath, content)

      expect(result).toContain('"relativePath":"docs/guide/getting-started.md"')
    })

    it('frontmatter 应覆盖默认元数据', () => {
      const filePath = createMarkdownFile(
        'docs/test.md',
        '---\ntitle: Custom Title\ndescription: Custom Description\n---\n# Content'
      )
      const content = '---\ntitle: Custom Title\ndescription: Custom Description\n---\n# Content'

      const result = parser.parse(filePath, content)

      expect(result).toContain('"title":"Custom Title"')
      expect(result).toContain('"description":"Custom Description"')
    })
  })

  describe('插件集成', () => {
    it('应调用插件的 beforeParse 钩子', async () => {
      const beforeParseMock = vi.fn((content: string, _filePath: string) => {
        return content.replace('# Test', '# Modified')
      })

      const plugin: VitaSitePlugin = {
        name: 'test-plugin',
        beforeParse: beforeParseMock
      }

      const pluginApp = await createTestApp(tempDir, { plugins: [plugin] })
      const pluginParser = new MdParser(md, pluginApp)
      const filePath = createMarkdownFile('docs/test.md', '# Test')

      pluginParser.parse(filePath, '# Test')

      expect(beforeParseMock).toHaveBeenCalledWith('# Test', filePath, pluginApp)
    })

    it('应调用插件的 afterParse 钩子', async () => {
      const afterParseMock = vi.fn()

      const plugin: VitaSitePlugin = {
        name: 'test-plugin',
        afterParse: afterParseMock
      }

      const pluginApp = await createTestApp(tempDir, { plugins: [plugin] })
      const pluginParser = new MdParser(md, pluginApp)
      const filePath = createMarkdownFile('docs/test.md', '# Test')

      pluginParser.parse(filePath, '# Test')

      expect(afterParseMock).toHaveBeenCalled()
      expect(afterParseMock).toHaveBeenCalledWith(
        expect.objectContaining({
          meta: expect.objectContaining({ relativePath: 'docs/test.md' })
        }),
        pluginApp
      )
    })

    it('插件 beforeParse 返回空值时应保持原内容', async () => {
      const beforeParseMock = vi.fn((_content: string, _file: string): string | void => {
        return
      })

      const plugin: VitaSitePlugin = {
        name: 'test-plugin',
        beforeParse: beforeParseMock
      }

      const pluginApp = await createTestApp(tempDir, { plugins: [plugin] })
      const pluginParser = new MdParser(md, pluginApp)
      const filePath = createMarkdownFile('docs/test.md', '# Test')

      const result = pluginParser.parse(filePath, '# Test')

      expect(result).toContain('<h1>Test</h1>')
    })

    it('插件抛出错误时不应中断解析', async () => {
      const { warn } = await import('vitarx-router/file-router')
      const warnMock = vi.mocked(warn)
      warnMock.mockClear()

      const errorPlugin: VitaSitePlugin = {
        name: 'error-plugin',
        beforeParse: vi.fn(() => {
          throw new Error('Plugin error')
        }),
        afterParse: vi.fn(() => {
          throw new Error('After parse error')
        })
      }

      const pluginApp = await createTestApp(tempDir, { plugins: [errorPlugin] })
      const pluginParser = new MdParser(md, pluginApp)
      const filePath = createMarkdownFile('docs/test.md', '# Test')

      expect(() => pluginParser.parse(filePath, '# Test')).not.toThrow()
      expect(warnMock).toHaveBeenCalledTimes(2)
      expect(warnMock).toHaveBeenCalledWith(
        'Plugin error-plugin beforeParse error:',
        expect.any(Error)
      )
      expect(warnMock).toHaveBeenCalledWith(
        'Plugin error-plugin afterParse error:',
        expect.any(Error)
      )
    })
  })
})
