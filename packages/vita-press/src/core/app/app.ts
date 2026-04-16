import MarkdownIt from 'markdown-it'
import path from 'node:path'
import { warn } from 'vitarx-router/file-router'
import { ConfigManager } from '../config/index.js'
import { createMarkdownIt, MdParser } from '../markdown/index.js'
import { VitaPressServerRouter } from '../router/index.js'
import type { ResolvedConfig } from '../types/index.js'
import type { VitaPressPlugin } from '../types/plugin.js'

interface VitaPressAppOptions {
  /** 根目录 */
  root: string
  /** 命令模式 */
  command: 'serve' | 'build'
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
  public readonly docDirPath: string
  /**
   * 根目录
   */
  public readonly root: string
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
  public readonly command: 'serve' | 'build'
  /**
   * 路由器实例
   */
  public readonly router: VitaPressServerRouter
  private constructor(options: VitaPressAppOptions) {
    this.root = options.root
    this.command = options.command
    this.config = Object.freeze(options.config)
    this.plugins = Object.freeze(options.plugins)
    this.mdParser = this.createMdParser(options.markdownIt)
    this.router = this.createRouter()
    this.docDirPath = path.resolve(this.root, options.config.docDir.dir)
  }
  /**
   * 是否为开发模式
   */
  get isDev(): boolean {
    return this.command === 'serve'
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
  private createRouter(): VitaPressServerRouter {
    return new VitaPressServerRouter(this)
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
    command: 'serve' | 'build',
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
