import { describe, expect, it } from 'vitest'
import { DEFAULT_CONFIG } from '../../../src/core/config/defaults.js'

describe('ConfigDefaults', () => {
  describe('DEFAULT_CONFIG', () => {
    it('应包含所有默认值', () => {
      expect(DEFAULT_CONFIG.title).toBe('')
      expect(DEFAULT_CONFIG.description).toBe('')
      expect(DEFAULT_CONFIG.keywords).toBe('')
      expect(DEFAULT_CONFIG.docDir).toBe('docs')
      expect(DEFAULT_CONFIG.sort).toBe('asc')
    })

    it('应包含 markdownIt 默认配置', () => {
      expect(DEFAULT_CONFIG.markdownIt).toBeDefined()
      expect(DEFAULT_CONFIG.markdownIt?.options).toBeDefined()
      expect(DEFAULT_CONFIG.markdownIt?.options?.html).toBe(true)
      expect(DEFAULT_CONFIG.markdownIt?.options?.linkify).toBe(true)
      expect(DEFAULT_CONFIG.markdownIt?.options?.typographer).toBe(true)
      expect(DEFAULT_CONFIG.markdownIt?.options?.xhtmlOut).toBe(true)
    })
  })
})
