import { describe, expect, it } from 'vitest'
import { jsxComponentParser } from '../../../../src/server/markdown/plugins/jsxComponentParser.js'
import { createMarkdownWithPlugin, parseMarkdown, renderMarkdown } from '../testUtils.js'

describe('jsxComponentParser', () => {
  describe('自闭合标签', () => {
    it('应解析标准自闭合标签 <Tag />', () => {
      const md = createMarkdownWithPlugin(jsxComponentParser)
      const html = renderMarkdown(md, '<Button />')

      expect(html).toContain('<Button />')
    })

    it('应解析带空格的自闭合标签 <Tag / >', () => {
      const md = createMarkdownWithPlugin(jsxComponentParser)
      const html = renderMarkdown(md, '<Button / >')

      expect(html).toContain('<Button / >')
    })

    it('应解析带属性的自闭合标签', () => {
      const md = createMarkdownWithPlugin(jsxComponentParser)
      const html = renderMarkdown(md, '<Button variant="primary" size="large" />')

      expect(html).toContain('<Button variant="primary" size="large" />')
    })

    it('应解析带空格和属性的自闭合标签', () => {
      const md = createMarkdownWithPlugin(jsxComponentParser)
      const html = renderMarkdown(md, '<Button variant="primary" / >')

      expect(html).toContain('<Button variant="primary" / >')
    })

    it('应正确识别多个连续的自闭合标签', () => {
      const md = createMarkdownWithPlugin(jsxComponentParser)
      const html = renderMarkdown(
        md,
        `<Button />
<Input />
<Select />`
      )

      expect(html).toContain('<Button />')
      expect(html).toContain('<Input />')
      expect(html).toContain('<Select />')
    })
  })

  describe('成对标签', () => {
    it('应解析简单的成对标签', () => {
      const md = createMarkdownWithPlugin(jsxComponentParser)
      const html = renderMarkdown(
        md,
        `<Button>
Click me
</Button>`
      )

      expect(html).toContain('<Button>')
      expect(html).toContain('Click me')
      expect(html).toContain('</Button>')
    })

    it('应解析带属性的成对标签', () => {
      const md = createMarkdownWithPlugin(jsxComponentParser)
      const html = renderMarkdown(
        md,
        `<Button variant="primary">
Submit
</Button>`
      )

      expect(html).toContain('<Button>')
      expect(html).toContain('Submit')
      expect(html).toContain('</Button>')
    })

    it('应解析空内容的成对标签', () => {
      const md = createMarkdownWithPlugin(jsxComponentParser)
      const html = renderMarkdown(
        md,
        `<Container>
</Container>`
      )

      expect(html).toContain('<Container>')
      expect(html).toContain('</Container>')
    })

    it('应解析多行内容的成对标签', () => {
      const md = createMarkdownWithPlugin(jsxComponentParser)
      const html = renderMarkdown(
        md,
        `<Card>
# Title
Content here
More content
</Card>`
      )

      expect(html).toContain('<Card>')
      expect(html).toContain('# Title')
      expect(html).toContain('Content here')
      expect(html).toContain('</Card>')
    })
  })

  describe('嵌套组件', () => {
    it('应正确处理同名组件嵌套', () => {
      const md = createMarkdownWithPlugin(jsxComponentParser)
      const html = renderMarkdown(
        md,
        `<Container>
<Container>
Nested
</Container>
</Container>`
      )

      expect(html).toContain('<Container>')
      expect(html).toContain('Nested')
      expect(html).toContain('</Container>')
    })

    it('应正确处理不同组件嵌套', () => {
      const md = createMarkdownWithPlugin(jsxComponentParser)
      const html = renderMarkdown(
        md,
        `<Container>
<Button>
Click
</Button>
</Container>`
      )

      expect(html).toContain('<Container>')
      expect(html).toContain('<Button>')
      expect(html).toContain('Click')
      expect(html).toContain('</Button>')
      expect(html).toContain('</Container>')
    })

    it('应正确处理多层嵌套', () => {
      const md = createMarkdownWithPlugin(jsxComponentParser)
      const html = renderMarkdown(
        md,
        `<Level1>
<Level2>
<Level3>
Deep content
</Level3>
</Level2>
</Level1>`
      )

      expect(html).toContain('<Level1>')
      expect(html).toContain('<Level2>')
      expect(html).toContain('<Level3>')
      expect(html).toContain('Deep content')
    })

    it('应正确处理嵌套中的自闭合标签', () => {
      const md = createMarkdownWithPlugin(jsxComponentParser)
      const html = renderMarkdown(
        md,
        `<Container>
<Button />
<Input />
</Container>`
      )

      expect(html).toContain('<Container>')
      expect(html).toContain('<Button />')
      expect(html).toContain('<Input />')
      expect(html).toContain('</Container>')
    })

    it('应正确处理嵌套中的带空格自闭合标签', () => {
      const md = createMarkdownWithPlugin(jsxComponentParser)
      const html = renderMarkdown(
        md,
        `<Container>
<Button / >
</Container>`
      )

      expect(html).toContain('<Container>')
      expect(html).toContain('<Button / >')
      expect(html).toContain('</Container>')
    })
  })

  describe('组件命名规则', () => {
    it('应识别大写字母开头的组件名', () => {
      const md = createMarkdownWithPlugin(jsxComponentParser)
      const tokens = parseMarkdown(md, '<Button />')

      expect(tokens.some(t => t.type === 'jsxComponent')).toBe(true)
    })

    it('应识别包含数字的组件名', () => {
      const md = createMarkdownWithPlugin(jsxComponentParser)
      const html = renderMarkdown(md, '<Button2 />')

      expect(html).toContain('<Button2 />')
    })

    it('不应识别小写字母开头的标签', () => {
      const md = createMarkdownWithPlugin(jsxComponentParser)
      const tokens = parseMarkdown(md, '<button />')

      expect(tokens.some(t => t.type === 'jsxComponent')).toBe(false)
    })

    it('应识别驼峰命名的组件', () => {
      const md = createMarkdownWithPlugin(jsxComponentParser)
      const html = renderMarkdown(md, '<MyButton />')

      expect(html).toContain('<MyButton />')
    })

    it('应识别全大写的组件名', () => {
      const md = createMarkdownWithPlugin(jsxComponentParser)
      const html = renderMarkdown(md, '<BUTTON />')

      expect(html).toContain('<BUTTON />')
    })
  })

  describe('边界情况', () => {
    it('应处理空文档', () => {
      const md = createMarkdownWithPlugin(jsxComponentParser)
      const html = renderMarkdown(md, '')

      expect(html).toBe('')
    })

    it('应处理无组件的文档', () => {
      const md = createMarkdownWithPlugin(jsxComponentParser)
      const html = renderMarkdown(md, '这是一段普通文本')

      expect(html).toContain('这是一段普通文本')
      expect(html).not.toContain('jsxComponent')
    })

    it('应处理未闭合的标签', () => {
      const md = createMarkdownWithPlugin(jsxComponentParser)
      const tokens = parseMarkdown(
        md,
        `<Button>
No closing tag`
      )

      expect(tokens.some(t => t.type === 'jsxComponent')).toBe(false)
    })

    it('应处理只有开始标签的情况', () => {
      const md = createMarkdownWithPlugin(jsxComponentParser)
      const html = renderMarkdown(md, '<Button>')

      expect(html).not.toContain('<Button>')
    })

    it('应处理标签前有缩进的情况', () => {
      const md = createMarkdownWithPlugin(jsxComponentParser)
      const html = renderMarkdown(
        md,
        `  <Button />
  <Input />`
      )

      expect(html).toContain('<Button />')
      expect(html).toContain('<Input />')
    })

    it('应处理标签后有空白的情况', () => {
      const md = createMarkdownWithPlugin(jsxComponentParser)
      const html = renderMarkdown(md, '<Button />   ')

      expect(html).toContain('<Button />')
    })
  })

  describe('与其他 Markdown 语法共存', () => {
    it('应与标题共存', () => {
      const md = createMarkdownWithPlugin(jsxComponentParser)
      const html = renderMarkdown(
        md,
        `# Title
<Button />
## Subtitle`
      )

      expect(html).toContain('<h1')
      expect(html).toContain('<Button />')
      expect(html).toContain('<h2')
    })

    it('应与列表共存', () => {
      const md = createMarkdownWithPlugin(jsxComponentParser)
      const html = renderMarkdown(
        md,
        `- Item 1
<Button />
- Item 2`
      )

      expect(html).toContain('<ul')
      expect(html).toContain('<Button />')
    })

    it('应与引用共存', () => {
      const md = createMarkdownWithPlugin(jsxComponentParser)
      const html = renderMarkdown(
        md,
        `> Quote
<Button />
> Another quote`
      )

      expect(html).toContain('<blockquote')
      expect(html).toContain('<Button />')
    })

    it('应与代码块共存', () => {
      const md = createMarkdownWithPlugin(jsxComponentParser)
      const html = renderMarkdown(
        md,
        `\`\`\`js
const a = 1
\`\`\`
<Button />`
      )

      expect(html).toContain('<pre')
      expect(html).toContain('<Button />')
    })

    it('应与行内代码共存', () => {
      const md = createMarkdownWithPlugin(jsxComponentParser)
      const html = renderMarkdown(
        md,
        `Use \`code\` here
<Button />`
      )

      expect(html).toContain('<code>')
      expect(html).toContain('<Button />')
    })

    it('应与链接共存', () => {
      const md = createMarkdownWithPlugin(jsxComponentParser)
      const html = renderMarkdown(
        md,
        `[Link](url)
<Button />`
      )

      expect(html).toContain('<a href=')
      expect(html).toContain('<Button />')
    })
  })

  describe('Token 结构', () => {
    it('应生成正确的 token 类型', () => {
      const md = createMarkdownWithPlugin(jsxComponentParser)
      const tokens = parseMarkdown(md, '<Button />')

      const jsxToken = tokens.find(t => t.type === 'jsxComponent')
      expect(jsxToken).toBeDefined()
    })

    it('应设置正确的 tag 属性', () => {
      const md = createMarkdownWithPlugin(jsxComponentParser)
      const tokens = parseMarkdown(md, '<Button />')

      const jsxToken = tokens.find(t => t.type === 'jsxComponent')
      expect(jsxToken?.tag).toBe('Button')
    })

    it('应设置正确的 content 属性', () => {
      const md = createMarkdownWithPlugin(jsxComponentParser)
      const tokens = parseMarkdown(md, '<Button variant="primary" />')

      const jsxToken = tokens.find(t => t.type === 'jsxComponent')
      expect(jsxToken?.content).toBe('<Button variant="primary" />')
    })

    it('应设置正确的 block 属性', () => {
      const md = createMarkdownWithPlugin(jsxComponentParser)
      const tokens = parseMarkdown(md, '<Button />')

      const jsxToken = tokens.find(t => t.type === 'jsxComponent')
      expect(jsxToken?.block).toBe(true)
    })

    it('应设置正确的 map 属性', () => {
      const md = createMarkdownWithPlugin(jsxComponentParser)
      const tokens = parseMarkdown(
        md,
        `Text
<Button />
More text`
      )

      const jsxToken = tokens.find(t => t.type === 'jsxComponent')
      expect(jsxToken?.map).toEqual([1, 2])
    })
  })

  describe('复杂场景', () => {
    it('应处理包含特殊字符的属性', () => {
      const md = createMarkdownWithPlugin(jsxComponentParser)
      const html = renderMarkdown(md, '<Button data-value="test &amp; demo" />')

      expect(html).toContain('data-value="test &amp; demo"')
    })

    it('应处理多个属性', () => {
      const md = createMarkdownWithPlugin(jsxComponentParser)
      const html = renderMarkdown(
        md,
        '<Button id="btn" class="primary" disabled onClick={handleClick} />'
      )

      expect(html).toContain('id="btn"')
      expect(html).toContain('class="primary"')
      expect(html).toContain('disabled')
    })

    it('应处理包含 Markdown 语法的组件内容', () => {
      const md = createMarkdownWithPlugin(jsxComponentParser)
      const html = renderMarkdown(
        md,
        `<Card>
## Title
- Item 1
- Item 2
**Bold** and *italic*
</Card>`
      )

      expect(html).toContain('<Card>')
      expect(html).toContain('## Title')
      expect(html).toContain('- Item 1')
      expect(html).toContain('</Card>')
    })

    it('应处理复杂的嵌套结构', () => {
      const md = createMarkdownWithPlugin(jsxComponentParser)
      const html = renderMarkdown(
        md,
        `<Layout>
<Header>
<Nav />
</Header>
<Main>
<Article>
Content
</Article>
<Aside />
</Main>
</Layout>`
      )

      expect(html).toContain('<Layout>')
      expect(html).toContain('<Header>')
      expect(html).toContain('<Nav />')
      expect(html).toContain('<Main>')
      expect(html).toContain('<Article>')
      expect(html).toContain('Content')
      expect(html).toContain('<Aside />')
    })
  })
})
