import { containerPlugin } from '@vitapress/plugin-container'
import searchPlugin from '@vitapress/plugin-search'
import { type AnyColor, createScheme, generateCSS, type SchemeOptions } from '@zmaui/color'
import { existsSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import type { VitaPressPlugin } from 'vitapress'
import { defineConfig } from 'vitapress/server'
import type { SiteData, SiteOptions } from './types.js'

export interface DefaultThemeOptions extends SiteOptions {
  /**
   * 主题的颜色
   */
  color: AnyColor
  /**
   * 配色方案选项
   */
  schemeOptions?: SchemeOptions
  /**
   * 是否启用容器插件
   *
   * @default true
   */
  useContainer?: boolean
}

const __dirname = dirname(fileURLToPath(import.meta.url))
const VIRTUAL_CSS_ID = 'virtual:vitapress-theme-default-color.css'
const RESOLVED_VIRTUAL_CSS_ID = '\0' + VIRTUAL_CSS_ID
// 客户端配置路径，兼容本地调试使用config.ts
const CLIENT_CONFIG_PATH = existsSync(resolve(__dirname, 'config.js'))
  ? resolve(__dirname, 'config.js')
  : resolve(__dirname, 'config.ts')

// 文档布局路径，兼容本地调试使用layout/DocLayout.tsx
const DOC_LAYOUT_PATH = existsSync(resolve(__dirname, 'layouts/DocLayout.jsx'))
  ? resolve(__dirname, 'layouts/DocLayout.jsx')
  : resolve(__dirname, 'layouts/DocLayout.tsx')

// 首页布局路径，兼容本地调试使用layout/Home.tsx
const HOME_PATH = existsSync(resolve(__dirname, 'pages/Home.jsx'))
  ? resolve(__dirname, 'pages/Home.jsx')
  : resolve(__dirname, 'pages/Home.tsx')

/**
 * 默认主题插件
 *
 * @param options
 */
export function defaultTheme(options: DefaultThemeOptions): VitaPressPlugin {
  const { color, schemeOptions, useContainer = true } = options
  const scheme = createScheme(color, schemeOptions).schemes
  const colorCssContent = generateCSS(scheme, 'data-theme').join('\n')
  const siteData: SiteData = {
    title: options.title,
    edit: options.edit || null,
    logo: options.logo || null,
    libLink: options.libLink || null,
    footer: options.footer || null,
    hero: options.hero || null,
    features: options.features || [],
    navLinks: options.navLinks || [],
    useSearch: options.useSearch ?? true
  }

  return {
    name: 'vitapress-theme-default',
    clientConfig: CLIENT_CONFIG_PATH,
    siteData, // 将客户端需要的配置数据注入到客户端
    config(_config, env) {
      const plugins = []
      if (useContainer) {
        plugins.push(containerPlugin())
      }
      if (siteData.useSearch) {
        plugins.push(searchPlugin())
      }
      return defineConfig({
        plugins,
        homeFile: HOME_PATH,
        docLayoutFile: DOC_LAYOUT_PATH,
        injectHead: [
          `<link rel="stylesheet" href="${resolve(__dirname, 'assets/styles/main.scss')}">`,
          `<link rel="stylesheet" href="${env.isBuild ? VIRTUAL_CSS_ID : `/${VIRTUAL_CSS_ID}`}">`,
          `<script>document.documentElement.setAttribute('data-theme',((t=localStorage.getItem('__THEME_MODE__')||'system')==='system'?window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light':t==='light'?'light':'dark'))</script>`,
          `<script>document.documentElement.setAttribute('data-browser', navigator.userAgent.indexOf('Firefox') > -1 ? 'not-webkit' : 'webkit');</script>`
        ],
        vite: {
          plugins: [
            {
              name: 'vitapress-theme-default-vite',
              resolveId(id) {
                if (id === VIRTUAL_CSS_ID) {
                  return RESOLVED_VIRTUAL_CSS_ID
                }
                return null
              },
              load(id) {
                if (id === RESOLVED_VIRTUAL_CSS_ID) {
                  return colorCssContent
                }
                return null
              },
              configureServer(server) {
                server.middlewares.use((req, res, next) => {
                  if (req.url === `/${VIRTUAL_CSS_ID}`) {
                    res.statusCode = 200
                    res.setHeader('Content-Type', 'text/css; charset=utf-8')
                    res.setHeader('Cache-Control', 'no-cache')
                    res.end(colorCssContent)
                  } else {
                    next()
                  }
                })
              }
            }
          ]
        }
      })
    }
  }
}
