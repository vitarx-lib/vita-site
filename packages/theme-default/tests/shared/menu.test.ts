import { describe, expect, it, vi } from 'vitest'

/**
 * 模拟 vitarx 的 inject 函数
 * - 默认返回 undefined（模拟未注入状态）
 * - 通过 mockInjectReturn 可动态设置返回值
 */
const mockInjectReturn = vi.fn().mockReturnValue(undefined)
vi.mock('vitarx', () => ({
  inject: (...args: any[]) => mockInjectReturn(...args)
}))

import { NAV_MENU_STATE, NAV_SIDEBAR_STATE, useMenuState, useSidebarState } from '../../src/shared/menu.js'

describe('Symbol 常量', () => {
  it('NAV_MENU_STATE 应为全局共享的 Symbol', () => {
    expect(NAV_MENU_STATE).toBe(Symbol.for('__VITAPRESS_DEFAULT_NAV_MENU_STATE'))
  })

  it('NAV_SIDEBAR_STATE 应为全局共享的 Symbol', () => {
    expect(NAV_SIDEBAR_STATE).toBe(Symbol.for('__VITAPRESS_DEFAULT_NAV_SIDEBAR_STATE'))
  })
})

describe('useMenuState', () => {
  it('应返回 inject 注入的值', () => {
    const mockRef = { value: false }
    mockInjectReturn.mockReturnValue(mockRef)

    const result = useMenuState()
    expect(result).toBe(mockRef)
  })

  it('未注入时应抛出错误', () => {
    mockInjectReturn.mockReturnValue(undefined)

    expect(() => useMenuState()).toThrow('useMenuState must be used within a GlobalLayout')
  })
})

describe('useSidebarState', () => {
  it('应返回 inject 注入的值', () => {
    const mockRef = { value: false }
    mockInjectReturn.mockReturnValue(mockRef)

    const result = useSidebarState()
    expect(result).toBe(mockRef)
  })

  it('未注入时应抛出错误', () => {
    mockInjectReturn.mockReturnValue(undefined)

    expect(() => useSidebarState()).toThrow('useSidebarState must be used within a GlobalLayout')
  })
})
