import type MarkdownIt from 'markdown-it'

/**
 * JSX 组件 Token 结构定义
 *
 * 扩展 markdown-it 的 Token 类型，用于标识 JSX 组件标签
 * 与普通 HTML 标签的区别：组件名必须以大写字母开头（React 约定）
 */
interface JsxComponentToken {
  type: 'jsxComponent'
  tag: string
  content: string
  block: boolean
  map: [number, number]
}

/**
 * JSX 组件解析器插件
 *
 * 功能说明：
 * 为 markdown-it 添加 JSX 组件标签的解析能力，使其能够识别和处理 Markdown 中的 React 组件语法。
 *
 * 设计思路：
 * 1. 使用大写字母开头作为组件标识（遵循 React 命名约定）
 * 2. 支持自闭合和成对标签两种形式
 * 3. 通过深度计数处理嵌套组件，确保正确匹配闭合标签
 *
 * 支持的 JSX 语法：
 * - 自闭合标签：`<Button />`
 * - 带属性的标签：`<Button variant="primary">Click me</Button>`
 * - 嵌套组件：`<Container><Button>Click</Button></Container>`
 *
 * @param md - MarkdownIt 实例，用于注册解析规则和渲染器
 *
 * @example
 * ```ts
 * import MarkdownIt from 'markdown-it'
 * import { jsxComponentParser } from './plugins/jsxComponentParser'
 *
 * const md = new MarkdownIt()
 * md.use(jsxComponentParser)
 *
 * // 现在可以解析 JSX 组件了
 * md.render('<Button>Click</Button>')
 * ```
 */
export function jsxComponentParser(md: MarkdownIt): void {
  /**
   * 检测是否为自闭合标签
   *
   * 支持的格式：
   * - <Tag />
   * - <Tag / >  (斜杠和大于号之间有空格)
   * - <Tag attribute="value" />
   *
   * @param content - 要检测的内容
   * @returns 是否为自闭合标签
   */
  function isSelfClosingTag(content: string): boolean {
    return /<[A-Z][a-zA-Z0-9]*[^>]*\/\s*>/.test(content)
  }

  /**
   * 解析 JSX 组件标签的核心函数
   *
   * 算法流程：
   * 1. 检测行首是否匹配 JSX 组件标签模式（大写字母开头）
   * 2. 判断是自闭合标签还是成对标签
   * 3. 对于成对标签，使用深度计数法查找匹配的闭合标签
   * 4. 提取组件内容并生成对应的 Token
   *
   * @param state - markdown-it 解析状态对象，包含源码、行信息等
   * @param startLine - 当前解析的起始行号
   * @param endLine - 文档结束行号
   * @param silent - 是否为静默模式（仅检测，不生成 Token）
   * @returns 是否成功解析为 JSX 组件
   */
  function parseJsxComponent(
    state: any,
    startLine: number,
    endLine: number,
    silent: boolean
  ): boolean {
    const pos = state.bMarks[startLine]
    const tShift = state.tShift[startLine]
    const max = state.eMarks[startLine]

    if (pos === undefined || tShift === undefined || max === undefined) {
      return false
    }

    if (startLine >= endLine) {
      return false
    }

    const lineStart = pos + tShift
    const lineContent = state.src.slice(lineStart, max).trim()

    /**
     * 正则匹配规则：
     * - ^< : 以 < 开头
     * - ([A-Z][a-zA-Z0-9]*) : 组件名必须大写字母开头，后续为字母或数字
     * - (\s+[^>]*)? : 可选的属性部分（空格 + 非 > 的任意字符）
     * - \/?> : 以 /> 或 > 结尾
     */
    const match = lineContent.match(/^<([A-Z][a-zA-Z0-9]*)(\s+[^>]*)?\/?>/)
    if (!match) {
      return false
    }

    if (silent) {
      return true
    }

    const tagName = match[1]!
    const isSelfClosing = isSelfClosingTag(lineContent)

    if (isSelfClosing) {
      const token = state.push('jsxComponent', tagName, 0) as JsxComponentToken
      token.content = lineContent
      token.block = true
      token.map = [startLine, startLine + 1]
      state.line = startLine + 1
      return true
    }

    /**
     * 处理成对标签的闭合标签查找
     *
     * 使用深度计数法处理嵌套场景：
     * - 遇到同名开始标签时 depth++
     * - 遇到同名结束标签时 depth--
     * - 当 depth === 0 时找到匹配的闭合标签
     *
     * 示例：
     * <Container>      depth = 1
     *   <Container>    depth = 2
     *   </Container>   depth = 1
     * </Container>     depth = 0 ✓ 找到匹配
     */
    const endTag = `</${tagName}>`
    let endLinePos = -1
    let depth = 1

    for (let i = startLine + 1; i < endLine; i++) {
      const linePos = state.bMarks[i]
      const lineTShift = state.tShift[i]
      const lineMax = state.eMarks[i]

      if (linePos === undefined || lineTShift === undefined || lineMax === undefined) {
        continue
      }

      const line = state.src.slice(linePos + lineTShift, lineMax).trim()

      /**
       * 检测嵌套的开始标签
       * 注意：自闭合标签 <Tag /> 或 <Tag / > 不增加深度，因为它不会闭合
       */
      if (line.includes(`<${tagName}`) && !isSelfClosingTag(line)) {
        depth++
      }

      if (line === endTag) {
        depth--
        if (depth === 0) {
          endLinePos = i
          break
        }
      }
    }

    if (endLinePos === -1) {
      return false
    }

    /**
     * 提取组件内容
     *
     * contentStart: 开始标签后的第一个字符位置
     * contentEnd: 闭合标签前的最后一个字符位置
     *
     * 示例：
     * <Button>
     *   Click me    <- content
     * </Button>
     */
    const contentStart = state.eMarks[startLine]! + 1
    const contentEnd = state.bMarks[endLinePos]!
    const content = state.src.slice(contentStart, contentEnd).trim()

    const token = state.push('jsxComponent', tagName, 0) as JsxComponentToken
    token.content = `<${tagName}>${content}${endTag}`
    token.block = true
    token.map = [startLine, endLinePos + 1]

    state.line = endLinePos + 1

    return true
  }

  /**
   * 注册块级解析规则
   *
   * 位置选择：
   * - before('paragraph'): 在段落解析之前执行，优先级高于普通文本
   * - alt: 定义替代解析规则，当主要规则失败时尝试这些规则
   *
   * 这样可以确保 JSX 组件标签不会被当作普通段落处理
   */
  md.block.ruler.before('paragraph', 'jsxComponent', parseJsxComponent, {
    alt: ['paragraph', 'reference', 'blockquote', 'list']
  })

  /**
   * 渲染器规则
   *
   * 将 JSX 组件 Token 转换为原始字符串
   *
   * 注意：这里保留原始 JSX 语法，后续由其他处理器（如 Vite 插件）进行编译
   * 这样可以保持插件的职责单一，只负责解析，不负责转换
   */
  md.renderer.rules['jsxComponent'] = (tokens, idx) => {
    const token = tokens[idx] as JsxComponentToken
    return token.content || ''
  }
}
