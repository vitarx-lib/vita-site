import { existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { loadUserConfig } from '../../../src/server/config/loader.js'

describe('loadUserConfig', () => {
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

  describe('查找配置文件', () => {
    it('当没有配置文件时应返回空配置', async () => {
      const result = await loadUserConfig(tempDir)
      expect(result.config).toEqual({})
      expect(result.configFile).toBeUndefined()
    })

    it('应正确加载 .vitapress/config.ts 配置文件', async () => {
      const configDir = join(tempDir, '.vitapress')
      mkdirSync(configDir, { recursive: true })
      writeFileSync(join(configDir, 'config.ts'), `export default { title: 'Test Site' }`)

      const result = await loadUserConfig(tempDir)
      expect(result.config.title).toBe('Test Site')
      expect(result.configFile).toContain('config.ts')
    })

    it('应正确加载 .vitapress/config.js 配置文件', async () => {
      const configDir = join(tempDir, '.vitapress')
      mkdirSync(configDir, { recursive: true })
      writeFileSync(join(configDir, 'config.js'), `module.exports = { title: 'JS Config' }`)

      const result = await loadUserConfig(tempDir)
      expect(result.config.title).toBe('JS Config')
      expect(result.configFile).toContain('config.js')
    })

    it('应正确加载 .vitapress/config.mjs 配置文件', async () => {
      const configDir = join(tempDir, '.vitapress')
      mkdirSync(configDir, { recursive: true })
      writeFileSync(join(configDir, 'config.mjs'), `export default { title: 'MJS Config' }`)

      const result = await loadUserConfig(tempDir)
      expect(result.config.title).toBe('MJS Config')
      expect(result.configFile).toContain('config.mjs')
    })

    it('应正确加载 .vitapress/config.mts 配置文件', async () => {
      const configDir = join(tempDir, '.vitapress')
      mkdirSync(configDir, { recursive: true })
      writeFileSync(join(configDir, 'config.mts'), `export default { title: 'MTS Config' }`)

      const result = await loadUserConfig(tempDir)
      expect(result.config.title).toBe('MTS Config')
      expect(result.configFile).toContain('config.mts')
    })
  })

  describe('指定配置文件', () => {
    it('应正确加载指定的配置文件', async () => {
      const customConfigPath = join(tempDir, 'custom-config.ts')
      writeFileSync(
        customConfigPath,
        `export default { title: 'Custom Config', description: 'Custom Description' }`
      )

      const result = await loadUserConfig(tempDir, 'custom-config.ts')
      expect(result.config.title).toBe('Custom Config')
      expect(result.config.description).toBe('Custom Description')
      expect(result.configFile).toContain('custom-config.ts')
    })

    it('当指定的配置文件不存在时应抛出错误', async () => {
      await expect(loadUserConfig(tempDir, 'non-existent.ts')).rejects.toThrow('配置文件不存在')
    })

    it('应正确加载嵌套目录中的配置文件', async () => {
      const nestedDir = join(tempDir, 'config', 'nested')
      mkdirSync(nestedDir, { recursive: true })
      writeFileSync(join(nestedDir, 'config.ts'), `export default { title: 'Nested Config' }`)

      const result = await loadUserConfig(tempDir, 'config/nested/config.ts')
      expect(result.config.title).toBe('Nested Config')
    })
  })

  describe('配置文件内容', () => {
    it('应正确加载包含多种配置项的文件', async () => {
      const configDir = join(tempDir, '.vitapress')
      mkdirSync(configDir, { recursive: true })
      writeFileSync(
        join(configDir, 'config.ts'),
        `export default {
          title: 'Full Config',
          description: 'Test Description',
          lang: ['zh-CN', 'en-US'],
          injectHead: ['<link rel="stylesheet">'],
          injectBody: ['<script>test</script>']
        }`
      )

      const result = await loadUserConfig(tempDir)
      expect(result.config.title).toBe('Full Config')
      expect(result.config.description).toBe('Test Description')
      expect(result.config.lang).toEqual(['zh-CN', 'en-US'])
      expect(result.config.injectHead).toEqual(['<link rel="stylesheet">'])
      expect(result.config.injectBody).toEqual(['<script>test</script>'])
    })

    it('应正确加载空配置文件', async () => {
      const configDir = join(tempDir, '.vitapress')
      mkdirSync(configDir, { recursive: true })
      writeFileSync(join(configDir, 'config.ts'), `export default {}`)

      const result = await loadUserConfig(tempDir)
      expect(result.config).toEqual({})
    })

    it('应正确加载包含函数导出的配置文件', async () => {
      const configDir = join(tempDir, '.vitapress')
      mkdirSync(configDir, { recursive: true })
      writeFileSync(
        join(configDir, 'config.ts'),
        `export default function() {
          return { title: 'Function Config' }
        }`
      )

      const result = await loadUserConfig(tempDir)
      expect(result.config.title).toBe('Function Config')
    })
  })

  describe('错误处理', () => {
    it('当配置文件有语法错误时应抛出错误', async () => {
      const configDir = join(tempDir, '.vitapress')
      mkdirSync(configDir, { recursive: true })
      writeFileSync(join(configDir, 'config.ts'), `export default { title: 'Invalid`)

      await expect(loadUserConfig(tempDir)).rejects.toThrow()
    })
  })
})
