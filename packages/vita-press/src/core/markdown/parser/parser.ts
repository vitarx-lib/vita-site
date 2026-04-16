import MarkdownIt from 'markdown-it'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { warn } from 'vitarx-router/file-router'
import { VitaPressApp } from '../../app/index.js'
import { isPlainObject, mergeConfig } from '../../config/index.js'
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
  private readonly app: VitaPressApp
  /**
   * 语言目录
   * @private
   */
  private readonly langDirs: string[]
  private readonly defaultLang: string
  private readonly languages: Record<string, string> = {}
  private readonly injectCode: string
  public readonly cacheManager: CacheManager
  /**
   * 创建 Markdown 解析器实例
   *
   * @param md - MarkdownIt 实例，用于渲染 Markdown 内容
   * @param app - VitaPressApp 实例，包含解析器配置选项
   */
  constructor(md: MarkdownIt, app: VitaPressApp) {
    this.md = md
    this.app = app
    const config = app.config
    const docDir = path.resolve(app.root, config.docDir.dir)
    this.defaultLang = Array.isArray(config.lang) ? config.lang[0] || 'zh-CN' : config.lang
    if (Array.isArray(config.lang)) {
      config.lang.forEach(lang => {
        this.languages[path.resolve(docDir, lang)] = lang
      })
    }
    const configHash = createHash('md5')
      .update(
        JSON.stringify({
          root: app.root,
          defaultLang: this.defaultLang,
          languages: this.languages,
          injectCode: this.app.config.injectCode
        })
      )
      .digest('hex')
    this.cacheManager = new CacheManager(this.app.root, configHash)
    this.langDirs = Object.keys(this.languages)
    this.injectCode = this.app.config.injectCode.length
      ? this.app.config.injectCode.join('\n') + '\n'
      : ''
  }

  /**
   * 清理失效缓存
   *
   * @returns 清理的缓存条目数量
   */
  pruneCache(): number {
    return this.cacheManager.prune()
  }

  /**
   * 清理所有缓存
   */
  clearCache(): void {
    this.cacheManager.clear()
  }

  /**
   * 转换markdown内容
   *
   * @param filePath - 文件路径
   * @param [content] - Markdown 内容
   * @returns 转换后的结果, 包含生成的 Vitarx 组件代码、文件路径和文档元数据
   */
  parse(filePath: string, content?: string): MdParseResult {
    try {
      if (typeof content !== 'string') content = readFileSync(filePath, 'utf-8')
    } catch (e) {
      throw new Error(`Read file error: ${filePath}\n ${String(e)}`)
    }
    const relativePath = path.relative(this.app.root, filePath)

    const cached = this.cacheManager.get(relativePath, content)
    if (cached) return cached
    content = this.beforeParse(filePath, content)
    let result = this.transform(filePath, content)
    result = this.afterParse(result)
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
      lang: '',
      authors: gitInfo.authors,
      createdAt: gitInfo.createdAt,
      lastUpdateAt: gitInfo.lastUpdateAt,
      tocList: toc,
      relativePath: path.relative(this.app.root, filePath),
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
    return lang ? this.languages[lang]! : this.defaultLang
  }

  /**
   * 生成组件代码
   * @param html
   * @param meta
   * @param filePath
   * @private
   */
  private generateComponent(html: string, meta: DocPageMetaData, filePath: string): string {
    const injectCodeBlock = this.injectCode

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

  /**
   * 内容预处理
   *
   * @param filePath
   * @param content
   * @private
   */
  private beforeParse(filePath: string, content: string): string {
    for (const plugin of this.app.plugins) {
      if (typeof plugin.beforeParse === 'function') {
        try {
          const result = plugin.beforeParse(filePath, content)
          if (result) content = result
        } catch (e) {
          warn(`Plugin ${plugin.name} beforeParse error:`, e)
        }
      }
    }
    return content
  }

  /**
   * 内容后处理
   *
   * @param result
   * @private
   */
  private afterParse(result: MdParseResult): MdParseResult {
    for (const plugin of this.app.plugins) {
      if (typeof plugin.afterParse === 'function') {
        try {
          const _result = plugin.afterParse(result)
          if (isPlainObject(_result)) result = mergeConfig(result, _result)
        } catch (e) {
          warn(`Plugin ${plugin.name} afterParse error:`, e)
        }
      }
    }
    return result
  }
}
