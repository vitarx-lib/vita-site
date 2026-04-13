import yaml from 'js-yaml'
import { warn } from 'vitarx-router/file-router'

export type FrontMatterData = Record<string, unknown>

export type ParseResult = {
  data: FrontMatterData
  content: string
}

/**
 * 解析Markdown Front Matter
 *
 * @param content - Markdown 内容
 * @param filePath - 文件路径，仅用于解析失败时的日志提示信息
 * @returns 解析结果，包含 front matter 数据和剩余内容
 */
export function parseFrontMatter(content: string, filePath?: string): ParseResult {
  const frontMetaRegex = /^---\n([\s\S]+?)\n---\n([\s\S]*)/
  const match = content.match(frontMetaRegex)

  if (match) {
    const [_, frontMatterStr, remainingContent] = match

    if (frontMatterStr) {
      try {
        const parsedData = yaml.load(frontMatterStr)
        const data =
          typeof parsedData === 'object' && parsedData !== null && !Array.isArray(parsedData)
            ? (parsedData as FrontMatterData)
            : {}
        return {
          data,
          content: remainingContent || ''
        }
      } catch (error) {
        warn('Failed to parse front matter', `${error} in ${filePath}`)
      }
    }
  }

  return {
    data: {},
    content: content
  }
}
