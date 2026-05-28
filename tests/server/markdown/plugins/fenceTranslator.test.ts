import MarkdownIt from 'markdown-it'
import { describe, expect, it } from 'vitest'
import { fenceTranslator } from '../../../../src/server/markdown/plugins/fenceTranslator.js'
import { renderMarkdown } from '../../../testUtils.js'

function createMarkdownWithMockFence(): MarkdownIt {
  const md = new MarkdownIt()

  md.renderer.rules.fence = function (tokens, idx) {
    const token = tokens[idx]
    const info = token?.info || 'text'
    const content = token?.content || ''
    return `<pre class="shiki"><code class="language-${info}">${content}</code></pre>`
  }

  md.use(fenceTranslator)
  return md
}

describe('fenceTranslator', () => {
  describe('基础功能', () => {
    it('应生成包含 v-html 的代码块', () => {
      const md = createMarkdownWithMockFence()
      const html = renderMarkdown(md, '```js\nconsole.log("hello")\n```')

      expect(html).toContain('v-html')
    })

    it('应生成 v-source-code 容器', () => {
      const md = createMarkdownWithMockFence()
      const html = renderMarkdown(md, '```js\ncode\n```')

      expect(html).toContain('class="v-source-code"')
    })

    it('应生成复制按钮', () => {
      const md = createMarkdownWithMockFence()
      const html = renderMarkdown(md, '```js\ncode\n```')

      expect(html).toContain('class="v-source-code__copy"')
      expect(html).toContain('title="copy all code"')
    })
  })

  describe('语言信息', () => {
    it('应正确提取语言信息', () => {
      const md = createMarkdownWithMockFence()
      const html = renderMarkdown(md, '```typescript\nconst x = 1\n```')

      expect(html).toContain('data-lang="typescript"')
    })

    it('应处理无语言标记的代码块', () => {
      const md = createMarkdownWithMockFence()
      const html = renderMarkdown(md, '```\nplain code\n```')

      expect(html).toContain('data-lang="text"')
    })

    it('应处理各种编程语言', () => {
      const languages = ['js', 'ts', 'python', 'rust', 'go', 'java']

      const md = createMarkdownWithMockFence()
      languages.forEach(lang => {
        const html = renderMarkdown(md, '```' + lang + '\ncode\n```')
        expect(html).toContain(`data-lang="${lang}"`)
      })
    })
  })

  describe('特殊字符转义', () => {
    it('应转义反引号', () => {
      const md = createMarkdownWithMockFence()
      const html = renderMarkdown(md, '```js\nconst str = `template`\n```')

      expect(html).toContain('&#96;')
    })

    it('应转义左花括号', () => {
      const md = createMarkdownWithMockFence()
      const html = renderMarkdown(md, '```js\nconst obj = { name: "test" }\n```')

      expect(html).toContain('&#123;')
    })

    it('应转义右花括号', () => {
      const md = createMarkdownWithMockFence()
      const html = renderMarkdown(md, '```js\nconst obj = { name: "test" }\n```')

      expect(html).toContain('&#125;')
    })

    it('应同时转义多种特殊字符', () => {
      const md = createMarkdownWithMockFence()
      const html = renderMarkdown(md, '```js\nconst {a} = `${x}`\n```')

      expect(html).toContain('&#96;')
      expect(html).toContain('&#123;')
      expect(html).toContain('&#125;')
    })
  })

  describe('边界情况', () => {
    it('应处理空代码块', () => {
      const md = createMarkdownWithMockFence()
      const html = renderMarkdown(md, '```js\n```')

      expect(html).toContain('v-source-code')
    })

    it('应处理多行代码', () => {
      const md = createMarkdownWithMockFence()
      const html = renderMarkdown(md, '```js\nline1\nline2\nline3\n```')

      expect(html).toContain('v-source-code')
    })

    it('应处理包含 HTML 的代码', () => {
      const md = createMarkdownWithMockFence()
      const html = renderMarkdown(md, '```html\n<div>content</div>\n```')

      expect(html).toContain('v-source-code')
    })
  })

  describe('插件缺失处理', () => {
    it('当 fence 规则不存在时应跳过处理', () => {
      const md = new MarkdownIt()
      delete md.renderer.rules.fence

      md.use(fenceTranslator)

      expect(md.renderer.rules.fence).toBeUndefined()
    })
  })

  describe('HTML 结构', () => {
    it('应保留 pre 和 code 标签', () => {
      const md = createMarkdownWithMockFence()
      const html = renderMarkdown(md, '```js\ncode\n```')

      expect(html).toContain('<pre')
      expect(html).toContain('<code')
      expect(html).toContain('</code>')
      expect(html).toContain('</pre>')
    })

    it('应生成正确的嵌套结构', () => {
      const md = createMarkdownWithMockFence()
      const html = renderMarkdown(md, '```js\ncode\n```')

      expect(html).toMatch(
        /<div class="v-source-code"[^>]*>.*<span class="v-source-code__lang">.*<\/span>.*<button[^>]*>.*<\/button>.*<pre[^>]*>.*<code[^>]*>.*<\/code>.*<\/pre>.*<\/div>/s
      )
    })
  })
})
