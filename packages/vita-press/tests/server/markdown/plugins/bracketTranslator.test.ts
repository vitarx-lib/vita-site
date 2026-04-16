import { describe, expect, it } from 'vitest'
import { bracketTranslator } from '../../../../src/server/markdown/plugins/bracketTranslator.js'
import { createMarkdownWithPlugin, renderMarkdown } from '../testUtils.js'

describe('bracketTranslator', () => {
  describe('花括号转义', () => {
    it('应转义左花括号 {', () => {
      const md = createMarkdownWithPlugin(bracketTranslator)
      const html = renderMarkdown(md, '测试 { 花括号')

      expect(html).toContain('&#123;')
      expect(html).not.toContain('{')
    })

    it('应转义右花括号 }', () => {
      const md = createMarkdownWithPlugin(bracketTranslator)
      const html = renderMarkdown(md, '测试 } 花括号')

      expect(html).toContain('&#125;')
      expect(html).not.toContain('}')
    })

    it('应转义成对的花括号 {}', () => {
      const md = createMarkdownWithPlugin(bracketTranslator)
      const html = renderMarkdown(md, '测试 {name} 变量')

      expect(html).toContain('&#123;')
      expect(html).toContain('&#125;')
    })

    it('应转义多个花括号', () => {
      const md = createMarkdownWithPlugin(bracketTranslator)
      const html = renderMarkdown(md, '{{count}} 和 {{name}}')

      const leftBraces = (html.match(/&#123;/g) || []).length
      const rightBraces = (html.match(/&#125;/g) || []).length

      expect(leftBraces).toBe(4)
      expect(rightBraces).toBe(4)
    })
  })

  describe('反引号转义', () => {
    it('应在纯文本中转义反引号', () => {
      const md = createMarkdownWithPlugin(bracketTranslator)
      const html = renderMarkdown(md, '使用反引号符号 ` 进行标记')

      expect(html).toContain('&#96;')
    })
  })

  describe('尖括号转义', () => {
    it('应转义左尖括号 <', () => {
      const md = createMarkdownWithPlugin(bracketTranslator)
      const html = renderMarkdown(md, '测试 < 尖括号')

      expect(html).toContain('&lt;')
    })

    it('应转义右尖括号 >', () => {
      const md = createMarkdownWithPlugin(bracketTranslator)
      const html = renderMarkdown(md, '测试 > 尖括号')

      expect(html).toContain('&gt;')
    })

    it('应转义成对的尖括号 <>', () => {
      const md = createMarkdownWithPlugin(bracketTranslator)
      const html = renderMarkdown(md, '测试 <Component> 组件')

      expect(html).toContain('&lt;')
      expect(html).toContain('&gt;')
    })
  })

  describe('混合字符转义', () => {
    it('应同时转义多种特殊字符', () => {
      const md = createMarkdownWithPlugin(bracketTranslator)
      const html = renderMarkdown(md, 'const {name} = <Component>')

      expect(html).toContain('&#123;')
      expect(html).toContain('&#125;')
      expect(html).toContain('&lt;')
      expect(html).toContain('&gt;')
    })

    it('应正确处理 Vitarx 模板语法', () => {
      const md = createMarkdownWithPlugin(bracketTranslator)
      const html = renderMarkdown(md, '{{ message }}')

      expect(html).toContain('&#123;')
      expect(html).toContain('&#125;')
    })

    it('应正确处理 JSX 语法', () => {
      const md = createMarkdownWithPlugin(bracketTranslator)
      const html = renderMarkdown(md, '<div className="test">')

      expect(html).toContain('&lt;')
      expect(html).toContain('&gt;')
    })
  })

  describe('边界情况', () => {
    it('应处理空文档', () => {
      const md = createMarkdownWithPlugin(bracketTranslator)
      const html = renderMarkdown(md, '')

      expect(html).toBe('')
    })

    it('应处理无特殊字符的文本', () => {
      const md = createMarkdownWithPlugin(bracketTranslator)
      const html = renderMarkdown(md, '普通文本内容')

      expect(html).toContain('普通文本内容')
    })

    it('应处理纯特殊字符', () => {
      const md = createMarkdownWithPlugin(bracketTranslator)
      const html = renderMarkdown(md, '{}<>`')

      expect(html).toContain('&#123;')
      expect(html).toContain('&#125;')
      expect(html).toContain('&lt;')
      expect(html).toContain('&gt;')
      expect(html).toContain('&#96;')
    })

    it('应处理连续的特殊字符', () => {
      const md = createMarkdownWithPlugin(bracketTranslator)
      const html = renderMarkdown(md, '{{{ }}}')

      expect(html).toContain('&#123;')
      expect(html).toContain('&#125;')
    })

    it('应保留普通字符不变', () => {
      const md = createMarkdownWithPlugin(bracketTranslator)
      const html = renderMarkdown(md, 'Hello World 123 !@#$%^&*()')

      expect(html).toContain('Hello World 123')
    })
  })

  describe('与其他 Markdown 语法共存', () => {
    it('应在标题中正确转义', () => {
      const md = createMarkdownWithPlugin(bracketTranslator)
      const html = renderMarkdown(md, '## 标题 {name}')

      expect(html).toContain('&#123;')
      expect(html).toContain('&#125;')
      expect(html).toContain('<h2')
    })

    it('应在列表中正确转义', () => {
      const md = createMarkdownWithPlugin(bracketTranslator)
      const html = renderMarkdown(
        md,
        `- 项目 {a}
- 项目 {b}`
      )

      expect(html).toContain('&#123;')
      expect(html).toContain('<ul')
    })

    it('应在引用中正确转义', () => {
      const md = createMarkdownWithPlugin(bracketTranslator)
      const html = renderMarkdown(md, '> 引用 {content}')

      expect(html).toContain('&#123;')
      expect(html).toContain('<blockquote')
    })
  })
})
