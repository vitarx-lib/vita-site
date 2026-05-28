import type MarkdownIt from 'markdown-it'
import path from 'node:path'
import type { MarkdownParseEnvContext } from '../../../types/index.js'
import { isExternalLink } from '../utils/index.js'

/**
 * 判断是否为特殊协议链接（mailto、tel 等）
 *
 * @param href - 链接地址
 * @returns 是否为特殊协议链接
 */
function isSpecialProtocol(href: string): boolean {
  return /^(mailto:|tel:|javascript:|data:)/i.test(href)
}

/**
 * 分离链接中的路径和哈希部分
 *
 * @param href - 原始链接地址
 * @returns 路径和哈希部分
 *
 * @example
 * splitHref('./page.md#section') // { pathname: './page.md', hash: '#section' }
 * splitHref('./page.md')         // { pathname: './page.md', hash: '' }
 * splitHref('#section')          // { pathname: '', hash: '#section' }
 */
function splitHref(href: string): { pathname: string; hash: string } {
  const hashIndex = href.indexOf('#')
  if (hashIndex === -1) {
    return { pathname: href, hash: '' }
  }
  return {
    pathname: href.slice(0, hashIndex),
    hash: href.slice(hashIndex)
  }
}

/**
 * 链接路径解析插件
 *
 * 功能：
 * - 将 Markdown 中的内部链接解析为路由路径
 * - 通过 env.app.router.getRouteFullPath() 获取运行时可跳转的地址
 * - 如果返回 null，则保留原始链接
 *
 * 处理流程：
 * 1. 遍历所有 link_open token
 * 2. 跳过外部链接、锚点链接和特殊协议链接
 * 3. 将相对路径解析为绝对文件路径
 * 4. 调用 router.getRouteFullPath() 获取路由路径
 * 5. 成功时替换 href 为路由路径（保留哈希部分）
 * 6. 失败时保留原始 href
 *
 * @param md - MarkdownIt 实例
 */
export function linkResolver(md: MarkdownIt): void {
  md.core.ruler.push('link-resolver', state => {
    const env = state.env as MarkdownParseEnvContext
    if (!env?.app?.router || !env.filePath) return

    const { router } = env.app
    const currentFilePath = env.filePath

    for (const token of state.tokens) {
      if (token.type !== 'inline' || !token.children) continue

      for (const child of token.children) {
        if (child.type !== 'link_open') continue

        const href = child.attrGet('href')
        if (!href) continue

        if (isExternalLink(href) || isSpecialProtocol(href)) continue

        const { pathname, hash } = splitHref(href)

        if (!pathname) continue

        const resolvedFilePath = path.resolve(path.dirname(currentFilePath), pathname)

        const routePath = router.getRouteFullPath(resolvedFilePath)
        if (routePath !== null) {
          child.attrSet('href', routePath + hash)
        }
      }
    }
  })
}
