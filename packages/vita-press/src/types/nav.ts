import type { TocTree } from '../server/markdown/plugins/tocTree.js'

export type { TocTree }

/**
 * 导航项 - 对应一个可导航的文档页面
 */
export interface NavItem {
  type: 'item'
  /** 路由路径 */
  path: string
  /** 导航标题 */
  title: string
  /** 页面目录树 */
  tocList: TocTree[]
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
 * 导航树 - 按语言分组
 */
export type NavTree = Record<string, NavEntry[]>
