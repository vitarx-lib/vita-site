import { describe, expect, it, vi } from 'vitest'
import { defaultTheme, type DefaultThemeOptions } from '../src/plugin.js'

/**
 * 创建最小可用的主题选项
 */
function createMinimalOptions(overrides?: Partial<DefaultThemeOptions>): DefaultThemeOptions {
  return {
    title: 'Test Site',
    color: '#3b82f6',
    ...overrides
  }
}

describe('defaultTheme', () => {
  describe('插件结构', () => {
    it('应返回包含正确 name 属性的插件对象', () => {
      const plugin = defaultTheme(createMinimalOptions())
      expect(plugin.name).toBe('vitapress-theme-default')
    })

    it('应包含 clientConfig 属性', () => {
      const plugin = defaultTheme(createMinimalOptions())
      expect(plugin.clientConfig).toBeDefined()
      expect(typeof plugin.clientConfig).toBe('string')
    })

    it('应包含 siteData 属性', () => {
      const plugin = defaultTheme(createMinimalOptions())
      expect(plugin.siteData).toBeDefined()
    })

    it('应包含 config 方法', () => {
      const plugin = defaultTheme(createMinimalOptions())
      expect(typeof plugin.config).toBe('function')
    })
  })

  describe('siteData 构建', () => {
    it('应正确设置 title', () => {
      const plugin = defaultTheme(createMinimalOptions({ title: 'My Site' }))
      expect(plugin['siteData']!['title']).toBe('My Site')
    })

    it('未配置 edit 时默认为 null', () => {
      const plugin = defaultTheme(createMinimalOptions())
      expect(plugin['siteData']!['edit']).toBeNull()
    })

    it('应正确设置 edit', () => {
      const plugin = defaultTheme(createMinimalOptions({ edit: 'https://github.com/repo/edit/main/' }))
      expect(plugin['siteData']!['edit']).toBe('https://github.com/repo/edit/main/')
    })

    it('未配置 logo 时默认为 null', () => {
      const plugin = defaultTheme(createMinimalOptions())
      expect(plugin['siteData']!['logo']).toBeNull()
    })

    it('应正确设置 logo', () => {
      const plugin = defaultTheme(createMinimalOptions({ logo: '/logo.png' }))
      expect(plugin['siteData']!['logo']).toBe('/logo.png')
    })

    it('未配置 libLink 时默认为 null', () => {
      const plugin = defaultTheme(createMinimalOptions())
      expect(plugin['siteData']!['libLink']).toBeNull()
    })

    it('应正确设置 libLink', () => {
      const plugin = defaultTheme(createMinimalOptions({ libLink: 'https://github.com/repo' }))
      expect(plugin['siteData']!['libLink']).toBe('https://github.com/repo')
    })

    it('未配置 footer 时默认为 null', () => {
      const plugin = defaultTheme(createMinimalOptions())
      expect(plugin['siteData']!['footer']).toBeNull()
    })

    it('应正确设置 footer', () => {
      const plugin = defaultTheme(createMinimalOptions({ footer: '<p>Made with love</p>' }))
      expect(plugin['siteData']!['footer']).toBe('<p>Made with love</p>')
    })

    it('未配置 hero 时默认为 null', () => {
      const plugin = defaultTheme(createMinimalOptions())
      expect(plugin['siteData']!['hero']).toBeNull()
    })

    it('应正确设置 hero', () => {
      const hero = { name: 'VitaPress', text: 'Next-gen docs' }
      const plugin = defaultTheme(createMinimalOptions({ hero }))
      expect(plugin['siteData']!['hero']).toEqual(hero)
    })

    it('未配置 features 时默认为空数组', () => {
      const plugin = defaultTheme(createMinimalOptions())
      expect(plugin['siteData']!['features']).toEqual([])
    })

    it('应正确设置 features', () => {
      const features = [{ title: 'Fast', details: 'Super fast' }]
      const plugin = defaultTheme(createMinimalOptions({ features }))
      expect(plugin['siteData']!['features']).toEqual(features)
    })

    it('未配置 navLinks 时默认为空数组', () => {
      const plugin = defaultTheme(createMinimalOptions())
      expect(plugin['siteData']!['navLinks']).toEqual([])
    })

    it('应正确设置 navLinks', () => {
      const navLinks = [{ text: 'Home', link: '/' }]
      const plugin = defaultTheme(createMinimalOptions({ navLinks }))
      expect(plugin['siteData']!['navLinks']).toEqual(navLinks)
    })

    it('useSearch 默认为 true', () => {
      const plugin = defaultTheme(createMinimalOptions())
      expect(plugin['siteData']!['useSearch']).toBe(true)
    })

    it('useSearch 可设置为 false', () => {
      const plugin = defaultTheme(createMinimalOptions({ useSearch: false }))
      expect(plugin['siteData']!['useSearch']).toBe(false)
    })
  })

  describe('config 方法', () => {
    it('应返回包含 vite 配置的对象', () => {
      const plugin = defaultTheme(createMinimalOptions())
      const config = plugin.config!({} as any, { isBuild: false } as any) as any
      expect(config).toHaveProperty('vite')
      expect(config.vite).toHaveProperty('plugins')
    })

    it('应包含 homeFile 配置', () => {
      const plugin = defaultTheme(createMinimalOptions())
      const config = plugin.config!({} as any, { isBuild: false } as any) as any
      expect(config).toHaveProperty('homeFile')
      expect(config.homeFile).toContain('Home')
    })

    it('应包含 docLayoutFile 配置', () => {
      const plugin = defaultTheme(createMinimalOptions())
      const config = plugin.config!({} as any, { isBuild: false } as any) as any
      expect(config).toHaveProperty('docLayoutFile')
      expect(config.docLayoutFile).toContain('DocLayout')
    })

    it('应包含 injectHead 配置', () => {
      const plugin = defaultTheme(createMinimalOptions())
      const config = plugin.config!({} as any, { isBuild: false } as any) as any
      expect(config).toHaveProperty('injectHead')
      expect(Array.isArray(config.injectHead)).toBe(true)
      expect(config.injectHead.length).toBeGreaterThan(0)
    })

    it('injectHead 应包含主题样式链接', () => {
      const plugin = defaultTheme(createMinimalOptions())
      const config = plugin.config!({} as any, { isBuild: false } as any) as any
      const hasMainScss = config.injectHead.some((head: string) => head.includes('main.scss'))
      expect(hasMainScss).toBe(true)
    })

    it('injectHead 应包含颜色 CSS 链接', () => {
      const plugin = defaultTheme(createMinimalOptions())
      const config = plugin.config!({} as any, { isBuild: false } as any) as any
      const hasColorCss = config.injectHead.some((head: string) =>
        head.includes('virtual:vitapress-theme-default-color.css')
      )
      expect(hasColorCss).toBe(true)
    })

    it('injectHead 应包含主题模式脚本', () => {
      const plugin = defaultTheme(createMinimalOptions())
      const config = plugin.config!({} as any, { isBuild: false } as any) as any
      const hasThemeScript = config.injectHead.some((head: string) =>
        head.includes('__THEME_MODE__')
      )
      expect(hasThemeScript).toBe(true)
    })

    it('injectHead 应包含浏览器检测脚本', () => {
      const plugin = defaultTheme(createMinimalOptions())
      const config = plugin.config!({} as any, { isBuild: false } as any) as any
      const hasBrowserScript = config.injectHead.some((head: string) =>
        head.includes('data-browser')
      )
      expect(hasBrowserScript).toBe(true)
    })
  })

  describe('Vite 插件', () => {
    it('应包含名称为 vitapress-theme-default-vite 的 vite 插件', () => {
      const plugin = defaultTheme(createMinimalOptions())
      const config = plugin.config!({} as any, { isBuild: false } as any) as any
      const vitePlugin = config.vite.plugins[0] as any
      expect(vitePlugin.name).toBe('vitapress-theme-default-vite')
    })

    it('resolveId 应识别虚拟 CSS ID', () => {
      const plugin = defaultTheme(createMinimalOptions())
      const config = plugin.config!({} as any, { isBuild: false } as any) as any
      const vitePlugin = config.vite.plugins[0] as any
      const result = vitePlugin.resolveId('virtual:vitapress-theme-default-color.css')
      expect(result).toBe('\0virtual:vitapress-theme-default-color.css')
    })

    it('resolveId 对非虚拟 ID 应返回 null', () => {
      const plugin = defaultTheme(createMinimalOptions())
      const config = plugin.config!({} as any, { isBuild: false } as any) as any
      const vitePlugin = config.vite.plugins[0] as any
      const result = vitePlugin.resolveId('some-other-id')
      expect(result).toBeNull()
    })

    it('load 应返回 CSS 内容', () => {
      const plugin = defaultTheme(createMinimalOptions())
      const config = plugin.config!({} as any, { isBuild: false } as any) as any
      const vitePlugin = config.vite.plugins[0] as any
      const result = vitePlugin.load('\0virtual:vitapress-theme-default-color.css')
      expect(typeof result).toBe('string')
      expect(result.length).toBeGreaterThan(0)
    })

    it('load 对非虚拟 CSS ID 应返回 null', () => {
      const plugin = defaultTheme(createMinimalOptions())
      const config = plugin.config!({} as any, { isBuild: false } as any) as any
      const vitePlugin = config.vite.plugins[0] as any
      const result = vitePlugin.load('some-other-id')
      expect(result).toBeNull()
    })

    it('不同颜色应生成不同的 CSS 内容', () => {
      const plugin1 = defaultTheme(createMinimalOptions({ color: '#3b82f6' }))
      const plugin2 = defaultTheme(createMinimalOptions({ color: '#ef4444' }))
      const config1 = plugin1.config!({} as any, { isBuild: false } as any) as any
      const config2 = plugin2.config!({} as any, { isBuild: false } as any) as any
      const vitePlugin1 = config1.vite.plugins[0] as any
      const vitePlugin2 = config2.vite.plugins[0] as any
      const css1 = vitePlugin1.load('\0virtual:vitapress-theme-default-color.css')
      const css2 = vitePlugin2.load('\0virtual:vitapress-theme-default-color.css')
      expect(css1).not.toBe(css2)
    })
  })

  describe('useContainer 选项', () => {
    it('useContainer 默认为 true 时应包含容器插件', () => {
      const plugin = defaultTheme(createMinimalOptions())
      const config = plugin.config!({} as any, { isBuild: false } as any) as any
      expect(config.plugins.length).toBeGreaterThan(0)
    })

    it('useContainer 为 false 时不应包含容器插件', () => {
      const plugin = defaultTheme(createMinimalOptions({ useContainer: false }))
      const config = plugin.config!({} as any, { isBuild: false } as any) as any
      const hasContainer = config.plugins.some((p: any) => p.name === 'vitapress-plugin-container')
      expect(hasContainer).toBe(false)
    })
  })

  describe('useSearch 选项', () => {
    it('useSearch 为 true 时应包含搜索插件', () => {
      const plugin = defaultTheme(createMinimalOptions({ useSearch: true }))
      const config = plugin.config!({} as any, { isBuild: false } as any) as any
      const hasSearch = config.plugins.some((p: any) => p.name === 'vitapress-plugin-search')
      expect(hasSearch).toBe(true)
    })

    it('useSearch 为 false 时不应包含搜索插件', () => {
      const plugin = defaultTheme(createMinimalOptions({ useSearch: false }))
      const config = plugin.config!({} as any, { isBuild: false } as any) as any
      const hasSearch = config.plugins.some((p: any) => p.name === 'vitapress-plugin-search')
      expect(hasSearch).toBe(false)
    })
  })

  describe('configureServer', () => {
    it('应在开发服务器中间件中响应虚拟 CSS 请求', () => {
      const plugin = defaultTheme(createMinimalOptions())
      const config = plugin.config!({} as any, { isBuild: false } as any) as any
      const vitePlugin = config.vite.plugins[0] as any

      const middleware = vi.fn()
      const server = {
        middlewares: { use: middleware }
      }

      vitePlugin.configureServer(server)

      expect(middleware).toHaveBeenCalledOnce()
      expect(typeof middleware.mock.calls[0]![0]).toBe('function')
    })

    it('中间件应正确处理虚拟 CSS 请求', () => {
      const plugin = defaultTheme(createMinimalOptions())
      const config = plugin.config!({} as any, { isBuild: false } as any) as any
      const vitePlugin = config.vite.plugins[0] as any

      let capturedMiddleware: Function | undefined
      const server = {
        middlewares: {
          use(mw: Function) {
            capturedMiddleware = mw
          }
        }
      }

      vitePlugin.configureServer(server)

      const res = {
        statusCode: 0,
        headers: {} as Record<string, string>,
        setHeader(key: string, value: string) {
          this.headers[key] = value
        },
        end: vi.fn()
      }
      const next = vi.fn()

      capturedMiddleware!(
        { url: '/virtual:vitapress-theme-default-color.css' },
        res,
        next
      )

      expect(res.statusCode).toBe(200)
      expect(res.headers['Content-Type']).toBe('text/css; charset=utf-8')
      expect(res.headers['Cache-Control']).toBe('no-cache')
      expect(res.end).toHaveBeenCalledOnce()
      expect(next).not.toHaveBeenCalled()
    })

    it('中间件应将非虚拟 CSS 请求传递给下一个处理器', () => {
      const plugin = defaultTheme(createMinimalOptions())
      const config = plugin.config!({} as any, { isBuild: false } as any) as any
      const vitePlugin = config.vite.plugins[0] as any

      let capturedMiddleware: Function | undefined
      const server = {
        middlewares: {
          use(mw: Function) {
            capturedMiddleware = mw
          }
        }
      }

      vitePlugin.configureServer(server)

      const res = {}
      const next = vi.fn()

      capturedMiddleware!({ url: '/other-path' }, res, next)

      expect(next).toHaveBeenCalledOnce()
    })
  })
})
