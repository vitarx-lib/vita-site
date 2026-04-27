import { existsSync, mkdirSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { ConfigValidationError, validateConfig } from '../../../src/server/config/validator.js'
import type { UserConfig } from '../../../src/server/types/index.js'

describe('ConfigValidationError', () => {
  it('应正确创建错误实例', () => {
    const error = new ConfigValidationError('测试错误消息')
    expect(error).toBeInstanceOf(Error)
    expect(error).toBeInstanceOf(ConfigValidationError)
    expect(error.name).toBe('ConfigValidationError')
    expect(error.message).toBe('测试错误消息')
  })
})

describe('validateConfig', () => {
  let tempDir: string

  beforeEach(() => {
    tempDir = join(process.cwd(), 'temp-test-validator-' + Date.now())
    mkdirSync(tempDir, { recursive: true })
  })

  afterEach(() => {
    if (existsSync(tempDir)) {
      rmSync(tempDir, { recursive: true, force: true })
    }
  })

  describe('基础字段验证', () => {
    it('应接受有效的 title', () => {
      const config: UserConfig = { title: 'My Site' }
      expect(() => validateConfig(config, tempDir)).not.toThrow()
    })

    it('应拒绝非字符串类型的 title', () => {
      const config = { title: 123 }
      expect(() => validateConfig(config as any, tempDir)).toThrow(ConfigValidationError)
      expect(() => validateConfig(config as any, tempDir)).toThrow('title 必须是字符串类型')
    })

    it('应接受有效的 description', () => {
      const config: UserConfig = { description: 'My Description' }
      expect(() => validateConfig(config, tempDir)).not.toThrow()
    })

    it('应拒绝非字符串类型的 description', () => {
      const config = { description: {} }
      expect(() => validateConfig(config as any, tempDir)).toThrow(ConfigValidationError)
      expect(() => validateConfig(config as any, tempDir)).toThrow('description 必须是字符串类型')
    })

    it('应接受有效的 keywords', () => {
      const config: UserConfig = { keywords: 'vite, vue, docs' }
      expect(() => validateConfig(config, tempDir)).not.toThrow()
    })

    it('应拒绝非字符串类型的 keywords', () => {
      const config = { keywords: [] }
      expect(() => validateConfig(config as any, tempDir)).toThrow(ConfigValidationError)
      expect(() => validateConfig(config as any, tempDir)).toThrow('keywords 必须是字符串类型')
    })
  })

  describe('注入选项验证', () => {
    it('应接受有效的 injectHead 数组', () => {
      const config: UserConfig = { injectHead: ['<link rel="stylesheet">'] }
      expect(() => validateConfig(config, tempDir)).not.toThrow()
    })

    it('应拒绝非数组类型的 injectHead', () => {
      const config = { injectHead: 'not-array' }
      expect(() => validateConfig(config as any, tempDir)).toThrow(ConfigValidationError)
      expect(() => validateConfig(config as any, tempDir)).toThrow('injectHead 必须是数组类型')
    })

    it('应拒绝 injectHead 中包含非字符串元素', () => {
      const config = { injectHead: [123] }
      expect(() => validateConfig(config as any, tempDir)).toThrow(ConfigValidationError)
      expect(() => validateConfig(config as any, tempDir)).toThrow('injectHead[0] 必须是字符串类型')
    })

    it('应接受有效的 injectBody 数组', () => {
      const config: UserConfig = { injectBody: ['<script>console.log(1)</script>'] }
      expect(() => validateConfig(config, tempDir)).not.toThrow()
    })

    it('应拒绝非数组类型的 injectBody', () => {
      const config = { injectBody: {} }
      expect(() => validateConfig(config as any, tempDir)).toThrow(ConfigValidationError)
      expect(() => validateConfig(config as any, tempDir)).toThrow('injectBody 必须是数组类型')
    })

    it('应接受有效的 injectCode 数组', () => {
      const config: UserConfig = { injectCode: ['import { custom } from "./custom"'] }
      expect(() => validateConfig(config, tempDir)).not.toThrow()
    })

    it('应拒绝非数组类型的 injectCode', () => {
      const config = { injectCode: true }
      expect(() => validateConfig(config as any, tempDir)).toThrow(ConfigValidationError)
      expect(() => validateConfig(config as any, tempDir)).toThrow('injectCode 必须是数组类型')
    })
  })

  describe('文档目录验证', () => {
    it('应接受有效的 docDir 配置', () => {
      mkdirSync(join(tempDir, 'docs'), { recursive: true })
      const config: UserConfig = { docDir: { dir: 'docs' } }
      expect(() => validateConfig(config, tempDir)).not.toThrow()
    })

    it('应拒绝不存在的文档目录', () => {
      const config: UserConfig = { docDir: { dir: 'non-existent' } }
      expect(() => validateConfig(config, tempDir)).toThrow(ConfigValidationError)
      expect(() => validateConfig(config, tempDir)).toThrow('目录不存在')
    })

    it('应拒绝非对象类型的 docDir', () => {
      const config = { docDir: 'docs' }
      expect(() => validateConfig(config as any, tempDir)).toThrow(ConfigValidationError)
      expect(() => validateConfig(config as any, tempDir)).toThrow('docsDir 必须是对象类型')
    })

    it('应拒绝空字符串的 dir', () => {
      const config = { docDir: { dir: '' } }
      expect(() => validateConfig(config as any, tempDir)).toThrow(ConfigValidationError)
      expect(() => validateConfig(config as any, tempDir)).toThrow('docsDir.dir 必须是非空字符串')
    })

    it('应接受有效的 include 配置', () => {
      mkdirSync(join(tempDir, 'docs'), { recursive: true })
      const config: UserConfig = {
        docDir: { dir: 'docs', include: ['**/*.md'] }
      }
      expect(() => validateConfig(config, tempDir)).not.toThrow()
    })

    it('应拒绝非数组类型的 include', () => {
      mkdirSync(join(tempDir, 'docs'), { recursive: true })
      const config = { docDir: { dir: 'docs', include: '*.md' } }
      expect(() => validateConfig(config as any, tempDir)).toThrow(ConfigValidationError)
      expect(() => validateConfig(config as any, tempDir)).toThrow(
        'docsDir.patterns 必须是数组类型'
      )
    })

    it('应拒绝 include 中包含非字符串元素', () => {
      mkdirSync(join(tempDir, 'docs'), { recursive: true })
      const config = { docDir: { dir: 'docs', include: [123] } }
      expect(() => validateConfig(config as any, tempDir)).toThrow(ConfigValidationError)
      expect(() => validateConfig(config as any, tempDir)).toThrow(
        'docsDir.patterns[0] 必须是字符串类型'
      )
    })
  })

  describe('页面目录验证', () => {
    it('应接受有效的 pageDirs 配置', () => {
      mkdirSync(join(tempDir, 'pages'), { recursive: true })
      const config: UserConfig = {
        pageDirs: [{ dir: 'pages' }]
      }
      expect(() => validateConfig(config, tempDir)).not.toThrow()
    })

    it('应拒绝非数组类型的 pageDirs', () => {
      const config = { pageDirs: { dir: 'pages' } }
      expect(() => validateConfig(config as any, tempDir)).toThrow(ConfigValidationError)
      expect(() => validateConfig(config as any, tempDir)).toThrow('pageDirs 必须是数组类型')
    })

    it('应拒绝 pageDirs 中包含空元素', () => {
      const config = { pageDirs: [null] }
      expect(() => validateConfig(config as any, tempDir)).toThrow(ConfigValidationError)
      expect(() => validateConfig(config as any, tempDir)).toThrow('pageDirs[0] 不能为空')
    })

    it('应拒绝不存在的页面目录', () => {
      const config: UserConfig = {
        pageDirs: [{ dir: 'non-existent' }]
      }
      expect(() => validateConfig(config, tempDir)).toThrow(ConfigValidationError)
      expect(() => validateConfig(config, tempDir)).toThrow('目录不存在')
    })
  })

  describe('语言配置验证', () => {
    it('应接受数组类型的 locales', () => {
      const config: UserConfig = { locales: [{ id: 'zh-CN', name: '简体中文' }] }
      expect(() => validateConfig(config, tempDir)).not.toThrow()
    })

    it('应拒绝非数组类型的 locales', () => {
      const config = { locales: 'zh-CN' }
      expect(() => validateConfig(config as any, tempDir)).toThrow(ConfigValidationError)
      expect(() => validateConfig(config as any, tempDir)).toThrow(
        'locales 必须是数组类型'
      )
    })

    it('应拒绝 locales 数组中包含非对象元素', () => {
      const config = { locales: ['zh-CN'] }
      expect(() => validateConfig(config as any, tempDir)).toThrow(ConfigValidationError)
      expect(() => validateConfig(config as any, tempDir)).toThrow('locales[0] 必须是对象类型')
    })

    it('应拒绝 locales 中缺少 id 属性', () => {
      const config = { locales: [{ name: '简体中文' }] }
      expect(() => validateConfig(config as any, tempDir)).toThrow(ConfigValidationError)
      expect(() => validateConfig(config as any, tempDir)).toThrow(
        'locales[0] 必须有 id 属性'
      )
    })

    it('应拒绝 locales 中缺少 name 属性', () => {
      const config = { locales: [{ id: 'zh-CN' }] }
      expect(() => validateConfig(config as any, tempDir)).toThrow(ConfigValidationError)
      expect(() => validateConfig(config as any, tempDir)).toThrow(
        'locales[0] 必须有 name 属性'
      )
    })
  })

  describe('MarkdownIt 配置验证', () => {
    it('应接受有效的 markdownIt 配置', () => {
      const config: UserConfig = {
        markdownIt: {
          options: { html: true }
        }
      }
      expect(() => validateConfig(config, tempDir)).not.toThrow()
    })

    it('应拒绝非对象类型的 markdownIt', () => {
      const config = { markdownIt: 'invalid' }
      expect(() => validateConfig(config as any, tempDir)).toThrow(ConfigValidationError)
      expect(() => validateConfig(config as any, tempDir)).toThrow('markdownIt 必须是对象类型')
    })

    it('应拒绝非对象类型的 markdownIt.options', () => {
      const config = { markdownIt: { options: 'invalid' } }
      expect(() => validateConfig(config as any, tempDir)).toThrow(ConfigValidationError)
      expect(() => validateConfig(config as any, tempDir)).toThrow(
        'markdownIt.options 必须是对象类型'
      )
    })

    it('应拒绝非数组类型的 markdownIt.plugins', () => {
      const config = { markdownIt: { plugins: {} } }
      expect(() => validateConfig(config as any, tempDir)).toThrow(ConfigValidationError)
      expect(() => validateConfig(config as any, tempDir)).toThrow(
        'markdownIt.plugins 必须是数组类型'
      )
    })

    it('应拒绝非对象类型的 markdownIt.shikiConfig', () => {
      const config = { markdownIt: { shikiConfig: [] } }
      expect(() => validateConfig(config as any, tempDir)).toThrow(ConfigValidationError)
      expect(() => validateConfig(config as any, tempDir)).toThrow(
        'markdownIt.shikiConfig 必须是对象类型'
      )
    })
  })

  describe('DTS 配置验证', () => {
    it('应接受布尔类型的 dts', () => {
      const config: UserConfig = { dts: true }
      expect(() => validateConfig(config, tempDir)).not.toThrow()
    })

    it('应接受字符串类型的 dts', () => {
      const config: UserConfig = { dts: 'router.d.ts' }
      expect(() => validateConfig(config, tempDir)).not.toThrow()
    })

    it('应拒绝非布尔或字符串类型的 dts', () => {
      const config = { dts: 123 }
      expect(() => validateConfig(config as any, tempDir)).toThrow(ConfigValidationError)
      expect(() => validateConfig(config as any, tempDir)).toThrow('dts 必须是布尔值或字符串类型')
    })
  })

  describe('插件配置验证', () => {
    it('应接受有效的插件配置', () => {
      const config: UserConfig = {
        plugins: [{ name: 'test-plugin' }]
      }
      expect(() => validateConfig(config, tempDir)).not.toThrow()
    })

    it('应拒绝非数组类型的 plugins', () => {
      const config = { plugins: { name: 'test' } }
      expect(() => validateConfig(config as any, tempDir)).toThrow(ConfigValidationError)
      expect(() => validateConfig(config as any, tempDir)).toThrow('plugins.plugins 必须是数组类型')
    })

    it('应拒绝插件缺少 name 属性', () => {
      const config = { plugins: [{}] }
      expect(() => validateConfig(config as any, tempDir)).toThrow(ConfigValidationError)
      expect(() => validateConfig(config as any, tempDir)).toThrow(
        'plugins.plugins[0] 必须有 name 属性'
      )
    })

    it('应拒绝非对象类型的插件', () => {
      const config = { plugins: ['invalid'] }
      expect(() => validateConfig(config as any, tempDir)).toThrow(ConfigValidationError)
      expect(() => validateConfig(config as any, tempDir)).toThrow(
        'plugins.plugins[0] 必须是对象类型'
      )
    })
  })

  describe('空配置', () => {
    it('应接受空配置对象', () => {
      expect(() => validateConfig({}, tempDir)).not.toThrow()
    })
  })
})
