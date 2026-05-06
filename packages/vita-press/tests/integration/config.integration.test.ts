import { existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { ConfigManager } from '../../src/server/config/manager.js'
import type { ConfigEnv } from '../../src/types/index.js'
import { loadUserConfig, mergeConfig } from '../../src/server/index.js'

const devEnv: ConfigEnv = {
  command: 'dev',
  isDev: true,
  isBuild: false,
  isPreview: false
}

describe('配置系统端到端集成测试', () => {
  let tempDir: string

  beforeEach(() => {
    tempDir = join(tmpdir(), `config-integration-test-${Date.now()}`)
    mkdirSync(tempDir, { recursive: true })
  })

  afterEach(() => {
    if (existsSync(tempDir)) {
      rmSync(tempDir, { recursive: true, force: true })
    }
  })

  function createConfigFile(content: string, filename = 'config.ts'): void {
    const configDir = join(tempDir, '.vitapress')
    mkdirSync(configDir, { recursive: true })
    writeFileSync(join(configDir, filename), content)
  }

  describe('配置文件加载', () => {
    it('应成功加载 TypeScript 配置文件', async () => {
      createConfigFile(`
        export default {
          title: 'TypeScript Config',
          description: 'Testing TS config'
        }
      `)

      const { config } = await loadUserConfig(tempDir)

      expect(config.title).toBe('TypeScript Config')
      expect(config.description).toBe('Testing TS config')
    })

    it('应成功加载 JavaScript 配置文件', async () => {
      createConfigFile(
        `
        module.exports = {
          title: 'JavaScript Config',
          description: 'Testing JS config'
        }
      `,
        'config.js'
      )

      const { config } = await loadUserConfig(tempDir)

      expect(config.title).toBe('JavaScript Config')
      expect(config.description).toBe('Testing JS config')
    })

    it('应优先加载 TypeScript 配置文件', async () => {
      createConfigFile(`export default { title: 'TS Config' }`)
      createConfigFile(`module.exports = { title: 'JS Config' }`, 'config.js')

      const { config } = await loadUserConfig(tempDir)

      expect(config.title).toBe('TS Config')
    })

    it('应在缺少配置文件时返回默认配置', async () => {
      const { config } = await loadUserConfig(tempDir)

      expect(config).toBeDefined()
      expect(config.title).not.toBeDefined()
      expect(config.description).not.toBeDefined()
    })
  })

  describe('配置验证', () => {
    it('应验证有效的配置', async () => {
      createConfigFile(`
        export default {
          title: 'Valid Config',
          description: 'Valid description',
          locales: [{ id: 'en-US', name: 'English' }],
          dts: true
        }
      `)

      const manager = await ConfigManager.create(tempDir, undefined, devEnv)

      expect(manager.config.title).toBe('Valid Config')
      expect(manager.config.locales).toEqual([{ id: 'en-US', name: 'English' }])
      expect(manager.config.dts).toBe(true)
    })

    it('应正确处理空配置', async () => {
      createConfigFile(`export default {}`)

      const manager = await ConfigManager.create(tempDir, undefined, devEnv)

      expect(manager.config).toBeDefined()
      expect(manager.config.title).toBe('')
      expect(manager.config.locales).toEqual([{ id: 'zh-CN', name: '简体中文' }])
    })

    it('应正确处理部分配置', async () => {
      createConfigFile(`
        export default {
          title: 'Partial Config'
        }
      `)

      const manager = await ConfigManager.create(tempDir, undefined, devEnv)

      expect(manager.config.title).toBe('Partial Config')
      expect(manager.config.description).toBe('')
      expect(manager.config.locales).toEqual([{ id: 'zh-CN', name: '简体中文' }])
    })
  })

  describe('配置合并', () => {
    it('应正确合并默认配置和用户配置', async () => {
      createConfigFile(`
        export default {
          title: 'User Title',
          locales: [{ id: 'en-US', name: 'English' }]
        }
      `)

      const manager = await ConfigManager.create(tempDir, undefined, devEnv)

      expect(manager.config.title).toBe('User Title')
      expect(manager.config.locales).toEqual([{ id: 'en-US', name: 'English' }])
      expect(manager.config.dts).toBe(false)
    })

    it('应深度合并嵌套配置', async () => {
      createConfigFile(`
        export default {
          vite: {
            base: '/docs/',
            server: {
              port: 3000
            }
          }
        }
      `)

      const manager = await ConfigManager.create(tempDir, undefined, devEnv)

      expect(manager.config.vite.base).toBe('/docs/')
      expect(manager.config.vite.server?.port).toBe(3000)
    })

    it('用户配置应完全覆盖数组配置', async () => {
      createConfigFile(`
        export default {
          injectHead: ['<script src="custom.js"></script>'],
          injectBody: ['<div>Custom</div>']
        }
      `)

      const manager = await ConfigManager.create(tempDir, undefined, devEnv)

      expect(manager.config.injectHead).toHaveLength(1)
      expect(manager.config.injectHead[0]).toBe('<script src="custom.js"></script>')
    })
  })

  describe('插件配置', () => {
    it('应正确加载空插件列表', async () => {
      createConfigFile(`export default {}`)

      const manager = await ConfigManager.create(tempDir, undefined, devEnv)

      expect(manager.plugins).toEqual([])
    })

    it('应正确加载单个插件', async () => {
      createConfigFile(`
        const myPlugin = {
          name: 'my-plugin',
          setup() {
            console.log('Plugin setup')
          }
        }
        export default {
          plugins: [myPlugin]
        }
      `)

      const manager = await ConfigManager.create(tempDir, undefined, devEnv)

      expect(manager.plugins).toHaveLength(1)
      expect(manager.plugins[0]!.name).toBe('my-plugin')
    })

    it('应正确加载多个插件', async () => {
      createConfigFile(`
        const plugin1 = { name: 'plugin-1' }
        const plugin2 = { name: 'plugin-2' }
        const plugin3 = { name: 'plugin-3' }
        export default {
          plugins: [plugin1, plugin2, plugin3]
        }
      `)

      const manager = await ConfigManager.create(tempDir, undefined, devEnv)

      expect(manager.plugins).toHaveLength(3)
      expect(manager.plugins.map(p => p.name)).toEqual(['plugin-1', 'plugin-2', 'plugin-3'])
    })

    it('应正确排序 enforce: pre 插件', async () => {
      createConfigFile(`
        const normal = { name: 'normal' }
        const pre = { name: 'pre', enforce: 'pre' }
        export default {
          plugins: [normal, pre]
        }
      `)

      const manager = await ConfigManager.create(tempDir, undefined, devEnv)

      expect(manager.plugins[0]!.name).toBe('pre')
      expect(manager.plugins[1]!.name).toBe('normal')
    })

    it('应正确排序 enforce: post 插件', async () => {
      createConfigFile(`
        const normal = { name: 'normal' }
        const post = { name: 'post', enforce: 'post' }
        export default {
          plugins: [post, normal]
        }
      `)

      const manager = await ConfigManager.create(tempDir, undefined, devEnv)

      expect(manager.plugins[0]!.name).toBe('normal')
      expect(manager.plugins[1]!.name).toBe('post')
    })

    it('应正确排序数字 enforce 插件', async () => {
      createConfigFile(`
        const p1 = { name: 'p1', enforce: 1 }
        const p5 = { name: 'p5', enforce: 5 }
        const p3 = { name: 'p3', enforce: 3 }
        export default {
          plugins: [p1, p5, p3]
        }
      `)

      const manager = await ConfigManager.create(tempDir, undefined, devEnv)

      expect(manager.plugins.map(p => p.name)).toEqual(['p5', 'p3', 'p1'])
    })

    it('应去重同名插件', async () => {
      createConfigFile(`
        const plugin = { name: 'duplicate' }
        export default {
          plugins: [plugin, plugin]
        }
      `)

      const manager = await ConfigManager.create(tempDir, undefined, devEnv)

      expect(manager.plugins).toHaveLength(1)
    })
  })

  describe('多语言配置', () => {
    it('应使用默认语言配置', async () => {
      createConfigFile(`export default {}`)

      const manager = await ConfigManager.create(tempDir, undefined, devEnv)

      expect(manager.config.locales).toEqual([{ id: 'zh-CN', name: '简体中文' }])
    })

    it('应支持自定义语言配置', async () => {
      createConfigFile(`
        export default {
          locales: [{ id: 'en-US', name: 'English' }]
        }
      `)

      const manager = await ConfigManager.create(tempDir, undefined, devEnv)

      expect(manager.config.locales).toEqual([{ id: 'en-US', name: 'English' }])
    })

    it('应支持多语言配置', async () => {
      createConfigFile(`
        export default {
          locales: [
            { id: 'zh-CN', name: '简体中文' },
            { id: 'en-US', name: 'English' },
            { id: 'ja-JP', name: '日本語' }
          ]
        }
      `)

      const manager = await ConfigManager.create(tempDir, undefined, devEnv)

      expect(manager.config.locales).toEqual([
        { id: 'zh-CN', name: '简体中文' },
        { id: 'en-US', name: 'English' },
        { id: 'ja-JP', name: '日本語' }
      ])
    })
  })

  describe('MarkdownIt 配置', () => {
    it('应使用默认 MarkdownIt 配置', async () => {
      createConfigFile(`export default {}`)

      const manager = await ConfigManager.create(tempDir, undefined, devEnv)

      expect(manager.config.markdownIt).toBeDefined()
    })

    it('应支持自定义 MarkdownIt 配置', async () => {
      createConfigFile(`
        export default {
          markdownIt: {
            options:{
              html: true,
              linkify: true,
              typographer: true
            }
          }
        }
      `)

      const manager = await ConfigManager.create(tempDir, undefined, devEnv)
      expect(manager.config.markdownIt.options!.html).toBe(true)
      expect(manager.config.markdownIt.options!.linkify).toBe(true)
      expect(manager.config.markdownIt.options!.typographer).toBe(true)
    })
  })

  describe('Vite 配置', () => {
    it('应使用默认 Vite 配置', async () => {
      createConfigFile(`export default {}`)

      const manager = await ConfigManager.create(tempDir, undefined, devEnv)

      expect(manager.config.vite).toBeDefined()
    })

    it('应支持自定义 Vite 配置', async () => {
      createConfigFile(`
        export default {
          vite: {
            base: '/docs/',
            server: {
              port: 3000,
              open: true
            }
          }
        }
      `)

      const manager = await ConfigManager.create(tempDir, undefined, devEnv)

      expect(manager.config.vite.base).toBe('/docs/')
      expect(manager.config.vite.server?.port).toBe(3000)
      expect(manager.config.vite.server?.open).toBe(true)
    })
  })

  describe('代码注入配置', () => {
    it('应支持注入 head 标签', async () => {
      createConfigFile(`
        export default {
          injectHead: [
            '<meta name="author" content="Test">',
            '<link rel="icon" href="/favicon.ico">'
          ]
        }
      `)

      const manager = await ConfigManager.create(tempDir, undefined, devEnv)

      expect(manager.config.injectHead).toHaveLength(2)
      expect(manager.config.injectHead[0]).toBe('<meta name="author" content="Test">')
    })

    it('应支持注入 body 内容', async () => {
      createConfigFile(`
        export default {
          injectBody: [
            '<script>console.log("test")</script>',
            '<div id="custom"></div>'
          ]
        }
      `)

      const manager = await ConfigManager.create(tempDir, undefined, devEnv)

      expect(manager.config.injectBody).toHaveLength(2)
    })

    it('应支持注入代码', async () => {
      createConfigFile(`
        export default {
          injectCode: [
            'import { customFunction } from "./custom"',
            'import MyComponent from "./MyComponent.vue"'
          ]
        }
      `)

      const manager = await ConfigManager.create(tempDir, undefined, devEnv)

      expect(manager.config.injectCode).toHaveLength(2)
    })
  })

  describe('docLayoutFile 配置', () => {
    it('默认 docLayoutFile 应为 null', async () => {
      createConfigFile(`export default {}`)

      const manager = await ConfigManager.create(tempDir, undefined, devEnv)

      expect(manager.config.docLayoutFile).toBeNull()
    })

    it('应支持字符串类型的 docLayoutFile', async () => {
      const layoutPath = join(tempDir, 'layout.tsx')
      writeFileSync(layoutPath, 'export default function Layout() {}')

      createConfigFile(`
        export default {
          docLayoutFile: '${layoutPath}'
        }
      `)

      const manager = await ConfigManager.create(tempDir, undefined, devEnv)

      expect(manager.config.docLayoutFile).toBe(layoutPath)
    })

    it('应支持 null 类型的 docLayoutFile', async () => {
      createConfigFile(`
        export default {
          docLayoutFile: null
        }
      `)

      const manager = await ConfigManager.create(tempDir, undefined, devEnv)

      expect(manager.config.docLayoutFile).toBeNull()
    })

    it('用户配置应覆盖默认 docLayoutFile', async () => {
      const layoutPath = join(tempDir, 'custom-layout.tsx')
      writeFileSync(layoutPath, 'export default function Layout() {}')

      createConfigFile(`
        export default {
          docLayoutFile: '${layoutPath}'
        }
      `)

      const manager = await ConfigManager.create(tempDir, undefined, devEnv)

      expect(manager.config.docLayoutFile).toBe(layoutPath)
    })
  })

  describe('homeFile 配置', () => {
    it('默认 homeFile 应为 null', async () => {
      createConfigFile(`export default {}`)

      const manager = await ConfigManager.create(tempDir, undefined, devEnv)

      expect(manager.config.homeFile).toBeNull()
    })

    it('应支持字符串类型的 homeFile', async () => {
      const homeFile = join(tempDir, 'home.tsx')
      writeFileSync(homeFile, 'export default function Home() {}')

      createConfigFile(`
        export default {
          homeFile: '${homeFile}'
        }
      `)

      const manager = await ConfigManager.create(tempDir, undefined, devEnv)

      expect(manager.config.homeFile).toBe(homeFile)
    })

    it('应支持 null 类型的 homeFile', async () => {
      createConfigFile(`
        export default {
          homeFile: null
        }
      `)

      const manager = await ConfigManager.create(tempDir, undefined, devEnv)

      expect(manager.config.homeFile).toBeNull()
    })

    it('用户配置应覆盖默认 homeFile', async () => {
      const homeFile = join(tempDir, 'custom-home.tsx')
      writeFileSync(homeFile, 'export default function Home() {}')

      createConfigFile(`
        export default {
          homeFile: '${homeFile}'
        }
      `)

      const manager = await ConfigManager.create(tempDir, undefined, devEnv)

      expect(manager.config.homeFile).toBe(homeFile)
    })
  })

  describe('配置文件热更新', () => {
    it('应支持重新加载配置', async () => {
      createConfigFile(`
        export default {
          title: 'Initial Title'
        }
      `)

      const manager1 = await ConfigManager.create(tempDir, undefined, devEnv)
      expect(manager1.config.title).toBe('Initial Title')

      createConfigFile(`
        export default {
          title: 'Updated Title'
        }
      `)

      const manager2 = await ConfigManager.create(tempDir, undefined, devEnv)
      expect(manager2.config.title).toBe('Updated Title')
    })
  })

  describe('错误处理', () => {
    it('应处理配置文件语法错误', async () => {
      createConfigFile(`
        export default {
          title: 'Missing closing quote
        }
      `)

      await expect(ConfigManager.create(tempDir, undefined, devEnv)).rejects.toThrow()
    })
  })

  describe('mergeConfig 函数', () => {
    it('应正确合并配置对象', () => {
      const defaults = {
        title: 'Default',
        locales: [] as Array<{ id: string; name: string }>,
        dts: false
      }
      const overrides = {
        title: 'Custom',
        dts: true
      }

      const result = mergeConfig(defaults, overrides)

      expect(result.title).toBe('Custom')
      expect(result.locales).toEqual([])
      expect(result.dts).toBe(true)
    })

    it('应深度合并嵌套对象', () => {
      const defaults = {
        vite: {
          base: '/',
          server: {
            port: 3000
          }
        }
      }
      const overrides = {
        vite: {
          server: {
            port: 4000,
            open: true
          }
        }
      }

      const result = mergeConfig(defaults, overrides)

      expect(result.vite.base).toBe('/')
      expect(result.vite.server.port).toBe(4000)
      expect(result.vite.server.open).toBe(true)
    })

    it('应处理 null 和 undefined', () => {
      const defaults = { title: 'Default' }

      expect(mergeConfig(defaults, null)).toEqual(defaults)
      expect(mergeConfig(defaults, undefined)).toEqual(defaults)
    })
  })
})
