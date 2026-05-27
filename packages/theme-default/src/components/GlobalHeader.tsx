import { useI18n, useSiteData } from 'vitapress'
import { computed, For, inject, isPlainObject, type View } from 'vitarx'
import { RouterLink } from 'vitarx-router'
import '../assets/styles/header.scss'
import { langSelectorSymbol } from '../shared/lang.js'
import { useMenuState } from '../shared/menu.js'
import type { SiteData } from '../types.js'
import DocSearch from './DocSearch.js'
import Close from './icons/Close.js'
import IconGithub from './icons/Github.js'
import Menu from './icons/Menu.js'
import LangSelector, { type LangSelectorProps } from './LangSelector.js'
import LinkDropdown from './LinkDropdown.js'
import ThemeSwitch from './ThemeSwitch.js'

/**
 * 全局头部组件
 *
 * 提供站点品牌标识、导航链接、主题切换和语言切换，搜索功能
 * @constructor
 */
function GlobalHeader(): View {
  const i18n = useI18n()
  const menuState = useMenuState()
  const siteData = useSiteData<SiteData>()
  const navLinks = computed(() => {
    const links = siteData.navLinks
    if (Array.isArray(links)) {
      return links
    }
    if (isPlainObject(links)) {
      const langLinks = links[i18n.lang.value]
      if (langLinks && Array.isArray(langLinks)) {
        return langLinks
      }
    }
    return []
  })
  const customLangSelectorProps = inject<LangSelectorProps | null>(langSelectorSymbol, null)
  function closeMenu(): void {
    menuState.value = false
  }
  return (
    <header class="default-theme-top-bar" role="banner" data-menu-open={menuState.value}>
      <RouterLink class="logo al-center" to={i18n.buildPath('/')}>
        {siteData.logo && <img src={siteData.logo} alt="Logo" />}
        <span>{siteData.title}</span>
      </RouterLink>
      <div class="top-bar-navbar">
        <nav class="nav-links">
          <For each={navLinks} key={item => item.text}>
            {item =>
              item.children ? (
                <LinkDropdown links={item.children} callback={closeMenu}>
                  {item.text}
                </LinkDropdown>
              ) : (
                <RouterLink
                  class="nav-link al-center"
                  to={item.link!}
                  activeClass="active"
                  callback={closeMenu}
                >
                  {item.text}
                </RouterLink>
              )
            }
          </For>
        </nav>
        <div class="actions al-center">
          <DocSearch v-if={siteData.useSearch} />
          {customLangSelectorProps ? (
            <LangSelector {...customLangSelectorProps} />
          ) : (
            <LangSelector
              locales={i18n.locales}
              onSelect={id => i18n.setLang(id)}
              activeId={i18n.lang}
              v-if={i18n.locales.value.length > 1}
            />
          )}
          <ThemeSwitch />
          <RouterLink
            v-if={siteData.libLink}
            class="default-theme-action-btn"
            to={siteData.libLink}
            target="_blank"
          >
            <IconGithub />
          </RouterLink>
        </div>
      </div>
      <button
        type="button"
        class="default-theme-action-btn menu-btn"
        onClick={() => {
          menuState.value = !menuState.value
        }}
      >
        <Menu v-if={!menuState.value} />
        <Close v-else />
      </button>
    </header>
  )
}

export default GlobalHeader
