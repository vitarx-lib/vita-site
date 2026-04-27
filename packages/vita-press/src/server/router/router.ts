import { relative } from 'node:path'
import { FileRouter, type PageParseResult, warn } from 'vitarx-router/file-router'
import { VitaPressApp } from '../app/index.js'

/**
 * 路由器
 *
 * 继承自 FileRouter，负责扫描文档目录和页面目录，生成路由配置
 */
export class VitaPressRouter extends FileRouter {
  constructor(app: VitaPressApp) {
    super({
      root: app.root,
      pages: [app.config.docDir, ...app.config.pageDirs],
      injectImports: [`import { lazy } from "vitarx"`],
      importMode: ({ importPath, filePath }) => {
        if (filePath.endsWith('.md')) {
          const cachePath = app.mdParser.cache.getCacheFilePath(relative(app.root, filePath), 'jsx')
          return `lazy(() => import("${cachePath}"))`
        }
        return `lazy(() => import(${importPath}))`
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
      }
    })
  }
}
