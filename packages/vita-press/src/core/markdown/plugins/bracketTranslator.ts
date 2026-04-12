import MarkdownIt from 'markdown-it'

const ESCAPE_MAP: Record<string, string> = {
  '{': '&#123;',
  '}': '&#125;',
  '`': '&#96;',
  '<': '&lt;',
  '>': '&gt;'
}

const ESCAPE_PATTERN = /[{}<>`]/g

/**
 * 转义文本中的特殊字符为 HTML 实体
 *
 * @param content - 原始文本内容
 * @returns 转义后的内容
 */
function escapeSpecialChars(content: string): string {
  return content.replace(ESCAPE_PATTERN, char => ESCAPE_MAP[char] || char)
}

/**
 * 转译符号为 HTML 实体
 *
 * @param md - MarkdownIt 实例
 */
export function bracketTranslator(md: MarkdownIt): void {
  const originalText = md.renderer.rules.text

  md.renderer.rules.text = function (tokens, idx, options, env, slf): string {
    const token = tokens[idx]
    if (!token) return ''

    let content = originalText ? originalText(tokens, idx, options, env, slf) : token.content

    return escapeSpecialChars(content)
  }
}
