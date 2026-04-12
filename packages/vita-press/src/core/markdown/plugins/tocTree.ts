import GithubSlugger from 'github-slugger'
import type MarkdownIt from 'markdown-it'
import type Token from 'markdown-it/lib/token.mjs'

export interface TocParseEnvContext {
  __toc_tree_list: TocTree[]
  __toc_slugger: GithubSlugger
}

export interface TocTree {
  /**
   * 标题级别，2-3
   */
  level: number
  /**
   * 标题文本
   */
  name: string
  /**
   * 子级
   */
  children: TocTree[]
  /**
   * hash值，不带前缀#
   */
  hash: string
}

const MIN_HEADING_LEVEL = 1
const MAX_HEADING_LEVEL = 3
const ID_NUMBER_PREFIX = '_'

/**
 * 处理所有 tokens 并生成 TOC 树
 *
 * @param tokens - Markdown-it 解析后的 token 数组
 * @param env - 解析环境上下文
 */
function processTokens(tokens: Token[], env: TocParseEnvContext): void {
  const rawItems: TocTree[] = []

  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i]!
    if (token.type !== 'heading_open') continue

    const headingLevel = parseHeadingLevel(token.tag)
    if (headingLevel === null) continue

    const content = getHeadingContent(tokens, i)
    const hash = ensureValidId(env.__toc_slugger.slug(content))

    token.attrSet('id', hash)
    token.attrPush(['class', 'paragraph-title'])

    if (headingLevel === MIN_HEADING_LEVEL) continue

    rawItems.push({
      level: headingLevel,
      name: content,
      hash,
      children: []
    })
  }

  env.__toc_tree_list = buildTocTree(rawItems)
}

/**
 * 解析标题级别
 *
 * @param tag - HTML 标签名，如 'h1', 'h2'
 * @returns 标题级别 1-3，无效时返回 null
 */
function parseHeadingLevel(tag: string): number | null {
  if (!tag || tag.length !== 2 || tag[0] !== 'h') {
    return null
  }
  const level = tag.charCodeAt(1) - 48
  return level >= MIN_HEADING_LEVEL && level <= MAX_HEADING_LEVEL ? level : null
}

/**
 * 获取标题内容
 *
 * @param tokens - token 数组
 * @param headingOpenIndex - heading_open token 的索引
 * @returns 标题文本内容
 */
function getHeadingContent(tokens: Token[], headingOpenIndex: number): string {
  const contentToken = tokens[headingOpenIndex + 1]
  if (!contentToken?.children) return ''

  let content = ''
  for (const child of contentToken.children) {
    content += child.content || ''
  }
  return content.trim()
}

/**
 * 确保 hash 是有效的 HTML id 属性值
 *
 * HTML id 规范要求：
 * - 不能以数字开头（CSS 选择器兼容性）
 * - 不能包含空格
 *
 * @param slug - github-slugger 生成的 slug
 * @returns 有效的 HTML id
 *
 * @example
 * ensureValidId('hello-world')     // 'hello-world'
 * ensureValidId('1-快速开始')       // '_1-快速开始'
 * ensureValidId('123')             // '_123'
 */
function ensureValidId(slug: string): string {
  if (/^\d/.test(slug)) {
    return ID_NUMBER_PREFIX + slug
  }
  return slug
}

/**
 * 使用栈结构构建 TOC 树
 *
 * 算法说明：
 * - 维护一个栈，栈顶始终是当前可添加子节点的最近父节点
 * - 当遇到新节点时，弹出栈中所有级别 >= 当前节点的元素
 * - 将新节点添加到栈顶节点的 children 或作为根节点
 *
 * @param items - 扁平化的 TOC 项列表
 * @returns 构建好的 TOC 树
 */
function buildTocTree(items: TocTree[]): TocTree[] {
  if (items.length === 0) return []

  const root: TocTree[] = []
  const stack: TocTree[] = []

  for (const item of items) {
    while (stack.length > 0 && stack[stack.length - 1]!.level >= item.level) {
      stack.pop()
    }

    if (stack.length === 0) {
      root.push(item)
    } else {
      stack[stack.length - 1]!.children.push(item)
    }

    stack.push(item)
  }

  return root
}

/**
 * TOC 树解析插件
 *
 * 功能：
 * - 为标题生成唯一 id
 * - 构建目录树结构
 *
 * @param md - Markdown-it 实例
 */
export function tocTree(md: MarkdownIt): void {
  md.core.ruler.push('toc-tree', state => {
    state.env = state.env || {}
    state.env.__toc_slugger = new GithubSlugger()
    state.env.__toc_tree_list = []

    processTokens(state.tokens, state.env)
  })
}
