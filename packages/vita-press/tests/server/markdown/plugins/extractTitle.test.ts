import MarkdownIt from 'markdown-it'
import { describe, expect, it } from 'vitest'
import { extractTitle } from '../../../../src/server/markdown/plugins/extractTitle.js'
import { createMarkdownWithPlugin } from '../../../testUtils.js'

interface TestEnv {
  frontmatter: Record<string, any>
}

function createTestEnv(frontmatter: Record<string, any> = {}): TestEnv {
  return { frontmatter }
}

describe('extractTitle', () => {
  describe('基础功能', () => {
    it('应提取 H1 标题并赋值给 env.frontmatter.title', () => {
      const md = createMarkdownWithPlugin(extractTitle)
      const env = createTestEnv()

      md.render('# 文档标题', env as any)

      expect(env.frontmatter['title']).toBe('文档标题')
    })

    it('应正确提取包含空格的标题', () => {
      const md = createMarkdownWithPlugin(extractTitle)
      const env = createTestEnv()

      md.render('# Hello World Title', env as any)

      expect(env.frontmatter['title']).toBe('Hello World Title')
    })
  })

  describe('env.frontmatter.title 已存在的情况', () => {
    it('当 frontmatter.title 为字符串时，不应覆盖', () => {
      const md = createMarkdownWithPlugin(extractTitle)
      const env = createTestEnv({ title: '预设标题' })

      md.render('# 文档标题', env as any)

      expect(env.frontmatter['title']).toBe('预设标题')
    })

    it('当 frontmatter.title 为空字符串时，不应覆盖', () => {
      const md = createMarkdownWithPlugin(extractTitle)
      const env = createTestEnv({ title: '' })

      md.render('# 文档标题', env as any)

      expect(env.frontmatter['title']).toBe('')
    })

    it('当 frontmatter.title 为 undefined 时，应提取 H1 标题', () => {
      const md = createMarkdownWithPlugin(extractTitle)
      const env = createTestEnv({ title: undefined })

      md.render('# 文档标题', env as any)

      expect(env.frontmatter['title']).toBe('文档标题')
    })

    it('当 frontmatter.title 为 null 时，应提取 H1 标题', () => {
      const md = createMarkdownWithPlugin(extractTitle)
      const env = createTestEnv({ title: null })

      md.render('# 文档标题', env as any)

      expect(env.frontmatter['title']).toBe('文档标题')
    })

    it('当 frontmatter.title 为数字时，应提取 H1 标题', () => {
      const md = createMarkdownWithPlugin(extractTitle)
      const env = createTestEnv({ title: 123 })

      md.render('# 文档标题', env as any)

      expect(env.frontmatter['title']).toBe('文档标题')
    })
  })

  describe('没有 H1 标题的情况', () => {
    it('文档只有 H2 标题时，不应设置 frontmatter.title', () => {
      const md = createMarkdownWithPlugin(extractTitle)
      const env = createTestEnv()

      md.render('## 二级标题', env as any)

      expect(env.frontmatter['title']).toBeUndefined()
    })

    it('文档只有 H3 标题时，不应设置 frontmatter.title', () => {
      const md = createMarkdownWithPlugin(extractTitle)
      const env = createTestEnv()

      md.render('### 三级标题', env as any)

      expect(env.frontmatter['title']).toBeUndefined()
    })

    it('文档没有标题时，不应设置 frontmatter.title', () => {
      const md = createMarkdownWithPlugin(extractTitle)
      const env = createTestEnv()

      md.render('这是一段普通文本。', env as any)

      expect(env.frontmatter['title']).toBeUndefined()
    })

    it('空文档不应设置 frontmatter.title', () => {
      const md = createMarkdownWithPlugin(extractTitle)
      const env = createTestEnv()

      md.render('', env as any)

      expect(env.frontmatter['title']).toBeUndefined()
    })
  })

  describe('多个 H1 标题的情况', () => {
    it('应只提取第一个 H1 标题', () => {
      const md = createMarkdownWithPlugin(extractTitle)
      const env = createTestEnv()

      md.render(
        `# 第一个标题
## 二级标题
# 第二个标题`,
        env as any
      )

      expect(env.frontmatter['title']).toBe('第一个标题')
    })
  })

  describe('特殊字符和中文', () => {
    it('应正确提取中文标题', () => {
      const md = createMarkdownWithPlugin(extractTitle)
      const env = createTestEnv()

      md.render('# 中文标题测试', env as any)

      expect(env.frontmatter['title']).toBe('中文标题测试')
    })

    it('应正确提取包含特殊字符的标题', () => {
      const md = createMarkdownWithPlugin(extractTitle)
      const env = createTestEnv()

      md.render('# Hello!!!World', env as any)

      expect(env.frontmatter['title']).toBe('Hello!!!World')
    })

    it('应正确提取包含连字符的标题', () => {
      const md = createMarkdownWithPlugin(extractTitle)
      const env = createTestEnv()

      md.render('# API-Reference-Guide', env as any)

      expect(env.frontmatter['title']).toBe('API-Reference-Guide')
    })

    it('应正确提取包含下划线的标题', () => {
      const md = createMarkdownWithPlugin(extractTitle)
      const env = createTestEnv()

      md.render('# Getting_Started', env as any)

      expect(env.frontmatter['title']).toBe('Getting_Started')
    })
  })

  describe('复杂文档结构', () => {
    it('应正确处理包含代码块的文档', () => {
      const md = createMarkdownWithPlugin(extractTitle)
      const env = createTestEnv()

      md.render(
        `# API 文档

\`\`\`javascript
const title = 'test'
\`\`\`

## 安装`,
        env as any
      )

      expect(env.frontmatter['title']).toBe('API 文档')
    })

    it('应正确处理包含列表的文档', () => {
      const md = createMarkdownWithPlugin(extractTitle)
      const env = createTestEnv()

      md.render(
        `# 快速开始

- 项目 1
- 项目 2

## 详细说明`,
        env as any
      )

      expect(env.frontmatter['title']).toBe('快速开始')
    })

    it('应正确处理包含链接的标题', () => {
      const md = createMarkdownWithPlugin(extractTitle)
      const env = createTestEnv()

      md.render('# [Vue](https://vuejs.org/) 教程', env as any)

      expect(env.frontmatter['title']).toBe('Vue 教程')
    })

    it('应正确处理包含加粗的标题', () => {
      const md = createMarkdownWithPlugin(extractTitle)
      const env = createTestEnv()

      md.render('# **重要** 通知', env as any)

      expect(env.frontmatter['title']).toBe('重要 通知')
    })

    it('应正确处理包含斜体的标题', () => {
      const md = createMarkdownWithPlugin(extractTitle)
      const env = createTestEnv()

      md.render('# _特别_ 说明', env as any)

      expect(env.frontmatter['title']).toBe('特别 说明')
    })
  })

  describe('env 初始化', () => {
    it('env 未初始化时应正确工作', () => {
      const md = new MarkdownIt()
      md.use(extractTitle)

      const env = { frontmatter: {} as Record<string, any> }
      md.render('# 测试标题', env as any)

      expect(env.frontmatter['title']).toBe('测试标题')
    })
  })
})
