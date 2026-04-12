import MarkdownIt from 'markdown-it'
import { describe, expect, it } from 'vitest'
import {
  type TocParseEnvContext,
  tocTree,
  type TocTree
} from '../../../../src/core/markdown/plugins/tocTree.js'

function createMarkdown(): MarkdownIt {
  const md = new MarkdownIt()
  md.use(tocTree)
  return md
}

function parseAndExtractToc(md: MarkdownIt, content: string): TocTree[] {
  const env: TocParseEnvContext = {} as TocParseEnvContext
  md.parse(content, env)
  return env.__toc_tree_list || []
}

function extractHeadingIds(md: MarkdownIt, content: string): string[] {
  const tokens = md.parse(content, {})
  const ids: string[] = []
  for (const token of tokens) {
    if (token.type === 'heading_open') {
      const id = token.attrGet('id')
      if (id) ids.push(id)
    }
  }
  return ids
}

describe('tocTree', () => {
  describe('基础功能', () => {
    it('应正确解析简单标题结构', () => {
      const md = createMarkdown()
      const toc = parseAndExtractToc(
        md,
        `# 主标题
## 第一章
### 第一节
## 第二章`
      )

      expect(toc).toHaveLength(2)
      expect(toc[0]!.name).toBe('第一章')
      expect(toc[0]!.level).toBe(2)
      expect(toc[0]!.children).toHaveLength(1)
      expect(toc[0]!.children[0]!.name).toBe('第一节')
      expect(toc[1]!.name).toBe('第二章')
    })

    it('应忽略 h1 标题', () => {
      const md = createMarkdown()
      const toc = parseAndExtractToc(
        md,
        `# 主标题
## 副标题`
      )

      expect(toc).toHaveLength(1)
      expect(toc[0]!.name).toBe('副标题')
    })
  })

  describe('树结构构建', () => {
    it('应正确处理层级跳跃', () => {
      const md = createMarkdown()
      const toc = parseAndExtractToc(
        md,
        `## A
### B
## C`
      )

      expect(toc).toHaveLength(2)
      expect(toc[0]!.children).toHaveLength(1)
      expect(toc[0]!.children[0]!.level).toBe(3)
      expect(toc[0]!.children[0]!.name).toBe('B')
    })

    it('应正确处理同级标题', () => {
      const md = createMarkdown()
      const toc = parseAndExtractToc(
        md,
        `## A
## B
## C`
      )

      expect(toc).toHaveLength(3)
      expect(toc.every(item => item.children.length === 0)).toBe(true)
    })

    it('应正确处理嵌套结构', () => {
      const md = createMarkdown()
      const toc = parseAndExtractToc(
        md,
        `## A
### A1
### A2
## B
### B1`
      )

      expect(toc).toHaveLength(2)

      const a = toc[0]!
      expect(a.name).toBe('A')
      expect(a.children).toHaveLength(2)

      const a1 = a.children[0]!
      expect(a1.name).toBe('A1')
      expect(a1.children).toHaveLength(0)

      const a2 = a.children[1]!
      expect(a2.name).toBe('A2')
      expect(a2.children).toHaveLength(0)

      const b = toc[1]!
      expect(b.name).toBe('B')
      expect(b.children).toHaveLength(1)
      expect(b.children[0]!.name).toBe('B1')
    })
  })

  describe('Hash 生成', () => {
    it('应为标题生成有效的 hash', () => {
      const md = createMarkdown()
      const ids = extractHeadingIds(
        md,
        `# Hello World
## 中文标题
## API 接口`
      )

      expect(ids).toContain('hello-world')
      expect(ids).toContain('中文标题')
      expect(ids).toContain('api-接口')
    })

    it('应为数字开头的标题添加前缀', () => {
      const md = createMarkdown()
      const ids = extractHeadingIds(
        md,
        `## 1. 快速开始
## 2. 安装指南
## 123`
      )

      expect(ids[0]).toBe('_1-快速开始')
      expect(ids[1]).toBe('_2-安装指南')
      expect(ids[2]).toBe('_123')
    })

    it('应处理重复标题', () => {
      const md = createMarkdown()
      const ids = extractHeadingIds(
        md,
        `## Introduction
## Introduction
## Introduction`
      )

      expect(ids[0]).toBe('introduction')
      expect(ids[1]).toBe('introduction-1')
      expect(ids[2]).toBe('introduction-2')
    })

    it('应处理特殊字符', () => {
      const md = createMarkdown()
      const ids = extractHeadingIds(
        md,
        `## Hello!!!World
## API (v2.0)
## 测试@#$%标题`
      )

      expect(ids[0]).toBe('helloworld')
      expect(ids[1]).toMatch(/^api-v20/)
      expect(ids[2]).toMatch(/^测试标题/)
    })
  })

  describe('边界情况', () => {
    it('应处理空文档', () => {
      const md = createMarkdown()
      const toc = parseAndExtractToc(md, '')

      expect(toc).toHaveLength(0)
    })

    it('应处理无标题的文档', () => {
      const md = createMarkdown()
      const toc = parseAndExtractToc(
        md,
        `这是一段普通文本。

另一段文本。`
      )

      expect(toc).toHaveLength(0)
    })

    it('应处理只有 h1 的文档', () => {
      const md = createMarkdown()
      const toc = parseAndExtractToc(
        md,
        `# 标题1
# 标题2`
      )

      expect(toc).toHaveLength(0)
    })

    it('应处理特殊字符标题', () => {
      const md = createMarkdown()
      const ids = extractHeadingIds(md, '## Test!!!Heading')

      expect(ids).toHaveLength(1)
      expect(ids[0]).toBe('testheading')
    })
  })

  describe('Token 属性', () => {
    it('应为标题 token 添加 id 属性', () => {
      const md = createMarkdown()
      const tokens = md.parse('## Test Heading', {})

      const headingOpen = tokens.find(t => t.type === 'heading_open')
      expect(headingOpen).toBeDefined()
      expect(headingOpen!.attrGet('id')).toBe('test-heading')
    })

    it('应为标题 token 添加 class 属性', () => {
      const md = createMarkdown()
      const tokens = md.parse('## Test Heading', {})

      const headingOpen = tokens.find(t => t.type === 'heading_open')
      expect(headingOpen).toBeDefined()
      expect(headingOpen!.attrGet('class')).toBe('paragraph-title')
    })
  })
})
