import type { Feature, HeroConfig } from '../types.js'

/**
 * 解析 Hero 配置，支持直接配置和多语言配置
 *
 * @param hero - 原始 hero 配置
 * @param lang - 当前语言
 * @returns 解析后的 HeroConfig 或 null
 */
export function resolveHero(
  hero: HeroConfig | { [lang: string]: HeroConfig } | null,
  lang: string
): HeroConfig | null {
  if (!hero) return null
  if (hero && typeof hero === 'object' && !Array.isArray(hero)) {
    // 检查是否为多语言配置（不含 HeroConfig 特有字段）
    if (!('name' in hero) && !('text' in hero) && !('actions' in hero)) {
      return (hero as Record<string, HeroConfig>)[lang] || null
    }
  }
  return hero as HeroConfig
}

/**
 * 解析 Features 配置，支持直接配置和多语言配置
 *
 * @param features - 原始 features 配置
 * @param lang - 当前语言
 * @returns 解析后的 Feature 数组
 */
export function resolveFeatures(
  features: Feature[] | { [lang: string]: Feature[] },
  lang: string
): Feature[] {
  if (Array.isArray(features)) return features
  if (features && typeof features === 'object') {
    return (features as Record<string, Feature[]>)[lang] || []
  }
  return []
}
