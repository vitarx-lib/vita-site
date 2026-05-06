import type { ConfigEnv, ResolvedConfig, UserConfig } from '../../types/index.js'
import type { VitaPressPlugin } from '../../types/plugin.js'
import { invokeParallel } from '../common/hooks.js'
import { isPlainObject } from '../common/utils.js'
import { DEFAULT_CONFIG } from './constant.js'
import { loadUserConfig } from './loader.js'
import { mergeConfig } from './utils.js'
import { validateConfig } from './validator.js'

/**
 * 配置管理器
 */
export class ConfigManager {
  public readonly root: string
  /**
   * 插件列表
   * @private
   */
  #plugins: VitaPressPlugin[] = []
  /**
   * 解析后的配置
   * @private
   */
  #config!: ResolvedConfig
  /**
   * 插件名称集合
   * @private
   */
  #pluginNames = new Set<string>()
  /**
   * 插件配置
   * @private
   */
  #pluginConfig = new Map<string, UserConfig>()
  public readonly env: ConfigEnv
  private constructor(root: string, env: ConfigEnv) {
    this.root = root
    this.env = env
  }
  /**
   * 插件排序
   *
   * 排序规则：
   * 1. enforce: 'pre' 的插件优先级最高
   * 2. enforce: 'post' 的插件优先级最低
   * 3. 数字 enforce 值按从大到小排序（数字越大优先级越高）
   * 4. 无 enforce 的插件按原始顺序排在中间
   *
   * @param plugins - 插件列表
   * @returns 排序后的插件列表
   */
  private sortPlugins(plugins: VitaPressPlugin[]): VitaPressPlugin[] {
    const prePlugins: VitaPressPlugin[] = []
    const postPlugins: VitaPressPlugin[] = []
    const numericPlugins: VitaPressPlugin[] = []
    const normalPlugins: VitaPressPlugin[] = []

    for (const plugin of plugins) {
      if (plugin.enforce === 'pre') {
        prePlugins.push(plugin)
      } else if (plugin.enforce === 'post') {
        postPlugins.push(plugin)
      } else if (typeof plugin.enforce === 'number') {
        numericPlugins.push(plugin)
      } else {
        normalPlugins.push(plugin)
      }
    }

    numericPlugins.sort((a, b) => {
      const aEnforce = a.enforce as number
      const bEnforce = b.enforce as number
      return bEnforce - aEnforce
    })

    return [...prePlugins, ...numericPlugins, ...normalPlugins, ...postPlugins]
  }
  /**
   * 注册插件
   * @param plugin - 插件
   * @private
   */
  private registerPlugins(plugin: VitaPressPlugin | VitaPressPlugin[]): VitaPressPlugin[] {
    const registered: VitaPressPlugin[] = []
    if (Array.isArray(plugin)) {
      for (const p of plugin) {
        registered.push(...this.registerPlugins(p))
      }
    } else if (!this.#pluginNames.has(plugin.name)) {
      this.#pluginNames.add(plugin.name)
      this.#plugins.push(plugin)
      registered.push(plugin)
    }
    return registered
  }
  /**
   * 配置插件
   * @param config - 配置
   */
  private async invokeConfigHook(config: UserConfig): Promise<void> {
    if (!Array.isArray(config.plugins)) return void 0
    // 注册插件
    const plugins = this.registerPlugins(config.plugins)
    // 如果没有注册成功的插件，则返回
    if (!plugins.length) return void 0
    // 调用插件的 invokeConfigHook 方法
    const results: (void | UserConfig | Promise<void | UserConfig>)[] = []
    const pluginIndex = []
    for (const plugin of plugins) {
      // 调用插件的 invokeConfigHook 方法
      if (typeof plugin.config === 'function') {
        const result = plugin.config(config, this.env)
        if (result) {
          results.push(result)
          pluginIndex.push(plugin)
        }
      }
    }
    // 处理插件的 invokeConfigHook 方法返回值
    const results2 = await Promise.all(results)
    for (let i = 0; i < results2.length; i++) {
      const plugin = pluginIndex[i]!
      const result = results2[i]
      if (isPlainObject(result)) {
        try {
          // 校验返回的配置
          validateConfig(result, this.root)
        } catch (e) {
          throw new Error(
            `Plugin(${plugin.name}) config returned invalid config: ${e instanceof Error ? e.message : String(e)}`
          )
        }
        // 存储插件的 invokeConfigHook 方法返回的配置，待后续处理
        this.#pluginConfig.set(plugin.name, result)
        await this.invokeConfigHook(result)
      }
    }
  }
  /**
   * 配置解析完成
   * @param config - 配置
   * @private
   */
  private async invokeConfigResolvedHook(config: ResolvedConfig): Promise<void> {
    await invokeParallel(this.#plugins, 'configResolved', config, this.env)
  }
  /**
   * 解析配置
   * @param config - 配置
   * @private
   */
  private async resolveConfig(config: UserConfig): Promise<ResolvedConfig> {
    this.#plugins = this.sortPlugins(this.#plugins)
    let currentConfig = mergeConfig(DEFAULT_CONFIG, config)
    for (const plugin of this.#plugins) {
      const pluginConfig = this.#pluginConfig.get(plugin.name)
      if (pluginConfig) {
        currentConfig = mergeConfig(currentConfig, pluginConfig)
      }
    }
    if (!config.locales || config.locales.length === 0) {
      currentConfig.locales = [{ id: 'zh-CN', name: '简体中文' }]
    }
    if (currentConfig.docDir.include.length === 0) {
      currentConfig.docDir.include = ['**/*.md']
    }
    if (currentConfig.docDir.exclude.length === 0) {
      currentConfig.docDir.exclude = ['**/.*']
    }
    return currentConfig
  }
  /**
   * 初始化
   *
   * @param config - 配置
   * @private
   */
  private async init(config: UserConfig): Promise<ResolvedConfig> {
    await this.invokeConfigHook(config)
    this.#config = await this.resolveConfig(config)
    await this.invokeConfigResolvedHook(this.#config)
    return this.#config
  }
  /**
   * 获取配置
   */
  public get config(): ResolvedConfig {
    return this.#config
  }
  /**
   * 获取插件列表（已排序）
   */
  public get plugins(): VitaPressPlugin[] {
    return this.#plugins
  }
  /**
   * 创建配置管理器
   * @param root - 根目录
   * @param config - 配置文件名
   * @param env - 环境变量
   */
  public static async create(
    root: string,
    config: string | UserConfig | undefined,
    env: ConfigEnv
  ): Promise<ConfigManager> {
    let loadedConfig: UserConfig
    if (isPlainObject(config)) {
      loadedConfig = config
    } else {
      const result = await loadUserConfig(root, config)
      loadedConfig = result.config
    }
    const manager = new ConfigManager(root, env)
    await manager.init(loadedConfig)
    return manager
  }
}
