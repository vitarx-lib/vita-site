import type { AfterCallback, NavigationGuard, RouterOptions } from 'vitarx-router'
import type { EnhanceApp, RuntimeConfig, ThemeExpandConfig } from './config.js'
import type { I18nMessages, I18nOptions } from './i18n.js'

/**
 * 将钩子追加到现有钩子配置，兼容单函数或数组
 *
 * @param current - 当前已有的钩子
 * @param incoming - 待追加的钩子
 * @returns 合并后的钩子
 */
export function concatHook<T>(current: T | T[] | undefined, incoming: T | T[]): T | T[] {
  const hooks = Array.isArray(incoming) ? incoming : [incoming]
  if (current == null) return incoming
  if (Array.isArray(current)) {
    current.push(...hooks)
    return current
  }
  return [current, ...hooks]
}

/**
 * 深度合并 i18n messages（两层 Record 结构）
 *
 * @param base - 基础翻译（优先级低）
 * @param override - 覆盖翻译（优先级高）
 * @returns 合并后的翻译
 */
function mergeMessages(base: I18nMessages, override: I18nMessages): I18nMessages {
  const merged: I18nMessages = { ...base }
  for (const lang of Object.keys(override)) {
    merged[lang] = Object.assign({}, base[lang], override[lang])
  }
  return merged
}

/**
 * 合并 i18n 配置
 *
 * @param base - 基础配置（优先级低）
 * @param override - 覆盖配置（优先级高）
 * @returns 合并后的 i18n 配置
 */
function mergeI18nOptions(
  base: I18nOptions | undefined,
  override: I18nOptions | undefined
): I18nOptions {
  if (base == null && override == null) return {}
  if (base == null) return { ...override }
  if (override == null) return { ...base }
  const result: I18nOptions = { ...override }
  if (base.messages && override.messages) {
    result.messages = mergeMessages(base.messages, override.messages)
  } else if (base.messages) {
    result.messages = base.messages
  }
  return result
}

interface MergedRouterHooks {
  missing?: RouterOptions['missing']
  beforeEach?: RouterOptions['beforeEach']
  afterEach?: RouterOptions['afterEach']
}

/**
 * 合并路由配置中的钩子字段
 *
 * @param base - 基础路由配置（优先级低）
 * @param override - 覆盖路由配置（优先级高）
 * @returns 合并后的路由配置
 */
function mergeRouterHooks(base: MergedRouterHooks, override: MergedRouterHooks): MergedRouterHooks {
  const result: MergedRouterHooks = {}
  const missing = override.missing ?? base.missing
  if (missing != null) result.missing = missing
  if (base.beforeEach) result.beforeEach = base.beforeEach
  if (override.beforeEach) result.beforeEach = concatHook(result.beforeEach, override.beforeEach)
  if (base.afterEach) result.afterEach = base.afterEach
  if (override.afterEach) result.afterEach = concatHook(result.afterEach, override.afterEach)
  return result
}

/**
 * 合并增强函数列表
 *
 * @param base - 基础增强函数（优先级低，先执行）
 * @param override - 覆盖增强函数（优先级高，后执行）
 * @returns 合并后的增强函数数组或 undefined
 */
function mergeEnhanceApp(
  base: EnhanceApp | EnhanceApp[] | undefined,
  override: EnhanceApp | EnhanceApp[] | undefined
): EnhanceApp | EnhanceApp[] | undefined {
  if (base == null) return override
  if (override == null) return base
  const baseArr = Array.isArray(base) ? base : [base]
  const overrideArr = Array.isArray(override) ? override : [override]
  return [...baseArr, ...overrideArr]
}

/**
 * 将 ThemeExpandConfig 展开合并到 RuntimeConfig 中
 *
 * 合并策略：
 * - layout：override 覆盖 base
 * - missing：override 覆盖 base
 * - beforeEach / afterEach：base 先追加，override 后追加
 * - messages：深度合并，override 覆盖同 key
 * - enhanceApp：base 先执行，override 后执行
 *
 * @param base - 主题配置（优先级低）
 * @param override - 用户配置（优先级高）
 * @returns 合并后的运行时配置
 */
