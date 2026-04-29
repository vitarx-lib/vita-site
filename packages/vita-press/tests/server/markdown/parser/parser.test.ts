import MarkdownIt from 'markdown-it'
import { existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { ResolvedConfig, VitaPressPlugin } from '../../../../src/server/index.js'
import { MdParser } from '../../../../src/server/markdown/index.js'

vi.mock('vitarx-router/file-router', async importOriginal => {
  const actual = await importOriginal<typeof import('vitarx-router/file-router')>()
  return {
    ...actual,
    warn: vi.fn()
  }
})

vi.mock('../../../../src/server/markdown/utils/index.js', () => ({
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
}))

function createMockApp(
  root: string,
  options: Partial<ResolvedConfig> = {}
): {
  root: string
  config: ResolvedConfig
  plugins: VitaPressPlugin[]
  defaultLang: string
  langPathMap: Record<string, string>
  cacheDir: string
} {
  const defaultConfig: ResolvedConfig = {
    title: '',
    description: '',
    keywords: '',
    injectHead: [],
    injectBody: [],
    injectCode: [],
    markdownIt: {},
    dts: false,
    lang: 'zh-CN',
    langDirs: [],
    debug: false,
    docDir: { dir: 'docs' },
    pageDirs: [],
    plugins: [],
    viteConfig: {},
    ...options
  } as ResolvedConfig

  const defaultLang = defaultConfig.lang || 'zh-CN'
  const langPathMap: Record<string, string> = {}
  if (Array.isArray(defaultConfig.langDirs) && defaultConfig.langDirs.length) {
    const docDirPath = join(root, defaultConfig.docDir.dir)
    defaultConfig.langDirs.forEach(lang => {
      langPathMap[join(docDirPath, lang)] = lang
    })
  }

  const cacheDir = join(root, '.vitapress', '.cache', 'docs')
  mkdirSync(cacheDir, { recursive: true })

  return {
    root,
    config: defaultConfig,
    plugins: [],
    defaultLang,
    langPathMap,
    cacheDir
  }
}

describe('MdParser', () => {
  let tempDir: string
  let md: MarkdownIt
  let parser: MdParser
  let mockApp: ReturnType<typeof createMockApp>

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
    mockApp = createMockApp(tempDir)
    parser = new MdParser(md, mockApp as any)
  })

  afterEach(() => {
    rmSync(tempDir, { recursive: true, force: true })
  })

  describe('parse', () => {
    it('应正确转换 Markdown 内容', () => {
      const filePath = createMarkdownFile('docs/test.md', '# Hello World')
      const content = '# Hello World'

      const result = parser.parse(filePath, content)

      expect(result).toContain('// 此文件由vita-press自动生成')
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

    it('应注入自定义代码', () => {
      const customApp = createMockApp(tempDir, {
        injectCode: ['import { Button } from "components"', 'import { Card } from "ui"']
      })
      const customParser = new MdParser(md, customApp as any)

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

    it('frontmatter 中指定的语言应覆盖自动推断', () => {
      const multiLangApp = createMockApp(tempDir, {
        langDirs: ['zh-CN', 'en-US'],
        docDir: { dir: 'docs' }
      })
      const multiLangParser = new MdParser(md, multiLangApp as any)

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

    it('不同配置应生成不同的缓存', () => {
      const app1 = createMockApp(tempDir, { injectCode: ['import A from "a"'] })
      const app2 = createMockApp(tempDir, { injectCode: ['import B from "b"'] })

      const parser1 = new MdParser(md, app1 as any)
      const parser2 = new MdParser(md, app2 as any)

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

    it('应暴露 cache.cacheDir 属性', () => {
      expect(parser.cache.cacheDir).toBe(mockApp.cacheDir)
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
    it('应调用插件的 beforeParse 钩子', () => {
      const beforeParseMock = vi.fn((content: string, _filePath: string) => {
        return content.replace('# Test', '# Modified')
      })

      const pluginApp = createMockApp(tempDir)
      pluginApp.plugins = [
        {
          name: 'test-plugin',
          beforeParse: beforeParseMock
        }
      ]

      const pluginParser = new MdParser(md, pluginApp as any)
      const filePath = createMarkdownFile('docs/test.md', '# Test')

      pluginParser.parse(filePath, '# Test')

      expect(beforeParseMock).toHaveBeenCalledWith('# Test', filePath)
    })

    it('应调用插件的 afterParse 钩子', () => {
      const afterParseMock = vi.fn((result: any) => {
        result.meta = { ...result.meta, customField: 'custom-value' }
      })

      const pluginApp = createMockApp(tempDir)
      pluginApp.plugins = [
        {
          name: 'test-plugin',
          afterParse: afterParseMock
        }
      ]

      const pluginParser = new MdParser(md, pluginApp as any)
      const filePath = createMarkdownFile('docs/test.md', '# Test')

      const result = pluginParser.parse(filePath, '# Test')

      expect(afterParseMock).toHaveBeenCalled()
      expect(result).toContain('"customField":"custom-value"')
    })

    it('插件 beforeParse 返回空值时应保持原内容', () => {
      const beforeParseMock = vi.fn((_content: string, _file: string): string | void => {
        return
      })

      const pluginApp = createMockApp(tempDir)
      pluginApp.plugins = [
        {
          name: 'test-plugin',
          beforeParse: beforeParseMock
        }
      ]

      const pluginParser = new MdParser(md, pluginApp as any)
      const filePath = createMarkdownFile('docs/test.md', '# Test')

      const result = pluginParser.parse(filePath, '# Test')

      expect(result).toContain('<h1>Test</h1>')
    })

    it('插件抛出错误时不应中断解析', async () => {
      const { warn } = await import('vitarx-router/file-router')
      const warnMock = vi.mocked(warn)
      warnMock.mockClear()

      const errorPlugin = {
        name: 'error-plugin',
        beforeParse: vi.fn(() => {
          throw new Error('Plugin error')
        }),
        afterParse: vi.fn(() => {
          throw new Error('After parse error')
        })
      }

      const pluginApp = createMockApp(tempDir)
      pluginApp.plugins = [errorPlugin]

      const pluginParser = new MdParser(md, pluginApp as any)
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
