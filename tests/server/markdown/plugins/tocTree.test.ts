import MarkdownIt from 'markdown-it'
import { describe, expect, it } from 'vitest'
import { jsxComponentParser } from '../../../../src/server/markdown/plugins/jsxComponentParser.js'
import { tocTree } from '../../../../src/server/markdown/plugins/tocTree.js'
import { renderMarkdown } from '../../../testUtils.js'

function createMarkdownWithToc(): MarkdownIt {
  const md = new MarkdownIt()
  md.use(tocTree)
  return md
}

function createMarkdownWithTocAndJsx(): MarkdownIt {
  const md = new MarkdownIt({ html: true })
  md.use(tocTree)
  md.use(jsxComponentParser)
  return md
}

describe('tocTree', () => {
  describe('锚点功能', () => {
    it('应为标题生成锚点链接', () => {
      const md = createMarkdownWithToc()
      const html = renderMarkdown(md, '## 测试标题')

      expect(html).toContain('<RouterLink to="#')
      expect(html).toContain('</RouterLink>')
    })

    it('应正确提取标题的 id 作为锚点 href', () => {
      const md = createMarkdownWithToc()

      const tokens = md.parse('## Hello World', {})
      const headingOpen = tokens.find(t => t.type === 'heading_open')
      const id = headingOpen?.attrGet('id')

      const html = md.render('## Hello World')
      expect(html).toContain(`to="#${id}"`)
    })
  })

  describe('不同级别标题', () => {
    it('应处理 h1 标题', () => {
      const md = createMarkdownWithToc()
      const html = renderMarkdown(md, '# 主标题')

      expect(html).toContain('<h1')
      expect(html).toContain('<RouterLink to="#')
      expect(html).toContain('</RouterLink></h1>')
    })

    it('应处理 h2 标题', () => {
      const md = createMarkdownWithToc()
      const html = renderMarkdown(md, '## 二级标题')

      expect(html).toContain('<h2')
      expect(html).toContain('<RouterLink to="#')
      expect(html).toContain('</RouterLink></h2>')
    })

    it('应处理 h3 标题', () => {
      const md = createMarkdownWithToc()
      const html = renderMarkdown(md, '### 三级标题')

      expect(html).toContain('<h3')
      expect(html).toContain('<RouterLink to="#')
      expect(html).toContain('</RouterLink></h3>')
    })

    it('应处理 h4-h6 标题', () => {
      const md = createMarkdownWithToc()

      const html4 = renderMarkdown(md, '#### 四级标题')
      expect(html4).toContain('<h4')
      expect(html4).toContain('<RouterLink to="#')

      const html5 = renderMarkdown(md, '##### 五级标题')
      expect(html5).toContain('<h5')
      expect(html5).toContain('<RouterLink to="#')

      const html6 = renderMarkdown(md, '###### 六级标题')
      expect(html6).toContain('<h6')
      expect(html6).toContain('<RouterLink to="#')
    })
  })

  describe('多标题文档', () => {
    it('应为每个标题生成独立的锚点', () => {
      const md = createMarkdownWithToc()
      const html = renderMarkdown(
        md,
        `## 第一章
### 第一节
## 第二章`
      )

      const anchorCount = (html.match(/<RouterLink to="#/g) || []).length
      expect(anchorCount).toBe(3)
    })

    it('应为重复标题生成不同的锚点', () => {
      const md = createMarkdownWithToc()
      const html = renderMarkdown(
        md,
        `## Introduction
## Introduction`
      )

      const hrefs = html.match(/to="#[^"]+"/g) || []
      expect(hrefs).toHaveLength(2)
      expect(hrefs[0]).not.toBe(hrefs[1])
    })
  })

  describe('边界情况', () => {
    it('应处理空文档', () => {
      const md = createMarkdownWithToc()
      const html = renderMarkdown(md, '')

      expect(html).not.toContain('<a to="#')
    })

    it('应处理无标题的文档', () => {
      const md = createMarkdownWithToc()
      const html = renderMarkdown(md, '这是一段普通文本。')

      expect(html).not.toContain('<a to="#')
    })

    it('应处理包含特殊字符的标题', () => {
      const md = createMarkdownWithToc()
      const html = renderMarkdown(md, '## Hello!!!World')

      expect(html).toContain('<RouterLink to="#')
    })

    it('应处理中文标题', () => {
      const md = createMarkdownWithToc()
      const html = renderMarkdown(md, '## 中文标题测试')

      expect(html).toContain('<RouterLink to="#')
      expect(html).toContain('中文标题测试')
    })
  })

  describe('HTML 结构', () => {
    it('应生成正确的嵌套结构', () => {
      const md = createMarkdownWithToc()
      const html = renderMarkdown(md, '## Test')

      expect(html).toMatch(/<h2[^>]*>\s*<RouterLink to="#[^"]+">[^<]*<\/RouterLink>\s*<\/h2>/)
    })

    it('锚点应包含标题文本', () => {
      const md = createMarkdownWithToc()
      const html = renderMarkdown(md, '## My Heading')

      expect(html).toContain('>My Heading</RouterLink>')
    })
  })

  describe('标题中包含行内 HTML/JSX 组件', () => {
    it('tocList name 应排除行内 JSX 组件', () => {
      const md = createMarkdownWithTocAndJsx()
      const env: any = {}
      md.parse('## title <Badge type="vip" />', env)

      expect(env.tocList).toHaveLength(1)
      expect(env.tocList[0].name).toBe('title')
    })

    it('heading id 应排除行内 JSX 组件', () => {
      const md = createMarkdownWithTocAndJsx()
      const tokens = md.parse('## title <Badge type="vip" />', {})

      const headingOpen = tokens.find(t => t.type === 'heading_open')
      expect(headingOpen?.attrGet('id')).toBe('title')
    })

    it('tocList hash 应与 heading id 一致', () => {
      const md = createMarkdownWithTocAndJsx()
      const env: any = {}
      const tokens = md.parse('## title <Badge type="vip" />', env)

      const headingOpen = tokens.find(t => t.type === 'heading_open')
      // hash 与 name 相同时省略 hash，消费端应使用 name 作为回退
      const effectiveHash = env.tocList[0].hash ?? env.tocList[0].name
      expect(effectiveHash).toBe(headingOpen?.attrGet('id'))
    })

    it('应处理标题中包含多个行内组件的情况', () => {
      const md = createMarkdownWithTocAndJsx()
      const env: any = {}
      md.parse('## API <Badge type="tip" /> <Badge type="warning" />', env)

      expect(env.tocList[0].name).toBe('API')
      expect(env.tocList[0].hash).toBe('api')
    })

    it('应处理仅包含行内组件的标题', () => {
      const md = createMarkdownWithTocAndJsx()
      const env: any = {}
      md.parse('## <Badge type="vip" />', env)

      expect(env.tocList).toHaveLength(1)
      expect(env.tocList[0].name).toBe('')
    })

    it('无行内组件的标题应不受影响', () => {
      const md = createMarkdownWithTocAndJsx()
      const env: any = {}
      md.parse('## Pure Title', env)

      expect(env.tocList[0].name).toBe('Pure Title')
      expect(env.tocList[0].hash).toBe('pure-title')
    })
  })

  describe('重复标题 hash 唯一性', () => {
    it('重复标题的 token id 应各不相同', () => {
      const md = createMarkdownWithToc()
      const tokens = md.parse(
        `## Introduction
## Introduction
## Introduction`,
        {}
      )

      const headingOpens = tokens.filter(t => t.type === 'heading_open')
      const ids = headingOpens.map(t => t.attrGet('id'))

      expect(ids).toHaveLength(3)
      expect(new Set(ids).size).toBe(3)
    })

    it('重复标题的 tocList hash 应各不相同', () => {
      const md = createMarkdownWithToc()
      const env: any = {}
      md.parse(
        `## Introduction
## Introduction
## Introduction`,
        env
      )

      const hashes = env.tocList.map((item: any) => item.hash)
      expect(hashes).toHaveLength(3)
      expect(new Set(hashes).size).toBe(3)
    })

    it('重复标题的 hash 应遵循 github-slugger 递增后缀规则', () => {
      const md = createMarkdownWithToc()
      const tokens = md.parse(
        `## Getting Started
## Getting Started
## Getting Started`,
        {}
      )

      const headingOpens = tokens.filter(t => t.type === 'heading_open')
      const ids = headingOpens.map(t => t.attrGet('id'))

      expect(ids[0]).toBe('getting-started')
      expect(ids[1]).toBe('getting-started-1')
      expect(ids[2]).toBe('getting-started-2')
    })

    it('不同级别的重复标题 hash 应各不相同', () => {
      const md = createMarkdownWithToc()
      const tokens = md.parse(
        `## Overview
### Overview`,
        {}
      )

      const headingOpens = tokens.filter(t => t.type === 'heading_open')
      const ids = headingOpens.map(t => t.attrGet('id'))

      expect(ids).toHaveLength(2)
      expect(ids[0]).not.toBe(ids[1])
    })

    it('数字开头的重复标题 id 应保持唯一且符合规范', () => {
      const md = createMarkdownWithToc()
      const tokens = md.parse(
        `## 1 快速开始
## 1 快速开始`,
        {}
      )

      const headingOpens = tokens.filter(t => t.type === 'heading_open')
      const ids = headingOpens.map(t => t.attrGet('id'))

      expect(ids).toHaveLength(2)
      expect(new Set(ids).size).toBe(2)
      ids.forEach(id => {
        expect(id).toMatch(/^_\d/)
      })
    })

    it('tocList 中 hash 与 token id 应保持一致', () => {
      const md = createMarkdownWithToc()
      const env: any = {}
      const tokens = md.parse(
        `## Introduction
## Introduction`,
        env
      )

      const headingOpens = tokens.filter(t => t.type === 'heading_open')
      const tokenIds = headingOpens
        .filter(t => {
          const level = t.tag
          return level === 'h2' || level === 'h3'
        })
        .map(t => t.attrGet('id'))

      const tocHashes = env.tocList.map((item: any) => item.hash)

      expect(tocHashes).toEqual(tokenIds)
    })
  })

  describe('TOC 树生成', () => {
    it('应生成 TOC 树', () => {
      const md = createMarkdownWithToc()
      const env: any = {}
      md.parse(
        `## 第一章
### 第一节
## 第二章`,
        env
      )

      expect(env.tocList).toBeDefined()
      expect(env.tocList.length).toBe(2)
    })

    it('TOC 树只包含 h2-h3', () => {
      const md = createMarkdownWithToc()
      const env: any = {}
      md.parse(
        `# 主标题
## 二级标题
### 三级标题
#### 四级标题`,
        env
      )

      expect(env.tocList).toBeDefined()
      expect(env.tocList.length).toBe(1)
      expect(env.tocList[0].level).toBe(2)
      expect(env.tocList[0].children.length).toBe(1)
      expect(env.tocList[0].children[0].level).toBe(3)
    })

    it('所有标题都应有 id', () => {
      const md = createMarkdownWithToc()
      const tokens = md.parse(
        `# h1
## h2
### h3
#### h4
##### h5
###### h6`,
        {}
      )

      const headingOpens = tokens.filter(t => t.type === 'heading_open')
      expect(headingOpens).toHaveLength(6)
      headingOpens.forEach(token => {
        expect(token.attrGet('id')).toBeDefined()
        expect(token.attrGet('id')).not.toBeNull()
      })
    })
  })
})
