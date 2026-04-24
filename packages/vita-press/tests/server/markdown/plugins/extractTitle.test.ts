import MarkdownIt from 'markdown-it'
import { describe, expect, it } from 'vitest'
import { extractTitle, type TitleEnv } from '../../../../src/server/markdown/plugins/extractTitle.js'
import { createMarkdownWithPlugin } from '../testUtils.js'

describe('extractTitle', () => {
  describe('基础功能', () => {
    it('应提取 H1 标题并赋值给 env.title', () => {
      const md = createMarkdownWithPlugin(extractTitle)
      const env: TitleEnv = {}

      md.render('# 文档标题', env)

      expect(env.title).toBe('文档标题')
    })

    it('应正确提取包含空格的标题', () => {
      const md = createMarkdownWithPlugin(extractTitle)
      const env: TitleEnv = {}

      md.render('# Hello World Title', env)

      expect(env.title).toBe('Hello World Title')
    })
  })

  describe('env.title 已存在的情况', () => {
    it('当 env.title 为字符串时，不应覆盖', () => {
      const md = createMarkdownWithPlugin(extractTitle)
      const env: TitleEnv = { title: '预设标题' }

      md.render('# 文档标题', env)

      expect(env.title).toBe('预设标题')
    })

    it('当 env.title 为空字符串时，不应覆盖', () => {
      const md = createMarkdownWithPlugin(extractTitle)
      const env: TitleEnv = { title: '' }

      md.render('# 文档标题', env)

      expect(env.title).toBe('')
    })

    it('当 env.title 为 undefined 时，应提取 H1 标题', () => {
      const md = createMarkdownWithPlugin(extractTitle)
      const env: TitleEnv = {}

      md.render('# 文档标题', env)

      expect(env.title).toBe('文档标题')
    })

    it('当 env.title 为 null 时，应提取 H1 标题', () => {
      const md = createMarkdownWithPlugin(extractTitle)
      const env: TitleEnv = { title: null as any }

      md.render('# 文档标题', env)

      expect(env.title).toBe('文档标题')
    })

    it('当 env.title 为数字时，应提取 H1 标题', () => {
      const md = createMarkdownWithPlugin(extractTitle)
      const env: TitleEnv = { title: 123 as any }

      md.render('# 文档标题', env)

      expect(env.title).toBe('文档标题')
    })
  })

  describe('没有 H1 标题的情况', () => {
    it('文档只有 H2 标题时，不应设置 env.title', () => {
      const md = createMarkdownWithPlugin(extractTitle)
      const env: TitleEnv = {}

      md.render('## 二级标题', env)

      expect(env.title).toBeUndefined()
    })

    it('文档只有 H3 标题时，不应设置 env.title', () => {
      const md = createMarkdownWithPlugin(extractTitle)
      const env: TitleEnv = {}

      md.render('### 三级标题', env)

      expect(env.title).toBeUndefined()
    })

    it('文档没有标题时，不应设置 env.title', () => {
      const md = createMarkdownWithPlugin(extractTitle)
      const env: TitleEnv = {}

      md.render('这是一段普通文本。', env)

      expect(env.title).toBeUndefined()
    })

    it('空文档不应设置 env.title', () => {
      const md = createMarkdownWithPlugin(extractTitle)
      const env: TitleEnv = {}

      md.render('', env)

      expect(env.title).toBeUndefined()
    })
  })

  describe('多个 H1 标题的情况', () => {
    it('应只提取第一个 H1 标题', () => {
      const md = createMarkdownWithPlugin(extractTitle)
      const env: TitleEnv = {}

      md.render(
        `# 第一个标题
## 二级标题
# 第二个标题`,
        env
      )

      expect(env.title).toBe('第一个标题')
    })
  })

  describe('特殊字符和中文', () => {
    it('应正确提取中文标题', () => {
      const md = createMarkdownWithPlugin(extractTitle)
      const env: TitleEnv = {}

      md.render('# 中文标题测试', env)

      expect(env.title).toBe('中文标题测试')
    })

    it('应正确提取包含特殊字符的标题', () => {
      const md = createMarkdownWithPlugin(extractTitle)
      const env: TitleEnv = {}

      md.render('# Hello!!!World', env)

      expect(env.title).toBe('Hello!!!World')
    })

    it('应正确提取包含连字符的标题', () => {
      const md = createMarkdownWithPlugin(extractTitle)
      const env: TitleEnv = {}

      md.render('# API-Reference-Guide', env)

      expect(env.title).toBe('API-Reference-Guide')
    })

    it('应正确提取包含下划线的标题', () => {
      const md = createMarkdownWithPlugin(extractTitle)
      const env: TitleEnv = {}

      md.render('# Getting_Started', env)

      expect(env.title).toBe('Getting_Started')
    })
  })

  describe('复杂文档结构', () => {
    it('应正确处理包含代码块的文档', () => {
      const md = createMarkdownWithPlugin(extractTitle)
      const env: TitleEnv = {}

      md.render(
        `# API 文档

\`\`\`javascript
const title = 'test'
\`\`\`

## 安装`,
        env
      )

      expect(env.title).toBe('API 文档')
    })

    it('应正确处理包含列表的文档', () => {
      const md = createMarkdownWithPlugin(extractTitle)
      const env: TitleEnv = {}

      md.render(
        `# 快速开始

- 项目 1
- 项目 2

## 详细说明`,
        env
      )

      expect(env.title).toBe('快速开始')
    })

    it('应正确处理包含链接的标题', () => {
      const md = createMarkdownWithPlugin(extractTitle)
      const env: TitleEnv = {}

      md.render('# [Vue](https://vuejs.org/) 教程', env)

      expect(env.title).toBe('Vue 教程')
    })

    it('应正确处理包含加粗的标题', () => {
      const md = createMarkdownWithPlugin(extractTitle)
      const env: TitleEnv = {}

      md.render('# **重要** 通知', env)

      expect(env.title).toBe('重要 通知')
    })

    it('应正确处理包含斜体的标题', () => {
      const md = createMarkdownWithPlugin(extractTitle)
      const env: TitleEnv = {}

      md.render('# _特别_ 说明', env)

      expect(env.title).toBe('特别 说明')
    })
  })

  describe('env 初始化', () => {
    it('env 未初始化时应正确工作', () => {
      const md = new MarkdownIt()
      md.use(extractTitle)

      let env: TitleEnv | undefined
      md.render('# 测试标题', (env = {}))

      expect(env.title).toBe('测试标题')
    })
  })
})
