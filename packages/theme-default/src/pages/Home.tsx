import { useI18n, useSiteData } from 'vitapress'
import { computed, Dynamic, For, isPlainObject, type View } from 'vitarx'
import { RouterLink } from 'vitarx-router'
import '../assets/styles/home.scss'
import type { Feature, HeroConfig, SiteData } from '../types'

/**
 * 解析 Hero 配置，支持直接配置和多语言配置
 *
 * @param hero - 原始 hero 配置
 * @param lang - 当前语言
 * @returns 解析后的 HeroConfig 或 null
 */
function resolveHero(
  hero: HeroConfig | { [lang: string]: HeroConfig } | null,
  lang: string
): HeroConfig | null {
  if (!hero) return null
  if (isPlainObject(hero)) {
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
function resolveFeatures(
  features: Feature[] | { [lang: string]: Feature[] },
  lang: string
): Feature[] {
  if (Array.isArray(features)) return features
  if (isPlainObject(features)) {
    return (features as Record<string, Feature[]>)[lang] || []
  }
  return []
}

/**
 * 文档站点首页
 *
 * 包含 Hero 区域、Features 区域和 Footer 区域
 */
export default function HomePage(): View {
  const siteData = useSiteData<SiteData>()
  const i18n = useI18n()

  const hero = computed(() => resolveHero(siteData.hero, i18n.lang.value))
  const heroName = computed(() => hero.value?.name || siteData.title)
  const features = computed(() => resolveFeatures(siteData.features, i18n.lang.value))

  return (
    <div class="default-theme-home-page">
      {/* Hero 区域 */}
      <section class="hero">
        <h1 class="hero-name">{heroName.value}</h1>
        {hero.value?.text && <p class="hero-text">{hero.value.text}</p>}
        {hero.value?.actions && hero.value.actions.length > 0 && (
          <div class="hero-actions">
            <For each={hero.value.actions} key={item => item.link}>
              {action => (
                <RouterLink class={`hero-action ${action.theme || 'primary'}`} to={action.link}>
                  {action.text}
                </RouterLink>
              )}
            </For>
          </div>
        )}
      </section>

      {/* Features 区域 */}
      {features.value.length > 0 && (
        <section class="features">
          <For each={features.value} key={item => JSON.stringify(item)}>
            {feature => (
              <Dynamic
                is={feature.link ? RouterLink : 'div'}
                class="feature-item"
                to={feature.link}
              >
                {feature.icon && <div class="feature-icon" v-html={feature.icon} />}
                <h3 class="feature-title">{feature.title}</h3>
                <p class="feature-details">{feature.details}</p>
              </Dynamic>
            )}
          </For>
        </section>
      )}

      {/* Footer 区域 */}
      {siteData.footer && <footer class="home-footer" v-html={siteData.footer} />}
    </div>
  )
}
