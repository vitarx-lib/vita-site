import { type App, type Computed, computed, getApp, shallowRef, type ShallowRef } from 'vitarx'
import type { Locale } from '../server/index.js'
import { locales } from './locales.js'

export type I18nMessages = Record<string, Record<string, string>>

const LANG_CACHE_KEY = 'vitapress:lang'

/**
 * 从缓存中读取语言偏好
 *
 * @returns 缓存的语言标识或 null
 */
function getCachedLang(): string | null {
  try {
    return localStorage.getItem(LANG_CACHE_KEY)
  } catch {
    return null
  }
}

/**
 * 将语言偏好写入缓存
 *
 * @param lang - 语言标识
 */
function setCachedLang(lang: string): void {
  try {
    localStorage.setItem(LANG_CACHE_KEY, lang)
  } catch {
    // localStorage 不可用时静默忽略
  }
}

export interface I18nOptions {
  /**
   * 翻译消息
   *
   * @example
   * ```ts
   * {
   *   'zh-CN': {
   *     'nav.home': '首页',
   *     'nav.guide': '指南'
   *   },
   *   'en-US': {
   *     'nav.home': 'Home',
   *     'nav.guide': 'Guide'
   *   }
   * }
   * ```
   */
  messages?: I18nMessages
}

/**
 * i18n 注入键
 */
export const __I18N_INJECT_KEY__ = Symbol.for('__vitapress_i18n__')
/**
 * 国际化类
 */
export class I18n {
  /**
   * 当前语言标识（响应式）
   */
  public readonly lang: ShallowRef<string>
  /**
   * 当前语言配置（计算属性）
   */
  public readonly locale: Computed<Locale | undefined>
  /**
   * 所有支持的语言列表
   */
  public readonly locales: readonly Locale[]
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

  constructor(options: I18nOptions = {}) {
    this.locales = locales
    this.#messages = options.messages || {}
    const cachedLang = getCachedLang()
    const initialLang =
      cachedLang && this.locales.some(l => l.id === cachedLang) ? cachedLang : this.locales[0]!.id
    this.lang = shallowRef(initialLang)
    this.locale = computed(() => {
      return this.locales.find(l => l.id === this.lang.value)
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
   */
  setLang(newLang: string): void {
    const isValidLang = this.locales.some(locale => locale.id === newLang)
    if (!isValidLang) {
      console.warn(`[i18n] Invalid language: ${newLang}`)
      return
    }
    this.lang.value = newLang
    setCachedLang(newLang)
    if (typeof document !== 'undefined') {
      document.documentElement.lang = newLang
    }
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
    let text = ms[key] || key

    if (params) {
      for (const [paramKey, value] of Object.entries(params)) {
        text = text.replace(new RegExp(`\\{${paramKey}\\}`, 'g'), String(value))
      }
    }

    return text
  }

  /**
   * 判断是否为当前语言
   *
   * @param targetLang - 语言标识
   * @returns {boolean} 是否为当前语言
   */
  isLang(targetLang: string): boolean {
    return this.lang.value === targetLang
  }

  /**
   * 安装 i18n
   * @param app
   */
  install(app: App): void {
    app.provide(__I18N_INJECT_KEY__, this)
  }
}

/**
 * 创建 i18n 实例
 *
 * @param options - i18n 配置选项
 * @returns i18n 实例
 */
export function createI18n(options?: I18nOptions): I18n {
  return new I18n(options)
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
