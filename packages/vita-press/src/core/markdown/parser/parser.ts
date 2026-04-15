import MarkdownIt from 'markdown-it'
import { createHash } from 'node:crypto'
import path from 'node:path'
import type { MarkdownParseEnvContext } from '../../types/index.js'
import type { DocPageMetaData } from '../../types/page.js'
import { CacheManager } from '../cache/index.js'
import { getCommitInfo, parseFrontMatter } from '../utils/index.js'

/**
 * Markdown 解析结果
 *
 * 包含解析后的组件代码、文件路径和文档元数据
 */
export interface MdParseResult {
  /** 生成的 Vitarx 组件代码 */
  content: string
  /** 源文件的绝对路径 */
  filePath: string
  /** 文档页面的元数据信息 */
  meta: DocPageMetaData
}

/**
 * Markdown 解析器配置选项
 */
export interface ParserOptions {
  /** 项目根目录路径，用于计算相对路径 */
  root: string
  /** 需要注入到生成组件顶部的代码片段数组 */
  injectCode: readonly string[]
  /** 默认语言 */
  defaultLang: string
  /**
   * 语言映射
   *
   * @example
   * ```ts
   * {
   *   '/root/docs/zh-CN': 'zh-CN',
   *   '/root/docs/en-US': 'en-US'
   * }
   * ```
   */
  languages: Record<string, string>
}

/**
 * Markdown 解析器
 *
 * 负责将 Markdown 文件转换为可执行的 Vitarx 组件代码。
 * 内置缓存机制，避免重复解析相同内容，提升构建性能。
 *
 * @example
 * ```ts
 * const parser = new MdParser(markdownIt, {
 *   root: process.cwd(),
 *   injectCode: ['import { customDirective } from "./directives"']
 * })
 * parser.initCache()
 * const result = parser.parse('/project/docs/guide.md', markdownContent)
 * ```
 */
export class MdParser {
  private md: MarkdownIt
  public readonly cacheManager: CacheManager
  private readonly options: ParserOptions
  /**
   * 语言目录
   * @private
   */
  private readonly langDirs: string[]
  /**
   * 创建 Markdown 解析器实例
   *
   * @param md - MarkdownIt 实例，用于渲染 Markdown 内容
   * @param options - 解析器配置选项
   */
  constructor(md: MarkdownIt, options: ParserOptions) {
    this.md = md
    this.options = options

    const configHash = options
      ? createHash('md5').update(JSON.stringify(options)).digest('hex')
      : ''
    this.cacheManager = new CacheManager(this.options.root, configHash)
    this.langDirs = Object.keys(this.options.languages)
  }

  /**
   * 初始化缓存
   */
  initCache(): void {
    this.cacheManager.init()
  }

  /**
   * 清理失效缓存
   *
   * @returns 清理的缓存条目数量
   */
  pruneCache(): number {
    if (!this.cacheManager) return 0
    return this.cacheManager.prune()
  }

  /**
   * 清理所有缓存
   */
  clearCache(): void {
    this.cacheManager?.clear()
  }

  /**
   * 转换markdown内容
   *
   * @param filePath
   * @param content
   */
  parse(filePath: string, content: string): MdParseResult {
    const relativePath = path.relative(this.options.root, filePath)

    const cached = this.cacheManager.get(relativePath, content)
    if (cached) return cached

    const result = this.transform(filePath, content)

    this.cacheManager.set(relativePath, content, result)

    return result
  }

  /**
   * 转换markdown内容
   * @param filePath
   * @param content
   * @private
   */
  private transform(filePath: string, content: string): MdParseResult {
    const { data: frontmatter, content: markdownContent } = parseFrontMatter(content)
    const gitInfo = getCommitInfo(filePath)
    const env: MarkdownParseEnvContext = {
      filePath: filePath,
      frontmatter: frontmatter,
      tocList: []
    }
    const html = this.md.render(markdownContent, env)
    const toc = env.tocList
    const docPageMetaData: DocPageMetaData = {
      lang: this.options.defaultLang,
      authors: gitInfo.authors,
      createdAt: gitInfo.createdAt,
      lastUpdateAt: gitInfo.lastUpdateAt,
      tocList: toc,
      relativePath: path.relative(this.options.root, filePath),
      ...frontmatter
    }
    if (!docPageMetaData.lang) docPageMetaData.lang = this.parseLanguage(filePath)
    const componentCode = this.generateComponent(html, docPageMetaData, filePath)
    return {
      content: componentCode,
      filePath,
      meta: docPageMetaData
    }
  }

  /**
   * 解析文件语言
   *
   * @param filePath
   * @private
   */
  private parseLanguage(filePath: string): string {
    const lang = this.langDirs.find(key => filePath.startsWith(key))
    return lang ? this.options.languages[lang]! : this.options.defaultLang
  }

  /**
   * 生成组件代码
   * @param html
   * @param meta
   * @param filePath
   * @private
   */
  private generateComponent(html: string, meta: DocPageMetaData, filePath: string): string {
    const injectCodeBlock = this.options.injectCode?.length
      ? this.options.injectCode.join('\n') + '\n'
      : ''

    return `// 此文件由vita-press自动生成
import { createView, builder } from 'vitarx'
import { RouterLink } from 'vitarx-router'
${injectCodeBlock}
definePage({
  meta:${JSON.stringify(meta)}
})
/**
 * @title ${meta.title}
 * @description ${meta.description}
 * @source ${filePath}
 */
export default builder(() => (<article class="v-doc-content">${html}</article>))
`
  }
}
