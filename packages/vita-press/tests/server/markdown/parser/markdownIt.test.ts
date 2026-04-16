import MarkdownIt from 'markdown-it'
import { describe, expect, it, vi } from 'vitest'
import { createMarkdownIt } from '../../../../src/server/markdown/parser/markdownIt.js'

describe('createMarkdownIt', () => {
  describe('默认配置', () => {
    it('应创建 MarkdownIt 实例', async () => {
      const md = await createMarkdownIt()

      expect(md).toBeInstanceOf(MarkdownIt)
    })

    it('应使用默认选项配置 MarkdownIt', async () => {
      const md = await createMarkdownIt()

      expect(md.options.html).toBe(true)
      expect(md.options.linkify).toBe(true)
      expect(md.options.typographer).toBe(true)
      expect(md.options.xhtmlOut).toBe(true)
    })

    it('应正确渲染基础 Markdown', async () => {
      const md = await createMarkdownIt()
      const result = md.render('# Hello World')

      expect(result).toContain('<h1')
      expect(result).toContain('Hello World')
    })
  })

  describe('自定义配置', () => {
    it('应支持自定义 MarkdownIt 选项', async () => {
      const md = await createMarkdownIt({
        options: {
          html: false,
          linkify: false,
          typographer: false,
          xhtmlOut: false
        }
      })

      expect(md.options.html).toBe(false)
      expect(md.options.linkify).toBe(false)
      expect(md.options.typographer).toBe(false)
      expect(md.options.xhtmlOut).toBe(false)
    })

    it('应支持部分自定义选项', async () => {
      const md = await createMarkdownIt({
        options: {
          html: false
        }
      })

      expect(md.options.html).toBe(false)
      expect(md.options.linkify).toBe(true)
      expect(md.options.typographer).toBe(true)
      expect(md.options.xhtmlOut).toBe(true)
    })

    it('应支持自定义 shiki 配置', async () => {
      const md = await createMarkdownIt({
        shikiConfig: {
          options: {
            themes: {
              dark: 'github-dark',
              light: 'github-light'
            }
          }
        }
      })

      expect(md).toBeInstanceOf(MarkdownIt)
    })
  })

  describe('内置插件', () => {
    it('应挂载所有内置插件', async () => {
      const md = await createMarkdownIt()

      const coreRules = md.core.ruler.getRules('')
      expect(coreRules.length).toBeGreaterThan(0)
    })

    it('tocTree 插件应为标题生成 id', async () => {
      const md = await createMarkdownIt()
      const env: any = {}
      md.render('# Test Heading', env)

      expect(env.tocList).toBeDefined()
      expect(env.__toc_slugger).toBeDefined()
    })

    it('tocTree 插件应构建目录树', async () => {
      const md = await createMarkdownIt()
      const env: any = {}
      const markdown = `
# 主标题
## 二级标题一
### 三级标题
## 二级标题二
`
      md.render(markdown, env)

      expect(env.tocList).toHaveLength(2)
      expect(env.tocList[0].name).toBe('二级标题一')
      expect(env.tocList[0].children).toHaveLength(1)
      expect(env.tocList[0].children[0].name).toBe('三级标题')
      expect(env.tocList[1].name).toBe('二级标题二')
    })

    it('anchorPoint 插件应为标题添加锚点链接', async () => {
      const md = await createMarkdownIt()
      const result = md.render('# Test Heading')

      expect(result).toContain('<a href="#')
      expect(result).toContain('</a>')
    })

    it('routerLink 插件应将 a 标签转换为 RouterLink', async () => {
      const md = await createMarkdownIt()
      const result = md.render('[Test Link](/path)')

      expect(result).toContain('<RouterLink')
      expect(result).toContain('to="/path"')
      expect(result).not.toContain('<a href=')
    })

    it('routerLink 插件应正确处理外部链接', async () => {
      const md = await createMarkdownIt()
      const result = md.render('[External](https://example.com)')

      expect(result).toContain('<RouterLink')
      expect(result).toContain('to="https://example.com"')
      expect(result).toContain('target="_blank"')
      expect(result).toContain('rel="noopener noreferrer"')
      expect(result).toContain('class="link external"')
    })

    it('routerLink 插件应为内部链接添加 class', async () => {
      const md = await createMarkdownIt()
      const result = md.render('[Internal](/internal)')

      expect(result).toContain('class="link"')
    })

    it('应正确渲染代码块', async () => {
      const md = await createMarkdownIt()
      const result = md.render('```javascript\nconst a = 1\n```')

      expect(result).toContain('<pre')
      expect(result).toContain('<code')
    })

    it('应支持 HTML 标签（html: true）', async () => {
      const md = await createMarkdownIt()
      const result = md.render('<div class="custom">Content</div>')

      expect(result).toContain('<div class="custom">')
      expect(result).toContain('Content')
    })

    it('应禁用 HTML 标签（html: false）', async () => {
      const md = await createMarkdownIt({
        options: { html: false }
      })
      const result = md.render('<div class="custom">Content</div>')

      expect(result).not.toContain('<div class="custom">')
    })

    it('应自动转换 URL 为链接（linkify: true）', async () => {
      const md = await createMarkdownIt()
      const result = md.render('Visit https://example.com')

      expect(result).toContain('<RouterLink')
      expect(result).toContain('https://example.com')
    })

    it('应不自动转换 URL（linkify: false）', async () => {
      const md = await createMarkdownIt({
        options: { linkify: false }
      })
      const result = md.render('Visit https://example.com')

      expect(result).not.toContain('<RouterLink')
      expect(result).toContain('https://example.com')
    })
  })

  describe('自定义插件', () => {
    it('应支持函数形式的插件', async () => {
      const mockPlugin = vi.fn((md: MarkdownIt) => {
        md.core.ruler.push('test-plugin', () => {})
      })

      const md = await createMarkdownIt({
        plugins: [mockPlugin]
      })

      expect(mockPlugin).toHaveBeenCalled()
      expect(mockPlugin).toHaveBeenCalledWith(md)
    })

    it('应支持带选项对象的插件', async () => {
      const mockPlugin = vi.fn((md: MarkdownIt, _options: any) => {
        md.core.ruler.push('test-plugin', () => {})
      })

      const options = { testOption: true }
      const md = await createMarkdownIt({
        plugins: [{ plugin: mockPlugin, options }]
      })

      expect(mockPlugin).toHaveBeenCalled()
      expect(mockPlugin).toHaveBeenCalledWith(md, options)
    })

    it('应支持带参数数组的插件', async () => {
      const mockPlugin = vi.fn((md: MarkdownIt, _opt1: any, _opt2: any) => {
        md.core.ruler.push('test-plugin', () => {})
      })

      const md = await createMarkdownIt({
        plugins: [{ plugin: mockPlugin, options: ['opt1', 'opt2'] }]
      })

      expect(mockPlugin).toHaveBeenCalled()
      expect(mockPlugin).toHaveBeenCalledWith(md, 'opt1', 'opt2')
    })

    it('应支持多个自定义插件', async () => {
      const mockPlugin1 = vi.fn((md: MarkdownIt) => {
        md.core.ruler.push('test-plugin-1', () => {})
      })
      const mockPlugin2 = vi.fn((md: MarkdownIt) => {
        md.core.ruler.push('test-plugin-2', () => {})
      })

      await createMarkdownIt({
        plugins: [mockPlugin1, mockPlugin2]
      })

      expect(mockPlugin1).toHaveBeenCalled()
      expect(mockPlugin2).toHaveBeenCalled()
    })

    it('应在内置插件之后挂载自定义插件', async () => {
      const callOrder: string[] = []

      const mockPlugin = vi.fn((md: MarkdownIt) => {
        const coreRules = md.core.ruler.getRules('')
        const tocTreeIndex = coreRules.findIndex(r => r.name === 'toc-tree')
        callOrder.push(`toc-tree-index: ${tocTreeIndex}`)
        md.core.ruler.push('test-plugin', () => {})
      })

      await createMarkdownIt({
        plugins: [mockPlugin]
      })

      expect(callOrder.length).toBeGreaterThan(0)
    })

    it('应忽略空插件数组', async () => {
      const md = await createMarkdownIt({
        plugins: []
      })

      expect(md).toBeInstanceOf(MarkdownIt)
    })

    it('应忽略非数组插件配置', async () => {
      const md = await createMarkdownIt({
        plugins: 'invalid' as any
      })

      expect(md).toBeInstanceOf(MarkdownIt)
    })
  })

  describe('错误处理', () => {
    it('应处理空配置对象', async () => {
      const md = await createMarkdownIt({})

      expect(md).toBeInstanceOf(MarkdownIt)
    })

    it('应处理 undefined 配置', async () => {
      const md = await createMarkdownIt(undefined)

      expect(md).toBeInstanceOf(MarkdownIt)
    })
  })

  describe('渲染功能集成测试', () => {
    it('应正确渲染复杂 Markdown 文档', async () => {
      const md = await createMarkdownIt()
      const markdown = `
# 主标题

这是一段文本，包含**粗体**和*斜体*。

## 二级标题

- 列表项 1
- 列表项 2
- 列表项 3

### 三级标题

\`\`\`javascript
const greeting = 'Hello, World!'
console.log(greeting)
\`\`\`

[链接文本](https://example.com)

> 这是一个引用
`
      const env: any = {}
      const result = md.render(markdown, env)

      expect(result).toContain('<h1')
      expect(result).toContain('主标题')
      expect(result).toContain('<strong>粗体</strong>')
      expect(result).toContain('<em>斜体</em>')
      expect(result).toContain('<ul>')
      expect(result).toContain('<li>')
      expect(result).toContain('<pre')
      expect(result).toContain('<RouterLink')
      expect(result).toContain('<blockquote>')
      expect(env.tocList).toBeDefined()
    })

    it('应正确处理重复标题的 id 生成', async () => {
      const md = await createMarkdownIt()
      const env: any = {}
      const markdown = `
## 标题
## 标题
## 标题
`
      md.render(markdown, env)

      const hashes = env.tocList.map((item: any) => item.hash)
      const uniqueHashes = new Set(hashes)

      expect(uniqueHashes.size).toBe(3)
    })

    it('应为数字开头的标题添加前缀', async () => {
      const md = await createMarkdownIt()
      const env: any = {}
      md.render('## 123标题', env)

      expect(env.tocList[0].hash).toMatch(/^_\d/)
    })

    it('应正确处理嵌套列表', async () => {
      const md = await createMarkdownIt()
      const markdown = `
- 一级列表
  - 二级列表
    - 三级列表
`
      const result = md.render(markdown)

      expect(result).toContain('<ul>')
      expect(result).toContain('<li>')
    })

    it('应正确处理表格', async () => {
      const md = await createMarkdownIt()
      const markdown = `
| 列1 | 列2 | 列3 |
|-----|-----|-----|
| A   | B   | C   |
| D   | E   | F   |
`
      const result = md.render(markdown)

      expect(result).toContain('<table>')
      expect(result).toContain('<thead>')
      expect(result).toContain('<tbody>')
      expect(result).toContain('<td>')
    })
  })

  describe('性能测试', () => {
    it('应能快速创建实例', async () => {
      const start = performance.now()
      await createMarkdownIt()
      const duration = performance.now() - start

      expect(duration).toBeLessThan(1000)
    })

    it('应能处理大量内容', async () => {
      const md = await createMarkdownIt()
      const lines = Array(1000).fill('这是一行测试文本。')
      const markdown = lines.join('\n')

      const start = performance.now()
      const result = md.render(markdown)
      const duration = performance.now() - start

      expect(result).toContain('<p>')
      expect(duration).toBeLessThan(1000)
    })
  })
})
