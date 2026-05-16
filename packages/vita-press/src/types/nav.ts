import type { TocTree } from '../server/markdown/plugins/tocTree.js'

export type { TocTree }

/**
 * 精简的页面信息
 *
 * @property {string} title - 标题
 * @property {string} path - 路径，用于导航
 */
export interface PageInfo {
  title: string
  path: string
}

/**
 * 分页信息
 *
 * @property {PageInfo | null} prev - 上一页
 * @property {PageInfo | null} next - 下一页
 */
export interface Pagination {
  prev: PageInfo | null
  next: PageInfo | null
}

/**
 * 导航项 - 对应一个可导航的文档页面，继承分页信息
 */
export interface NavItem {
  type: 'item'
  /** 路由路径 */
  path: string
  /** 导航标题 */
  title: string
  /** 排序权重，数值越小越靠前 */
  order: number
}

/**
 * 导航分组 - 对应一个文档分类目录
 */
export interface NavGroup {
  type: 'group'
  /** 分组标题 */
  title: string
  /** 分组路径（有 index 页面时存在，可点击跳转） */
  path?: string
  /** 排序权重，数值越小越靠前 */
  order: number
  /** 分组内导航项（不含 index） */
  items: NavItem[]
}

/**
 * 导航条目 - 分组或独立项
 */
export type NavEntry = NavGroup | NavItem

/**
 * 导航树 - 按语言和文档目录path分组
 *
 * `record<语言, record<文档目录路由path, 导航条目[]>>`
 */
export type NavTree = Record<string, Record<string, NavEntry[]>>
