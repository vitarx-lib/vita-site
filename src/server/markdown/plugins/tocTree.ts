import GithubSlugger from 'github-slugger'
import type MarkdownIt from 'markdown-it'
import type Token from 'markdown-it/lib/token.mjs'

export interface TocParseEnvContext {
  tocList: TocTree[]
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
   * 子级，无子级时不设置以节省内存
   */
  children?: TocTree[]
  /**
   * hash值，不带前缀#
   *
   * 当 hash 与 name 相同时可省略，消费端应使用 name 作为回退
   */
  hash?: string
}

const MIN_HEADING_LEVEL = 1
const MAX_HEADING_LEVEL = 6
const TOC_MIN_LEVEL = 2
const TOC_MAX_LEVEL = 3
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

    if (headingLevel < TOC_MIN_LEVEL || headingLevel > TOC_MAX_LEVEL) continue

    const tocItem: TocTree = {
      level: headingLevel,
      name: content
    }
    if (hash !== content) {
      tocItem.hash = hash
    }

    rawItems.push(tocItem)
  }

  if (env.tocList) {
    env.tocList.push(...buildTocTree(rawItems))
  } else {
    env.tocList = buildTocTree(rawItems)
  }
}

/**
 * 解析标题级别
 *
 * @param tag - HTML 标签名，如 'h1', 'h2'
 * @returns 标题级别 1-6，无效时返回 null
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
 * 过滤 html_inline 类型的子 token，避免将标题中的行内 HTML/JSX 组件
 * （如 `<Badge type="vip" />`）纳入标题文本。
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
    if (child.type === 'html_inline') continue
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
      const parent = stack[stack.length - 1]!
      ;(parent.children ??= []).push(item)
    }

    stack.push(item)
  }

  return root
}

/**
 * TOC 树解析插件
 *
 * 功能：
 * - 为所有标题（h1-h6）生成唯一 id
 * - 为所有标题添加锚点链接（RouterLink）
 * - 构建目录树结构（仅 h2-h3）
 *
 * @param md - Markdown-it 实例
 */
export function tocTree(md: MarkdownIt): void {
  md.core.ruler.push('toc-tree', state => {
    state.env ??= {}
    state.env.__toc_slugger = new GithubSlugger()

    processTokens(state.tokens, state.env)
  })

  md.renderer.rules['heading_open'] = (tokens, idx, options, _env, self) => {
    const token = tokens[idx]
    if (!token) return ''

    const tag = self.renderToken(tokens, idx, options)
    return `${tag}\n<RouterLink to="#${token.attrGet('id')}">`
  }

  md.renderer.rules['heading_close'] = (tokens, idx, _options, _env, _self) => {
    const token = tokens[idx]
    if (!token) return ''
    return `</RouterLink></${token.tag}>\n`
  }
}
