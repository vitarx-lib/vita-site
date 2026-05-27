import { useI18n, useSiteData } from 'vitapress'
import { computed, Dynamic, For, type View } from 'vitarx'
import { RouterLink } from 'vitarx-router'
import '../assets/styles/home.scss'
import { resolveHero, resolveFeatures } from '../shared/config.js'
import type { SiteData } from '../types'

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
