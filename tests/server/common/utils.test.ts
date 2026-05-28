import { existsSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { getVersion, isPlainObject, writeCacheFileSync } from '../../../src/server/common/utils.js'

describe('isPlainObject', () => {
  it('应正确识别普通对象', () => {
    expect(isPlainObject({})).toBe(true)
    expect(isPlainObject({ a: 1, b: 'test' })).toBe(true)
    expect(isPlainObject({ nested: { deep: 'value' } })).toBe(true)
  })

  it('应正确识别空对象', () => {
    expect(isPlainObject({})).toBe(true)
  })

  it('应对 null 返回 false', () => {
    expect(isPlainObject(null)).toBe(false)
  })

  it('应对数组返回 false', () => {
    expect(isPlainObject([])).toBe(false)
    expect(isPlainObject([1, 2, 3])).toBe(false)
  })

  it('应对基本类型返回 false', () => {
    expect(isPlainObject(42)).toBe(false)
    expect(isPlainObject('string')).toBe(false)
    expect(isPlainObject(true)).toBe(false)
    expect(isPlainObject(undefined)).toBe(false)
  })

  it('应对内置对象返回 false', () => {
    expect(isPlainObject(new Date())).toBe(false)
    expect(isPlainObject(new RegExp('test'))).toBe(false)
    expect(isPlainObject(new Error('test'))).toBe(false)
  })

  it('应对函数返回 false', () => {
    expect(isPlainObject(() => {})).toBe(false)
    expect(isPlainObject(function () {})).toBe(false)
  })

  it('应对 Map 和 Set 返回 false', () => {
    expect(isPlainObject(new Map())).toBe(false)
    expect(isPlainObject(new Set())).toBe(false)
  })
})

describe('getVersion', () => {
  it('应返回版本号字符串', () => {
    const version = getVersion()
    expect(typeof version).toBe('string')
    expect(version).toMatch(/^\d+\.\d+\.\d+/)
  })

  it('应返回有效的版本号格式', () => {
    const version = getVersion()
    expect(version).not.toBe('')
    expect(version).not.toBe('0.0.0')
  })
})

describe('writeCacheFileSync', () => {
  let testDir: string

  beforeEach(() => {
    testDir = join(tmpdir(), `vita-site-test-${Date.now()}`)
  })

  afterEach(() => {
    if (existsSync(testDir)) {
      rmSync(testDir, { recursive: true, force: true })
    }
  })

  it('应成功写入文件到已存在的目录', () => {
    const filePath = join(testDir, 'test.txt')
    const content = 'test content'

    writeCacheFileSync(filePath, content)

    expect(existsSync(filePath)).toBe(true)
    expect(readFileSync(filePath, 'utf-8')).toBe(content)
  })

  it('应自动创建不存在的目录', () => {
    const filePath = join(testDir, 'nested', 'deep', 'test.txt')
    const content = 'nested content'

    writeCacheFileSync(filePath, content)

    expect(existsSync(filePath)).toBe(true)
    expect(readFileSync(filePath, 'utf-8')).toBe(content)
  })

  it('应正确写入空内容', () => {
    const filePath = join(testDir, 'empty.txt')
    const content = ''

    writeCacheFileSync(filePath, content)

    expect(existsSync(filePath)).toBe(true)
    expect(readFileSync(filePath, 'utf-8')).toBe(content)
  })

  it('应正确覆盖已存在的文件', () => {
    const filePath = join(testDir, 'overwrite.txt')
    const content1 = 'first content'
    const content2 = 'second content'

    writeCacheFileSync(filePath, content1)
    writeCacheFileSync(filePath, content2)

    expect(readFileSync(filePath, 'utf-8')).toBe(content2)
  })

  it('应正确写入多级嵌套目录的文件', () => {
    const filePath = join(testDir, 'a', 'b', 'c', 'd', 'test.txt')
    const content = 'deep nested content'

    writeCacheFileSync(filePath, content)

    expect(existsSync(filePath)).toBe(true)
    expect(readFileSync(filePath, 'utf-8')).toBe(content)
  })

  it('应正确写入包含特殊字符的内容', () => {
    const filePath = join(testDir, 'special.txt')
    const content = '特殊字符 🎉 \n\t\r\n'

    writeCacheFileSync(filePath, content)

    expect(readFileSync(filePath, 'utf-8')).toBe(content)
  })
})
