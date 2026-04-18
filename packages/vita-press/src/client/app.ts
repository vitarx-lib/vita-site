import {
  type App,
  type AppConfig,
  type Component,
  createComponentView,
  createSSRApp,
  type View
} from 'vitarx'
import { createRouter, Router, type RouterOptions, RouterView } from 'vitarx-router'
import { handleHotUpdate, routes } from 'vitarx-router/auto-routes'

/**
 * 运行时配置
 */
export interface RuntimeConfig {
  /**
   * 应用入口组件或视图对象
   *
   * @default () => <RouterView />
   */
  app?: View | Component
  /**
   * 应用配置
   */
  appConfig?: AppConfig
  /**
   * 路由配置
   */
  router?: RouterOptions
  /**
   * 拓展应用
   *
   * 在app挂载之前调用
   *
   * @param app - 应用实例
   * @param router - 路由器实例
   */
  enhanceApp?: (app: App, router: Router) => void
}

/**
 * 创建应用
 *
 * @param config - 运行时配置
 * @returns {Promise<App>} 应用实例
 */
export async function createApp(config: RuntimeConfig = {}): Promise<App> {
  const routerOptions = Object.assign({}, { routes }, config.router)
  const router = createRouter(routerOptions)
  if (import.meta.hot) {
    handleHotUpdate(router)
  }
  await router.isReady()
  await router.resolveComponents()
  const app = createSSRApp(
    config.app ?? ((): View => createComponentView(RouterView)),
    config.appConfig
  )
  app.use(router)
  if (typeof config.enhanceApp === 'function') {
    config.enhanceApp(app, router)
  }
  app.mount('#root')
  return app
}
