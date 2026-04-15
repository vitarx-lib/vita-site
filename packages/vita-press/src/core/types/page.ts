import type { TocTree } from '../markdown/plugins/tocTree.js'
import type { GitCommitInfo } from '../markdown/utils/index.js'
import type { SiteOptions } from './config.js'

/**
 * 页面元数据
 */
export interface PageMetaData extends SiteOptions {
  lang: string
  [key: string]: any
}

/**
 * 文档页面数据
 */
export interface DocPageMetaData extends GitCommitInfo, PageMetaData {
  /**
   * 段落目录列表
   */
  tocList: TocTree[]
  /**
   * 相对于项目根目录的文件路径
   */
  relativePath: string
}
