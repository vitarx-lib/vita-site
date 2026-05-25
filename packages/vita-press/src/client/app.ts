import config from 'virtual:vitapress/runtime/config'
import { type App, createComponentView, createSSRApp, type SSRApp } from 'vitarx'
import type {
  AfterCallback,
  NavTarget,
  NotFoundTarget,
  RouteLocation,
  RoutePath,
  Router,
  RouterOptions
} from 'vitarx-router'
import { createMemoryRouter, createRouteManager, createWebRouter, RouterView } from 'vitarx-router'
import { handleHotUpdate, routes } from 'vitarx-router/auto-routes'
import type { AppPlugins, EnhanceApp } from './config.js'
import { I18n } from './i18n.js'
import { concatHook } from './merge.js'

/**
 * 处理首页路由重定向回退策略
 *
 * @param target
 */
function handleIndexRoute(target: NotFoundTarget): NavTarget | void {
  const path = target.index
  if (typeof path === 'string' && path.endsWith('/index.html')) {
    const fallback = (path.slice(0, -11) || '/') as RoutePath
    return { index: fallback, replace: true }
  }
  return void 0
}

/**
 * 创建基础应用实例和路由配置
 *
 * @returns 应用实例与路由配置
 */
function createBaseApp(): { app: SSRApp; routerOptions: RouterOptions } {
  const layout = config.layout ?? createComponentView(RouterView)
  const app = createSSRApp(layout, config.app)
  const routerOptions: RouterOptions = Object.assign(
    {
      routes: createRouteManager(routes),
      mode: 'path',
      suffix: '.html'
    },
    config.router
  )
  routerOptions.onNotFound = concatHook(handleIndexRoute, routerOptions.onNotFound)
  return { app, routerOptions }
}

/**
 * 执行应用增强函数，兼容单个函数或数组
 *
 * @param enhanceApp - 单个增强函数或增强函数数组
 * @param app - 应用实例
 * @param plugins - 应用插件
 */
function applyEnhanceApp(
  enhanceApp: EnhanceApp | EnhanceApp[] | undefined,
  app: App,
  plugins: AppPlugins
): void {
  if (enhanceApp == null) return
  const fns = Array.isArray(enhanceApp) ? enhanceApp : [enhanceApp]
  for (const fn of fns) {
    fn(app, plugins)
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
  const i18n = new I18n(router)
  app.use(i18n)
  applyEnhanceApp(config.enhanceApp, app, { router, i18n })
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
  routerOptions.afterEach = concatHook(createPageMetaManager(), routerOptions.afterEach)
  const router = createWebRouter(routerOptions, false)
  if (import.meta.hot) {
    handleHotUpdate(router)
  }
  setupPlugins(app, router)
  // 初始化路由
  router.init()
  await router.isReady()
  await router.resolveComponents()
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
