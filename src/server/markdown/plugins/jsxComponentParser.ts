import type MarkdownIt from 'markdown-it'
import type { MarkdownParseEnvContext } from '../../../types/index.js'

/**
 * 从 HTML 内容中收集 JSX 组件名称
 *
 * JSX 组件名以大写字母开头（React 约定），
 * 同时收集开始标签和闭合标签中的组件名，确保不遗漏。
 *
 * @param html - HTML 字符串
 * @param names - 收集组件名称的集合
 *
 * @example
 * collectJsxComponentNames('<Badge type="vip" />', names)  // names → {"Badge"}
 * collectJsxComponentNames('</Container>', names)          // names → {"Container"}
 */
function collectJsxComponentNames(html: string, names: Set<string>): void {
  const re = /<\/?([A-Z][a-zA-Z0-9]*)/g
  let match: RegExpExecArray | null
  while ((match = re.exec(html)) !== null) {
    names.add(match[1]!)
  }
}

/**
 * 标签开闭状态跟踪器
 *
 * 跨 token 维护栈结构，正确处理 markdown-it 将开始标签和闭合标签
 * 拆分为独立 html_inline 子 token 的情况。
 *
 * 例如 `<Button>Click</Button>` 会被 markdown-it 拆分为：
 * - html_inline: `<Button>`
 * - text: `Click`
 * - html_inline: `</Button>`
 *
 * 如果在每个 token 内独立运行栈，无法匹配开闭标签。
 * 因此需要跨 token 维护统一的栈。
 */
class TagClosureTracker {
  private readonly stack: string[] = []
  private readonly tagRe = /<\/?([A-Z][a-zA-Z0-9]*)([^>]*)>/g

  /**
   * 处理一段 HTML 内容，更新开闭状态
   *
   * @param html - HTML 字符串
   */
  process(html: string): void {
    this.tagRe.lastIndex = 0
    let match: RegExpExecArray | null
    while ((match = this.tagRe.exec(html)) !== null) {
      const fullMatch = match[0]
      const tagName = match[1]!
      const attrs = match[2] || ''

      if (fullMatch.startsWith('</')) {
        if (this.stack.length > 0 && this.stack[this.stack.length - 1] === tagName) {
          this.stack.pop()
        }
      } else if (attrs.trimEnd().endsWith('/')) {
        // 自闭合标签，不压栈
      } else {
        this.stack.push(tagName)
      }
    }
  }

  /**
   * 获取未闭合的标签名称集合
   *
   * @returns 未闭合标签名称集合
   */
  getUnclosed(): Set<string> {
    return new Set(this.stack)
  }
}

/**
 * JSX 组件导入校验与标签闭合检测插件
 *
 * 功能说明：
 * 扫描 Markdown 解析后的 token 流，执行两项校验：
 * 1. 导入校验：检查使用的 JSX 组件是否已在 injectCode 中导入
 * 2. 闭合校验：检查 JSX 组件标签是否正确闭合
 *
 * 设计思路：
 * 1. 在 core 规则链中后处理 token 流，而非块级规则
 *    （markdown-it 的 HTML 块规则优先级更高，块级规则无法拦截 JSX）
 * 2. 扫描 html_block 和 html_inline 两类 token，覆盖块级和行内 JSX
 * 3. 不扫描 fence / code_inline / code_block token，代码围栏中的标签不参与校验
 * 4. 使用 TagClosureTracker 跨 token 维护开闭状态，避免误报
 * 5. 仅做校验，不修改 token 流，不影响最终 HTML 输出
 *
 * @param md - MarkdownIt 实例
 *
 * @example
 * ```ts
 * // injectCode 中未导入 Badge
 * const env = { availableComponents: new Set(['Button']), ... }
 * md.render('## title <Badge type="vip" />', env)
 * // → 抛出 Error: 使用了未导入的组件: Badge
 *
 * // 未闭合的组件标签
 * md.render('<Button>Click', env)
 * // → 抛出 Error: 存在未闭合的组件标签: Button
 * ```
 */
export function jsxComponentParser(md: MarkdownIt): void {
  md.core.ruler.push('jsx-component-check', state => {
    const env = state.env as MarkdownParseEnvContext
    if (!env?.availableComponents) return

    const usedComponents = new Set<string>()
    const closureTracker = new TagClosureTracker()

    for (const token of state.tokens) {
      if (token.type === 'html_block') {
        collectJsxComponentNames(token.content, usedComponents)
        closureTracker.process(token.content)
      }
      if (token.type === 'inline' && token.children) {
        for (const child of token.children) {
          if (child.type === 'html_inline') {
            collectJsxComponentNames(child.content, usedComponents)
            closureTracker.process(child.content)
          }
        }
      }
    }

    const filePath = env.filePath || 'unknown'
    const errors: string[] = []

    const unimported = [...usedComponents].filter(name => !env.availableComponents.has(name))
    if (unimported.length > 0) {
      const names = unimported.join(', ')
      const suggestions = unimported.map(n => `  import { ${n} } from "..."`).join('\n')
      errors.push(
        `使用了未导入的组件: ${names}\n请在配置 injectCode 中添加导入语句:\n${suggestions}`
      )
    }

    const unclosedTags = closureTracker.getUnclosed()
    if (unclosedTags.size > 0) {
      const names = [...unclosedTags].join(', ')
      const sample = [...unclosedTags][0]!
      errors.push(
        `存在未闭合的组件标签: ${names}\n请添加对应的闭合标签，如 <${sample}></${sample}> 或使用自闭合形式 <${sample} />`
      )
    }

    if (errors.length > 0) {
      throw new Error(`[jsxComponentParser] ${filePath} 中存在以下问题:\n${errors.join('\n\n')}`)
    }
  })
}
