import { existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { resolveConfig } from '../../../src/core/config/loader.js'

describe('ConfigLoader', () => {
  let tempDir: string
  let originalCwd: string

  beforeEach(() => {
    originalCwd = process.cwd()
    tempDir = join(process.cwd(), 'temp-test-loader-' + Date.now())
    mkdirSync(tempDir, { recursive: true })
  })

  afterEach(() => {
    process.chdir(originalCwd)
    if (existsSync(tempDir)) {
      rmSync(tempDir, { recursive: true, force: true })
    }
  })

  describe('resolveConfig', () => {
    it('应在没有配置文件时返回空配置', async () => {
      process.chdir(tempDir)
      const result = await resolveConfig()

      expect(result.config).toEqual({})
      expect(result.configFile).toBeUndefined()
    })

    it('应加载指定的配置文件', async () => {
      const configDir = join(tempDir, '.vitapress')
      mkdirSync(configDir, { recursive: true })

      const configFile = join(configDir, 'custom.config.ts')
      writeFileSync(
        configFile,
        `
export default {
  title: 'Test Site',
  description: 'Test Description'
}
`
      )

      process.chdir(tempDir)
      const result = await resolveConfig('.vitapress/custom.config.ts')

      expect(result.config.title).toBe('Test Site')
      expect(result.config.description).toBe('Test Description')
      expect(result.configFile).toBe(configFile)
    })

    it('应在指定的配置文件不存在时抛出错误', async () => {
      process.chdir(tempDir)

      await expect(resolveConfig('non-existent.config.ts')).rejects.toThrow(/配置文件不存在/)
    })

    it('应自动查找 .vitapress/config.ts 配置文件', async () => {
      const configDir = join(tempDir, '.vitapress')
      mkdirSync(configDir, { recursive: true })

      const configFile = join(configDir, 'config.ts')
      writeFileSync(
        configFile,
        `
export default {
  title: 'Auto Found Config',
  base: '/docs/'
}
`
      )

      process.chdir(tempDir)
      const result = await resolveConfig()

      expect(result.config.title).toBe('Auto Found Config')
      expect(result.config.base).toBe('/docs/')
      expect(result.configFile).toBe(configFile)
    })

    it('应自动查找 .vitapress/config.js 配置文件', async () => {
      const configDir = join(tempDir, '.vitapress')
      mkdirSync(configDir, { recursive: true })

      const configFile = join(configDir, 'config.js')
      writeFileSync(
        configFile,
        `
module.exports = {
  title: 'JS Config'
}
`
      )

      process.chdir(tempDir)
      const result = await resolveConfig()

      expect(result.config.title).toBe('JS Config')
      expect(result.configFile).toBe(configFile)
    })

    it('应自动查找 .vitapress/config.mjs 配置文件', async () => {
      const configDir = join(tempDir, '.vitapress')
      mkdirSync(configDir, { recursive: true })

      const configFile = join(configDir, 'config.mjs')
      writeFileSync(
        configFile,
        `
export default {
  title: 'MJS Config'
}
`
      )

      process.chdir(tempDir)
      const result = await resolveConfig()

      expect(result.config.title).toBe('MJS Config')
      expect(result.configFile).toBe(configFile)
    })

    it('应自动查找 .vitapress/config.mts 配置文件', async () => {
      const configDir = join(tempDir, '.vitapress')
      mkdirSync(configDir, { recursive: true })

      const configFile = join(configDir, 'config.mts')
      writeFileSync(
        configFile,
        `
export default {
  title: 'MTS Config'
}
`
      )

      process.chdir(tempDir)
      const result = await resolveConfig()

      expect(result.config.title).toBe('MTS Config')
      expect(result.configFile).toBe(configFile)
    })

    it('应加载包含目录配置的完整配置', async () => {
      const docsDir = join(tempDir, 'docs')
      const pagesDir = join(tempDir, 'pages')
      const configDir = join(tempDir, '.vitapress')
      mkdirSync(docsDir, { recursive: true })
      mkdirSync(pagesDir, { recursive: true })
      mkdirSync(configDir, { recursive: true })

      const configFile = join(configDir, 'config.ts')
      writeFileSync(
        configFile,
        `
export default {
  title: 'Full Config',
  description: 'Full Description',
  keywords: 'test, full, config',
  base: '/docs/',
  lang: ['zh-CN', 'en-US'],
  docsDir: {
    dir: 'docs',
    patterns: ['**/*.md'],
    group: '/'
  },
  pagesDir: {
    dir: 'pages',
    patterns: ['**/*.tsx'],
    group: '/'
  },
  injectHead: ['<link rel="stylesheet" href="test.css">'],
  injectBody: ['<script>console.log("test")</script>'],
  injectCode: ['import { Button } from "components"']
}
`
      )

      process.chdir(tempDir)
      const result = await resolveConfig()

      expect(result.config.title).toBe('Full Config')
      expect(result.config.description).toBe('Full Description')
      expect(result.config.keywords).toBe('test, full, config')
      expect(result.config.base).toBe('/docs/')
      expect(result.config.lang).toEqual(['zh-CN', 'en-US'])
      expect(result.config.docsDir).toEqual({
        dir: 'docs',
        patterns: ['**/*.md'],
        group: '/'
      })
      expect(result.config.pagesDir).toEqual({
        dir: 'pages',
        patterns: ['**/*.tsx'],
        group: '/'
      })
      expect(result.config.injectHead).toEqual(['<link rel="stylesheet" href="test.css">'])
      expect(result.config.injectBody).toEqual(['<script>console.log("test")</script>'])
      expect(result.config.injectCode).toEqual(['import { Button } from "components"'])
    })

    it('应加载包含主题配置的完整配置', async () => {
      const entryFile = join(tempDir, 'theme-entry.tsx')
      const layoutFile = join(tempDir, 'layout.tsx')
      const homeFile = join(tempDir, 'home.tsx')
      const configDir = join(tempDir, '.vitapress')
      mkdirSync(configDir, { recursive: true })

      writeFileSync(entryFile, 'export default function Theme() {}')
      writeFileSync(layoutFile, 'export default function Layout() {}')
      writeFileSync(homeFile, 'export default function Home() {}')

      const configFile = join(configDir, 'config.ts')
      writeFileSync(
        configFile,
        `
export default {
  title: 'Theme Config',
  theme: {
    entry: 'theme-entry.tsx',
    layout: 'layout.tsx',
    home: 'home.tsx',
    clientData: {
      nav: ['home', 'about'],
      footer: { text: 'Copyright' }
    },
    plugins: []
  }
}
`
      )

      process.chdir(tempDir)
      const result = await resolveConfig()

      expect(result.config.title).toBe('Theme Config')
      expect(result.config.theme?.entry).toBe('theme-entry.tsx')
      expect(result.config.theme?.layout).toBe('layout.tsx')
      expect(result.config.theme?.home).toBe('home.tsx')
      expect(result.config.theme?.clientData).toEqual({
        nav: ['home', 'about'],
        footer: { text: 'Copyright' }
      })
      expect(result.config.theme?.plugins).toEqual([])
    })

    it('应在配置验证失败时抛出错误', async () => {
      const configDir = join(tempDir, '.vitapress')
      mkdirSync(configDir, { recursive: true })

      const configFile = join(configDir, 'config.ts')
      writeFileSync(
        configFile,
        `
export default {
  title: 123,
  base: 'invalid'
}
`
      )

      process.chdir(tempDir)

      await expect(resolveConfig()).rejects.toThrow()
    })

    it('应在配置文件语法错误时抛出错误', async () => {
      const configDir = join(tempDir, '.vitapress')
      mkdirSync(configDir, { recursive: true })

      const configFile = join(configDir, 'config.ts')
      writeFileSync(
        configFile,
        `
export default {
  title: 'Invalid Syntax'
  // 缺少逗号
  description: 'Test'
}
`
      )

      process.chdir(tempDir)
      await expect(resolveConfig()).rejects.toThrow(/加载配置文件失败/)
    })

    it('应加载包含 MarkdownIt 配置的完整配置', async () => {
      const configDir = join(tempDir, '.vitapress')
      mkdirSync(configDir, { recursive: true })

      const configFile = join(configDir, 'config.ts')
      writeFileSync(
        configFile,
        `
export default {
  title: 'MarkdownIt Config',
  markdownIt: {
    options: {
      html: true,
      linkify: true
    },
    plugins: [],
    shikiConfig: {
      langs: ['javascript', 'typescript']
    }
  }
}
`
      )

      process.chdir(tempDir)
      const result = await resolveConfig()

      expect(result.config.title).toBe('MarkdownIt Config')
      expect(result.config.markdownIt?.options).toEqual({
        html: true,
        linkify: true
      })
      expect(result.config.markdownIt?.plugins).toEqual([])
      expect(result.config.markdownIt?.shikiConfig?.langs).toEqual(['javascript', 'typescript'])
    })

    it('应加载包含 Vite 配置的完整配置', async () => {
      const configDir = join(tempDir, '.vitapress')
      mkdirSync(configDir, { recursive: true })

      const configFile = join(configDir, 'config.ts')
      writeFileSync(
        configFile,
        `
export default {
  title: 'Vite Config',
  viteConfig: {
    publicDir: 'public',
    define: {
      __DEV__: true
    },
    server: {
      port: 3000
    }
  }
}
`
      )

      process.chdir(tempDir)
      const result = await resolveConfig()

      expect(result.config.title).toBe('Vite Config')
      expect(result.config.viteConfig?.publicDir).toBe('public')
      expect(result.config.viteConfig?.define).toEqual({ __DEV__: true })
      expect(result.config.viteConfig?.server).toEqual({ port: 3000 })
    })
  })
})
