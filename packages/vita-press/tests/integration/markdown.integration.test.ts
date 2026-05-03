import { existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { VitaPressPlugin } from '../../src/server/index.js'
import { createTestApp } from '../testUtils.js'

describe('Markdown 解析端到端集成测试', () => {
  let tempDir: string

  beforeEach(() => {
    tempDir = join(tmpdir(), `markdown-integration-test-${Date.now()}`)
    mkdirSync(tempDir, { recursive: true })
  })

  afterEach(() => {
    if (existsSync(tempDir)) {
      rmSync(tempDir, { recursive: true, force: true })
    }
  })

  function createMarkdownFile(relativePath: string, content: string): string {
    const fullPath = join(tempDir, relativePath)
    const dir = join(fullPath, '..')
    mkdirSync(dir, { recursive: true })
    writeFileSync(fullPath, content)
    return fullPath
  }

  describe('基础 Markdown 解析', () => {
    it('应正确解析标题', async () => {
      const app = await createTestApp(tempDir)
      const parser = app.mdParser

      const filePath = createMarkdownFile('docs/test.md', '# Title')
      const content = '# Title'
      const result = parser.parse(filePath, content)

      expect(result).toContain('Title')
      expect(result).toContain('id="title"')
    })

    it('应正确解析多级标题', async () => {
      const app = await createTestApp(tempDir)
      const parser = app.mdParser

      const content = `# H1
## H2
### H3
#### H4
##### H5
###### H6`

      const filePath = createMarkdownFile('docs/test.md', content)
      const result = parser.parse(filePath, content)

      expect(result).toContain('id="h1"')
      expect(result).toContain('>H1</RouterLink></h1>')
      expect(result).toContain('id="h2"')
      expect(result).toContain('>H2</RouterLink></h2>')
      expect(result).toContain('id="h3"')
      expect(result).toContain('>H3</RouterLink></h3>')
      expect(result).toContain('id="h4"')
      expect(result).toContain('>H4</RouterLink></h4>')
      expect(result).toContain('id="h5"')
      expect(result).toContain('>H5</RouterLink></h5>')
      expect(result).toContain('id="h6"')
      expect(result).toContain('>H6</RouterLink></h6>')
    })

    it('应正确解析段落', async () => {
      const app = await createTestApp(tempDir)
      const parser = app.mdParser

      const content = 'This is a paragraph.\n\nThis is another paragraph.'
      const filePath = createMarkdownFile('docs/test.md', content)
      const result = parser.parse(filePath, content)

      expect(result).toContain('<p>This is a paragraph.</p>')
      expect(result).toContain('<p>This is another paragraph.</p>')
    })

    it('应正确解析列表', async () => {
      const app = await createTestApp(tempDir)
      const parser = app.mdParser

      const content = `- Item 1
- Item 2
  - Nested item
- Item 3

1. First
2. Second
3. Third`

      const filePath = createMarkdownFile('docs/test.md', content)
      const result = parser.parse(filePath, content)

      expect(result).toContain('<ul>')
      expect(result).toContain('<ol>')
      expect(result).toContain('<li>Item 1</li>')
      expect(result).toContain('<li>Nested item</li>')
    })

    it('应正确解析链接和图片', async () => {
      const app = await createTestApp(tempDir)
      const parser = app.mdParser

      const content = `[Link](https://example.com)\n\n![Image](https://example.com/image.png)`
      const filePath = createMarkdownFile('docs/test.md', content)
      const result = parser.parse(filePath, content)

      expect(result).toContain('RouterLink')
      expect(result).toContain('to="https://example.com"')
      expect(result).toContain('Link')
      expect(result).toContain('<img src="https://example.com/image.png" alt="Image"')
    })

    it('应正确解析代码块', async () => {
      const app = await createTestApp(tempDir)
      const parser = app.mdParser

      const content = `\`\`\`javascript
const x = 1
console.log(x)
\`\`\`

\`\`\`typescript
const y: number = 2
console.log(y)
\`\`\``

      const filePath = createMarkdownFile('docs/test.md', content)
      const result = parser.parse(filePath, content)

      expect(result).toContain('v-source-code')
      expect(result).toContain('data-lang="javascript"')
      expect(result).toContain('data-lang="typescript"')
      expect(result).toContain('const')
      expect(result).toContain('console')
    })

    it('应正确解析行内代码', async () => {
      const app = await createTestApp(tempDir)
      const parser = app.mdParser

      const content = 'This is `inline code` in a paragraph.'
      const filePath = createMarkdownFile('docs/test.md', content)
      const result = parser.parse(filePath, content)

      expect(result).toContain('<code>inline code</code>')
    })

    it('应正确解析引用', async () => {
      const app = await createTestApp(tempDir)
      const parser = app.mdParser

      const content = '> This is a quote\n> Multiple lines'
      const filePath = createMarkdownFile('docs/test.md', content)
      const result = parser.parse(filePath, content)

      expect(result).toContain('<blockquote>')
      expect(result).toContain('This is a quote')
    })

    it('应正确解析表格', async () => {
      const app = await createTestApp(tempDir)
      const parser = app.mdParser

      const content = `| Header 1 | Header 2 |
|----------|----------|
| Cell 1   | Cell 2   |
| Cell 3   | Cell 4   |`

      const filePath = createMarkdownFile('docs/test.md', content)
      const result = parser.parse(filePath, content)

      expect(result).toContain('<table>')
      expect(result).toContain('<thead>')
      expect(result).toContain('<tbody>')
      expect(result).toContain('Header 1')
      expect(result).toContain('Cell 1')
    })
  })

  describe('Frontmatter 解析', () => {
    it('应正确解析 YAML frontmatter', async () => {
      const app = await createTestApp(tempDir)
      const parser = app.mdParser

      const content = `---
title: Custom Title
description: Custom Description
author: Test Author
---

# Content`

      const filePath = createMarkdownFile('docs/test.md', content)
      const result = parser.parse(filePath, content)

      expect(result).toContain('"title":"Custom Title"')
      expect(result).toContain('"description":"Custom Description"')
      expect(result).toContain('"author":"Test Author"')
    })

    it('应正确处理空 frontmatter', async () => {
      const app = await createTestApp(tempDir)
      const parser = app.mdParser

      const content = `---
---

# Content`

      const filePath = createMarkdownFile('docs/test.md', content)
      const result = parser.parse(filePath, content)

      expect(result).toContain('Content')
      expect(result).toContain('id="content"')
    })

    it('frontmatter 应覆盖默认元数据', async () => {
      const app = await createTestApp(tempDir)
      const parser = app.mdParser

      const content = `---
title: Frontmatter Title
---

# Markdown Title`

      const filePath = createMarkdownFile('docs/test.md', content)
      const result = parser.parse(filePath, content)

      expect(result).toContain('"title":"Frontmatter Title"')
    })
  })

  describe('自定义容器和组件', () => {
    it('应正确解析自定义容器', async () => {
      const app = await createTestApp(tempDir)
      const parser = app.mdParser

      const content = `::: tip
This is a tip
:::

::: warning
This is a warning
:::

::: danger
This is a danger
:::`

      const filePath = createMarkdownFile('docs/test.md', content)
      const result = parser.parse(filePath, content)

      expect(result).toContain('This is a tip')
      expect(result).toContain('This is a warning')
      expect(result).toContain('This is a danger')
    })

    it('应正确解析 JSX 组件', async () => {
      const app = await createTestApp(tempDir)
      const parser = app.mdParser

      const content = `<CustomComponent title="Test" />

<AnotherComponent>
  Content
</AnotherComponent>`

      const filePath = createMarkdownFile('docs/test.md', content)
      const result = parser.parse(filePath, content)

      expect(result).toContain('CustomComponent')
      expect(result).toContain('AnotherComponent')
    })
  })

  describe('代码导入', () => {
    it('应正确处理代码导入语法', async () => {
      const app = await createTestApp(tempDir)
      const parser = app.mdParser

      const content = `# Code Example

\`\`\`js
<<< @/examples/sample.js
\`\`\``

      const filePath = createMarkdownFile('docs/test.md', content)
      const result = parser.parse(filePath, content)

      expect(result).toContain('v-source-code')
      expect(result).toContain('data-lang="js"')
    })

    it('应正确处理代码片段导入语法', async () => {
      const app = await createTestApp(tempDir)
      const parser = app.mdParser

      const content = `# Snippet Example

\`\`\`js
<<< @/examples/code.js#snippet
\`\`\``

      const filePath = createMarkdownFile('docs/test.md', content)
      const result = parser.parse(filePath, content)

      expect(result).toContain('v-source-code')
      expect(result).toContain('data-lang="js"')
    })
  })

  describe('锚点和 TOC', () => {
    it('应为标题生成锚点', async () => {
      const app = await createTestApp(tempDir)
      const parser = app.mdParser

      const content = `# Introduction

## Getting Started

### Installation

## Usage`

      const filePath = createMarkdownFile('docs/test.md', content)
      const result = parser.parse(filePath, content)

      expect(result).toContain('id="introduction"')
      expect(result).toContain('id="getting-started"')
      expect(result).toContain('id="installation"')
      expect(result).toContain('id="usage"')
    })

    it('应生成目录树', async () => {
      const app = await createTestApp(tempDir)
      const parser = app.mdParser

      const content = `# Main Title

## Section 1

### Subsection 1.1

### Subsection 1.2

## Section 2

### Subsection 2.1`

      const filePath = createMarkdownFile('docs/test.md', content)
      const result = parser.parse(filePath, content)

      expect(result).toContain('"tocList"')
      expect(result).toContain('"name":"Section 1"')
      expect(result).toContain('"name":"Section 2"')
    })
  })

  describe('路由链接', () => {
    it('应将相对链接转换为 RouterLink', async () => {
      const app = await createTestApp(tempDir)
      const parser = app.mdParser

      const content = `[Home](/)\n[Guide](/guide)\n[API](/api/intro)`
      const filePath = createMarkdownFile('docs/test.md', content)
      const result = parser.parse(filePath, content)

      expect(result).toContain('RouterLink')
      expect(result).toContain('to="/"')
      expect(result).toContain('to="/guide"')
      expect(result).toContain('to="/api/intro"')
    })

    it('应保留外部链接', async () => {
      const app = await createTestApp(tempDir)
      const parser = app.mdParser

      const content = `[External](https://example.com)`
      const filePath = createMarkdownFile('docs/test.md', content)
      const result = parser.parse(filePath, content)

      expect(result).toContain('RouterLink')
      expect(result).toContain('to="https://example.com"')
      expect(result).toContain('target="_blank"')
    })
  })

  describe('多语言支持', () => {
    it('frontmatter 中的语言应覆盖自动检测', async () => {
      const app = await createTestApp(tempDir, {
        locales: [
          { id: 'zh-CN', name: '简体中文' },
          { id: 'en-US', name: 'English' }
        ]
      })
      const parser = app.mdParser

      const content = `---
lang: en-US
---

# Test`

      const zhPath = createMarkdownFile('docs/zh-CN/test.md', content)

      const result = parser.parse(zhPath, content)

      expect(result).toContain('"lang":"en-US"')
    })
  })

  describe('代码注入', () => {
    it('应注入自定义代码', async () => {
      const app = await createTestApp(tempDir, {
        injectCode: ['import { Button } from "ui"', 'import { Card } from "components"']
      })
      const parser = app.mdParser

      const filePath = createMarkdownFile('docs/test.md', '# Test')
      const result = parser.parse(filePath, '# Test')

      expect(result).toContain('import { Button } from "ui"')
      expect(result).toContain('import { Card } from "components"')
    })
  })

  describe('插件集成', () => {
    it('应调用插件的 beforeParse 钩子', async () => {
      const plugin: VitaPressPlugin = {
        name: 'test-plugin',
        beforeParse: (content: string) => {
          return content.replace('# Test', '# Modified')
        }
      }
      const app = await createTestApp(tempDir, { plugins: [plugin] })
      const parser = app.mdParser

      const filePath = createMarkdownFile('docs/test.md', '# Test')
      const result = parser.parse(filePath, '# Test')

      expect(result).toContain('Modified')
      expect(result).toContain('id="modified"')
    })

    it('应调用插件的 afterParse 钩子', async () => {
      const afterParseMock = vi.fn()
      const plugin: VitaPressPlugin = {
        name: 'test-plugin',
        afterParse: afterParseMock
      }
      const app = await createTestApp(tempDir, { plugins: [plugin] })
      const parser = app.mdParser

      const filePath = createMarkdownFile('docs/test.md', '# Test')
      parser.parse(filePath, '# Test')

      expect(afterParseMock).toHaveBeenCalled()
      expect(afterParseMock).toHaveBeenCalledWith(
        expect.objectContaining({
          meta: expect.objectContaining({ relativePath: 'docs/test.md' })
        }),
        app
      )
    })
  })

  describe('缓存机制', () => {
    it('应缓存解析结果', async () => {
      const app = await createTestApp(tempDir)
      const parser = app.mdParser

      const filePath = createMarkdownFile('docs/test.md', '# Test')
      const result1 = parser.parse(filePath, '# Test')
      const result2 = parser.parse(filePath, '# Test')

      expect(result1).toBe(result2)
    })

    it('内容变化时应重新解析', async () => {
      const app = await createTestApp(tempDir)
      const parser = app.mdParser

      const filePath = createMarkdownFile('docs/test.md', '# Test')
      const result1 = parser.parse(filePath, '# Test')
      const result2 = parser.parse(filePath, '# Updated')

      expect(result1).not.toBe(result2)
      expect(result2).toContain('Updated')
      expect(result2).toContain('id="updated"')
    })

    it('应支持清除缓存', async () => {
      const app = await createTestApp(tempDir)
      const parser = app.mdParser

      const filePath = createMarkdownFile('docs/test.md', '# Test')
      parser.parse(filePath, '# Test')

      parser.cache.clear()

      expect(existsSync(parser.cache.getCacheFilePath('docs/test.md', 'json'))).toBe(false)
    })
  })

  describe('错误处理', () => {
    it('应处理不存在的文件', async () => {
      const app = await createTestApp(tempDir)
      const parser = app.mdParser

      const nonExistentPath = join(tempDir, 'non-existent.md')

      expect(() => parser.parse(nonExistentPath)).toThrow('Read file error')
    })

    it('应处理无效的 Markdown 语法', async () => {
      const app = await createTestApp(tempDir)
      const parser = app.mdParser

      const content = '# Test\n\n```\nunclosed code block'
      const filePath = createMarkdownFile('docs/test.md', content)

      expect(() => parser.parse(filePath, content)).not.toThrow()
    })
  })

  describe('完整文档解析', () => {
    it('应正确解析完整的文档', async () => {
      const app = await createTestApp(tempDir)
      const parser = app.mdParser

      const content = `---
title: Complete Document
description: A complete markdown document
author: Test Author
---

# Introduction

This is an introduction paragraph.

## Getting Started

Follow these steps:

1. Install dependencies
2. Configure the project
3. Run the application

### Installation

\`\`\`bash
npm install
\`\`\`

### Configuration

Edit the \`config.js\` file:

\`\`\`javascript
export default {
  title: 'My App',
  lang: 'en-US'
}
\`\`\`

## Features

- **Feature 1**: Description
- **Feature 2**: Description
- **Feature 3**: Description

> This is a note

[Learn more](/guide)

![Screenshot](/screenshot.png)

::: tip
This is a tip
:::

<CustomComponent />
`

      const filePath = createMarkdownFile('docs/complete.md', content)
      const result = parser.parse(filePath, content)

      expect(result).toContain('"title":"Complete Document"')
      expect(result).toContain('Introduction')
      expect(result).toContain('id="introduction"')
      expect(result).toContain('Getting Started')
      expect(result).toContain('id="getting-started"')
      expect(result).toContain('<ol>')
      expect(result).toContain('v-source-code')
      expect(result).toContain('<blockquote>')
      expect(result).toContain('RouterLink')
      expect(result).toContain('<img')
      expect(result).toContain('CustomComponent')
    })
  })
})
