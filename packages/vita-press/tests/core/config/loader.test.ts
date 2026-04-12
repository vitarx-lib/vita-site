import { existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { DEFAULT_CONFIG } from '../../../src/core/config/defaults.js'
import { resolveConfig } from '../../../src/core/config/loader.js'

describe('ConfigLoader', () => {
  let tempDir: string

  beforeEach(() => {
    tempDir = join(process.cwd(), 'temp-test-loader-' + Date.now())
    mkdirSync(tempDir, { recursive: true })
  })

  afterEach(() => {
    if (existsSync(tempDir)) {
      rmSync(tempDir, { recursive: true, force: true })
    }
  })

  describe('resolveConfig', () => {
    it('应加载默认配置（无配置文件）', async () => {
      const docsDir = join(tempDir, 'docs')
      mkdirSync(docsDir, { recursive: true })

      const result = await resolveConfig(tempDir)

      expect(result.config).toEqual(DEFAULT_CONFIG)
      expect(result.configFile).toBeUndefined()
    })

    it('应加载并合并用户配置', async () => {
      const docsDir = join(tempDir, 'documentation')
      mkdirSync(docsDir, { recursive: true })

      const configFile = join(tempDir, 'vitapress.config.ts')
      writeFileSync(
        configFile,
        `
export default {
  title: 'Test Site',
  description: 'Test Description',
  docDir: 'documentation'
}
      `
      )

      const result = await resolveConfig(tempDir)

      expect(result.config.title).toBe('Test Site')
      expect(result.config.description).toBe('Test Description')
      expect(result.config.docDir).toBe('documentation')
      expect(result.configFile).toBe(configFile)
    })

    it('应加载指定的配置文件', async () => {
      const docsDir = join(tempDir, 'docs')
      mkdirSync(docsDir, { recursive: true })

      const customConfigFile = join(tempDir, 'custom.config.ts')
      writeFileSync(
        customConfigFile,
        `
export default {
  title: 'Custom Config'
}
      `
      )

      const result = await resolveConfig(tempDir, 'custom.config.ts')

      expect(result.config.title).toBe('Custom Config')
      expect(result.configFile).toBe(customConfigFile)
    })

    it('应在配置文件不存在时抛出错误', async () => {
      await expect(resolveConfig(tempDir, 'non-existent.config.ts')).rejects.toThrow(
        /配置文件不存在/
      )
    })

    it('应正确合并嵌套配置', async () => {
      const docsDir = join(tempDir, 'docs')
      mkdirSync(docsDir, { recursive: true })

      const configFile = join(tempDir, 'vitapress.config.ts')
      writeFileSync(
        configFile,
        `
export default {
  title: 'Test Site',
  markdownIt: {
    options: {
      html: false
    }
  }
}
      `
      )

      const result = await resolveConfig(tempDir)

      expect(result.config.title).toBe('Test Site')
      expect(result.config.markdownIt?.options?.html).toBe(false)
      expect(result.config.markdownIt?.options?.linkify).toBe(true)
    })

    it('应验证配置并抛出错误', async () => {
      const configFile = join(tempDir, 'vitapress.config.ts')
      writeFileSync(
        configFile,
        `
export default {
  docDir: 'non-existent-dir'
}
      `
      )

      await expect(resolveConfig(tempDir)).rejects.toThrow(/文档目录不存在/)
    })
  })
})
