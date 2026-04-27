import type { TocTree } from '../markdown/plugins/tocTree.js'
import type { GitCommitInfo } from '../markdown/utils/index.js'
import type { SiteOptions } from './config.js'

/**
 * 页面元数据
 */
export interface PageMetaData extends SiteOptions {
  /**
   * 网站语言
   *
   * 文档或页面中通过配置定义的lang优先级高于此配置，
   *
   * @default 'zh-CN'
   */
  lang?: string
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
