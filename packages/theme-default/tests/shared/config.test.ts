import { describe, expect, it } from 'vitest'
import { resolveHero, resolveFeatures } from '../../src/shared/config.js'
import type { Feature, HeroConfig } from '../../src/types.js'

describe('resolveHero', () => {
  describe('null 输入', () => {
    it('应返回 null', () => {
      expect(resolveHero(null, 'zh')).toBeNull()
    })
  })

  describe('直接配置', () => {
    it('应返回原始 HeroConfig', () => {
      const hero: HeroConfig = { name: 'VitaPress', text: 'Next-gen docs' }
      expect(resolveHero(hero, 'zh')).toBe(hero)
    })

    it('含 name 字段时应识别为直接配置', () => {
      const hero: HeroConfig = { name: 'VitaPress' }
      expect(resolveHero(hero, 'en')).toBe(hero)
    })

    it('含 text 字段时应识别为直接配置', () => {
      const hero: HeroConfig = { text: 'Description' }
      expect(resolveHero(hero, 'en')).toBe(hero)
    })

    it('含 actions 字段时应识别为直接配置', () => {
      const hero: HeroConfig = { actions: [{ text: 'Start', link: '/guide/' }] }
      expect(resolveHero(hero, 'en')).toBe(hero)
    })

    it('含 name 和 actions 时应识别为直接配置', () => {
      const hero: HeroConfig = {
        name: 'VitaPress',
        text: 'Docs',
        actions: [{ text: 'Start', link: '/guide/' }]
      }
      expect(resolveHero(hero, 'zh')).toBe(hero)
    })
  })

  describe('多语言配置', () => {
    it('应返回对应语言的 HeroConfig', () => {
      const hero = {
        zh: { name: 'VitaPress', text: '下一代文档框架' },
        en: { name: 'VitaPress', text: 'Next-gen docs' }
      }
      expect(resolveHero(hero, 'zh')).toEqual({ name: 'VitaPress', text: '下一代文档框架' })
      expect(resolveHero(hero, 'en')).toEqual({ name: 'VitaPress', text: 'Next-gen docs' })
    })

    it('语言不存在时应返回 null', () => {
      const hero = {
        zh: { name: 'VitaPress', text: '下一代文档框架' }
      }
      expect(resolveHero(hero, 'ja')).toBeNull()
    })

    it('不含 HeroConfig 特有字段时应识别为多语言配置', () => {
      const hero = {
        zh: { name: '中文', text: '描述' },
        en: { name: 'English', text: 'Description' }
      }
      expect(resolveHero(hero, 'zh')).toEqual({ name: '中文', text: '描述' })
    })
  })
})

describe('resolveFeatures', () => {
  describe('数组输入', () => {
    it('应直接返回原始数组', () => {
      const features: Feature[] = [
        { title: 'Fast', details: 'Super fast' },
        { title: 'Simple', details: 'Easy to use' }
      ]
      expect(resolveFeatures(features, 'zh')).toBe(features)
    })

    it('空数组应直接返回', () => {
      const features: Feature[] = []
      expect(resolveFeatures(features, 'zh')).toBe(features)
    })
  })

  describe('多语言配置', () => {
    it('应返回对应语言的 Feature 数组', () => {
      const features = {
        zh: [{ title: '极速', details: '基于 Vite' }],
        en: [{ title: 'Fast', details: 'Powered by Vite' }]
      }
      expect(resolveFeatures(features, 'zh')).toEqual([{ title: '极速', details: '基于 Vite' }])
      expect(resolveFeatures(features, 'en')).toEqual([{ title: 'Fast', details: 'Powered by Vite' }])
    })

    it('语言不存在时应返回空数组', () => {
      const features = {
        zh: [{ title: '极速', details: '基于 Vite' }]
      }
      expect(resolveFeatures(features, 'ja')).toEqual([])
    })
  })

  describe('边界情况', () => {
    it('含 icon 的 Feature 应正确返回', () => {
      const features: Feature[] = [
        { icon: '⚡', title: 'Fast', details: 'Super fast', link: '/guide/' }
      ]
      expect(resolveFeatures(features, 'zh')).toEqual(features)
    })

    it('多语言配置中各语言 Feature 数量可不同', () => {
      const features = {
        zh: [{ title: '特性1', details: '描述1' }],
        en: [
          { title: 'Feature 1', details: 'Desc 1' },
          { title: 'Feature 2', details: 'Desc 2' }
        ]
      }
      expect(resolveFeatures(features, 'zh')).toHaveLength(1)
      expect(resolveFeatures(features, 'en')).toHaveLength(2)
    })
  })
})
