import type { RouteNode } from 'vitarx-router/file-router'
import type { NavEntry, NavGroup, NavItem, NavTree } from '../../types/nav.js'
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
 * 计算指定语言的首页路由路径段
 *
 * 默认语言的 index.md 经 pageParser 解析后 path 为 ''，
 * 非默认语言的 index.{langId}.md 解析后 path 为 'index-{langId.toLowerCase()}'
 *
 * @param lang - 目标语言标识
 * @param defaultLang - 默认语言标识
 * @returns 首页路由的 path 字段值
 */
function resolveIndexPath(lang: string, defaultLang: string): string {
  return lang === defaultLang ? '' : `index-${lang.toLowerCase()}`
}

/**
 * 判断路由节点是否属于指定语言
 *
 * @param node - 路由节点
 * @param lang - 目标语言标识
 */
function isLangOf(node: RouteNode, lang: string): boolean {
  return (node.meta?.['lang'] as string | undefined) === lang
}

/**
 * 从路由子节点中构建指定语言的导航项列表
 *
 * 过滤掉首页、隐藏项、分组节点和非目标语言的页面，
 * 排除当前语言的首页（首页由 NavGroup.path 表示）
 *
 * @param children - 子路由节点
 * @param lang - 目标语言标识
 * @param defaultLang - 默认语言标识
 * @returns 导航项数组
 */
function buildNavItems(
  children: RouteNode[] | undefined,
  lang: string,
  defaultLang: string
): NavItem[] {
  if (!children) return []

  const indexPath = resolveIndexPath(lang, defaultLang)

  return children
    .filter(child => child.path !== indexPath)
    .filter(child => !child.meta?.['navHidden'])
    .filter(child => !child.isGroup)
    .filter(child => isLangOf(child, lang))
    .map(child => ({
      type: 'item' as const,
      path: child.fullPath,
      title: resolveNavTitle(child.meta, child.path),
      tocList: (child.meta?.['tocList'] as TocTree[] | undefined) ?? [],
      order: (child.meta?.['navOrder'] as number | undefined) ?? 0,
      prev: null,
      next: null
    }))
    .sort((a, b) => a.order - b.order)
}

/**
 * 扁平化导航条目列表
 * @param entries - 导航条目数组
 */
function flattenNavEntries(entries: NavEntry[]): NavEntry[] {
  const flattenEntries: NavEntry[] = []
  for (const entry of entries) {
    if (entry.type === 'group') {
      if (entry.path) {
        flattenEntries.push(entry)
      }
      flattenEntries.push(...flattenNavEntries(entry.items))
    } else {
      flattenEntries.push(entry)
    }
  }
  return flattenEntries
}

/**
 * 为导航条目列表中的所有 NavItem 分配跨分组的分页信息
 *
 * 将所有 NavItem（含分组内和独立项）扁平化为线性序列，
 * 按顺序串联 prev/next，实现跨分组的连续翻页
 *
 * @param entries - 导航条目数组
 */
function assignPagination(entries: NavEntry[]): void {
  const flatItems: NavEntry[] = flattenNavEntries(entries)

  for (let i = 0; i < flatItems.length; i++) {
    const item = flatItems[i]!
    if (i > 0) {
      const prevItem = flatItems[i - 1]!
      item.prev = { title: prevItem.title, path: prevItem.path! }
    }
    if (i < flatItems.length - 1) {
      const nextItem = flatItems[i + 1]!
      item.next = { title: nextItem.title, path: nextItem.path! }
    }
  }
}

/**
 * 从文档路由树中提取指定语言的导航条目
 *
 * 遍历 docs 分组的直接子节点：
 * - isGroup: true → 生成 NavGroup（按语言过滤子项，按语言查找首页）
 * - isGroup: false → 生成 NavItem（仅包含目标语言的独立页面）
 *
 * @param docGroupChildren - docs 分组的子路由节点
 * @param lang - 目标语言标识
 * @param defaultLang - 默认语言标识
 * @returns 导航条目数组
 */
function extractNavEntries(
  docGroupChildren: RouteNode[],
  lang: string,
  defaultLang: string
): NavEntry[] {
  const entries: NavEntry[] = []
  const indexPath = resolveIndexPath(lang, defaultLang)

  for (const child of docGroupChildren) {
    if (child.meta?.['navHidden']) continue

    if (child.isGroup) {
      const indexChild = child.children?.find(c => c.path === indexPath && isLangOf(c, lang))
      const title = child.meta?.['navTitle']
        ? child.meta['navTitle']
        : resolveNavTitle(indexChild?.meta, child.path)
      const hasIndex = !!indexChild && !indexChild.meta?.['navHidden']

      const group: NavGroup = {
        type: 'group',
        title,
        ...(hasIndex ? { path: child.fullPath } : {}),
        order: (child.meta?.['navOrder'] as number | undefined) ?? 0,
        items: buildNavItems(child.children, lang, defaultLang),
        prev: null,
        next: null
      }

      if (group.items.length > 0 || hasIndex) {
        entries.push(group)
      }
    } else {
      if (!isLangOf(child, lang)) continue

      entries.push({
        type: 'item',
        path: child.fullPath,
        title: resolveNavTitle(child.meta, child.path),
        tocList: (child.meta?.['tocList'] as TocTree[] | undefined) ?? [],
        order: (child.meta?.['navOrder'] as number | undefined) ?? 0,
        prev: null,
        next: null
      })
    }
  }

  entries.sort((a, b) => a.order - b.order)
  assignPagination(entries)
  return entries
}

/**
 * 从路由树构建导航树
 *
 * 遍历所有配置的语言，对每个语言从文档分组中提取对应的导航条目，
 * 生成按语言和文档目录分组的导航树
 *
 * @param routes - 路由节点数组
 * @param docDirs - 文档目录的绝对路径
 * @param defaultLang - 默认语言标识
 * @param langs - 所有语言标识列表
 * @returns 按语言和文档目录分组的导航树
 */
export function buildNavTree(
  routes: RouteNode[],
  docDirs: Set<string>,
  defaultLang: string,
  langs: string[]
): NavTree {
  const tree: NavTree = {}

  for (const lang of langs) {
    const docNavTree: Record<string, NavEntry[]> = {}
    for (const route of routes) {
      if (!route.isGroup) continue
      if (!docDirs.has(route.filePath)) continue
      const entries = extractNavEntries(route.children ?? [], lang, defaultLang)
      if (entries.length > 0) {
        docNavTree[route.fullPath] = entries
      }
    }
    if (Object.keys(docNavTree).length > 0) {
      tree[lang] = docNavTree
    }
  }

  return tree
}
