import type { RouteNode } from 'vitarx-router/file-router'
import type { NavEntry, NavGroup, NavItem, NavTree } from '../types/nav.js'
import type { TocTree } from '../markdown/plugins/tocTree.js'

/**
 * 从路由路径推断标题
 *
 * 取路径最后一段，首字母大写，连字符替换为空格
 *
 * @param path - 路由路径段
 * @returns 推断的标题
 */
function inferTitleFromPath(path: string): string {
  const segment = path.split('/').pop() || path
  return segment.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}

/**
 * 从路由元数据中提取导航标题
 *
 * 优先级：navTitle > title > 路径推断
 *
 * @param meta - 路由元数据
 * @param fallbackPath - 回退推断用的路径
 * @returns 导航标题
 */
function resolveNavTitle(meta: Record<string, any> | undefined, fallbackPath: string): string {
  if (meta?.['navTitle']) return meta['navTitle']
  if (meta?.['title']) return meta['title']
  return inferTitleFromPath(fallbackPath)
}

/**
 * 从路由子节点中构建导航项列表
 *
 * @param children - 子路由节点
 * @returns 导航项数组
 */
function buildNavItems(children: RouteNode[] | undefined): NavItem[] {
  if (!children) return []

  return children
    .filter(child => child.path !== '')
    .filter(child => !child.meta?.['navHidden'])
    .filter(child => !child.isGroup)
    .map(child => ({
      type: 'item' as const,
      path: child.fullPath,
      title: resolveNavTitle(child.meta, child.path),
      tocList: (child.meta?.['tocList'] as TocTree[] | undefined) ?? [],
      order: (child.meta?.['navOrder'] as number | undefined) ?? 0
    }))
    .sort((a, b) => a.order - b.order)
}

/**
 * 从文档路由树中提取导航条目
 *
 * 遍历 docs 分组的直接子节点：
 * - isGroup: true → 生成 NavGroup
 * - isGroup: false → 生成 NavItem（独立页面）
 *
 * @param docGroupChildren - docs 分组的子路由节点
 * @returns 导航条目数组
 */
function extractNavEntries(docGroupChildren: RouteNode[]): NavEntry[] {
  const entries: NavEntry[] = []

  for (const child of docGroupChildren) {
    if (child.meta?.['navHidden']) continue

    if (child.isGroup) {
      const indexChild = child.children?.find(c => c.path === '')
      const title = child.meta?.['navTitle']
        ? child.meta['navTitle']
        : resolveNavTitle(indexChild?.meta, child.path)
      const hasIndex = !!indexChild && !indexChild.meta?.['navHidden']

      const group: NavGroup = {
        type: 'group',
        title,
        ...(hasIndex ? { path: child.fullPath } : {}),
        order: (child.meta?.['navOrder'] as number | undefined) ?? 0,
        items: buildNavItems(child.children)
      }

      if (group.items.length > 0 || hasIndex) {
        entries.push(group)
      }
    } else {
      entries.push({
        type: 'item',
        path: child.fullPath,
        title: resolveNavTitle(child.meta, child.path),
        tocList: (child.meta?.['tocList'] as TocTree[] | undefined) ?? [],
        order: (child.meta?.['navOrder'] as number | undefined) ?? 0
      })
    }
  }

  return entries.sort((a, b) => a.order - b.order)
}

/**
 * 从路由树构建导航树
 *
 * @param routes - 路由节点数组
 * @param docDirPath - 文档目录的绝对路径
 * @param defaultLang - 默认语言标识
 * @returns 按语言分组的导航树
 */
export function buildNavTree(
  routes: RouteNode[],
  docDirPath: string,
  defaultLang: string
): NavTree {
  const tree: NavTree = {}

  for (const route of routes) {
    if (!route.filePath.startsWith(docDirPath)) continue
    if (!route.isGroup) continue

    const lang = (route.meta?.['lang'] as string | undefined) ?? defaultLang

    const entries = extractNavEntries(route.children ?? [])
    if (entries.length > 0) {
      tree[lang] = entries
    }
  }

  return tree
}
