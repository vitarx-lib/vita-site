import { existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { VitaSiteApp } from '../../src/server/index.js'

describe('VitaSiteApp 端到端集成测试', () => {
  let tempDir: string

  beforeEach(() => {
    tempDir = join(tmpdir(), `vita-site-app-test-${Date.now()}`)
    mkdirSync(tempDir, { recursive: true })
  })

  afterEach(() => {
    if (existsSync(tempDir)) {
      rmSync(tempDir, { recursive: true, force: true })
    }
  })

  function createProjectStructure(files: Record<string, string>): void {
    for (const [relativePath, content] of Object.entries(files)) {
      const fullPath = join(tempDir, relativePath)
      const dir = join(fullPath, '..')
      mkdirSync(dir, { recursive: true })
      writeFileSync(fullPath, content)
    }
  }

  describe('应用初始化', () => {
    it('应成功创建最小化的 VitaSiteApp 实例', async () => {
      createProjectStructure({
        '.vita-site/config.ts': `export default {}`,
        'docs/index.md': '# Welcome'
      })

      const app = await VitaSiteApp.create(tempDir, 'dev')

      expect(app).toBeInstanceOf(VitaSiteApp)
      expect(app.root).toBe(tempDir)
      expect(app.command).toBe('dev')
      expect(app.isDev).toBe(true)
    })

    it('应正确初始化所有核心属性', async () => {
      createProjectStructure({
        '.vita-site/config.ts': `export default {
          title: 'Test Site',
          description: 'Test Description'
        }`,
        'docs/index.md': '# Home'
      })

      const app = await VitaSiteApp.create(tempDir, 'build')

      expect(app.config.title).toBe('Test Site')
      expect(app.config.description).toBe('Test Description')
      expect(app.cacheDir).toBe(join(tempDir, '.vita-site/.cache'))
      expect(app.tempDir).toBe(join(tempDir, '.vita-site/.temp'))
      expect(app.lang).toBe('zh-CN')
    })

    it('应正确识别客户端配置文件（TypeScript）', async () => {
      createProjectStructure({
        '.vita-site/config.ts': `export default {}`,
        '.vita-site/config.client.ts': `export default {}`,
        'docs/index.md': '# Home'
      })

      const app = await VitaSiteApp.create(tempDir, 'dev')

      expect(app.clientConfigPath).toBe(join(tempDir, '.vita-site/config.client.ts'))
    })

    it('应正确识别客户端配置文件（JavaScript）', async () => {
      createProjectStructure({
        '.vita-site/config.ts': `export default {}`,
        '.vita-site/config.client.js': `export default {}`,
        'docs/index.md': '# Home'
      })

      const app = await VitaSiteApp.create(tempDir, 'dev')

      expect(app.clientConfigPath).toBe(join(tempDir, '.vita-site/config.client.js'))
    })

    it('应在没有客户端配置时返回 null', async () => {
      createProjectStructure({
        '.vita-site/config.ts': `export default {}`,
        'docs/index.md': '# Home'
      })

      const app = await VitaSiteApp.create(tempDir, 'dev')

      expect(app.clientConfigPath).toBeNull()
    })
  })

  describe('命令模式', () => {
    it('应正确识别开发模式', async () => {
      createProjectStructure({
        '.vita-site/config.ts': `export default {}`,
        'docs/index.md': '# Home'
      })

      const app = await VitaSiteApp.create(tempDir, 'dev')

      expect(app.command).toBe('dev')
      expect(app.isDev).toBe(true)
    })

    it('应正确识别构建模式', async () => {
      createProjectStructure({
        '.vita-site/config.ts': `export default {}`,
        'docs/index.md': '# Home'
      })

      const app = await VitaSiteApp.create(tempDir, 'build')

      expect(app.command).toBe('build')
      expect(app.isDev).toBe(false)
    })

    it('应正确识别预览模式', async () => {
      createProjectStructure({
        '.vita-site/config.ts': `export default {}`,
        'docs/index.md': '# Home'
      })

      const app = await VitaSiteApp.create(tempDir, 'preview')

      expect(app.command).toBe('preview')
      expect(app.isDev).toBe(false)
    })
  })

  describe('Markdown 解析器初始化', () => {
    it('应成功初始化 Markdown 解析器', async () => {
      createProjectStructure({
        '.vita-site/config.ts': `export default {}`,
        'docs/index.md': '# Home'
      })

      const app = await VitaSiteApp.create(tempDir, 'dev')

      expect(app.mdParser).toBeDefined()
      expect(typeof app.mdParser.parse).toBe('function')
    })

    it('应正确解析 Markdown 文件', async () => {
      createProjectStructure({
        '.vita-site/config.ts': `export default {}`,
        'docs/guide.md': '# Guide\n\nThis is a guide.'
      })

      const app = await VitaSiteApp.create(tempDir, 'dev')
      const mdPath = join(tempDir, 'docs/guide.md')
      const result = app.mdParser.parse(mdPath)

      expect(result).toContain(
        '<h1 id="guide" class="paragraph-title">\n' +
          '<RouterLink to="#guide">Guide</RouterLink></h1>'
      )
      expect(result).toContain('This is a guide.')
    })

    it('应支持自定义 MarkdownIt 配置', async () => {
      createProjectStructure({
        '.vita-site/config.ts': `export default {
          markdownIt: {
            html: true,
            linkify: true
          }
        }`,
        'docs/index.md': '# Test'
      })

      const app = await VitaSiteApp.create(tempDir, 'dev')

      expect(app.mdParser).toBeDefined()
    })
  })

  describe('路由器初始化', () => {
    it('应成功初始化路由器', async () => {
      createProjectStructure({
        '.vita-site/config.ts': `export default {}`,
        'docs/index.md': '# Home'
      })

      const app = await VitaSiteApp.create(tempDir, 'dev')

      expect(app.router).toBeDefined()
      expect(typeof app.router.generate).toBe('function')
    })

    it('应正确生成路由代码', async () => {
      createProjectStructure({
        '.vita-site/config.ts': `export default {}`,
        'docs/index.md': '# Home',
        'docs/guide.md': '# Guide',
        'docs/api/intro.md': '# API Intro'
      })

      const app = await VitaSiteApp.create(tempDir, 'dev')
      const { code } = app.router.generate()

      expect(code).toContain('export default')
      expect(code).toContain('path: "/"')
      expect(code).toContain('path: "guide"')
      expect(code).toContain('path: "api"')
    })
  })

  describe('插件系统', () => {
    it('应正确加载空插件列表', async () => {
      createProjectStructure({
        '.vita-site/config.ts': `export default {}`,
        'docs/index.md': '# Home'
      })

      const app = await VitaSiteApp.create(tempDir, 'dev')

      expect(app.plugins).toEqual([])
    })

    it('应正确加载插件', async () => {
      createProjectStructure({
        '.vita-site/config.ts': `
          const testPlugin = {
            name: 'test-plugin',
            setup() {
              console.log('Plugin setup')
            }
          }
          export default {
            plugins: [testPlugin]
          }
        `,
        'docs/index.md': '# Home'
      })

      const app = await VitaSiteApp.create(tempDir, 'dev')

      expect(app.plugins).toHaveLength(1)
      expect(app.plugins[0]!.name).toBe('test-plugin')
    })

    it('应正确执行插件的 markdownIt 钩子', async () => {
      createProjectStructure({
        '.vita-site/config.ts': `
          const markdownPlugin = {
            name: 'markdown-plugin',
            markdownIt(md) {
              md.use((md) => {
                md.inline.ruler.push('custom_rule', () => false)
              })
            }
          }
          export default {
            plugins: [markdownPlugin]
          }
        `,
        'docs/index.md': '# Home'
      })

      const app = await VitaSiteApp.create(tempDir, 'dev')

      expect(app.mdParser).toBeDefined()
    })
  })

  describe('多语言支持', () => {
    it('应正确设置默认语言', async () => {
      createProjectStructure({
        '.vita-site/config.ts': `export default {}`,
        'docs/index.md': '# Home'
      })

      const app = await VitaSiteApp.create(tempDir, 'dev')

      expect(app.lang).toBe('zh-CN')
    })

    it('应支持自定义默认语言', async () => {
      createProjectStructure({
        '.vita-site/config.ts': `export default {
          locales: [{ id: 'en-US', name: 'English' }]
        }`,
        'docs/index.md': '# Home'
      })

      const app = await VitaSiteApp.create(tempDir, 'dev')

      expect(app.lang).toBe('en-US')
    })

    it('应正确配置多语言', async () => {
      createProjectStructure({
        '.vita-site/config.ts': `export default {
          locales: [
            { id: 'zh-CN', name: '简体中文' },
            { id: 'en-US', name: 'English' }
          ]
        }`,
        'docs/index.md': '# 中文',
        'docs/index.en-US.md': '# English'
      })

      const app = await VitaSiteApp.create(tempDir, 'dev')

      expect(app.langs).toEqual(['zh-CN', 'en-US'])
    })
  })

  describe('配置合并', () => {
    it('应正确合并默认配置', async () => {
      createProjectStructure({
        '.vita-site/config.ts': `export default {}`,
        'docs/index.md': '# Home'
      })

      const app = await VitaSiteApp.create(tempDir, 'dev')

      expect(app.config.dts).toBe(false)
      expect(app.config.locales).toEqual([{ id: 'zh-CN', name: '简体中文' }])
    })

    it('用户配置应覆盖默认配置', async () => {
      createProjectStructure({
        '.vita-site/config.ts': `export default {
          title: 'Custom Title',
          description: 'Custom Description',
          locales: [{ id: 'en-US', name: 'English' }],
          dts: true
        }`,
        'docs/index.md': '# Home'
      })

      const app = await VitaSiteApp.create(tempDir, 'dev')

      expect(app.config.title).toBe('Custom Title')
      expect(app.config.description).toBe('Custom Description')
      expect(app.config.locales).toEqual([{ id: 'en-US', name: 'English' }])
      expect(app.config.dts).toBe(true)
    })

    it('应正确处理嵌套配置', async () => {
      createProjectStructure({
        '.vita-site/config.ts': `export default {
          vite: {
            base: '/docs/',
            server: {
              port: 3000
            }
          }
        }`,
        'docs/index.md': '# Home'
      })

      const app = await VitaSiteApp.create(tempDir, 'dev')

      expect(app.config.vite.base).toBe('/docs/')
      expect(app.config.vite.server?.port).toBe(3000)
    })
  })

  describe('文档目录配置', () => {
    it('应使用默认文档目录', async () => {
      createProjectStructure({
        '.vita-site/config.ts': `export default {}`,
        'docs/index.md': '# Home'
      })

      const app = await VitaSiteApp.create(tempDir, 'dev')

      expect(app.config.docDirs).toEqual([
        { dir: 'docs', include: ['**/*.{md,jsx,tsx}'], exclude: ['**/.*'] }
      ])
    })
    it('应支持文档目录配置对象', async () => {
      createProjectStructure({
        '.vita-site/config.ts': `export default {
          docDirs: [{
            dir: 'content',
            prefix: '/docs'
          }]
        }`,
        'content/index.md': '# Home'
      })

      const app = await VitaSiteApp.create(tempDir, 'dev')

      expect(app.config.docDirs[0]!.dir).toBe('content')
    })
  })

  describe('错误处理', () => {
    it('应在缺少配置文件时使用默认配置', async () => {
      createProjectStructure({
        'docs/index.md': '# Home'
      })

      const app = await VitaSiteApp.create(tempDir, 'dev')

      expect(app).toBeInstanceOf(VitaSiteApp)
      expect(app.config).toBeDefined()
    })

    it('应正确处理空文档目录', async () => {
      createProjectStructure({
        'docs/index.md': '# Home',
        '.vita-site/config.ts': `export default {}`
      })

      const app = await VitaSiteApp.create(tempDir, 'dev')

      expect(app).toBeInstanceOf(VitaSiteApp)
      expect(app.router).toBeDefined()
    })
  })

  describe('完整工作流', () => {
    it('应完成完整的初始化流程', async () => {
      createProjectStructure({
        '.vita-site/config.ts': `export default {
          title: 'Integration Test',
          description: 'Testing full workflow',
          plugins: [
            {
              name: 'test-plugin',
              markdownIt(md) {
              }
            }
          ]
        }`,
        '.vita-site/config.client.ts': `export default {}`,
        'docs/index.md': '# Welcome\n\nThis is the home page.',
        'docs/guide/getting-started.md': '# Getting Started\n\nQuick start guide.',
        'docs/api/overview.md': '# API Overview\n\nAPI documentation.'
      })

      const app = await VitaSiteApp.create(tempDir, 'dev')

      expect(app).toBeInstanceOf(VitaSiteApp)
      expect(app.config.title).toBe('Integration Test')
      expect(app.plugins).toHaveLength(1)
      expect(app.mdParser).toBeDefined()
      expect(app.router).toBeDefined()

      const { code } = app.router.generate()
      expect(code).toContain('path: "/"')
      expect(code).toContain('path: "guide"')
      expect(code).toContain('path: "api"')

      const mdPath = join(tempDir, 'docs/index.md')
      const parsed = app.mdParser.parse(mdPath)
      expect(parsed).toContain(
        '<h1 id="welcome" class="paragraph-title">\n' +
          '<RouterLink to="#welcome">Welcome</RouterLink></h1>'
      )
    })
  })
})
