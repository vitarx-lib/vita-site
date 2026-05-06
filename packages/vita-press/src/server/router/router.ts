import { existsSync } from 'node:fs'
import { relative } from 'node:path'
import { FileRouter, findRoute, type PageParseResult } from 'vitarx-router/file-router'
import type { NavTree } from '../../types/nav.js'
import type { VitaPressApp } from '../app/index.js'
import { invokeParallel, invokePipe } from '../common/hooks.js'
import { buildNavTree } from './nav.js'

/**
 * 路由器
 *
 * 继承自 FileRouter，负责扫描文档目录和页面目录，生成路由配置
 */
export class VitaPressRouter extends FileRouter {
  private _navTree: NavTree | null = null
  private layoutComponentPath: string | null = null
  private homeComponentPath: string | null = null
  /**
   * 获取导航树
   *
   * 在 generate() 调用后可用，返回按语言分组的导航数据。
   */
  get navTree(): NavTree | null {
    return this._navTree
  }

  constructor(app: VitaPressApp) {
    super(
      {
        root: app.root,
        pages: [{ ...app.config.docDir, group: true }, ...app.config.pageDirs],
        injectImports: [
          `import { lazy } from "vitarx"`,
          `import __runtimeConfig from "virtual:vitapress/runtime/config"`
        ],
        importMode: ({ importPath, filePath }) => {
          if (filePath.endsWith('.md')) {
            const cachePath = app.mdParser.cache.getCacheFilePath(
              relative(app.root, filePath),
              'jsx'
            )
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
          invokeParallel(app.plugins, 'extendRoute', route, app)
        },
        beforeWriteRoutes: routes => {
          if (this.layoutComponentPath) {
            const docsRoute = routes.find(route => route.filePath === app.docDirPath)
            if (docsRoute) {
              if (!docsRoute.component) {
                docsRoute.component = {
                  default: this.layoutComponentPath
                }
              } else if (!docsRoute.component['default']) {
                docsRoute.component['default'] = this.layoutComponentPath
              }
            }
          }
          if (this.homeComponentPath) {
            for (const langId of app.langs) {
              const langSegment = langId.toLowerCase()
              const langPath = langId === app.lang ? '/' : `/index-${langSegment}`
              if (!findRoute(routes, langPath)) {
                routes.push({
                  filePath: this.homeComponentPath,
                  fullPath: langPath,
                  isGroup: false,
                  path: `index-${langSegment}`,
                  component: {
                    default: this.homeComponentPath
                  },
                  meta: { lang: langId }
                })
              }
            }
          }
          const result = invokePipe(app.plugins, 'beforeWriteRoutes', routes, app)
          this._navTree = buildNavTree(result, app.docDirPath, app.lang)
          return result
        }
      },
      false
    )
    // 添加文档布局组件路径
    if (app.config.docLayoutFile && existsSync(app.config.docLayoutFile)) {
      this.layoutComponentPath = app.config.docLayoutFile
    }
    if (app.config.homeFile && existsSync(app.config.homeFile)) {
      this.homeComponentPath = app.config.homeFile
    }
  }
}
