import { existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { MdParser } from '../../../src/core/markdown/index.js'
import { Router } from '../../../src/core/router/router.js'

describe('Router', () => {
  let tempDir: string
  let mockMdParser: MdParser

  beforeEach(() => {
    tempDir = join(process.cwd(), 'temp-test-router-' + Date.now())
    mkdirSync(tempDir, { recursive: true })
    // export default function MdPage() { return 'Mock MD Content' }
    mockMdParser = {
      parse: vi.fn().mockReturnValue({
        content: `// 此文件由vita-press自动生成
import { builder } from 'vitarx'
definePage({
  meta: {}
})
export default builder(() => {
  return <article class="v-doc-content">Mock MD Content</article>
})
`,
        filePath: '',
        meta: {}
      })
    } as any
  })

  afterEach(() => {
    if (existsSync(tempDir)) {
      rmSync(tempDir, { recursive: true, force: true })
    }
  })

  describe('基础功能', () => {
    it('应正确初始化并生成路由代码', () => {
      const docsDir = join(tempDir, 'docs')
      mkdirSync(docsDir, { recursive: true })
      writeFileSync(join(docsDir, 'index.tsx'), 'export default function Page() {}')

      const router = new Router({
        root: tempDir,
        docDir: 'docs',
        mdParser: mockMdParser
      })

      const { code } = router.generate()

      expect(code).toContain('export default')
      expect(code).toContain('lazy')
    })

    it('应正确处理嵌套目录', () => {
      const docsDir = join(tempDir, 'docs')
      const apiDir = join(docsDir, 'api')
      mkdirSync(apiDir, { recursive: true })
      writeFileSync(join(docsDir, 'index.tsx'), 'export default function Page() {}')
      writeFileSync(join(apiDir, 'intro.tsx'), 'export default function Intro() {}')

      const router = new Router({
        root: tempDir,
        docDir: 'docs',
        mdParser: mockMdParser
      })

      const { code } = router.generate()

      expect(code).toContain('path: "/"')
      expect(code).toContain('path: "/api"')
      expect(code).toContain('path: "intro"')
    })

    it('应支持 Markdown 文件转换', () => {
      const docsDir = join(tempDir, 'docs')
      mkdirSync(docsDir, { recursive: true })
      writeFileSync(join(docsDir, 'index.md'), '# Home')

      const router = new Router({
        root: tempDir,
        docDir: 'docs',
        mdParser: mockMdParser
      })

      const { code } = router.generate()

      expect(code).toContain('export default')
      expect(mockMdParser.parse).toHaveBeenCalled()
    })
  })

  describe('多语言模式', () => {
    it('应为每个语言配置独立的前缀', () => {
      const docsDir = join(tempDir, 'docs')
      const zhDir = join(docsDir, 'zh')
      const enDir = join(docsDir, 'en')
      mkdirSync(zhDir, { recursive: true })
      mkdirSync(enDir, { recursive: true })
      writeFileSync(join(zhDir, 'index.tsx'), 'export default function Page() {}')
      writeFileSync(join(enDir, 'index.tsx'), 'export default function Page() {}')

      const router = new Router({
        root: tempDir,
        docDir: 'docs',
        languages: [
          { id: 'zh', name: '中文' },
          { id: 'en', name: 'English' }
        ],
        mdParser: mockMdParser
      })

      const { code } = router.generate()

      expect(code).toContain('path: "/zh"')
      expect(code).toContain('path: "/en"')
    })

    it('应正确处理 Markdown 文件', () => {
      const docsDir = join(tempDir, 'docs')
      const zhDir = join(docsDir, 'zh')
      mkdirSync(zhDir, { recursive: true })
      writeFileSync(join(zhDir, 'guide.md'), '# Guide')

      const router = new Router({
        root: tempDir,
        docDir: 'docs',
        languages: [{ id: 'zh', name: '中文' }],
        mdParser: mockMdParser
      })

      const { code } = router.generate()

      expect(code).toContain('path: "/zh"')
      expect(mockMdParser.parse).toHaveBeenCalled()
    })
  })

  describe('页面目录配置', () => {
    it('应支持页面目录配置', () => {
      const docsDir = join(tempDir, 'docs')
      const pagesDir = join(tempDir, 'pages')
      mkdirSync(docsDir, { recursive: true })
      mkdirSync(pagesDir, { recursive: true })
      writeFileSync(join(docsDir, 'index.tsx'), 'export default function Page() {}')
      writeFileSync(join(pagesDir, 'index.tsx'), 'export default function Page() {}')

      const router = new Router({
        root: tempDir,
        docDir: 'docs',
        pageDirs: [{ dir: 'pages', prefix: '/' }],
        mdParser: mockMdParser
      })

      const { code } = router.generate()

      expect(code).toContain('path: "/"')
    })

    it('应支持自定义路由前缀', () => {
      const docsDir = join(tempDir, 'docs')
      const pagesDir = join(tempDir, 'pages')
      mkdirSync(docsDir, { recursive: true })
      mkdirSync(pagesDir, { recursive: true })
      writeFileSync(join(docsDir, 'index.tsx'), 'export default function Page() {}')
      writeFileSync(join(pagesDir, 'admin.tsx'), 'export default function Admin() {}')

      const router = new Router({
        root: tempDir,
        docDir: 'docs',
        pageDirs: [{ dir: 'pages', prefix: '/app/' }],
        mdParser: mockMdParser
      })

      const { code } = router.generate()

      expect(code).toContain('path: "/app/admin"')
    })
  })

  describe('热更新支持', () => {
    it('应支持重新扫描', () => {
      const docsDir = join(tempDir, 'docs')
      mkdirSync(docsDir, { recursive: true })
      writeFileSync(join(docsDir, 'index.tsx'), 'export default function Page() {}')

      const router = new Router({
        root: tempDir,
        docDir: 'docs',
        mdParser: mockMdParser
      })

      let { code } = router.generate()
      expect(code).toContain('path: "/"')

      writeFileSync(join(docsDir, 'guide.tsx'), 'export default function Guide() {}')
      router.reload()

      code = router.generate().code
      expect(code).toContain('path: "/guide"')
    })

    it('应支持清空缓存', () => {
      const docsDir = join(tempDir, 'docs')
      mkdirSync(docsDir, { recursive: true })
      writeFileSync(join(docsDir, 'index.tsx'), 'export default function Page() {}')

      const router = new Router({
        root: tempDir,
        docDir: 'docs',
        mdParser: mockMdParser
      })

      router.generate()
      router.clearGenerateResult()

      const { code } = router.generate()
      expect(code).toContain('export default')
    })
  })

  describe('边界情况', () => {
    it('应处理空文档目录', () => {
      const docsDir = join(tempDir, 'docs')
      mkdirSync(docsDir, { recursive: true })

      const router = new Router({
        root: tempDir,
        docDir: 'docs',
        mdParser: mockMdParser
      })

      const { code } = router.generate()
      expect(code).toContain('export default')
    })
  })
})
