import MarkdownIt from 'markdown-it'
import { warn } from 'vitarx-router/file-router'

const ESCAPE_CHARS = {
  BACKTICK: '&#96;',
  LEFT_BRACE: '&#123;',
  RIGHT_BRACE: '&#125;'
} as const

const DEFAULT_LANGUAGE = 'text'

const FENCE_PATTERN = /<pre([^>]*)><code([^>]*)>([\s\S]*?)<\/code><\/pre>/

/**
 * 转义代码内容中的特殊字符
 *
 * @param content - 原始代码内容
 * @returns 转义后的内容
 */
function escapeCodeContent(content: string): string {
  return content
    .replace(/`/g, ESCAPE_CHARS.BACKTICK)
    .replace(/{/g, ESCAPE_CHARS.LEFT_BRACE)
    .replace(/}/g, ESCAPE_CHARS.RIGHT_BRACE)
}

/**
 * 代码块处理插件
 * 主要功能：转义特殊字符，使用 v-html 属性渲染以提高性能
 *
 * @param md - MarkdownIt 实例
 */
export function fenceTranslator(md: MarkdownIt): void {
  const originalFence = md.renderer.rules.fence

  if (!originalFence) {
    warn('[fenceTranslator] fence rule not found, plugin skipped')
    return
  }

  md.renderer.rules.fence = function (tokens, idx, options, env, slf): string {
    const token = tokens[idx]
    const language = token?.info || DEFAULT_LANGUAGE
    const highlightedCode = originalFence(tokens, idx, options, env, slf)

    const match = highlightedCode.match(FENCE_PATTERN)
    if (!match) {
      return highlightedCode
    }

    const [, preAttributes, codeAttributes, codeTagContent] = match
    const escapedContent = escapeCodeContent(codeTagContent!)

    return `<div class="v-source-code" data-lang="${language}"><span class="v-source-code__lang">${language}</span><button type="button" class="v-source-code__copy" title="copy all code"></button><pre${preAttributes}><code${codeAttributes} v-html={\`${escapedContent}\`}></code></pre></div>`
  }
}
