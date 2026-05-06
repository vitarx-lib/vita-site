import type { AfterCallback, NavigationGuard, RouterOptions } from 'vitarx-router'
import type { ClientConfig, EnhanceApp, PluginClientConfig } from './config.js'

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
 * 将 PluginClientConfig 展开合并到 ClientConfig 中
 *
 * 合并策略：
 * - layout：override 覆盖 base
 * - missing：override 覆盖 base
 * - beforeEach / afterEach：base 先追加，override 后追加
 * - enhanceApp：base 先执行，override 后执行
 *
 * @param base - 主题配置（优先级低）
 * @param override - 用户配置（优先级高）
 * @returns 合并后的运行时配置
 */
export function mergeClientConfig(base: PluginClientConfig, override: ClientConfig): ClientConfig {
  const result: ClientConfig = {}

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
  const router: NonNullable<ClientConfig['router']> = { ...routerRest }
  if (mergedHooks.missing != null) router.missing = mergedHooks.missing
  if (mergedHooks.beforeEach != null) router.beforeEach = mergedHooks.beforeEach
  if (mergedHooks.afterEach != null) router.afterEach = mergedHooks.afterEach
  result.router = router

  const enhanceApp = mergeEnhanceApp(base.enhanceApp, override.enhanceApp)
  if (enhanceApp != null) result.enhanceApp = enhanceApp

  if (override.app != null) result.app = override.app

  return result
}

/**
 * 合并多个 PluginClientConfig 为一个
 *
 * 按数组顺序依次合并，后者覆盖前者。
 *
 * @param configs - 插件客户端配置数组
 * @returns 合并后的插件客户端配置
 */
export function mergePluginClientConfig(configs: PluginClientConfig[]): PluginClientConfig {
  if (configs.length === 0) return {}
  if (configs.length === 1) return { ...configs[0] }
  return configs.reduce((acc, theme) => {
    const result: PluginClientConfig = {}
    const layout = theme.layout ?? acc.layout
    if (layout != null) result.layout = layout
    const lazy = theme.lazy ?? acc.lazy
    if (lazy != null) result.lazy = lazy
    const missing = theme.missing ?? acc.missing
    if (missing != null) result.missing = missing
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
 * 合并所有插件客户端配置与用户配置，生成最终的运行时配置
 *
 * @param extended - 插件提供的客户端配置数组（按注册顺序，后者优先级高于前者）
 * @param userConfig - 用户客户端配置（优先级最高）
 * @returns 最终的运行时配置
 */
export function resolveClientConfig(
  extended: PluginClientConfig[],
  userConfig: ClientConfig
): ClientConfig {
  if (extended.length === 0) return userConfig
  const mergedTheme = mergePluginClientConfig(extended)
  return mergeClientConfig(mergedTheme, userConfig)
}
