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
      importMode: 'lazy',
      pathStrategy: 'kebab',
      dts: app.config.dts || false,
      transform: (content: string, file: string) => {
        if (file.endsWith('.md')) {
          return app.mdParser.parse(file, content).content
        }
        return content
      },
      extendRoute: (route, parsed) => {
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
