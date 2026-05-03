/**
 * 判断是否为外部链接
 *
 * @param href - 链接地址
 * @returns 是否为外部链接
 */
export function isExternalLink(href: string): boolean {
  return href.startsWith('http://') || href.startsWith('https://') || href.startsWith('//')
}
