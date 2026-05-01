import MarkdownIt from 'markdown-it'
import type { RouteNode } from 'vitarx-router/file-router'
import { VitaPressApp } from '../app/index.js'
import type { MdParseResult } from '../markdown/index.js'
import type { ResolvedConfig, UserConfig } from './config.js'

/**
 * 插件钩子函数
 */
export interface PluginHooks {
  /**
   * 配置解析前调用
   *
   * 注意事项： 不应该修改 config 对象（特别是 config.plugins），应该返回一个新的配置对象。
   */
  config?: (config: UserConfig) => void | UserConfig | Promise<void | UserConfig>
  /**
   * 配置解析完成后调用
   */
  configResolved?: (config: ResolvedConfig) => void | Promise<void>
  /**
   * 配置 MarkdownIt 实例
   */
  markdown?: (md: MarkdownIt) => void | Promise<void>
  /**
   * 应用实例创建完成后调用
   *
   * 在 VitaPressApp 实例完全构造后、路由扫描前调用。
   * 插件可在此钩子中记录 app 实例引用，供后续钩子使用。
   *
   * @param app - VitaPress 应用实例
   */
  appCreated?: (app: VitaPressApp) => void | Promise<void>
  /**
   * 在解析 Markdown 文件之前调用
   *
   * @param content - 文件内容
   * @param file - 文件路径
   * @param app - VitaPress 应用实例
   * @returns 修改后的内容或 void
   */
  beforeParse?: (content: string, file: string, app: VitaPressApp) => string | void
  /**
   * 在解析 Markdown 文件之后调用（通知钩子）
   *
   * 此钩子为纯通知性质，插件应仅读取解析结果数据，
   * 不应修改 res 对象——修改不会被反映到最终输出。
   * 即使缓存命中也会调用此钩子，确保插件能收集到所有文档数据。
   *
   * @param res - 解析结果（只读，不应修改）
   * @param app - VitaPress 应用实例
   */
  afterParse?: (res: MdParseResult, app: VitaPressApp) => void
  /**
   * 扩展路由节点
   */
  extendRoute?: (route: RouteNode, app: VitaPressApp) => void
  /**
   * 写入路由之前
   */
  beforeWriteRoutes?: (routes: RouteNode[], app: VitaPressApp) => RouteNode[] | void
  /**
   * 构建结束时调用
   *
   * 在客户端构建完成且所有 HTML 文件已生成后调用。
   * 适用于搜索索引生成、站点地图输出等需要在构建产物上操作的场景。
   *
   * @param app - VitaPress 应用实例
   */
  buildEnd?: (app: VitaPressApp) => void | Promise<void>
}

/**
 * VitaPress 插件接口
 */
export interface VitaPressPlugin extends PluginHooks {
  /** 插件名称 */
  name: string
  /** 插件优先级，数字越大优先级越高 */
  enforce?: 'pre' | 'post' | number
  /**
   * 客户端主题配置的模块路径
   *
   * 构建时自动 import 并与用户客户端配置合并，优先级低于用户配置。
   * 模块应导出 ThemeExpandConfig 类型的默认导出。
   */
  clientConfig?: string
}
