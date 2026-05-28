import MarkdownIt from 'markdown-it'
import { isExternalLink } from '../utils/index.js'

/**
 * 将 `<a>` 标签替换为 `<RouterLink>`
 * RouterLink 支持内部路由和外部链接，同时支持所有 a 标签属性
 *
 * @param md - MarkdownIt 实例
 */
export function routerLink(md: MarkdownIt): void {
  md.renderer.rules['link_open'] = function (tokens, idx, options, _env, slf) {
    const token = tokens[idx]
    if (!token) return slf.renderToken(tokens, idx, options)

    token.attrPush(['class', 'link'])
    const hrefIndex = token.attrIndex('href')

    if (hrefIndex >= 0) {
      const href = token.attrGet('href') || ''

      token.attrs![hrefIndex]![0] = 'to'
      token.tag = 'RouterLink'

      if (isExternalLink(href)) {
        token.attrPush(['target', '_blank'])
        token.attrPush(['rel', 'noopener noreferrer'])
        const classIndex = token.attrIndex('class')
        if (classIndex >= 0) {
          token.attrs![classIndex]![1] = 'link external'
        }
      }
    }

    return slf.renderToken(tokens, idx, options)
  }

  md.renderer.rules['link_close'] = function (tokens, idx, options, _env, slf) {
    const token = tokens[idx]
    if (!token) return ''

    token.tag = 'RouterLink'
    return slf.renderToken(tokens, idx, options)
  }
}
