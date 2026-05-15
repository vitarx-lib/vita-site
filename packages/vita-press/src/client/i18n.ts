import { type App, type Computed, computed, getApp } from 'vitarx'
import { type RoutePath, type Router } from 'vitarx-router'
import type { Locale } from '../server/index.js'
import { useI18nMessages } from './i18nMessages.js'
import { locales } from './locales.js'

/**
 * 翻译消息
 *
 * `record<语言ID, record<翻译标识符, 翻译消息>>`
 */
export type I18nMessages = Record<string, Record<string, string>>

/**
 * i18n 注入键
 */
export const __I18N_INJECT_KEY__ = Symbol.for('__vitapress_i18n__')

export interface PageLocale extends Locale {
  /**
   * 路由路径
   *
   * 可用于路由导航，但不保证百分百匹配，
   * 因为当前页面可能不存在该语言的版本，
   * 可通过 `router.manager.findByPath(path)` 判断当前页面是否存在特定语言版本
   */
  path: RoutePath
}

function removePathEndSlash<T extends string>(str: T): T {
  if (str === '/') return str
  return str.endsWith('/') ? (str.slice(0, -1) as T) : str
}

/**
 * 国际化（i18n）管理类，用于处理多语言切换和文本翻译。
 *
 * 主要功能：
 * - 管理当前语言状态和语言列表
 * - 提供文本翻译功能（支持参数插值）
 * - 处理语言切换时的路由跳转
 * - 支持语言可用性检查
 *
 * @example
 * ```typescript
 * // 在应用中使用
 * const i18n = new I18n(router)
 * app.use(i18n)
 *
 * // 在组件中使用
 * const i18n = inject(__I18N_INJECT_KEY__) as I18n
 * i18n.setLang('en')  // 切换语言
 * i18n.t('welcome')   // 翻译文本
 * i18n.t('greeting', { name: 'John' })  // 带参数的翻译
 * ```
 *
 * @param router - 路由实例，用于处理语言切换时的路由跳转
 *
 * 注意事项：
 * - 语言切换会触发路由跳转，确保路由配置正确
 * - 翻译键不存在时会返回键名本身或默认值
 * - 语言标识无效时会抛出错误
 * - 路由路径格式需符合约定：默认语言无后缀，其他语言格式为 `path-{lang}`
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
    this.locales = computed((): PageLocale[] => {
      const currentRoute = this.router.route
      const currentPath = removePathEndSlash(currentRoute.path)
      const currentLang = this.lang.value
      let path: RoutePath = currentPath
      const langSuffix = `-${currentLang}`
      if (currentLang !== this.defaultLang && currentPath.endsWith(langSuffix)) {
        // 找到后缀开始的位置，并截取它之前的所有内容
        path = currentPath.slice(0, currentPath.lastIndexOf(langSuffix)) as RoutePath
      }
      // 兼容根路径/index情况多语言应该使用根路径
      if (path === '/index') path = '/'
      // 兼容子路由path为空使用父级path情况多语言应该使用父级path+/index
      const lastMatched = currentRoute.matched.at(-1)
      if (
        lastMatched &&
        !path.endsWith('/index') &&
        lastMatched.path === lastMatched.parent?.path
      ) {
        path = `${path}/index`
      }
      return locales.map(item => {
        return {
          ...item,
          path: item.id === currentLang ? currentPath : this.buildPath(path, item.id)
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
    if (!locale.path) {
      throw new Error(`[i18n] Currently, there are no matching routes for the ${newLang} language`)
    }
    this.router.push(locale.path)
  }

  /**
   * 翻译函数
   *
   * @param key - 翻译键
   * @param params - 插值参数或未匹配时的默认值（字符串）
   * @param defaultValue - 未匹配时的默认回退文本，优先级低于 params 为字符串时的值
   * @returns {string} 翻译后的文本
   */
  t(key: string, params?: Record<string, string | number> | string, defaultValue?: string): string {
    const ms = this.#currentMessages.value
    const fallback = typeof params === 'string' ? params : defaultValue
    let text = ms[key] || fallback || this.#messages[this.defaultLang]?.[key] || key
    if (params && typeof params === 'object') {
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
    return this.locales.value.some(l => l.id === targetLang && l.path)
  }

  /**
   * 安装 i18n
   * @param app
   */
  install(app: App): void {
    app.provide(__I18N_INJECT_KEY__, this)
  }

  /**
   * 构建路由路径
   *
   * @param path - 路由路径
   * @param [newLang = this.lang.value] - 语言标识
   */
  public buildPath(path: RoutePath, newLang?: string): RoutePath {
    newLang ??= this.lang.value
    if (newLang === this.defaultLang) return path
    if (path === '/') return `/index-${newLang}`
    return `${path}-${newLang}`
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
    throw new Error('[vitapress] useI18n must be called in the context of the VitarxApp.')
  } else {
    const instance = app.inject(__I18N_INJECT_KEY__)
    if (!(instance instanceof I18n)) {
      throw new Error(
        '[vitapress] failing to get an i18n instance from the app context, have you already called app.use(i18n)?'
      )
    }
    return instance
  }
}
