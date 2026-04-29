import type { App, AppConfig, Component, View } from 'vitarx'
import type { Router, RouterOptions } from 'vitarx-router'
import type { I18nOptions } from './i18n.js'

export type EnhanceApp = (app: App, router: Router) => void
/**
 * 运行时配置
 */
export interface RuntimeConfig {
  /**
   * 应用入口布局组件或视图对象
   *
   * @default () => <RouterView />
   */
  layout?: View | Component
  /**
   * 应用配置
   */
  app?: AppConfig
  /**
   * 路由配置
   */
  router?: RouterOptions
  /**
   * i18n 配置
   */
  i18n?: I18nOptions
  /**
   * 拓展应用
   *
   * 在app挂载之前调用
   *
   * @param app - 应用实例
   * @param router - 路由器实例
   */
  enhanceApp?: EnhanceApp | EnhanceApp[]
}
/**
 * 定义运行时配置
 *
 * @param config - 运行时配置
 * @returns {RuntimeConfig} 运行时配置
 */
export function defineConfig(config: RuntimeConfig): RuntimeConfig {
  return config
}
