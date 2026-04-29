import config from 'virtual:vitapress/runtime/config'
import { type App, createComponentView, createSSRApp, type SSRApp } from 'vitarx'
import {
  type AfterCallback,
  createMemoryRouter,
  createWebRouter,
  type RouteLocation,
  type Router,
  type RouterOptions,
  RouterView
} from 'vitarx-router'
import { handleHotUpdate, routes } from 'vitarx-router/auto-routes'
import type { EnhanceApp } from './config.js'
import { I18n } from './i18n.js'
import { concatHook } from './merge.js'

/**
 * 创建基础应用实例和路由配置
 *
 * @returns 应用实例与路由配置
 */
function createBaseApp(): { app: SSRApp; routerOptions: RouterOptions } {
  const layout = config.layout ?? createComponentView(RouterView)
  const app = createSSRApp(layout, config.app)
  const routerOptions: RouterOptions = Object.assign({}, { routes, mode: 'path' }, config.router)
  return { app, routerOptions }
}

/**
 * 执行应用增强函数，兼容单个函数或数组
 *
 * @param enhanceApp - 单个增强函数或增强函数数组
 * @param app - 应用实例
 * @param router - 路由器实例
 */
function applyEnhanceApp(
  enhanceApp: EnhanceApp | EnhanceApp[] | undefined,
  app: App,
  router: Router
): void {
  if (enhanceApp == null) return
  const fns = Array.isArray(enhanceApp) ? enhanceApp : [enhanceApp]
  for (const fn of fns) {
    fn(app, router)
  }
}

/**
 * 注册路由、国际化插件并执行增强函数
 *
 * @param app - 应用实例
 * @param router - 路由器实例
 */
function setupPlugins(app: App, router: Router): void {
  app.use(router)
  const i18n = new I18n(router, config.i18n)
  app.use(i18n)
  applyEnhanceApp(config.enhanceApp, app, router)
}

interface PageMeta {
  title: string
  description: string
  keywords: string
  lang: string
}

/**
 * 创建页面元数据管理器
 *
 * @returns {AfterCallback} 页面元数据管理器
 */
function createPageMetaManager(): AfterCallback {
  const htmlEl = document.documentElement
  const metaDescription = document.querySelector<HTMLMetaElement>('meta[name="description"]')
  const metaKeywords = document.querySelector<HTMLMetaElement>('meta[name="keywords"]')

  const rawMeta: PageMeta = {
    title: document.title,
    description: metaDescription?.content || '',
    keywords: metaKeywords?.content || '',
    lang: htmlEl.lang
  }

  return (to: RouteLocation): void => {
    const meta = to.meta
    document.title = typeof meta['title'] === 'string' ? meta['title'] : rawMeta.title
    if (metaDescription) {
      metaDescription.content =
        typeof meta['description'] === 'string' ? meta['description'] : rawMeta.description
    }
    if (metaKeywords) {
      metaKeywords.content =
        typeof meta['keywords'] === 'string' ? meta['keywords'] : rawMeta.keywords
    }
    if (typeof meta['lang'] === 'string') {
      htmlEl.lang = meta['lang']
    } else if (rawMeta.lang) {
      htmlEl.lang = rawMeta.lang
    }
  }
}

/**
 * 创建客户端应用
 *
 * @returns {Promise<App>} 应用实例
 */
async function createClientApp(): Promise<SSRApp> {
  const { app, routerOptions } = createBaseApp()
  routerOptions.afterEach = concatHook(routerOptions.afterEach, createPageMetaManager())
  const router = createWebRouter(routerOptions)
  if (import.meta.hot) {
    handleHotUpdate(router)
  }
  await router.isReady()
  await router.resolveComponents()
  setupPlugins(app, router)
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
  const { app, routerOptions } = createBaseApp()
  const router = createMemoryRouter(routerOptions)
  setupPlugins(app, router)
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
