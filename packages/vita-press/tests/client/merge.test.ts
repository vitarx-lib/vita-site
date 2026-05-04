import { describe, expect, it } from 'vitest'
import type { ClientConfig, ExtendedConfig } from '../../src/client/config.js'
import {
  concatHook,
  mergeClientConfig,
  mergeExtendedConfig,
  resolveClientConfig
} from '../../src/client/merge.js'

describe('concatHook', () => {
  it('current 为 undefined 时应返回 incoming', () => {
    const fn = () => {}
    expect(concatHook(undefined, fn)).toBe(fn)
  })

  it('current 为 undefined 且 incoming 为数组时应返回数组', () => {
    const fns = [() => {}, () => {}]
    expect(concatHook(undefined, fns)).toBe(fns)
  })

  it('current 为单函数时应合并为数组', () => {
    const fn1 = () => {}
    const fn2 = () => {}
    const result = concatHook(fn1, fn2) as (() => void)[]
    expect(result).toHaveLength(2)
    expect(result[0]).toBe(fn1)
    expect(result[1]).toBe(fn2)
  })

  it('current 为数组时应原地 push 并返回', () => {
    const fn1 = () => {}
    const fn2 = () => {}
    const arr = [fn1]
    const result = concatHook(arr, fn2)
    expect(result).toBe(arr)
    expect(arr).toHaveLength(2)
    expect(arr[1]).toBe(fn2)
  })

  it('current 为数组且 incoming 为数组时应全部 push', () => {
    const fn1 = () => {}
    const fn2 = () => {}
    const fn3 = () => {}
    const arr = [fn1]
    const result = concatHook(arr, [fn2, fn3])
    expect(result).toBe(arr)
    expect(arr).toHaveLength(3)
  })
})

describe('mergeRuntimeConfig', () => {
  it('空 theme 和空 user 应返回空配置', () => {
    const result = mergeClientConfig({}, {})
    expect(result.layout).toBeUndefined()
    expect(result.enhanceApp).toBeUndefined()
    expect(result.app).toBeUndefined()
  })

  it('layout: user 覆盖 theme', () => {
    const themeLayout = {} as any
    const userLayout = {} as any
    const result = mergeClientConfig({ layout: themeLayout }, { layout: userLayout })
    expect(result.layout).toBe(userLayout)
  })

  it('layout: user 缺失时回退到 theme', () => {
    const themeLayout = {} as any
    const result = mergeClientConfig({ layout: themeLayout }, {})
    expect(result.layout).toBe(themeLayout)
  })

  it('missing: user.router.missing 覆盖 theme.missing', () => {
    const themeMissing = {} as any
    const userMissing = {} as any
    const result = mergeClientConfig(
      { missing: themeMissing },
      { router: { missing: userMissing } }
    )
    expect(result.router?.missing).toBe(userMissing)
  })

  it('missing: user 缺失时回退到 theme', () => {
    const themeMissing = {} as any
    const result = mergeClientConfig({ missing: themeMissing }, {})
    expect(result.router?.missing).toBe(themeMissing)
  })

  it('beforeEach: 按 theme → user 顺序追加', () => {
    const themeGuard = (() => {}) as any
    const userGuard = (() => {}) as any
    const result = mergeClientConfig(
      { beforeEach: themeGuard },
      { router: { beforeEach: userGuard } }
    )
    const guards = result.router?.beforeEach as any[]
    expect(guards).toHaveLength(2)
    expect(guards[0]).toBe(themeGuard)
    expect(guards[1]).toBe(userGuard)
  })

  it('beforeEach: 仅 theme 有时保留', () => {
    const themeGuard = (() => {}) as any
    const result = mergeClientConfig({ beforeEach: themeGuard }, {})
    expect(result.router?.beforeEach).toBe(themeGuard)
  })

  it('beforeEach: 仅 user 有时保留', () => {
    const userGuard = (() => {}) as any
    const result = mergeClientConfig({}, { router: { beforeEach: userGuard } })
    expect(result.router?.beforeEach).toBe(userGuard)
  })

  it('beforeEach: theme 数组 + user 单函数', () => {
    const g1 = (() => {}) as any
    const g2 = (() => {}) as any
    const g3 = (() => {}) as any
    const result = mergeClientConfig({ beforeEach: [g1, g2] }, { router: { beforeEach: g3 } })
    const guards = result.router?.beforeEach as any[]
    expect(guards).toHaveLength(3)
    expect(guards[0]).toBe(g1)
    expect(guards[1]).toBe(g2)
    expect(guards[2]).toBe(g3)
  })

  it('afterEach: 按 theme → user 顺序追加', () => {
    const themeCb = (() => {}) as any
    const userCb = (() => {}) as any
    const result = mergeClientConfig({ afterEach: themeCb }, { router: { afterEach: userCb } })
    const callbacks = result.router?.afterEach as any[]
    expect(callbacks).toHaveLength(2)
    expect(callbacks[0]).toBe(themeCb)
    expect(callbacks[1]).toBe(userCb)
  })

  it('enhanceApp: 按 theme → user 顺序合并', () => {
    const themeEnhance = (() => {}) as any
    const userEnhance = (() => {}) as any
    const result = mergeClientConfig({ enhanceApp: themeEnhance }, { enhanceApp: userEnhance })
    const fns = result.enhanceApp as any[]
    expect(fns).toHaveLength(2)
    expect(fns[0]).toBe(themeEnhance)
    expect(fns[1]).toBe(userEnhance)
  })

  it('enhanceApp: 仅 theme 有时保留', () => {
    const themeEnhance = (() => {}) as any
    const result = mergeClientConfig({ enhanceApp: themeEnhance }, {})
    expect(result.enhanceApp).toBe(themeEnhance)
  })

  it('enhanceApp: 仅 user 有时保留', () => {
    const userEnhance = (() => {}) as any
    const result = mergeClientConfig({}, { enhanceApp: userEnhance })
    expect(result.enhanceApp).toBe(userEnhance)
  })

  it('enhanceApp: theme 数组 + user 数组', () => {
    const fn1 = (() => {}) as any
    const fn2 = (() => {}) as any
    const fn3 = (() => {}) as any
    const fn4 = (() => {}) as any
    const result = mergeClientConfig({ enhanceApp: [fn1, fn2] }, { enhanceApp: [fn3, fn4] })
    const fns = result.enhanceApp as any[]
    expect(fns).toHaveLength(4)
    expect(fns[0]).toBe(fn1)
    expect(fns[3]).toBe(fn4)
  })

  it('app: 应保留 user.app', () => {
    const appConfig = { root: '#app' } as any
    const result = mergeClientConfig({}, { app: appConfig })
    expect(result.app).toBe(appConfig)
  })

  it('router: 应保留 user.router 中除钩子外的字段', () => {
    const result = mergeClientConfig({}, { router: { mode: 'hash', base: '/docs' } as any })
    expect(result.router?.mode).toBe('hash')
    expect(result.router?.base).toBe('/docs')
  })

  it('完整场景：所有字段同时合并', () => {
    const themeLayout = {} as any
    const themeMissing = {} as any
    const themeGuard = (() => {}) as any
    const themeCb = (() => {}) as any
    const themeEnhance = (() => {}) as any
    const userLayout = {} as any
    const userGuard = (() => {}) as any
    const userCb = (() => {}) as any
    const userEnhance = (() => {}) as any

    const result = mergeClientConfig(
      {
        layout: themeLayout,
        missing: themeMissing,
        beforeEach: themeGuard,
        afterEach: themeCb,
        enhanceApp: themeEnhance
      },
      {
        layout: userLayout,
        router: { beforeEach: userGuard, afterEach: userCb, mode: 'hash' } as any,
        enhanceApp: userEnhance,
        app: {} as any
      }
    )

    expect(result.layout).toBe(userLayout)
    expect(result.router?.mode).toBe('hash')
    expect(result.router?.missing).toBe(themeMissing)
    expect(result.router?.beforeEach as any[]).toHaveLength(2)
    expect(result.router?.afterEach as any[]).toHaveLength(2)
    expect(result.enhanceApp as any[]).toHaveLength(2)
    expect(result.app).toBeDefined()
  })
})

