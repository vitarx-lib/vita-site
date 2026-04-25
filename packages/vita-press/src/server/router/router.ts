import path from 'node:path'
import { FileRouter, warn } from 'vitarx-router/file-router'
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
          const cachePath = app.mdParser.cache.getCacheFilePath(
            path.relative(app.root, filePath),
            'jsx'
          )
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
      extendRoute: (route, parsed) => {
        const lang = app.langPathMap[parsed.filePath] || app.defaultLang
        route.meta ??= {}
        route.meta['lang'] = typeof route.meta['lang'] === 'string' ? route.meta['lang'] : lang
        for (const plugin of app.plugins) {
          if (typeof plugin.extendRoute === 'function') {
            try {
              plugin.extendRoute(route, parsed, app)
            } catch (e) {
              warn(`Plugin ${plugin.name} extendRoute error:`, e)
            }
          }
        }
      }
    })
  }
}
