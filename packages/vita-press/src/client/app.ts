import config from 'virtual:vitapress/runtime/config'
import { type App, createComponentView, createSSRApp, type View } from 'vitarx'
import {
  type AfterCallback,
  createMemoryRouter,
  createRouter,
  type RouteLocation,
  RouterView
} from 'vitarx-router'
import { handleHotUpdate, routes } from 'vitarx-router/auto-routes'

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
async function createClientApp(): Promise<App> {
  const routerOptions = Object.assign({}, { routes, mode: 'path' }, config.router)
  const metaManager = createPageMetaManager()
  if (routerOptions.afterEach) {
    if (Array.isArray(routerOptions.afterEach)) {
      routerOptions.afterEach.push(metaManager)
    } else {
      routerOptions.afterEach = [routerOptions.afterEach, metaManager]
    }
  } else {
    routerOptions.afterEach = metaManager
  }
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
