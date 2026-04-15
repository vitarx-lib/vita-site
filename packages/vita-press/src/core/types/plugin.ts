import { Router } from 'vitarx-router'
import { MdParser } from '../markdown/index.js'
import type { ResolvedConfig, UserConfig } from './config.js'

/**
 * VitePress 插件上下文
 */
export interface VitaPressPluginContext {
  /** 用户配置 */
  config: ResolvedConfig
  /** 路由器实例 */
  router: Router
  /** Markdown 解析器实例 */
  mdParser: MdParser
  /** 是否为开发模式 */
  isDev: boolean
  /** 命令模式 */
  command: 'serve' | 'build'
}

/**
 * 插件钩子函数
 */
export interface PluginHooks {
  config?: (config: UserConfig) => UserConfig | void
  /**
   * 配置解析完成后调用
   * 可以修改配置
   */
  configResolved?: (config: ResolvedConfig) => void
}

/**
 * VitaPress 插件接口
 */
export interface VitaPressPlugin extends PluginHooks {
  /** 插件名称 */
  name: string
  /** 插件版本 */
  version?: string
  /** 插件描述 */
  description?: string
  /** 插件优先级，数字越大优先级越高 */
  enforce?: 'pre' | 'post' | number
}
