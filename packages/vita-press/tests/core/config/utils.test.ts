import { describe, expect, it } from 'vitest'
import { mergeConfig } from '../../../src/core/config/utils.js'

describe('mergeConfig', () => {
  describe('对象合并', () => {
    it('应合并两个简单对象', () => {
      const target = { a: 1, b: 2 }
      const source = { c: 3, d: 4 }
      const result = mergeConfig(target, source)

      expect(result).toEqual({ a: 1, b: 2, c: 3, d: 4 })
    })

    it('应覆盖同名属性', () => {
      const target = { a: 1, b: 2 }
      const source = { b: 3, c: 4 }
      const result = mergeConfig(target, source)

      expect(result).toEqual({ a: 1, b: 3, c: 4 })
    })

    it('应合并多个对象', () => {
      const obj1 = { a: 1 }
      const obj2 = { b: 2 }
      const obj3 = { c: 3 }
      const result = mergeConfig(obj1, obj2, obj3)

      expect(result).toEqual({ a: 1, b: 2, c: 3 })
    })

    it('应处理空对象', () => {
      const target = { a: 1 }
      const source = {}
      const result = mergeConfig(target, source)

      expect(result).toEqual({ a: 1 })
    })

    it('应处理所有参数为空对象', () => {
      const result = mergeConfig({}, {}, {})

      expect(result).toEqual({})
    })
  })

  describe('嵌套对象合并', () => {
    it('应深度合并嵌套对象', () => {
      const target = {
        level1: {
          level2: {
            a: 1,
            b: 2
          }
        }
      }
      const source = {
        level1: {
          level2: {
            b: 3,
            c: 4
          }
        }
      }
      const result = mergeConfig(target, source)

      expect(result).toEqual({
        level1: {
          level2: {
            a: 1,
            b: 3,
            c: 4
          }
        }
      })
    })

    it('应合并多层嵌套对象', () => {
      const target = {
        config: {
          markdownIt: {
            options: {
              html: true
            }
          }
        }
      }
      const source = {
        config: {
          markdownIt: {
            options: {
              linkify: true
            }
          }
        }
      }
      const result = mergeConfig(target, source)

      expect(result).toEqual({
        config: {
          markdownIt: {
            options: {
              html: true,
              linkify: true
            }
          }
        }
      })
    })

    it('应正确处理对象和基本类型的覆盖', () => {
      const target = {
        config: {
          nested: { a: 1 }
        }
      }
      const source = {
        config: 'string'
      }
      const result = mergeConfig(target, source)

      expect(result).toEqual({
        config: 'string'
      })
    })
  })

  describe('数组合并', () => {
    it('应合并两个数组', () => {
      const target = [1, 2, 3]
      const source = [4, 5, 6]
      const result = mergeConfig(target, source)

      expect(result).toEqual([1, 2, 3, 4, 5, 6])
    })

    it('应去重合并数组', () => {
      const target = [1, 2, 3]
      const source = [2, 3, 4]
      const result = mergeConfig(target, source)

      expect(result).toEqual([1, 2, 3, 4])
    })

    it('应处理空数组', () => {
      const target = [1, 2, 3]
      const source: number[] = []
      const result = mergeConfig(target, source)

      expect(result).toEqual([1, 2, 3])
    })

    it('应处理所有参数为空数组', () => {
      const result = mergeConfig([], [], [])

      expect(result).toEqual([])
    })

    it('应合并字符串数组', () => {
      const target = ['a', 'b']
      const source = ['c', 'd']
      const result = mergeConfig(target, source)

      expect(result).toEqual(['a', 'b', 'c', 'd'])
    })

    it('应去重合并字符串数组', () => {
      const target = ['a', 'b', 'c']
      const source = ['b', 'c', 'd']
      const result = mergeConfig(target, source)

      expect(result).toEqual(['a', 'b', 'c', 'd'])
    })
  })

  describe('对象中的数组合并', () => {
    it('应合并对象中的数组', () => {
      const target = {
        items: [1, 2, 3]
      }
      const source = {
        items: [4, 5, 6]
      }
      const result = mergeConfig(target, source)

      expect(result).toEqual({
        items: [1, 2, 3, 4, 5, 6]
      })
    })

    it('应去重合并对象中的数组', () => {
      const target = {
        items: [1, 2, 3]
      }
      const source = {
        items: [2, 3, 4]
      }
      const result = mergeConfig(target, source)

      expect(result).toEqual({
        items: [1, 2, 3, 4]
      })
    })

    it('应正确处理对象中数组和基本类型的覆盖', () => {
      const target = {
        items: [1, 2, 3]
      }
      const source = {
        items: 'string'
      }
      const result = mergeConfig(target, source)

      expect(result).toEqual({
        items: 'string'
      })
    })
  })

  describe('边界情况', () => {
    it('应处理 null 值', () => {
      const target = { a: null }
      const source = { b: 2 }
      const result = mergeConfig(target, source)

      expect(result).toEqual({ a: null, b: 2 })
    })

    it('应处理 undefined 值', () => {
      const target = { a: undefined }
      const source = { b: 2 }
      const result = mergeConfig(target, source)

      expect(result).toEqual({ a: undefined, b: 2 })
    })

    it('应处理 null 覆盖对象', () => {
      const target = { a: { nested: 1 } }
      const source = { a: null }
      const result = mergeConfig(target, source)

      expect(result).toEqual({ a: null })
    })

    it('应处理 undefined 覆盖对象', () => {
      const target = { a: { nested: 1 } }
      const source = { a: undefined }
      const result = mergeConfig(target, source)

      expect(result).toEqual({ a: undefined })
    })

    it('应处理空参数', () => {
      const result = mergeConfig()

      expect(result).toEqual({})
    })

    it('应处理单个参数', () => {
      const obj = { a: 1, b: 2 }
      const result = mergeConfig(obj)

      expect(result).toEqual({ a: 1, b: 2 })
    })

    it('应处理基本类型参数', () => {
      const result1 = mergeConfig(1, 2)
      expect(result1).toBe(2)

      const result2 = mergeConfig('a', 'b')
      expect(result2).toBe('b')

      const result3 = mergeConfig(true, false)
      expect(result3).toBe(false)
    })

    it('应处理混合类型', () => {
      const target = {
        a: 1,
        b: [1, 2],
        c: { nested: true }
      }
      const source = {
        a: 2,
        b: [3, 4],
        c: { nested: false, new: true }
      }
      const result = mergeConfig(target, source)

      expect(result).toEqual({
        a: 2,
        b: [1, 2, 3, 4],
        c: { nested: false, new: true }
      })
    })
  })

  describe('实际应用场景', () => {
    it('应正确合并配置对象', () => {
      const defaultConfig = {
        title: '',
        description: '',
        docDir: 'docs',
        sort: 'asc',
        markdownIt: {
          options: {
            html: true,
            linkify: true
          }
        }
      }

      const userConfig = {
        title: 'My Site',
        docDir: 'documentation',
        markdownIt: {
          options: {
            html: false
          }
        }
      }

      const result = mergeConfig(defaultConfig, userConfig)

      expect(result).toEqual({
        title: 'My Site',
        description: '',
        docDir: 'documentation',
        sort: 'asc',
        markdownIt: {
          options: {
            html: false,
            linkify: true
          }
        }
      })
    })

    it('应正确合并注入配置', () => {
      const target = {
        injectHead: ['<link rel="stylesheet" href="base.css">'],
        injectBody: []
      }
      const source = {
        injectHead: ['<script src="custom.js"></script>'],
        injectBody: ['<div>footer</div>']
      }
      const result = mergeConfig(target, source)

      expect(result).toEqual({
        injectHead: [
          '<link rel="stylesheet" href="base.css">',
          '<script src="custom.js"></script>'
        ],
        injectBody: ['<div>footer</div>']
      })
    })

    it('应正确合并多语言配置', () => {
      const target = {
        languages: [{ id: 'zh', name: '中文' }]
      }
      const source = {
        languages: [{ id: 'en', name: 'English' }]
      }
      const result = mergeConfig(target, source)

      expect(result).toEqual({
        languages: [
          { id: 'zh', name: '中文' },
          { id: 'en', name: 'English' }
        ]
      })
    })
  })
})
