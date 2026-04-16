import type { PluginSimple } from 'markdown-it'
import MarkdownIt from 'markdown-it'

/**
 * 创建带有指定插件的 MarkdownIt 实例
 *
 * @param plugin - 要应用的插件
 * @returns MarkdownIt 实例
 */
export function createMarkdownWithPlugin(plugin: PluginSimple): MarkdownIt {
  const md = new MarkdownIt()
  md.use(plugin)
  return md
}

/**
 * 解析 Markdown 内容并返回渲染结果
 *
 * @param md - MarkdownIt 实例
 * @param content - Markdown 内容
 * @returns 渲染后的 HTML 字符串
 */
export function renderMarkdown(md: MarkdownIt, content: string): string {
  return md.render(content)
}

/**
 * 解析 Markdown 内容并返回 tokens
 *
 * @param md - MarkdownIt 实例
 * @param content - Markdown 内容
 * @returns Token 数组
 */
export function parseMarkdown(md: MarkdownIt, content: string) {
  return md.parse(content, {})
}

/**
 * 从渲染结果中提取特定标签的内容
 *
 * @param html - 渲染后的 HTML
 * @param tag - 要提取的标签名
 * @returns 匹配结果的数组
 */
export function extractTagContent(html: string, tag: string): RegExpMatchArray | null {
  const pattern = new RegExp(`<${tag}[^>]*>(.*?)</${tag}>`, 'gs')
  return html.match(pattern)
}

/**
 * 从 HTML 中提取属性值
 *
 * @param html - HTML 字符串
 * @param attr - 属性名
 * @returns 属性值或 null
 */
export function extractAttribute(html: string, attr: string): string | null {
  const pattern = new RegExp(`${attr}="([^"]*)"`)
  const match = html.match(pattern)
  return match ? match[1]! : null
}

/**
 * 检查 HTML 是否包含指定类名
 *
 * @param html - HTML 字符串
 * @param className - 类名
 * @returns 是否包含
 */
export function hasClass(html: string, className: string): boolean {
  const classAttr = extractAttribute(html, 'class')
  if (!classAttr) return false
  return classAttr.split(' ').includes(className)
}
