import type { App, AppConfig, Component, LazyLoadOptions, View } from 'vitarx'
import type { AfterCallback, NavigationGuard, Router, RouterOptions } from 'vitarx-router'
import type { I18n } from './i18n.js'

/**
 * 应用插件
 *
 * @description VitaPress 内部挂载到应用实例上的插件
 */
export interface AppPlugins {
  router: Router
  i18n: I18n
}

export type EnhanceApp = (app: App, plugins: AppPlugins) => void

/**
 * 插件客户端配置
 *
 * 插件/主题通过此接口向客户端注入配置，由 VitaPressPlugin.clientConfig 字段声明模块路径，
 * 构建时自动加载并合并，优先级低于用户 ClientConfig。
 */
export interface PluginClientConfig {
  /**
   * 应用入口布局组件或视图对象
   */
  layout?: View | Component
  /**
   * 惰性加载配置选项
   */
  lazy?: LazyLoadOptions
  /**
   * 拓展应用
   *
   * 在app挂载之前调用
   *
   * @param app - 应用实例
   * @param router - 路由器实例
   */
  enhanceApp?: EnhanceApp | EnhanceApp[]
  /**
   * 未匹配到路由时显示的组件
   */
  missing?: Component
  /**
   * 路由跳转前的守卫
   */
  beforeEach?: NavigationGuard | NavigationGuard[]
  /**
   * 路由跳转后的回调
   */
  afterEach?: AfterCallback | AfterCallback[]
}

/**
 * 运行时配置
 *
 * 由虚拟模块 virtual:vitapress/runtime/config 提供，
 * 已合并所有插件的主题配置，无需手动处理 theme 字段。
 */
export interface ClientConfig {
  /**
   * 应用入口布局组件或视图对象
   *
   * @default () => <RouterView />
   */
  layout?: View | Component
  /**
   * 惰性加载配置选项
   *
   * 用于配置路由组件懒加载行为，如 loading 组件、延迟时间、超时时间等。
   *
   * @example
   * ```ts
   * // .vitapress/config.client.ts
   * import { defineConfig } from 'vitapress'
   * import Loading from './components/Loading.tsx'
   *
   * export default defineConfig({
   *   lazy: {
   *     loading: () => Loading,
   *     delay: 300,
   *     timeout: 10000,
   *     onError: (e) => <div>加载失败: {String(e)}</div>
   *   }
   * })
   * ```
   */
  lazy?: LazyLoadOptions
  /**
   * 应用配置
   */
  app?: AppConfig
  /**
   * 路由配置
   */
  router?: Omit<RouterOptions, 'routes'>
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
 * 定义客户端运行时配置
 *
 * 注意：此辅助函数仅限于客户端配置文件使用，在服务端配置文件中使用导入路径，请使用 `import { defineConfig } from 'vitapress/server'`。
 *
 * @param config - 运行时配置
 * @returns {ClientConfig} 运行时配置
 */
export function defineConfig<T extends ClientConfig>(config: T): T {
  return config
}

/**
 * 定义插件客户端配置
 *
 * @param config - 插件客户端配置
 * @returns {PluginClientConfig} 插件客户端配置
 */
export function definePluginClientConfig<T extends PluginClientConfig>(config: T): T {
  return config
}
