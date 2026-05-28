import { describe, expect, it } from 'vitest'
import { mergeConfig } from '../../../src/server/index.js'

describe('mergeConfig', () => {
  it('应正确合并简单对象', () => {
    const defaults = { a: 1, b: 2 }
    const overrides = { b: 3, c: 4 }
    const result = mergeConfig(defaults, overrides)

    expect(result).toEqual({ a: 1, b: 3, c: 4 })
  })

  it('应深度合并嵌套对象', () => {
    const defaults = { a: 1, b: { x: 1, y: 2 } }
    const overrides = { b: { y: 3, z: 4 }, c: 5 }
    const result = mergeConfig(defaults, overrides)

    expect(result).toEqual({ a: 1, b: { x: 1, y: 3, z: 4 }, c: 5 })
  })

  it('不应修改原对象', () => {
    const defaults = { a: 1, b: { x: 1 } }
    const overrides = { b: { y: 2 } }
    const result = mergeConfig(defaults, overrides)

    expect(defaults).toEqual({ a: 1, b: { x: 1 } })
    expect(overrides).toEqual({ b: { y: 2 } })
    expect(result).toEqual({ a: 1, b: { x: 1, y: 2 } })
  })

  it('应处理 overrides 为 undefined', () => {
    const defaults = { a: 1, b: 2 }
    const result = mergeConfig(defaults, undefined)

    expect(result).toEqual({ a: 1, b: 2 })
  })

  it('应处理 overrides 为 null', () => {
    const defaults = { a: 1, b: 2 }
    const result = mergeConfig(defaults, null as any)

    expect(result).toEqual({ a: 1, b: 2 })
  })

  it('应忽略 overrides 中的 undefined 值', () => {
    const defaults = { a: 1, b: 2 }
    const overrides = { a: undefined, c: 3 }
    const result = mergeConfig(defaults, overrides)

    expect(result).toEqual({ a: 1, b: 2, c: 3 })
  })

  it('应忽略 overrides 中的 null 值', () => {
    const defaults = { a: 1, b: 2 }
    const overrides = { a: null, c: 3 }
    const result = mergeConfig(defaults, overrides)

    expect(result).toEqual({ a: 1, b: 2, c: 3 })
  })

  it('应处理相同对象引用', () => {
    const defaults = { a: 1 }
    const result = mergeConfig(defaults, defaults)

    expect(result).toEqual({ a: 1 })
  })

  it('应处理数组合并', () => {
    const defaults = { arr: [1, 2, 3] }
    const overrides = { arr: [4, 5, 6] }
    const result = mergeConfig(defaults, overrides)

    expect(result.arr).toBeDefined()
  })

  it('应用基本类型覆盖默认值', () => {
    const defaults = { a: 1, b: 'hello' }
    const overrides = { a: 2, b: 'world' }
    const result = mergeConfig(defaults, overrides)

    expect(result).toEqual({ a: 2, b: 'world' })
  })

  it('应处理深层嵌套对象', () => {
    const defaults = {
      level1: {
        level2: {
          level3: {
            value: 1
          }
        }
      }
    }
    const overrides = {
      level1: {
        level2: {
          level3: {
            value: 2,
            extra: 'new'
          }
        }
      }
    }
    const result = mergeConfig(defaults, overrides)

    expect(result.level1.level2.level3).toEqual({ value: 2, extra: 'new' })
  })

  it('应处理空对象', () => {
    expect(mergeConfig({}, { a: 1 })).toEqual({ a: 1 })
    expect(mergeConfig({ a: 1 }, {})).toEqual({ a: 1 })
    expect(mergeConfig({}, {})).toEqual({})
  })
})
