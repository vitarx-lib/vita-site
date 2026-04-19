import MarkdownIt from 'markdown-it'
import { existsSync } from 'node:fs'
import path from 'node:path'
import { warn } from 'vitarx-router/file-router'
import { ConfigManager } from '../config/index.js'
import { createMarkdownIt, MdParser } from '../markdown/index.js'
import { VitaPressRouter } from '../router/index.js'
import type { ResolvedConfig } from '../types/index.js'
import type { VitaPressPlugin } from '../types/plugin.js'

export type CommandName = 'dev' | 'build' | 'preview'
export interface VitaPressAppOptions {
  /** 根目录 */
  root: string
  /** 命令模式 */
  command: CommandName
  /**
   * MarkdownIt 实例
   */
  markdownIt: MarkdownIt
  /**
   * 解析后的配置对象
   */
  config: ResolvedConfig
  /**
   * 插件列表
   */
  plugins: VitaPressPlugin[]
}

/**
 * VitaPress 应用实例
 */
export class VitaPressApp {
  /**
   * 根目录
   */
  public readonly root: string
  /**
   * 文档目录路径
   */
  public readonly docDirPath: string
  /**
   * 客户端入口脚本路径
   */
  public readonly clientEntryPath: string | null
  /**
   * 缓存目录
   */
  public readonly cacheDir: string
  /**
   * 默认语言
   */
  public readonly defaultLang: string
  /**
   * 语言目录映射
   */
  public readonly langPathMap: Record<string, string> = {}
  /**
   * 插件列表
   */
  public readonly plugins: readonly VitaPressPlugin[]
  /**
   * 解析后的配置
   */
  public readonly config: ResolvedConfig
  /**
   * Markdown 解析器实例
   */
  public readonly mdParser: MdParser
  /**
   * 命令模式
   */
  public readonly command: CommandName
  /**
   * 路由器实例
   */
  public readonly router: VitaPressRouter
  private constructor(options: VitaPressAppOptions) {
    this.root = options.root
    this.cacheDir = path.resolve(this.root, '.vitapress/.cache')
    this.command = options.command
    this.config = Object.freeze(options.config)
    this.plugins = Object.freeze(options.plugins)
    this.mdParser = this.createMdParser(options.markdownIt)
    this.router = this.createRouter()
    this.docDirPath = path.resolve(this.root, options.config.docDir.dir)
    const mainTsPath = path.resolve(this.root, '.vitapress/main.ts')
    const mainJsPath = path.resolve(this.root, '.vitapress/main.js')
    this.clientEntryPath = existsSync(mainTsPath)
      ? mainTsPath
      : existsSync(mainJsPath)
        ? mainJsPath
        : null
    this.defaultLang = this.config.lang || 'zh-CN'
    if (Array.isArray(this.config.langDirs) && this.config.langDirs.length) {
      this.config.langDirs.forEach(lang => {
        this.langPathMap[path.resolve(this.docDirPath, lang)] = lang
      })
    }
  }
  /**
   * 是否为开发模式
   */
  get isDev(): boolean {
    return this.command === 'dev'
  }
  /**
   * 创建一个 MdParser 实例
   * @param markdownIt
   * @private
   */
  private createMdParser(markdownIt: MarkdownIt): MdParser {
    return new MdParser(markdownIt, this)
  }
  /**
   * 创建一个 VitaPressServerRouter 实例
   * @private
   */
  private createRouter(): VitaPressRouter {
    return new VitaPressRouter(this)
  }
  /**
   * 创建一个 VitaPressApp 实例
   *
   * @param root - 根目录
   * @param command - 命令模式
   * @param configFile - 配置文件路径
   */
  static async create(
    root: string,
    command: CommandName,
    configFile?: string
  ): Promise<VitaPressApp> {
    const configManager = await ConfigManager.create(root, configFile)
    const markdownIt = await createMarkdownIt(configManager.config.markdownIt)

    const results: (void | Promise<void>)[] = []
    for (const plugin of configManager.plugins) {
      if (typeof plugin.markdown === 'function') {
        try {
          const result = plugin.markdown(markdownIt)
          results.push(result)
        } catch (e) {
          warn(`Plugin ${plugin.name} markdown error:`, e)
        }
      }
    }
    await Promise.all(results)

    return new VitaPressApp({
      root,
      command,
      markdownIt,
      config: configManager.config,
      plugins: configManager.plugins
    })
  }
}
