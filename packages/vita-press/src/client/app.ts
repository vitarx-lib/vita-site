import config from 'virtual:vitapress/runtime/config'
import { type App, createComponentView, createSSRApp, type View } from 'vitarx'
import { createMemoryRouter, createRouter, RouterView } from 'vitarx-router'
import { handleHotUpdate, routes } from 'vitarx-router/auto-routes'

/**
 * 创建客户端应用
 *
 * @returns {Promise<App>} 应用实例
 */
async function createClientApp(): Promise<App> {
  const routerOptions = Object.assign({}, { routes, mode: 'path' }, config.router)
  const router = createRouter(routerOptions)
  if (import.meta.hot) {
    handleHotUpdate(router)
  }
  await router.isReady()
  await router.resolveComponents()
  const app = createSSRApp(
    config.layout ?? ((): View => createComponentView(RouterView)),
    config.app
  )
  app.use(router)
  if (typeof config.enhanceApp === 'function') {
    config.enhanceApp(app, router)
  }
  app.mount(
    '#root',
    (window as unknown as { __INITIAL_STATE__?: Record<string, any> }).__INITIAL_STATE__
  )
  return app
}

/**
 * 创建nodejs应用
 *
 * @returns {Promise<App>} 应用实例
 */
async function createNodeApp(): Promise<App> {
  const routerOptions = Object.assign({}, { routes }, config.router)
  const router = createMemoryRouter(routerOptions)
  const app = createSSRApp(
    config.layout ?? ((): View => createComponentView(RouterView)),
    config.app
  )
  app.use(router)
  if (typeof config.enhanceApp === 'function') {
    config.enhanceApp(app, router)
  }
  return app
}

/**
 * 创建应用
 *
 * @returns {Promise<App>} 应用实例
 */
export async function createApp(): Promise<App> {
  if (__VITARX_SSR__) {
    return await createNodeApp()
  }
  return await createClientApp()
}
