import { existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { Router } from '../../../src/core/router/router.js'

describe('Router', () => {
  let tempDir: string

  beforeEach(() => {
    tempDir = join(process.cwd(), 'temp-test-router-' + Date.now())
    mkdirSync(tempDir, { recursive: true })
  })

  afterEach(() => {
    if (existsSync(tempDir)) {
      rmSync(tempDir, { recursive: true, force: true })
    }
  })

  describe('基础功能', () => {
    it('应正确初始化并生成路由代码', () => {
      const pagesDir = join(tempDir, 'pages')
      mkdirSync(pagesDir, { recursive: true })
      writeFileSync(join(pagesDir, 'index.tsx'), 'export default function Page() {}')

      const router = new Router({
        root: tempDir,
        pageDirs: [{ dir: 'pages', prefix: '/' }]
      })

      const { code } = router.generate()

      expect(code).toContain('export default')
      expect(code).toContain('lazy')
    })

    it('应正确处理嵌套目录', () => {
      const pagesDir = join(tempDir, 'pages')
      const apiDir = join(pagesDir, 'api')
      mkdirSync(apiDir, { recursive: true })
      writeFileSync(join(pagesDir, 'index.tsx'), 'export default function Page() {}')
      writeFileSync(join(apiDir, 'intro.tsx'), 'export default function Intro() {}')

      const router = new Router({
        root: tempDir,
        pageDirs: [{ dir: 'pages', prefix: '/' }]
      })

      const { code } = router.generate()

      expect(code).toContain('path: "/"')
      expect(code).toContain('path: "/api"')
      expect(code).toContain('path: "intro"')
    })
  })

  describe('多语言模式', () => {
    it('应为每个语言配置独立的前缀', () => {
      const docsDir = join(tempDir, 'docs')
      const zhDir = join(docsDir, 'zh')
      const enDir = join(docsDir, 'en')
      mkdirSync(zhDir, { recursive: true })
      mkdirSync(enDir, { recursive: true })

      const router = new Router({
        root: tempDir,
        docDir: 'docs',
        languages: [
          { id: 'zh', name: '中文' },
          { id: 'en', name: 'English' }
        ]
      })

      const { code } = router.generate()

      expect(code).toContain('export default')
    })
  })

  describe('页面目录配置', () => {
    it('应支持页面目录配置', () => {
      const pagesDir = join(tempDir, 'pages')
      mkdirSync(pagesDir, { recursive: true })
      writeFileSync(join(pagesDir, 'index.tsx'), 'export default function Page() {}')

      const router = new Router({
        root: tempDir,
        pageDirs: [{ dir: 'pages', prefix: '/' }]
      })

      const { code } = router.generate()

      expect(code).toContain('path: "/"')
    })

    it('应支持自定义路由前缀', () => {
      const pagesDir = join(tempDir, 'pages')
      mkdirSync(pagesDir, { recursive: true })
      writeFileSync(join(pagesDir, 'admin.tsx'), 'export default function Admin() {}')

      const router = new Router({
        root: tempDir,
        pageDirs: [{ dir: 'pages', prefix: '/app/' }]
      })

      const { code } = router.generate()

      expect(code).toContain('path: "/app/admin"')
    })
  })

  describe('热更新支持', () => {
    it('应支持重新扫描', () => {
      const pagesDir = join(tempDir, 'pages')
      mkdirSync(pagesDir, { recursive: true })
      writeFileSync(join(pagesDir, 'index.tsx'), 'export default function Page() {}')

      const router = new Router({
        root: tempDir,
        pageDirs: [{ dir: 'pages', prefix: '/' }]
      })

      let { code } = router.generate()
      expect(code).toContain('path: "/"')

      writeFileSync(join(pagesDir, 'guide.tsx'), 'export default function Guide() {}')
      router.reload()

      code = router.generate().code
      expect(code).toContain('path: "/guide"')
    })

    it('应支持清空缓存', () => {
      const pagesDir = join(tempDir, 'pages')
      mkdirSync(pagesDir, { recursive: true })
      writeFileSync(join(pagesDir, 'index.tsx'), 'export default function Page() {}')

      const router = new Router({
        root: tempDir,
        pageDirs: [{ dir: 'pages', prefix: '/' }]
      })

      router.generate()
      router.clearGenerateResult()

      const { code } = router.generate()
      expect(code).toContain('export default')
    })
  })

  describe('边界情况', () => {
    it('应处理空页面目录', () => {
      const pagesDir = join(tempDir, 'pages')
      mkdirSync(pagesDir, { recursive: true })

      const router = new Router({
        root: tempDir,
        pageDirs: [{ dir: 'pages', prefix: '/' }]
      })

      const { code } = router.generate()
      expect(code).toContain('export default')
    })
  })
})
