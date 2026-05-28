import { describe, expect, it } from 'vitest'
import { DEFAULT_CONFIG } from '../../../src/server/config/constant.js'

describe('DEFAULT_CONFIG', () => {
  it('应定义所有必需的配置项', () => {
    expect(DEFAULT_CONFIG).toHaveProperty('dts')
    expect(DEFAULT_CONFIG).toHaveProperty('locales')
    expect(DEFAULT_CONFIG).toHaveProperty('title')
    expect(DEFAULT_CONFIG).toHaveProperty('description')
    expect(DEFAULT_CONFIG).toHaveProperty('keywords')
    expect(DEFAULT_CONFIG).toHaveProperty('docLayoutFile')
    expect(DEFAULT_CONFIG).toHaveProperty('homeFile')
    expect(DEFAULT_CONFIG).toHaveProperty('docDirs')
    expect(DEFAULT_CONFIG).toHaveProperty('injectBody')
    expect(DEFAULT_CONFIG).toHaveProperty('injectCode')
    expect(DEFAULT_CONFIG).toHaveProperty('injectHead')
    expect(DEFAULT_CONFIG).toHaveProperty('markdownIt')
    expect(DEFAULT_CONFIG).toHaveProperty('pageDirs')
    expect(DEFAULT_CONFIG).toHaveProperty('plugins')
    expect(DEFAULT_CONFIG).toHaveProperty('i18nMessages')
    expect(DEFAULT_CONFIG).toHaveProperty('vite')
  })

  describe('默认值', () => {
    it('dts 应为 false', () => {
      expect(DEFAULT_CONFIG.dts).toBe(false)
    })

    it('locales 默认应为空数组', () => {
      expect(DEFAULT_CONFIG.locales).toEqual([])
    })

    it('title 应为空字符串', () => {
      expect(DEFAULT_CONFIG.title).toBe('')
    })

    it('description 应为空字符串', () => {
      expect(DEFAULT_CONFIG.description).toBe('')
    })

    it('keywords 应为空字符串', () => {
      expect(DEFAULT_CONFIG.keywords).toBe('')
    })

    it('docLayoutFile 应为 null', () => {
      expect(DEFAULT_CONFIG.docLayoutFile).toBeNull()
    })

    it('homeFile 应为 null', () => {
      expect(DEFAULT_CONFIG.homeFile).toBeNull()
    })

    it('injectBody 应为空数组', () => {
      expect(DEFAULT_CONFIG.injectBody).toEqual([])
    })

    it('injectCode 应为空数组', () => {
      expect(DEFAULT_CONFIG.injectCode).toEqual([])
    })

    it('injectHead 应为空数组', () => {
      expect(DEFAULT_CONFIG.injectHead).toEqual([])
    })

    it('pageDirs 应为空数组', () => {
      expect(DEFAULT_CONFIG.pageDirs).toEqual([])
    })

    it('plugins 应为空数组', () => {
      expect(DEFAULT_CONFIG.plugins).toEqual([])
    })

    it('i18nMessages 应为空对象', () => {
      expect(DEFAULT_CONFIG.i18nMessages).toEqual({})
    })

    it('markdownIt 应为空对象', () => {
      expect(DEFAULT_CONFIG.markdownIt).toEqual({})
    })
  })

  describe('docDirs 配置', () => {
    it('docDirs 应为空数组', () => {
      expect(DEFAULT_CONFIG.docDirs).toEqual([])
    })
  })

  describe('vite 配置', () => {
    it('publicDir 应为 .vita-site/public', () => {
      expect(DEFAULT_CONFIG.vite.publicDir).toBe('.vita-site/public')
    })
  })

  describe('配置结构', () => {
    it('DEFAULT_CONFIG 应包含所有必需的配置项', () => {
      expect(DEFAULT_CONFIG).toBeDefined()
      expect(typeof DEFAULT_CONFIG).toBe('object')
    })
  })
})
