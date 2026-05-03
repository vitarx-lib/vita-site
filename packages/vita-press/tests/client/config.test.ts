import { describe, expect, it } from 'vitest'
import { type ClientConfig, defineConfig, type ExtendedConfig } from '../../src/client/config.js'

describe('defineConfig', () => {
  it('应原样返回配置对象', () => {
    const config: ClientConfig = {
      layout: {} as any,
      app: {} as any,
      router: { mode: 'hash' } as any,
      i18n: { messages: { 'zh-CN': { 'nav.home': '首页' } } },
      enhanceApp: () => {}
    }
    const result = defineConfig(config)
    expect(result).toBe(config)
  })

  it('应接受空配置', () => {
    const result = defineConfig({})
    expect(result).toEqual({})
  })

  it('应接受 enhanceApp 数组', () => {
    const fn1 = () => {}
    const fn2 = () => {}
    const result = defineConfig({ enhanceApp: [fn1, fn2] })
    expect(result.enhanceApp).toEqual([fn1, fn2])
  })
})

describe('ThemeExpandConfig', () => {
  it('ThemeExpandConfig 应包含所有主题扩展字段', () => {
    const theme: ExtendedConfig = {
      layout: {} as any,
      messages: { 'zh-CN': { 'nav.home': '首页' } },
      enhanceApp: () => {},
      missing: {} as any,
      beforeEach: () => true as any,
      afterEach: () => {}
    }
    expect(theme.layout).toBeDefined()
    expect(theme.messages).toBeDefined()
    expect(theme.enhanceApp).toBeDefined()
    expect(theme.missing).toBeDefined()
    expect(theme.beforeEach).toBeDefined()
    expect(theme.afterEach).toBeDefined()
  })

  it('ThemeExpandConfig enhanceApp 应支持数组', () => {
    const theme: ExtendedConfig = {
      enhanceApp: [() => {}, () => {}]
    }
    expect(Array.isArray(theme.enhanceApp)).toBe(true)
  })

  it('ThemeExpandConfig beforeEach/afterEach 应支持数组', () => {
    const theme: ExtendedConfig = {
      beforeEach: [() => true as any, () => true as any],
      afterEach: [() => {}, () => {}]
    }
    expect(Array.isArray(theme.beforeEach)).toBe(true)
    expect(Array.isArray(theme.afterEach)).toBe(true)
  })
})
