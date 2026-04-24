import type MarkdownIt from 'markdown-it'
import type Token from 'markdown-it/lib/token.mjs'

export interface TitleEnv {
  title?: string
}

/**
 * 提取 H1 标题并赋值给 env.title
 *
 * 功能：
 * - 当 env.title 不为字符串时，提取文档中第一个 H1 标题内容
 * - 将提取的内容赋值给 env.title
 *
 * @param md - Markdown-it 实例
 */
export function extractTitle(md: MarkdownIt): void {
  md.core.ruler.push('extract-title', state => {
    const env = state.env as TitleEnv

    if (typeof env.title === 'string') {
      return
    }

    const h1Content = findFirstH1Content(state.tokens)
    if (h1Content) {
      env.title = h1Content
    }
  })
}

/**
 * 查找第一个 H1 标题的内容
 *
 * @param tokens - Markdown-it 解析后的 token 数组
 * @returns H1 标题内容，未找到时返回 null
 */
function findFirstH1Content(tokens: Token[]): string | null {
  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i]!

    if (token.type === 'heading_open' && token.tag === 'h1') {
      return extractHeadingContent(tokens, i)
    }
  }

  return null
}

/**
 * 提取标题内容
 *
 * @param tokens - token 数组
 * @param headingOpenIndex - heading_open token 的索引
 * @returns 标题文本内容
 */
function extractHeadingContent(tokens: Token[], headingOpenIndex: number): string {
  const contentToken = tokens[headingOpenIndex + 1]
  if (!contentToken?.children) return ''

  let content = ''
  for (const child of contentToken.children) {
    content += child.content || ''
  }

  return content.trim()
}
