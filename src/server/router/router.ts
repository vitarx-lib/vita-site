import { existsSync } from 'node:fs'
import { relative, resolve } from 'node:path'
import { FileRouter, findRoute, type PageParseResult } from 'vitarx-router/file-router'
import type { NavTree } from '../../types/nav.js'
import type { VitaSiteApp } from '../app/index.js'
import { invokeParallel, invokePipe } from '../common/hooks.js'
import { buildNavTree } from './nav.js'

const ORDER_PREFIX_RE = /^(\d+)\.(.+)$/

interface OrderParseResult {
  name: string
  order: number
}

/**
 * 解析名称中的数字排序前缀
 *
 * @param name - 待解析的目录名或文件名
 * @returns 解析结果，包含去除前缀后的名称和排序值
 */
function parseOrderPrefix(name: string): OrderParseResult {
  const match = name.match(ORDER_PREFIX_RE)
  if (match) {
    return { name: match[2]!, order: Number(match[1]) }
  }
  return { name, order: 0 }
}

/**
 * 路由器
 *
 * 继承自 FileRouter，负责扫描文档目录和页面目录，生成路由配置
 */
export class VitaSiteRouter extends FileRouter {
  /**
   * 文档入口路径集合
   */
  public readonly docEnters: Set<string>
  private _navTree: NavTree | null = null
  private readonly layoutComponentPath: string | null = null
  private readonly homeComponentPath: string | null = null
  /**
   * 获取导航树
   *
   * 在 generate() 调用后可用，返回按语言分组的导航数据。
   */
  get navTree(): NavTree | null {
    return this._navTree
  }

  constructor(app: VitaSiteApp) {
    const docEnters = new Set<string>()
    const docLayout = new Map<string, string>()
    const docDirs = app.config.docDirs.map(docDir => {
      const { layout, ...rest } = docDir
      const absDir = resolve(app.root, rest.dir)
      docEnters.add(absDir)
      if (layout && existsSync(layout)) {
        docLayout.set(absDir, layout)
      }
      return {
        ...rest,
        group: true
      }
    })
    super(
      {
        root: app.root,
        pages: [...docDirs, ...app.config.pageDirs],
        injectImports: [
          `import { lazy } from "vitarx"`,
          `import __runtimeConfig from "virtual:vita-site/runtime/config"`
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
        groupParser: dirName => {
          const { name, order } = parseOrderPrefix(dirName)
          return {
            path: name,
            options: { meta: { order } }
          }
        },
        pageParser: basename => {
          const { name, order } = parseOrderPrefix(basename)
          const [path, viewName] = name.split('@', 2) as [string, string]
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
            meta: { lang, order }
          }
          return result
        },
        extendRoute: route => {
          invokeParallel(app.plugins, 'extendRoute', route, app)
        },
        beforeWriteRoutes: routes => {
          if (this.layoutComponentPath) {
            for (const route of routes) {
              if (!docEnters.has(route.filePath)) continue
              const layout = docLayout.get(route.filePath) || this.layoutComponentPath
              if (layout && !route.component) {
                route.component = {
                  default: layout
                }
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
                  path: langPath,
                  component: {
                    default: this.homeComponentPath
                  },
                  meta: { lang: langId }
                })
              }
            }
          }
          const result = invokePipe(app.plugins, 'beforeWriteRoutes', routes, app)
          this._navTree = buildNavTree(result, docEnters, app.lang, app.langs)
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
    this.docEnters = docEnters
  }
}
