import { describe, expect, it } from 'vitest'
import { routerLink } from '../../../../src/server/markdown/plugins/routerLink.js'
import { createMarkdownWithPlugin, renderMarkdown } from '../testUtils.js'

describe('routerLink', () => {
  describe('基础功能', () => {
    it('应将 a 标签转换为 RouterLink', () => {
      const md = createMarkdownWithPlugin(routerLink)
      const html = renderMarkdown(md, '[链接](/path)')

      expect(html).toContain('<RouterLink')
      expect(html).toContain('</RouterLink>')
    })

    it('应将 href 属性转换为 to 属性', () => {
      const md = createMarkdownWithPlugin(routerLink)
      const html = renderMarkdown(md, '[链接](/guide)')

      expect(html).toContain('to="/guide"')
      expect(html).not.toContain('href=')
    })

    it('应添加 link 类名', () => {
      const md = createMarkdownWithPlugin(routerLink)
      const html = renderMarkdown(md, '[链接](/path)')

      expect(html).toContain('class="link"')
    })
  })

  describe('内部链接', () => {
    it('应正确处理根路径', () => {
      const md = createMarkdownWithPlugin(routerLink)
      const html = renderMarkdown(md, '[首页](/)')

      expect(html).toContain('to="/"')
    })

    it('应正确处理相对路径', () => {
      const md = createMarkdownWithPlugin(routerLink)
      const html = renderMarkdown(md, '[指南](./guide)')

      expect(html).toContain('to="./guide"')
    })

    it('应正确处理带锚点的路径', () => {
      const md = createMarkdownWithPlugin(routerLink)
      const html = renderMarkdown(md, '[章节](/guide#intro)')

      expect(html).toContain('to="/guide#intro"')
    })

    it('应正确处理带查询参数的路径', () => {
      const md = createMarkdownWithPlugin(routerLink)
      const html = renderMarkdown(md, '[搜索](/search?q=test)')

      expect(html).toContain('to="/search?q=test"')
    })
  })

  describe('外部链接', () => {
    it('应正确处理 https 链接', () => {
      const md = createMarkdownWithPlugin(routerLink)
      const html = renderMarkdown(md, '[GitHub](https://github.com)')

      expect(html).toContain('to="https://github.com"')
      expect(html).toContain('target="_blank"')
      expect(html).toContain('rel="noopener noreferrer"')
    })

    it('应正确处理 http 链接', () => {
      const md = createMarkdownWithPlugin(routerLink)
      const html = renderMarkdown(md, '[示例](http://example.com)')

      expect(html).toContain('to="http://example.com"')
      expect(html).toContain('target="_blank"')
    })

    it('应为外部链接添加 external 类名', () => {
      const md = createMarkdownWithPlugin(routerLink)
      const html = renderMarkdown(md, '[外部](https://example.com)')

      expect(html).toContain('class="link external"')
    })

    it('应正确处理带路径的外部链接', () => {
      const md = createMarkdownWithPlugin(routerLink)
      const html = renderMarkdown(md, '[文档](https://vitarx.cn/guide)')

      expect(html).toContain('to="https://vitarx.cn/guide"')
      expect(html).toContain('target="_blank"')
    })
  })

  describe('链接文本', () => {
    it('应保留链接文本', () => {
      const md = createMarkdownWithPlugin(routerLink)
      const html = renderMarkdown(md, '[点击这里](/path)')

      expect(html).toContain('>点击这里</RouterLink>')
    })

    it('应处理包含特殊字符的链接文本', () => {
      const md = createMarkdownWithPlugin(routerLink)
      const html = renderMarkdown(md, '[Vitarx 3.0 & TypeScript](/guide)')

      expect(html).toContain('>Vitarx 3.0 &amp; TypeScript</RouterLink>')
    })

    it('应处理中文链接文本', () => {
      const md = createMarkdownWithPlugin(routerLink)
      const html = renderMarkdown(md, '[开始学习](/start)')

      expect(html).toContain('>开始学习</RouterLink>')
    })
  })

  describe('边界情况', () => {
    it('应处理空链接文本', () => {
      const md = createMarkdownWithPlugin(routerLink)
      const html = renderMarkdown(md, '[](https://example.com)')

      expect(html).toContain('<RouterLink')
    })

    it('应处理空链接地址', () => {
      const md = createMarkdownWithPlugin(routerLink)
      const html = renderMarkdown(md, '[链接]()')

      expect(html).toContain('to=""')
    })

    it('应处理多个链接', () => {
      const md = createMarkdownWithPlugin(routerLink)
      const html = renderMarkdown(md, '[内部](/a) 和 [外部](https://b.com)')

      const routerLinks = (html.match(/<RouterLink/g) || []).length
      expect(routerLinks).toBe(2)
    })

    it('应处理无链接的文档', () => {
      const md = createMarkdownWithPlugin(routerLink)
      const html = renderMarkdown(md, '普通文本内容')

      expect(html).not.toContain('<RouterLink')
    })
  })

  describe('HTML 结构', () => {
    it('应生成正确的开闭标签', () => {
      const md = createMarkdownWithPlugin(routerLink)
      const html = renderMarkdown(md, '[链接](/path)')

      const openCount = (html.match(/<RouterLink/g) || []).length
      const closeCount = (html.match(/<\/RouterLink>/g) || []).length

      expect(openCount).toBe(closeCount)
    })

    it('应正确处理行内链接', () => {
      const md = createMarkdownWithPlugin(routerLink)
      const html = renderMarkdown(md, '这是[链接](/path)在文本中')

      expect(html).toContain('<RouterLink')
      expect(html).toContain('这是')
      expect(html).toContain('在文本中')
    })
  })

  describe('与其他 Markdown 语法共存', () => {
    it('应在标题中正确工作', () => {
      const md = createMarkdownWithPlugin(routerLink)
      const html = renderMarkdown(md, '## [链接](/path)')

      expect(html).toContain('<RouterLink')
      expect(html).toContain('<h2')
    })

    it('应在列表中正确工作', () => {
      const md = createMarkdownWithPlugin(routerLink)
      const html = renderMarkdown(
        md,
        `- [项目1](/a)
- [项目2](/b)`
      )

      expect(html).toContain('<RouterLink')
      expect(html).toContain('<ul')
    })

    it('应在引用中正确工作', () => {
      const md = createMarkdownWithPlugin(routerLink)
      const html = renderMarkdown(md, '> 参考 [文档](/docs)')

      expect(html).toContain('<RouterLink')
      expect(html).toContain('<blockquote')
    })
  })
})
