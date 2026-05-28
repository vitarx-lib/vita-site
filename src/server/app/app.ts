import MarkdownIt from 'markdown-it'
import { existsSync } from 'node:fs'
import path from 'node:path'
import type { CommandName, ConfigEnv, ResolvedConfig, UserConfig } from '../../types/index.js'
import type { VitaSitePlugin } from '../../types/plugin.js'
import { invokeParallel } from '../common/hooks.js'
import { ConfigManager } from '../config/index.js'
import { createMarkdownIt, MdParser } from '../markdown/index.js'
import { VitaSiteRouter } from '../router/index.js'

export interface VitaSiteAppOptions {
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
  plugins: VitaSitePlugin[]
}

/**
 * VitaSite 应用实例
 */
export class VitaSiteApp {
  /**
   * 根目录
   */
  public readonly root: string
  /**
   * 客户端配置路径
   */
  public readonly clientConfigPath: string | null
  /**
   * 缓存目录
   */
  public readonly cacheDir: string
  /**
   * 临时目录
   */
  public readonly tempDir: string
  /**
   * 默认语言
   */
  public readonly lang: string
  /**
   * 语言列表
   */
  public readonly langs: string[] = []
  /**
   * 插件列表
   */
  public readonly plugins: readonly VitaSitePlugin[]
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
  public readonly router: VitaSiteRouter
  /**
   * 创建一个 VitaSiteApp 实例
   * @param options
   */
  private constructor(options: VitaSiteAppOptions) {
    this.root = options.root
    this.cacheDir = path.resolve(this.root, '.vita-site/.cache')
    this.tempDir = path.resolve(this.root, '.vita-site/.temp')
    this.command = options.command
    this.config = Object.freeze(options.config)
    this.plugins = Object.freeze(options.plugins)
    const configTsPath = path.resolve(this.root, '.vita-site/config.client.ts')
    const configJsPath = path.resolve(this.root, '.vita-site/config.client.js')
    this.clientConfigPath = existsSync(configTsPath)
      ? configTsPath
      : existsSync(configJsPath)
        ? configJsPath
        : null
    this.lang = this.config.locales[0]?.id || 'zh-CN'
    for (const locale of this.config.locales) {
      this.langs.push(locale.id)
    }
    this.mdParser = this.createMdParser(options.markdownIt)
    this.router = this.createRouter()
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
   * 创建一个 VitaSiteServerRouter 实例
   * @private
   */
  private createRouter(): VitaSiteRouter {
    return new VitaSiteRouter(this)
  }
  /**
   * 创建一个 VitaSiteApp 实例
   *
   * @param root - 根目录
   * @param command - 命令模式
   * @param config - 配置文件路径
   */
  static async create(
    root: string,
    command: CommandName,
    config?: string | UserConfig
  ): Promise<VitaSiteApp> {
    const env: ConfigEnv = {
      command,
      isDev: command === 'dev',
      isBuild: command === 'build',
      isPreview: command === 'preview'
    }
    const configManager = await ConfigManager.create(root, config, env)
    const markdownIt = await createMarkdownIt(configManager.config.markdownIt)

    await invokeParallel(configManager.plugins, 'markdownIt', markdownIt)

    const app = new VitaSiteApp({
      root,
      command,
      markdownIt,
      config: configManager.config,
      plugins: configManager.plugins
    })

    await invokeParallel(app.plugins, 'appCreated', app)

    app.router.reload()
    // 确保触发路由写入前钩子
    app.router.generate()
    return app
  }
}
