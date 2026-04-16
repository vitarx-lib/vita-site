import { describe, expect, it } from 'vitest'
import { isPlainObject, mergeConfig, mergeTwoArrays } from '../../../src/core/config/utils.js'

describe('isPlainObject', () => {
  it('应正确识别普通对象', () => {
    expect(isPlainObject({})).toBe(true)
    expect(isPlainObject({ a: 1 })).toBe(true)
    expect(isPlainObject({ a: { b: 2 } })).toBe(true)
  })

  it('应对非普通对象返回 false', () => {
    expect(isPlainObject(null)).toBe(false)
    expect(isPlainObject(undefined)).toBe(false)
    expect(isPlainObject([])).toBe(false)
    expect(isPlainObject([1, 2, 3])).toBe(false)
    expect(isPlainObject(() => {})).toBe(false)
    expect(isPlainObject(new Date())).toBe(false)
    expect(isPlainObject(new Map())).toBe(false)
    expect(isPlainObject(new Set())).toBe(false)
    expect(isPlainObject(/regex/)).toBe(false)
    expect(isPlainObject(123)).toBe(false)
    expect(isPlainObject('string')).toBe(false)
    expect(isPlainObject(true)).toBe(false)
  })

  it('应正确处理 Object.create(null) 创建的对象', () => {
    expect(isPlainObject(Object.create(null))).toBe(true)
  })
})

describe('mergeTwoArrays', () => {
  it('应正确合并两个数组', () => {
    expect(mergeTwoArrays([1, 2], [3, 4])).toEqual([1, 2, 3, 4])
  })

  it('应去重合并后的数组', () => {
    expect(mergeTwoArrays([1, 2, 3], [2, 3, 4])).toEqual([1, 2, 3, 4])
  })

  it('应处理第一个数组为 undefined', () => {
    expect(mergeTwoArrays(undefined, [1, 2])).toEqual([1, 2])
  })

  it('应处理第二个数组为 undefined', () => {
    expect(mergeTwoArrays([1, 2], undefined)).toEqual([1, 2])
  })

  it('应处理两个数组都为 undefined', () => {
    expect(mergeTwoArrays(undefined, undefined)).toEqual([])
  })

  it('应处理第一个数组为 null', () => {
    expect(mergeTwoArrays(null, [1, 2])).toEqual([1, 2])
  })

  it('应处理第二个数组为 null', () => {
    expect(mergeTwoArrays([1, 2], null)).toEqual([1, 2])
  })

  it('应处理两个数组都为 null', () => {
    expect(mergeTwoArrays(null, null)).toEqual([])
  })

  it('应处理空数组', () => {
    expect(mergeTwoArrays([], [1, 2])).toEqual([1, 2])
    expect(mergeTwoArrays([1, 2], [])).toEqual([1, 2])
    expect(mergeTwoArrays([], [])).toEqual([])
  })

  it('应保持顺序：先 a 后 b', () => {
    expect(mergeTwoArrays(['a', 'b'], ['c', 'd'])).toEqual(['a', 'b', 'c', 'd'])
  })

  it('应支持不同类型元素', () => {
    expect(mergeTwoArrays([1, 'a'], [2, 'b'])).toEqual([1, 'a', 2, 'b'])
  })
})

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
