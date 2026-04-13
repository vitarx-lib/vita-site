import path from 'node:path'
import type { FileRouterOptions, PageSource } from 'vitarx-router/file-router'
import { FileRouter } from 'vitarx-router/file-router'
import type { Language } from '../types/config.js'

/**
 * 路由器配置选项
 */
export interface RouterOptions {
  /**
   * 项目根目录
   */
  root: string
  /**
   * 文档目录
   */
  docDir: string
  /**
   * 语言配置
   */
  languages?: Language[]
  /**
   * 页面目录配置
   */
  pageDirs?: PageSource | PageSource[]
  /**
   * 是否生成类型定义文件
   */
  dts?: FileRouterOptions['dts']
}

/**
 * 路由器
 *
 * 继承自 FileRouter，负责扫描文档目录和页面目录，生成路由配置
 */
export class Router extends FileRouter {
  constructor(options: RouterOptions) {
    const pages = Router.resolvePageSources(options)

    super({
      root: options.root,
      pages,
      importMode: 'lazy',
      pathStrategy: 'kebab',
      dts: options.dts || false
    })
  }

  /**
   * 解析页面源配置
   *
   * 根据是否配置多语言，生成不同的 PageSource 配置
   */
  private static resolvePageSources(options: RouterOptions): PageSource[] {
    const sources: PageSource[] = []
    const include = ['**/*.{jsx,tsx,md}']

    if (options.languages && options.languages.length > 0) {
      for (const lang of options.languages) {
        sources.push({
          dir: path.resolve(options.root, options.docDir),
          prefix: `/${lang.id}`,
          group: true,
          include
        })
      }
    }

    if (options.pageDirs) {
      if (Array.isArray(options.pageDirs)) {
        sources.push(...options.pageDirs)
      } else {
        sources.push(options.pageDirs)
      }
    }

    return sources
  }
}
