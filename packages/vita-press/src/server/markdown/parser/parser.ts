import MarkdownIt from 'markdown-it'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import type { MarkdownParseEnvContext, MdParseResult } from '../../../types/index.js'
import type { DocPageMetaData } from '../../../types/page.js'
import type { VitaPressApp } from '../../app/index.js'
import { invokeParallel, invokePipe } from '../../common/hooks.js'
import { getVersion } from '../../common/utils.js'
import { CacheManager } from '../cache/index.js'
import { getCommitInfo, parseFrontMatter } from '../utils/index.js'

/**
 * Markdown 解析器
 *
 * 负责将 Markdown 文件转换为可执行的 Vitarx 组件代码。
 * 内置缓存机制，避免重复解析相同内容，提升构建性能。
 */
export class MdParser {
  private readonly app: VitaPressApp
  private readonly injectCode: string
  public readonly md: MarkdownIt
  public readonly cache: CacheManager
  /**
   * 创建 Markdown 解析器实例
   *
   * @param md - MarkdownIt 实例，用于渲染 Markdown 内容
   * @param app - VitaPressApp 实例，包含解析器配置选项
   */
  constructor(md: MarkdownIt, app: VitaPressApp) {
    this.md = md
    this.app = app
    this.injectCode = this.app.config.injectCode.length
      ? Array.from(new Set(this.app.config.injectCode)).join('\n') + '\n'
      : ''
    const configHash = createHash('md5')
      .update(
        JSON.stringify({
          root: app.root,
          lang: app.lang,
          langs: app.langs,
          injectCode: this.injectCode,
          version: getVersion()
        })
      )
      .digest('hex')
    this.cache = new CacheManager(app.cacheDir, configHash)
  }
  /**
   * 转换markdown内容
   *
   * @param filePath - 文件路径
   * @param [content] - Markdown 内容
   * @returns {string} - 生成的 Vitarx 组件代码
   */
  parse(filePath: string, content?: string): string {
    try {
      if (typeof content !== 'string') content = readFileSync(filePath, 'utf-8')
    } catch (e) {
      throw new Error(`Read file error: ${filePath}\n ${String(e)}`)
    }
    const relativePath = path.relative(this.app.root, filePath)

    const cached = this.cache.get(relativePath, content)
    if (cached) {
      this.afterParse(cached.parseResult)
      return cached.componentCode
    }
    content = this.beforeParse(filePath, content)
    const result = this.transform(filePath, content)
    const componentCode = this.generateComponent(result)
    this.afterParse(Object.freeze(result))
    this.cache.set(relativePath, content, componentCode, result)
    return componentCode
  }

  /**
   * 转换markdown内容
   * @param filePath
   * @param content
   * @private
   */
  public transform(filePath: string, content: string): MdParseResult {
    const { data: frontmatter, content: markdownContent } = parseFrontMatter(content)
    let alias: string | string[] | undefined = undefined
    if (
      frontmatter['alias'] &&
      (typeof frontmatter['alias'] === 'string' || Array.isArray(frontmatter['alias']))
    ) {
      alias = frontmatter['alias']
      delete frontmatter['alias']
    }
    const gitInfo = getCommitInfo(filePath)
    const env: MarkdownParseEnvContext = {
      app: this.app,
      filePath,
      frontmatter,
      tocList: []
    }
    const html = this.md.render(markdownContent, env)
    const toc = env.tocList
    const docPageMetaData: DocPageMetaData = {
      authors: gitInfo.authors,
      createdAt: gitInfo.createdAt,
      lastUpdateAt: gitInfo.lastUpdateAt,
      tocList: toc,
      relativePath: path.relative(this.app.root, filePath),
      ...frontmatter
    }

    return {
      html,
      content: markdownContent,
      filePath,
      alias,
      meta: docPageMetaData
    }
  }

  /**
   * 生成组件代码
   *
   * @param parseResult - 解析结果
   * @returns 组件代码
   */
  public generateComponent(parseResult: MdParseResult): string {
    const { html, meta, filePath, alias } = parseResult
    const injectCodeBlock = this.injectCode

    return `// 此文件由vita-press自动生成
import { RouterLink } from 'vitarx-router'
${injectCodeBlock}
definePage({${alias ? `\nalias:${JSON.stringify(alias)},` : ''}
  meta:${JSON.stringify(meta)}
})
/**
 * @title ${meta.title}
 * @description ${meta.description}
 * @source ${filePath}
 */
export default () => (<article class="v-doc-content">${html}</article>)
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
    return invokePipe(this.app.plugins, 'beforeParse', content, filePath, this.app)
  }

  /**
   * 内容后处理
   *
   * @param result
   * @private
   */
  private afterParse(result: MdParseResult): void {
    invokeParallel(this.app.plugins, 'afterParse', result, this.app)
  }
}
