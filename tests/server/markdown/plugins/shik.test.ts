import { describe, expect, it } from 'vitest'
import {
  createShikiHighlighter,
  type PartialShikiConfig
} from '../../../../src/server/markdown/plugins/shik.js'
import { createMarkdownWithPlugin, renderMarkdown } from '../../../testUtils.js'

describe('shik', () => {
  describe('默认配置', () => {
    it('应使用默认语言列表', async () => {
      const highlighter = await createShikiHighlighter({})
      expect(highlighter).toBeDefined()
      expect(typeof highlighter).toBe('function')
    })

    it('应使用默认主题配置', async () => {
      const highlighter = await createShikiHighlighter({})
      const md = createMarkdownWithPlugin(highlighter)
      const html = renderMarkdown(md, '```js\nconst x = 1\n```')
      expect(html).toContain('<pre')
      expect(html).toContain('<code')
    })
  })

  describe('配置合并', () => {
    it('应支持自定义语言列表', async () => {
      const config: PartialShikiConfig = {
        langs: ['javascript', 'typescript']
      }
      const highlighter = await createShikiHighlighter(config)
      expect(highlighter).toBeDefined()
    })

    it('应支持自定义主题', async () => {
      const config: PartialShikiConfig = {
        options: {
          themes: {
            dark: 'github-dark',
            light: 'github-light'
          }
        }
      }
      const highlighter = await createShikiHighlighter(config)
      const md = createMarkdownWithPlugin(highlighter)
      const html = renderMarkdown(md, '```js\ncode\n```')

      expect(html).toContain('shiki')
    })

    it('应支持自定义 CSS 变量前缀', async () => {
      const config: PartialShikiConfig = {
        options: {
          themes: {
            dark: 'github-dark',
            light: 'github-light'
          },
          cssVariablePrefix: '--custom-'
        }
      }
      const highlighter = await createShikiHighlighter(config)
      expect(highlighter).toBeDefined()
    })

    it('应支持默认颜色设置', async () => {
      const config: PartialShikiConfig = {
        options: {
          themes: {
            dark: 'github-dark',
            light: 'github-light'
          },
          defaultColor: 'light'
        }
      }
      const highlighter = await createShikiHighlighter(config)
      expect(highlighter).toBeDefined()
    })
  })

  describe('代码高亮功能', () => {
    it('应正确高亮 JavaScript 代码', async () => {
      const highlighter = await createShikiHighlighter({})
      const md = createMarkdownWithPlugin(highlighter)
      const html = renderMarkdown(md, '```js\nconst greeting = "hello";\n```')

      expect(html).toContain('<pre')
      expect(html).toContain('class="shiki')
    })

    it('应正确高亮 TypeScript 代码', async () => {
      const highlighter = await createShikiHighlighter({})
      const md = createMarkdownWithPlugin(highlighter)
      const html = renderMarkdown(md, '```typescript\ninterface User {\n  name: string;\n}\n```')

      expect(html).toContain('<pre')
      expect(html).toContain('shiki')
    })

    it('应正确处理多行代码', async () => {
      const highlighter = await createShikiHighlighter({})
      const md = createMarkdownWithPlugin(highlighter)
      const html = renderMarkdown(md, '```js\nconst a = 1;\nconst b = 2;\nconst c = a + b;\n```')

      expect(html).toContain('<pre')
      expect(html).toContain('</pre>')
    })

    it('应正确处理空代码块', async () => {
      const highlighter = await createShikiHighlighter({})
      const md = createMarkdownWithPlugin(highlighter)
      const html = renderMarkdown(md, '```js\n```')

      expect(html).toContain('<pre')
    })

    it('应使用 fallbackLanguage 处理未加载的语言', async () => {
      const config: PartialShikiConfig = {
        langs: ['javascript'],
        options: {
          themes: {
            dark: 'github-dark',
            light: 'github-light'
          },
          fallbackLanguage: 'javascript'
        }
      }
      const highlighter = await createShikiHighlighter(config)
      const md = createMarkdownWithPlugin(highlighter)
      const html = renderMarkdown(md, '```python\nprint("hello")\n```')

      expect(html).toContain('<pre')
    })
  })

  describe('边界情况', () => {
    it('应处理空配置', async () => {
      const highlighter = await createShikiHighlighter({})
      expect(highlighter).toBeDefined()
    })

    it('应处理部分配置', async () => {
      const config: PartialShikiConfig = {
        langs: ['javascript']
      }
      const highlighter = await createShikiHighlighter(config)
      expect(highlighter).toBeDefined()
    })

    it('应处理只有 options 的配置', async () => {
      const config: PartialShikiConfig = {
        options: {
          themes: {
            dark: 'github-dark',
            light: 'github-light'
          }
        }
      }
      const highlighter = await createShikiHighlighter(config)
      expect(highlighter).toBeDefined()
    })
  })

  describe('与其他 Markdown 语法共存', () => {
    it('应正确处理包含代码块的文档', async () => {
      const highlighter = await createShikiHighlighter({})
      const md = createMarkdownWithPlugin(highlighter)
      const html = renderMarkdown(
        md,
        `# 标题

\`\`\`js
const x = 1;
\`\`\`

普通段落`
      )

      expect(html).toContain('<h1')
      expect(html).toContain('<pre')
      expect(html).toContain('<p>')
    })

    it('应处理多个代码块', async () => {
      const highlighter = await createShikiHighlighter({})
      const md = createMarkdownWithPlugin(highlighter)
      const html = renderMarkdown(
        md,
        `\`\`\`js
const a = 1;
\`\`\`

\`\`\`ts
const b: number = 2;
\`\`\``
      )

      const preCount = (html.match(/<pre/g) || []).length
      expect(preCount).toBe(2)
    })
  })
})
