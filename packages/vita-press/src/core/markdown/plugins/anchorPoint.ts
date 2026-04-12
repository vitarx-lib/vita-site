import type MarkdownIt from 'markdown-it'

/**
 * 锚点解析插件
 *
 * @param md
 */
export function anchorPoint(md: MarkdownIt): void {
  // 标题标签开始
  md.renderer.rules['heading_open'] = (tokens, idx, options, _env, self) => {
    const token = tokens[idx]
    if (!token) return ''

    const tag = self.renderToken(tokens, idx, options)
    return `${tag}\n<a href="#${token.attrGet('id')}">`
  }
  // 标题标签结束
  md.renderer.rules['heading_close'] = (tokens, idx, _options, _env, _self) => {
    const token = tokens[idx]
    if (!token) return ''
    return `</a></${token.tag}>\n`
  }
}
