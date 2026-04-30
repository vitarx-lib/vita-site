import { relative } from 'node:path'
import { FileRouter, type PageParseResult, warn } from 'vitarx-router/file-router'
import { VitaPressApp } from '../app/index.js'
import type { NavTree } from '../types/nav.js'
import { buildNavTree } from './nav.js'

/**
 * 路由器
 *
 * 继承自 FileRouter，负责扫描文档目录和页面目录，生成路由配置
 */
export class VitaPressRouter extends FileRouter {
  private _navTree: NavTree | null = null

  /**
   * 获取导航树
   *
   * 在 generate() 调用后可用，返回按语言分组的导航数据。
   */
  get navTree(): NavTree | null {
    return this._navTree
  }

  constructor(app: VitaPressApp) {
    super({
      root: app.root,
      pages: [app.config.docDir, ...app.config.pageDirs],
      injectImports: [
        `import { lazy } from "vitarx"`,
        `import __runtimeConfig from "virtual:vitapress/runtime/config"`
      ],
      importMode: ({ importPath, filePath }) => {
        if (filePath.endsWith('.md')) {
          const cachePath = app.mdParser.cache.getCacheFilePath(relative(app.root, filePath), 'jsx')
          return `lazy(() => import("${cachePath}"), __runtimeConfig.lazy)`
        }
        return `lazy(() => import(${importPath}), __runtimeConfig.lazy)`
      },
      pathStrategy: 'kebab',
      dts: app.config.dts || false,
      transform: (content: string, file: string) => {
        if (file.endsWith('.md')) {
          return app.mdParser.parse(file, content)
        }
        return content
      },
      pageParser: basename => {
        const [path, viewName] = basename.split('@', 2) as [string, string]
        const result: PageParseResult = { path, viewName }
        let lang: string = app.lang

        if (path.includes('.')) {
          const parts = path.split('.')
          const lastPart = parts.pop()!

          if (app.langs.includes(lastPart)) {
            lang = lastPart
            result.path = parts.join('-') + '-' + lastPart
          } else {
            result.path = path.replace(/\./g, '-')
          }
        }

        result.options = {
          meta: { lang }
        }
        return result
      },
      extendRoute: route => {
        for (const plugin of app.plugins) {
          if (typeof plugin.extendRoute === 'function') {
            try {
              plugin.extendRoute(route, app)
            } catch (e) {
              warn(`Plugin ${plugin.name} extendRoute error:`, e)
            }
          }
        }
      },
      beforeWriteRoutes: routes => {
        for (const plugin of app.plugins) {
          if (typeof plugin.beforeWriteRoutes === 'function') {
            try {
              const result = plugin.beforeWriteRoutes(routes, app)
              if (Array.isArray(result)) routes = result
            } catch (e) {
              warn(`Plugin ${plugin.name} beforeWriteRoutes error:`, e)
            }
          }
        }
        this._navTree = buildNavTree(routes, app.docDirPath, app.lang)
        return routes
      }
    })
  }
}