export function mergeRuntimeConfig(
  base: ThemeExpandConfig,
  override: RuntimeConfig
): RuntimeConfig {
  const result: RuntimeConfig = {}

  const layout = override.layout ?? base.layout
  if (layout != null) result.layout = layout

  const lazy = override.lazy ?? base.lazy
  if (lazy != null) result.lazy = lazy

  const baseHooks: MergedRouterHooks = {
    missing: base.missing,
    beforeEach: base.beforeEach,
    afterEach: base.afterEach
  }
  const overrideHooks: MergedRouterHooks = {
    missing: override.router?.missing,
    beforeEach: override.router?.beforeEach,
    afterEach: override.router?.afterEach
  }
  const mergedHooks = mergeRouterHooks(baseHooks, overrideHooks)
  const { beforeEach: _bh, afterEach: _ah, missing: _m, ...routerRest } = override.router ?? {}
  const router: NonNullable<RuntimeConfig['router']> = { ...routerRest }
  if (mergedHooks.missing != null) router.missing = mergedHooks.missing
  if (mergedHooks.beforeEach != null) router.beforeEach = mergedHooks.beforeEach
  if (mergedHooks.afterEach != null) router.afterEach = mergedHooks.afterEach
  result.router = router

  const i18n = mergeI18nOptions(
    base.messages ? { messages: base.messages } : undefined,
    override.i18n
  )
  if (Object.keys(i18n).length > 0) result.i18n = i18n

  const enhanceApp = mergeEnhanceApp(base.enhanceApp, override.enhanceApp)
  if (enhanceApp != null) result.enhanceApp = enhanceApp

  if (override.app != null) result.app = override.app

  return result
}

/**
 * 合并多个 ThemeExpandConfig 为一个
 *
 * 按数组顺序依次合并，后者覆盖前者。
 *
 * @param themes - 主题配置数组
 * @returns 合并后的主题配置
 */
export function mergeThemes(themes: ThemeExpandConfig[]): ThemeExpandConfig {
  if (themes.length === 0) return {}
  if (themes.length === 1) return { ...themes[0] }
  return themes.reduce((acc, theme) => {
    const result: ThemeExpandConfig = {}
    const layout = theme.layout ?? acc.layout
    if (layout != null) result.layout = layout
    const lazy = theme.lazy ?? acc.lazy
    if (lazy != null) result.lazy = lazy
    const missing = theme.missing ?? acc.missing
    if (missing != null) result.missing = missing
    const messages =
      acc.messages && theme.messages
        ? mergeMessages(acc.messages, theme.messages)
        : (theme.messages ?? acc.messages)
    if (messages != null) result.messages = messages
    const beforeEach = mergeEnhanceApp(
      acc.beforeEach as EnhanceApp | EnhanceApp[] | undefined,
      theme.beforeEach as EnhanceApp | EnhanceApp[] | undefined
    )
    if (beforeEach != null)
      result.beforeEach = beforeEach as unknown as NavigationGuard | NavigationGuard[]
    const afterEach = mergeEnhanceApp(
      acc.afterEach as EnhanceApp | EnhanceApp[] | undefined,
      theme.afterEach as EnhanceApp | EnhanceApp[] | undefined
    )
    if (afterEach != null)
      result.afterEach = afterEach as unknown as AfterCallback | AfterCallback[]
    const enhanceApp = mergeEnhanceApp(acc.enhanceApp, theme.enhanceApp)
    if (enhanceApp != null) result.enhanceApp = enhanceApp
    return result
  })
}

/**
 * 合并所有主题配置与用户配置，生成最终的运行时配置
 *
 * @param themes - 插件提供的主题配置数组（按注册顺序，后者优先级高于前者）
 * @param userConfig - 用户客户端配置（优先级最高）
 * @returns 最终的运行时配置
 */
export function resolveRuntimeConfig(
  themes: ThemeExpandConfig[],
  userConfig: RuntimeConfig
): RuntimeConfig {
  if (themes.length === 0) return userConfig
  const mergedTheme = mergeThemes(themes)
  return mergeRuntimeConfig(mergedTheme, userConfig)
}
