import { type App, type Computed, computed, getApp } from 'vitarx'
import { cloneRouteLocation, type RouteLocation, type Router } from 'vitarx-router'
import type { Locale } from '../server/index.js'
import { useI18nMessages } from './i18nMessages.js'
import { locales } from './locales.js'

export type I18nMessages = Record<string, Record<string, string>>

/**
 * i18n 注入键
 */
export const __I18N_INJECT_KEY__ = Symbol.for('__vitapress_i18n__')

interface PageLocale extends Locale {
  route: RouteLocation | null
}

/**
 * 国际化类
 */
export class I18n {
  /**
   * 当前语言标识（响应式）
   */
  public readonly lang: Computed<string>
  /**
   * 当前语言配置（计算属性）
   */
  public readonly locale: Computed<PageLocale | undefined>
  /**
   * 所有支持的语言列表
   */
  public readonly locales: Computed<readonly PageLocale[]>
  /**
   * 默认语言标识
   */
  public readonly defaultLang: string
  /**
   * 翻译消息
   * @private
   */
  readonly #messages: I18nMessages
  /**
   * 当前语言的消息（计算属性）
   * @private
   */
  readonly #currentMessages: Computed<Record<string, string>>

  constructor(private readonly router: Router) {
    this.defaultLang = locales[0]!.id
    this.#messages = useI18nMessages()
    this.lang = computed((prevLang): string => {
      return router.route.meta['lang'] || prevLang || this.defaultLang
    })
    let lastComputedLang: string | undefined
    this.locales = computed((oldValue): PageLocale[] => {
      const currentRoute = this.router.route
      const currentLang = this.lang.value
      if (currentLang === lastComputedLang && oldValue) return oldValue
      lastComputedLang = currentLang
      let path: string
      if (currentLang === this.defaultLang) {
        path = currentRoute.path
      } else {
        path = currentRoute.path.replace(`-${currentLang}`, '')
        if (path === '/index') path = '/'
      }
      return locales.map(item => {
        return {
          ...item,
          route:
            item.id === currentLang
              ? cloneRouteLocation(currentRoute)
              : this.matchRoute(path, item.id)
        }
      })
    })
    this.locale = computed(() => {
      return this.locales.value.find(l => l.id === this.lang.value)
    })
    this.#currentMessages = computed(() => {
      const currentLang = this.lang.value
      return this.#messages[currentLang] || {}
    })
  }

  /**
   * 设置当前语言
   *
   * @param newLang - 语言标识
   * @throws {Error} 如果语言标识无效
   */
  setLang(newLang: string): void {
    const locale = this.locales.value.find(l => l.id === newLang)
    if (!locale) {
      throw new Error(`[i18n] Invalid language: ${newLang}`)
    }
    if (!locale.route) {
      throw new Error(`[i18n] Currently, there are no matching routes for the ${newLang} language`)
    }
    this.router.push(locale.route)
  }

  /**
   * 翻译函数
   *
   * @param key - 翻译键
   * @param params - 插值参数
   * @returns {string} 翻译后的文本
   */
  t(key: string, params?: Record<string, string | number>): string {
    const ms = this.#currentMessages.value
    let text = ms[key] || this.#messages[this.defaultLang]?.[key] || key
    if (params) {
      for (const [paramKey, value] of Object.entries(params)) {
        text = text.replace(new RegExp(`\\{${paramKey}\\}`, 'g'), String(value))
      }
    }

    return text
  }

  /**
   * 判断语言是否支持
   *
   * @param targetLang - 语言标识
   * @returns {boolean} 是否支持该语言
   */
  has(targetLang: string): boolean {
    return this.locales.value.some(l => l.id === targetLang && l.route)
  }

  /**
   * 安装 i18n
   * @param app
   */
  install(app: App): void {
    app.provide(__I18N_INJECT_KEY__, this)
  }

  /**
   * 匹配路由
   * @param path
   * @param newLang
   * @private
   */
  private matchRoute(path: string, newLang: string) {
    if (path === '/') {
      path = newLang === this.defaultLang ? path : `/index-${newLang}`
    } else {
      path = newLang === this.defaultLang ? path : `${path}-${newLang}`
    }
    return this.router.matchRoute({ index: path })
  }
}

/**
 * 获取 i18n 实例
 *
 * @returns {I18n} i18n 实例
 * @throws {Error} 如果 i18n 未被初始化
 */
export function useI18n(): I18n {
  const app = getApp()
  if (!app) {
    throw new Error('[i18n] useI18n must be called in the context of the VitarxApp.')
  } else {
    const instance = app.inject(__I18N_INJECT_KEY__)
    if (!(instance instanceof I18n)) {
      throw new Error(
        '[i18n] failing to get an i18n instance from the app context, have you already called app.use(i18n)?'
      )
    }
    return instance
  }
}
