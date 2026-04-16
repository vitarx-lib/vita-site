import MarkdownIt from 'markdown-it'
import type { ParsedNode, RouteNode } from 'vitarx-router/file-router'
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
   * 在解析 Markdown 文件之前调用
   * @param file - 文件路径
   * @param content - 文件内容
   * @param app - VitaPress 服务端应用实例
   * @returns {string | void} - 返回修改后的内容或 void
   */
  beforeParse?: (file: string, content: string) => string | void
  /**
   * 在解析 Markdown 文件之后调用
   * @param res - 解析结果
   * @param app - VitaPress 服务端应用实例
   * @returns {MdParseResult | void} - 返回解析结果（自动合并）或 void
   */
  afterParse?: (res: MdParseResult) => MdParseResult | void
  /**
   * 生成路由之前
   */
  extendRoute?: (route: RouteNode, parsed: Readonly<ParsedNode>, app: VitaPressApp) => void
}

/**
 * VitaPress 插件接口
 */
export interface VitaPressPlugin extends PluginHooks {
  /** 插件名称 */
  name: string
  /** 插件优先级，数字越大优先级越高 */
  enforce?: 'pre' | 'post' | number
}
