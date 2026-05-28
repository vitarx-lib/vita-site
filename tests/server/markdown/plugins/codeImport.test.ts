import MarkdownIt from 'markdown-it'
import path from 'node:path'
import { warn } from 'vitarx-router/file-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { codeImport } from '../../../../src/server/markdown/plugins/codeImport.js'

vi.mock('vitarx-router/file-router', () => ({
  warn: vi.fn()
}))

const FIXTURES_DIR = path.resolve(__dirname, 'fixtures')
const MOCK_MD_PATH = path.join(FIXTURES_DIR, 'index.md')

function createMarkdownWithCodeImport(): MarkdownIt {
  const md = new MarkdownIt()
  md.use(codeImport)
  return md
}

function renderWithFilePath(md: MarkdownIt, content: string, filePath: string): string {
  return md.render(content, { filePath })
}

function parseWithFilePath(md: MarkdownIt, content: string, filePath: string) {
  return md.parse(content, { filePath })
}

describe('codeImport', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('基本导入功能', () => {
    it('应完整导入文件内容', () => {
      const md = createMarkdownWithCodeImport()
      const html = renderWithFilePath(md, '@[code](./sample.js)', MOCK_MD_PATH)
      expect(html).toContain("const greeting = 'Hello, World!'")
      expect(html).toContain('console.log(greeting)')
      expect(html).toContain('function add(a, b)')
      expect(html).toContain('export { add, greeting }')
    })

    it('应生成 fence token', () => {
      const md = createMarkdownWithCodeImport()
      const tokens = parseWithFilePath(md, '@[code](./sample.js)', MOCK_MD_PATH)

      const fenceToken = tokens.find(t => t.type === 'fence')
      expect(fenceToken).toBeDefined()
      expect(fenceToken?.type).toBe('fence')
    })

    it('应支持相对路径导入', () => {
      const md = createMarkdownWithCodeImport()
      const html = renderWithFilePath(md, '@[code](./style.css)', MOCK_MD_PATH)

      expect(html).toContain('.container')
      expect(html).toContain('display: flex')
    })

    it('应支持上级目录路径', () => {
      const md = createMarkdownWithCodeImport()
      const nestedPath = path.join(FIXTURES_DIR, 'nested', 'index.md')
      const html = renderWithFilePath(md, '@[code](../sample.js)', nestedPath)

      expect(html).toContain("const greeting = 'Hello, World!'")
    })
  })

  describe('行范围导入功能', () => {
    it('应导入指定行范围的内容', () => {
      const md = createMarkdownWithCodeImport()
      const html = renderWithFilePath(md, '@[code{1-3}](./multiline.txt)', MOCK_MD_PATH)

      expect(html).toContain('line 1')
      expect(html).toContain('line 2')
      expect(html).toContain('line 3')
      expect(html).not.toContain('line 4')
    })

    it('应导入单行内容', () => {
      const md = createMarkdownWithCodeImport()
      const html = renderWithFilePath(md, '@[code{5-5}](./multiline.txt)', MOCK_MD_PATH)

      expect(html).toContain('line 5')
      expect(html).not.toContain('line 4')
      expect(html).not.toContain('line 6')
    })

    it('应导入从指定行到文件末尾的内容', () => {
      const md = createMarkdownWithCodeImport()
      const html = renderWithFilePath(md, '@[code{13-15}](./multiline.txt)', MOCK_MD_PATH)

      expect(html).toContain('line 13')
      expect(html).toContain('line 14')
      expect(html).toContain('line 15')
    })

    it('应正确处理行范围边界', () => {
      const md = createMarkdownWithCodeImport()
      const html = renderWithFilePath(md, '@[code{1-1}](./multiline.txt)', MOCK_MD_PATH)

      expect(html).toContain('line 1')
      expect(html).not.toContain('line 2')
    })
  })

  describe('代码语言指定功能', () => {
    it('应支持显式指定语言', () => {
      const md = createMarkdownWithCodeImport()
      const html = renderWithFilePath(md, '@[code js](./sample.ts)', MOCK_MD_PATH)

      expect(html).toContain('language-js')
    })

    it('应根据文件扩展名自动推断语言 - .js', () => {
      const md = createMarkdownWithCodeImport()
      const html = renderWithFilePath(md, '@[code](./sample.js)', MOCK_MD_PATH)

      expect(html).toContain('language-javascript')
    })

    it('应根据文件扩展名自动推断语言 - .ts', () => {
      const md = createMarkdownWithCodeImport()
      const html = renderWithFilePath(md, '@[code](./sample.ts)', MOCK_MD_PATH)

      expect(html).toContain('language-typescript')
    })

    it('应根据文件扩展名自动推断语言 - .py', () => {
      const md = createMarkdownWithCodeImport()
      const html = renderWithFilePath(md, '@[code](./sample.py)', MOCK_MD_PATH)

      expect(html).toContain('language-python')
    })

    it('应根据文件扩展名自动推断语言 - .css', () => {
      const md = createMarkdownWithCodeImport()
      const html = renderWithFilePath(md, '@[code](./style.css)', MOCK_MD_PATH)

      expect(html).toContain('language-css')
    })

    it('未知扩展名应默认为 text', () => {
      const md = createMarkdownWithCodeImport()
      const html = renderWithFilePath(md, '@[code](./multiline.txt)', MOCK_MD_PATH)

      expect(html).toContain('language-text')
    })

    it('显式指定语言应优先于扩展名推断', () => {
      const md = createMarkdownWithCodeImport()
      const html = renderWithFilePath(md, '@[code typescript](./sample.js)', MOCK_MD_PATH)

      expect(html).toContain('language-typescript')
      expect(html).not.toContain('language-javascript')
    })

    it('应支持行范围和语言同时指定', () => {
      const md = createMarkdownWithCodeImport()
      const html = renderWithFilePath(md, '@[code{1-3} js](./multiline.txt)', MOCK_MD_PATH)

      expect(html).toContain('language-js')
      expect(html).toContain('line 1')
      expect(html).toContain('line 3')
      expect(html).not.toContain('line 4')
    })
  })

  describe('错误处理', () => {
    it('文件不存在时应输出警告并跳过', () => {
      const md = createMarkdownWithCodeImport()
      renderWithFilePath(md, '@[code](./nonexistent.js)', MOCK_MD_PATH)

      expect(warn).toHaveBeenCalledWith(expect.stringContaining('[codeImport] 文件不存在'))
    })

    it('起始行号超出范围时应输出警告', () => {
      const md = createMarkdownWithCodeImport()
      renderWithFilePath(md, '@[code{100-110}](./multiline.txt)', MOCK_MD_PATH)

      expect(warn).toHaveBeenCalledWith(expect.stringContaining('起始行号'))
    })

    it('结束行号小于起始行号时应输出警告', () => {
      const md = createMarkdownWithCodeImport()
      renderWithFilePath(md, '@[code{5-3}](./multiline.txt)', MOCK_MD_PATH)

      expect(warn).toHaveBeenCalledWith(expect.stringContaining('不能小于起始行号'))
    })

    it('结束行号超出范围时应输出警告', () => {
      const md = createMarkdownWithCodeImport()
      renderWithFilePath(md, '@[code{1-100}](./multiline.txt)', MOCK_MD_PATH)

      expect(warn).toHaveBeenCalledWith(expect.stringContaining('结束行号'))
    })

    it('未设置 env 文件路径时应输出警告', () => {
      const md = createMarkdownWithCodeImport()
      md.render('@[code](./sample.js)')

      expect(warn).toHaveBeenCalledWith(expect.stringContaining('filePath'))
    })
  })

  describe('与其他 Markdown 语法共存', () => {
    it('应与标题共存', () => {
      const md = createMarkdownWithCodeImport()
      const html = renderWithFilePath(md, `# Title\n\n@[code](./sample.js)`, MOCK_MD_PATH)

      expect(html).toContain('<h1')
      expect(html).toContain("const greeting = 'Hello, World!'")
    })

    it('应与普通代码块共存', () => {
      const md = createMarkdownWithCodeImport()
      const html = renderWithFilePath(
        md,
        `\`\`\`js\ninline code\n\`\`\`\n\n@[code](./sample.js)`,
        MOCK_MD_PATH
      )

      expect(html).toContain('inline code')
      expect(html).toContain("const greeting = 'Hello, World!'")
    })

    it('不应处理代码块内的 @[code] 语法', () => {
      const md = createMarkdownWithCodeImport()
      const html = renderWithFilePath(md, `\`\`\`\n@[code](./sample.js)\n\`\`\``, MOCK_MD_PATH)

      expect(html).toContain('@[code]')
    })

    it('应与列表共存', () => {
      const md = createMarkdownWithCodeImport()
      const html = renderWithFilePath(md, `- Item 1\n\n@[code](./sample.js)`, MOCK_MD_PATH)

      expect(html).toContain('<li')
      expect(html).toContain("const greeting = 'Hello, World!'")
    })

    it('应与普通段落文本共存', () => {
      const md = createMarkdownWithCodeImport()
      const html = renderWithFilePath(
        md,
        `This is a paragraph.\n\n@[code](./sample.js)\n\nAnother paragraph.`,
        MOCK_MD_PATH
      )

      expect(html).toContain('<p>This is a paragraph.')
      expect(html).toContain("const greeting = 'Hello, World!'")
      expect(html).toContain('Another paragraph.')
    })
  })

  describe('边界情况', () => {
    it('应处理空文档', () => {
      const md = createMarkdownWithCodeImport()
      const html = renderWithFilePath(md, '', MOCK_MD_PATH)

      expect(html).toBe('')
    })

    it('应处理无代码导入语法的文档', () => {
      const md = createMarkdownWithCodeImport()
      const html = renderWithFilePath(md, '这是一段普通文本', MOCK_MD_PATH)

      expect(html).toContain('这是一段普通文本')
    })

    it('应处理多个代码导入', () => {
      const md = createMarkdownWithCodeImport()
      const html = renderWithFilePath(
        md,
        `@[code](./sample.js)\n\n@[code](./sample.ts)`,
        MOCK_MD_PATH
      )

      expect(html).toContain("const greeting = 'Hello, World!'")
      expect(html).toContain('interface User')
    })

    it('不应匹配普通链接语法', () => {
      const md = createMarkdownWithCodeImport()
      const html = renderWithFilePath(md, '[code](./sample.js)', MOCK_MD_PATH)

      expect(html).not.toContain("const greeting = 'Hello, World!'")
    })

    it('不应匹配不带 @ 前缀的语法', () => {
      const md = createMarkdownWithCodeImport()
      const html = renderWithFilePath(md, '[code](./sample.js)', MOCK_MD_PATH)

      expect(html).toContain('<a')
    })
  })

  describe('Token 结构', () => {
    it('应生成 fence 类型的 token', () => {
      const md = createMarkdownWithCodeImport()
      const tokens = parseWithFilePath(md, '@[code](./sample.js)', MOCK_MD_PATH)

      const fenceToken = tokens.find(t => t.type === 'fence')
      expect(fenceToken).toBeDefined()
      expect(fenceToken?.type).toBe('fence')
    })

    it('应设置正确的语言信息', () => {
      const md = createMarkdownWithCodeImport()
      const tokens = parseWithFilePath(md, '@[code](./sample.js)', MOCK_MD_PATH)

      const fenceToken = tokens.find(t => t.type === 'fence')
      expect(fenceToken?.info).toBe('javascript')
    })

    it('应设置正确的代码内容', () => {
      const md = createMarkdownWithCodeImport()
      const tokens = parseWithFilePath(md, '@[code](./sample.js)', MOCK_MD_PATH)

      const fenceToken = tokens.find(t => t.type === 'fence')
      expect(fenceToken?.content).toContain("const greeting = 'Hello, World!'")
    })

    it('显式指定语言时应设置到 info', () => {
      const md = createMarkdownWithCodeImport()
      const tokens = parseWithFilePath(md, '@[code js](./sample.ts)', MOCK_MD_PATH)

      const fenceToken = tokens.find(t => t.type === 'fence')
      expect(fenceToken?.info).toBe('js')
    })

    it('行范围导入应设置正确的 content', () => {
      const md = createMarkdownWithCodeImport()
      const tokens = parseWithFilePath(md, '@[code{1-3}](./multiline.txt)', MOCK_MD_PATH)

      const fenceToken = tokens.find(t => t.type === 'fence')
      expect(fenceToken?.content).toBe('line 1\nline 2\nline 3')
    })
  })
})
