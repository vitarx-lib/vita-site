import type { TocTree } from '../server/markdown/plugins/tocTree.js'
import type { GitCommitInfo } from '../server/markdown/utils/index.js'
import type { SiteOptions } from './config.js'
import type { Pagination } from './nav.js'

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
   * 导航标题
   *
   * 显示在侧边栏/导航栏中的标题，缺省取 title 或从路径推断。
   */
  navTitle?: string
  /**
   * 导航排序权重
   *
   * 数值越小越靠前。
   *
   * @default 0
   */
  navOrder?: number
  /**
   * 是否在导航中隐藏
   *
   * @default false
   */
  navHidden?: boolean
  /**
   * 段落目录列表
   */
  tocList: TocTree[]
  /**
   * 相对于项目根目录的文件路径
   */
  relativePath: string
  /**
   * 分页信息
   */
  pagination: Pagination
}
