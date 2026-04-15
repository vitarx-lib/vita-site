import { existsSync } from 'node:fs'
import { debug, FileRouter, type PageDirOptions, warn } from 'vitarx-router/file-router'
import type { MdParser } from '../markdown/index.js'

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
  docDir: PageDirOptions
  /**
   * 布局文件绝对路径
   */
  layout?: string
  /**
   * 页面目录配置
   */
  pageDirs: PageDirOptions[]
  /**
   * 是否生成类型定义文件
   */
  dts?: string | boolean
  /**
   * Markdown 解析器实例
   */
  mdParser: MdParser
}

/**
 * 路由器
 *
 * 继承自 FileRouter，负责扫描文档目录和页面目录，生成路由配置
 */
export class VitaPressServerRouter extends FileRouter {
  constructor(options: RouterOptions) {
    super({
      root: options.root,
      pages: [options.docDir, ...options.pageDirs],
      importMode: 'lazy',
      pathStrategy: 'kebab',
      dts: options.dts || false,
      transform: (content: string, file: string) => {
        if (file.endsWith('.md')) {
          return options.mdParser.parse(file, content).content
        }
        return content
      }
    })
    try {
      if (options.layout && existsSync(options.layout)) {
        const docsNode = this.fileMap.get(options.docDir.dir)
        if (docsNode) {
          if (!docsNode.components) {
            docsNode.components = { default: options.layout }
          } else {
            debug('文档目录下已经存在布局文件，将覆盖主题布局')
          }
        }
      }
    } catch (e) {
      warn('应用文档布局失败', String(e))
    }
  }
}
