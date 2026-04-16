import MarkdownIt from 'markdown-it'
import { describe, expect, it } from 'vitest'
import { anchorPoint } from '../../../../src/server/markdown/plugins/anchorPoint.js'
import { tocTree } from '../../../../src/server/markdown/plugins/tocTree.js'
import { createMarkdownWithPlugin, renderMarkdown } from '../testUtils.js'

function createMarkdownWithAnchorAndToc(): MarkdownIt {
  const md = new MarkdownIt()
  md.use(tocTree)
  md.use(anchorPoint)
  return md
}

describe('anchorPoint', () => {
  describe('基础功能', () => {
    it('应为标题生成锚点链接', () => {
      const md = createMarkdownWithPlugin(anchorPoint)
      const html = renderMarkdown(md, '## 测试标题')

      expect(html).toContain('<a href="#')
      expect(html).toContain('</a>')
    })

    it('应正确提取标题的 id 作为锚点 href', () => {
      const md = new MarkdownIt()
      md.use(anchorPoint)

      const tokens = md.parse('## Hello World', {})
      const headingOpen = tokens.find(t => t.type === 'heading_open')
      const id = headingOpen?.attrGet('id')

      const html = md.render('## Hello World')
      expect(html).toContain(`href="#${id}"`)
    })
  })

  describe('不同级别标题', () => {
    it('应处理 h1 标题', () => {
      const md = createMarkdownWithPlugin(anchorPoint)
      const html = renderMarkdown(md, '# 主标题')

      expect(html).toContain('<h1')
      expect(html).toContain('<a href="#')
      expect(html).toContain('</a></h1>')
    })

    it('应处理 h2 标题', () => {
      const md = createMarkdownWithPlugin(anchorPoint)
      const html = renderMarkdown(md, '## 二级标题')

      expect(html).toContain('<h2')
      expect(html).toContain('<a href="#')
      expect(html).toContain('</a></h2>')
    })

    it('应处理 h3 标题', () => {
      const md = createMarkdownWithPlugin(anchorPoint)
      const html = renderMarkdown(md, '### 三级标题')

      expect(html).toContain('<h3')
      expect(html).toContain('<a href="#')
      expect(html).toContain('</a></h3>')
    })

    it('应处理 h4-h6 标题', () => {
      const md = createMarkdownWithPlugin(anchorPoint)

      const html4 = renderMarkdown(md, '#### 四级标题')
      expect(html4).toContain('<h4')
      expect(html4).toContain('<a href="#')

      const html5 = renderMarkdown(md, '##### 五级标题')
      expect(html5).toContain('<h5')
      expect(html5).toContain('<a href="#')

      const html6 = renderMarkdown(md, '###### 六级标题')
      expect(html6).toContain('<h6')
      expect(html6).toContain('<a href="#')
    })
  })

  describe('多标题文档', () => {
    it('应为每个标题生成独立的锚点', () => {
      const md = createMarkdownWithPlugin(anchorPoint)
      const html = renderMarkdown(
        md,
        `## 第一章
### 第一节
## 第二章`
      )

      const anchorCount = (html.match(/<a href="#/g) || []).length
      expect(anchorCount).toBe(3)
    })

    it('应为重复标题生成不同的锚点', () => {
      const md = createMarkdownWithAnchorAndToc()
      const html = renderMarkdown(
        md,
        `## Introduction
## Introduction`
      )

      const hrefs = html.match(/href="#[^"]+"/g) || []
      expect(hrefs).toHaveLength(2)
      expect(hrefs[0]).not.toBe(hrefs[1])
    })
  })

  describe('边界情况', () => {
    it('应处理空文档', () => {
      const md = createMarkdownWithPlugin(anchorPoint)
      const html = renderMarkdown(md, '')

      expect(html).not.toContain('<a href="#')
    })

    it('应处理无标题的文档', () => {
      const md = createMarkdownWithPlugin(anchorPoint)
      const html = renderMarkdown(md, '这是一段普通文本。')

      expect(html).not.toContain('<a href="#')
    })

    it('应处理包含特殊字符的标题', () => {
      const md = createMarkdownWithPlugin(anchorPoint)
      const html = renderMarkdown(md, '## Hello!!!World')

      expect(html).toContain('<a href="#')
    })

    it('应处理中文标题', () => {
      const md = createMarkdownWithPlugin(anchorPoint)
      const html = renderMarkdown(md, '## 中文标题测试')

      expect(html).toContain('<a href="#')
      expect(html).toContain('中文标题测试')
    })
  })

  describe('HTML 结构', () => {
    it('应生成正确的嵌套结构', () => {
      const md = createMarkdownWithPlugin(anchorPoint)
      const html = renderMarkdown(md, '## Test')

      expect(html).toMatch(/<h2[^>]*>\s*<a href="#[^"]+">[^<]*<\/a>\s*<\/h2>/)
    })

    it('锚点应包含标题文本', () => {
      const md = createMarkdownWithPlugin(anchorPoint)
      const html = renderMarkdown(md, '## My Heading')

      expect(html).toContain('>My Heading</a>')
    })
  })
})
