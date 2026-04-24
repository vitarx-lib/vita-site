import { describe, expect, it } from 'vitest'
import { isPlainObject } from '../../../src/server/common/utils.js'

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