describe('mergeThemes', () => {
  it('空数组应返回空对象', () => {
    expect(mergeExtendedConfig([])).toEqual({})
  })

  it('单个主题应返回其副本', () => {
    const theme: ExtendedConfig = {
      enhanceApp: () => {}
    }
    const result = mergeExtendedConfig([theme])
    expect(result.enhanceApp).toBe(theme.enhanceApp)
  })

  it('多个主题应按顺序合并，后者覆盖前者', () => {
    const theme1: ExtendedConfig = {
      layout: {} as any,
      missing: {} as any
    }
    const theme2: ExtendedConfig = {
      layout: {} as any
    }
    const result = mergeExtendedConfig([theme1, theme2])
    expect(result.layout).toBe(theme2.layout)
    expect(result.missing).toBe(theme1.missing)
  })

  it('应合并多个主题的 enhanceApp', () => {
    const fn1 = (() => {}) as any
    const fn2 = (() => {}) as any
    const result = mergeExtendedConfig([{ enhanceApp: fn1 }, { enhanceApp: fn2 }])
    const fns = result.enhanceApp as any[]
    expect(fns).toHaveLength(2)
    expect(fns[0]).toBe(fn1)
    expect(fns[1]).toBe(fn2)
  })

  it('应合并多个主题的 beforeEach/afterEach', () => {
    const g1 = (() => {}) as any
    const g2 = (() => {}) as any
    const c1 = (() => {}) as any
    const c2 = (() => {}) as any
    const result = mergeExtendedConfig([
      { beforeEach: g1, afterEach: c1 },
      { beforeEach: g2, afterEach: c2 }
    ])
    expect(result.beforeEach as any[]).toHaveLength(2)
    expect(result.afterEach as any[]).toHaveLength(2)
  })

  it('缺失字段应从前面主题继承', () => {
    const layout = {} as any
    const result = mergeExtendedConfig([{ layout }, { missing: {} as any }])
    expect(result.layout).toBe(layout)
    expect(result.missing).toBeDefined()
  })
})

describe('resolveClientConfig', () => {
  it('无主题时应直接返回用户配置', () => {
    const userConfig: ClientConfig = { layout: {} as any }
    const result = resolveClientConfig([], userConfig)
    expect(result).toEqual(userConfig)
  })

  it('有主题时应合并主题和用户配置', () => {
    const theme: ExtendedConfig = {
      layout: {} as any,
      enhanceApp: () => {}
    }
    const userLayout = {} as any
    const userConfig: ClientConfig = { layout: userLayout }
    const result = resolveClientConfig([theme], userConfig)
    expect(result.layout).toBe(userLayout)
    expect(result.enhanceApp).toBe(theme.enhanceApp)
  })

  it('多个主题应先合并再与用户配置合并', () => {
    const theme1: ExtendedConfig = {
      missing: {} as any
    }
    const theme2: ExtendedConfig = {
      enhanceApp: () => {}
    }
    const userConfig: ClientConfig = { layout: {} as any }
    const result = resolveClientConfig([theme1, theme2], userConfig)
    expect(result.router?.missing).toBe(theme1.missing)
    expect(result.enhanceApp).toBe(theme2.enhanceApp)
    expect(result.layout).toBeDefined()
  })
})
