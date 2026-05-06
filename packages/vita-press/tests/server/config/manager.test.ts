import { existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ConfigManager } from '../../../src/server/config/manager.js'
import type { ConfigEnv } from '../../../src/types/index.js'

const devEnv: ConfigEnv = {
  command: 'dev',
  isDev: true,
  isBuild: false,
  isPreview: false
}

vi.mock('vitarx-router/file-router', async importOriginal => {
  const mod = await importOriginal<typeof import('vitarx-router/file-router')>()
  return {
    ...mod,
    warn: vi.fn()
  }
})

describe('ConfigManager', () => {
  let tempDir: string

  beforeEach(() => {
    tempDir = join(process.cwd(), 'temp-test-config-' + Date.now())
    mkdirSync(tempDir, { recursive: true })
  })

  afterEach(() => {
    if (existsSync(tempDir)) {
      rmSync(tempDir, { recursive: true, force: true })
    }
  })

  function createConfigFile(content: string): void {
    const configDir = join(tempDir, '.vitapress')
    mkdirSync(configDir, { recursive: true })
    writeFileSync(join(configDir, 'config.ts'), content)
  }

  describe('create', () => {
    it('应正确创建 ConfigManager 实例', async () => {
      createConfigFile(`export default { title: 'Test Site' }`)
      const manager = await ConfigManager.create(tempDir, undefined, devEnv)

      expect(manager).toBeInstanceOf(ConfigManager)
      expect(manager.root).toBe(tempDir)
    })

    it('应正确加载配置', async () => {
      createConfigFile(`export default {
        title: 'Test Title',
        description: 'Test Description'
      }`)
      const manager = await ConfigManager.create(tempDir, undefined, devEnv)

      expect(manager.config.title).toBe('Test Title')
      expect(manager.config.description).toBe('Test Description')
    })

    it('应正确处理空配置', async () => {
      createConfigFile(`export default {}`)
      const manager = await ConfigManager.create(tempDir, undefined, devEnv)

      expect(manager.config).toBeDefined()
      expect(manager.config.title).toBe('')
    })
  })

  describe('config getter', () => {
    it('应返回解析后的配置', async () => {
      createConfigFile(`export default { title: 'Config Test' }`)
      const manager = await ConfigManager.create(tempDir, undefined, devEnv)

      expect(manager.config).toBeDefined()
      expect(manager.config.title).toBe('Config Test')
    })
  })

  describe('plugins getter', () => {
    it('应返回空数组当没有插件', async () => {
      createConfigFile(`export default {}`)
      const manager = await ConfigManager.create(tempDir, undefined, devEnv)

      expect(manager.plugins).toEqual([])
    })

    it('应返回注册的插件列表', async () => {
      createConfigFile(`
        const plugin = { name: 'test-plugin' }
        export default { plugins: [plugin] }
      `)
      const manager = await ConfigManager.create(tempDir, undefined, devEnv)

      expect(manager.plugins).toHaveLength(1)
      expect(manager.plugins[0]!.name).toBe('test-plugin')
    })
  })

  describe('插件排序', () => {
    it('应正确排序 enforce: pre 插件', async () => {
      createConfigFile(`
        const plugins = [
          { name: 'normal-plugin' },
          { name: 'pre-plugin', enforce: 'pre' }
        ]
        export default { plugins }
      `)
      const manager = await ConfigManager.create(tempDir, undefined, devEnv)

      expect(manager.plugins[0]!.name).toBe('pre-plugin')
      expect(manager.plugins[1]!.name).toBe('normal-plugin')
    })

    it('应正确排序 enforce: post 插件', async () => {
      createConfigFile(`
        const plugins = [
          { name: 'post-plugin', enforce: 'post' },
          { name: 'normal-plugin' }
        ]
        export default { plugins }
      `)
      const manager = await ConfigManager.create(tempDir, undefined, devEnv)

      expect(manager.plugins[0]!.name).toBe('normal-plugin')
      expect(manager.plugins[1]!.name).toBe('post-plugin')
    })

    it('应正确排序数字 enforce 插件', async () => {
      createConfigFile(`
        const plugins = [
          { name: 'plugin-1', enforce: 1 },
          { name: 'plugin-5', enforce: 5 },
          { name: 'plugin-3', enforce: 3 }
        ]
        export default { plugins }
      `)
      const manager = await ConfigManager.create(tempDir, undefined, devEnv)

      expect(manager.plugins[0]!.name).toBe('plugin-5')
      expect(manager.plugins[1]!.name).toBe('plugin-3')
      expect(manager.plugins[2]!.name).toBe('plugin-1')
    })

    it('应正确混合排序所有插件类型', async () => {
      createConfigFile(`
        const plugins = [
          { name: 'normal-1' },
          { name: 'post-1', enforce: 'post' },
          { name: 'pre-1', enforce: 'pre' },
          { name: 'numeric-2', enforce: 2 },
          { name: 'normal-2' },
          { name: 'numeric-5', enforce: 5 },
          { name: 'pre-2', enforce: 'pre' },
          { name: 'post-2', enforce: 'post' }
        ]
        export default { plugins }
      `)
      const manager = await ConfigManager.create(tempDir, undefined, devEnv)

      const names = manager.plugins.map(p => p.name)
      expect(names.indexOf('pre-1')).toBeLessThan(names.indexOf('normal-1'))
      expect(names.indexOf('pre-2')).toBeLessThan(names.indexOf('normal-1'))
      expect(names.indexOf('numeric-5')).toBeLessThan(names.indexOf('numeric-2'))
      expect(names.indexOf('numeric-2')).toBeLessThan(names.indexOf('normal-1'))
      expect(names.indexOf('normal-1')).toBeLessThan(names.indexOf('post-1'))
      expect(names.indexOf('normal-2')).toBeLessThan(names.indexOf('post-2'))
    })
  })

  describe('插件去重', () => {
    it('应去重同名插件', async () => {
      createConfigFile(`
        const plugins = [
          { name: 'duplicate-plugin' },
          { name: 'duplicate-plugin' }
        ]
        export default { plugins }
      `)
      const manager = await ConfigManager.create(tempDir, undefined, devEnv)

      expect(manager.plugins).toHaveLength(1)
    })
  })

  describe('配置合并', () => {
    it('应正确合并默认配置', async () => {
      createConfigFile(`export default {}`)
      const manager = await ConfigManager.create(tempDir, undefined, devEnv)

      expect(manager.config.locales).toEqual([{ id: 'zh-CN', name: '简体中文' }])
      expect(manager.config.dts).toBe(false)
    })

    it('用户配置应覆盖默认配置', async () => {
      createConfigFile(`
        export default {
          title: 'Custom Title',
          locales: [{ id: 'en-US', name: 'English' }],
          dts: true
        }
      `)
      const manager = await ConfigManager.create(tempDir, undefined, devEnv)

      expect(manager.config.title).toBe('Custom Title')
      expect(manager.config.locales).toEqual([{ id: 'en-US', name: 'English' }])
      expect(manager.config.dts).toBe(true)
    })
  })
})
